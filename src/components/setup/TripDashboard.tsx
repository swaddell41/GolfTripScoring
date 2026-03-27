import { useMemo, useState } from 'react';
import { useTripStore } from '../../store/tripStore';
import { getCourse } from '../../config/courses';
import { formatMatchPlayStatus } from '../../lib/matchPlay';
import { syncTripToFirestore } from '../../firebase/sync';
import { players } from '../../config/players';
import { Toast } from '../shared/Toast';
import { PirateFlag } from '../brand/TampaHero';
import { calculatePoints, getRoundWinner, POINTS, type PointsBreakdown } from '../../lib/points';
import { shareScorecard } from '../../lib/exportScorecard';
import type { PlayerId } from '../../types';

interface TripDashboardProps {
  onNewRound: () => void;
  onViewScores: () => void;
  onLeaveTrip: () => void;
  onEditRound: (roundIndex: number) => void;
}

function getPlayerName(pid: PlayerId): string {
  return players.find((p) => p.id === pid)?.name ?? pid;
}

function confirmedTotal(b: PointsBreakdown): number {
  return b.roundWins + b.birdies + b.eagles;
}

function liveTotal(b: PointsBreakdown): number {
  return b.roundWins + b.birdies + b.eagles + b.overallMatch + b.firLeader + b.girLeader;
}

export function TripDashboard({ onNewRound, onViewScores, onLeaveTrip, onEditRound }: TripDashboardProps) {
  const trip = useTripStore((s) => s.trip);
  const [toast, setToast] = useState<string | null>(null);
  const [showLive, setShowLive] = useState(false);

  const pts = useMemo(() => (trip ? calculatePoints(trip) : null), [trip]);

  if (!trip) return null;

  const completedRounds = trip.rounds.filter((r) => r.isComplete);
  const canStartNew = completedRounds.length < 5;

  const handleSync = async () => {
    if (trip) {
      await syncTripToFirestore(trip);
      setToast('Trip synced to cloud');
    }
  };

  const handleCopyId = () => {
    navigator.clipboard?.writeText(trip.id).then(() => {
      setToast('Trip ID copied!');
    }).catch(() => {
      setToast(trip.id);
    });
  };

  const getTotal = showLive ? liveTotal : confirmedTotal;

  const leaderboard = pts
    ? (Object.entries(pts) as [PlayerId, PointsBreakdown][])
        .sort((a, b) => getTotal(b[1]) - getTotal(a[1]))
    : [];

  return (
    <div className="min-h-dvh bg-slate-900 flex flex-col">
      {/* Branded header */}
      <header className="relative bg-gradient-to-b from-slate-800/80 to-slate-900 border-b border-slate-800 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <PirateFlag className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-white leading-tight truncate">
              Sam&apos;s Tampa Golf Extravaganza
            </h1>
            <p className="text-amber-400/60 text-[10px] font-semibold uppercase tracking-[0.2em]">
              Plunder the Fairways
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-[10px] text-slate-500">{navigator.onLine ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 pb-8 space-y-5 overflow-y-auto">
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}

        {/* Trip ID */}
        <div className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Trip ID</div>
            <button
              onClick={handleCopyId}
              className="text-2xl font-mono font-bold text-emerald-400 tracking-[0.2em] active:text-emerald-300"
            >
              {trip.id}
            </button>
            <div className="text-xs text-slate-500 mt-0.5">Tap to copy</div>
          </div>
          <button
            onClick={handleSync}
            className="px-3 py-2 rounded-xl bg-slate-700 text-slate-300 text-xs font-medium
              active:bg-slate-600 transition-colors"
          >
            Sync
          </button>
        </div>

        {/* Points Leaderboard */}
        {pts && completedRounds.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-4 border border-amber-500/20">
            {/* Header with toggle */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Points
              </div>
              <button
                onClick={() => setShowLive(!showLive)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                  showLive
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-slate-700/50 text-slate-500 border border-transparent'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${showLive ? 'bg-sky-400 animate-pulse' : 'bg-slate-600'}`} />
                Live
              </button>
            </div>

            {/* Player totals */}
            <div className="space-y-2 mb-4">
              {leaderboard.map(([pid, breakdown], idx) => {
                const confirmed = confirmedTotal(breakdown);
                const projected = liveTotal(breakdown) - confirmed;
                const displayTotal = showLive ? liveTotal(breakdown) : confirmed;
                return (
                  <div
                    key={pid}
                    className={`flex items-center justify-between rounded-xl p-3 ${
                      idx === 0
                        ? 'bg-amber-500/10 border border-amber-500/30'
                        : 'bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-extrabold w-6 text-center ${
                        idx === 0 ? 'text-amber-400' : 'text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-white font-semibold text-sm">
                        {getPlayerName(pid)}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-xl font-extrabold tabular-nums ${
                        idx === 0 ? 'text-amber-400' : 'text-white'
                      }`}>
                        {displayTotal}
                      </span>
                      {showLive && projected > 0 && (
                        <span className="text-sky-400 text-xs font-medium tabular-nums">
                          (+{projected})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirmed breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                Confirmed
              </div>
              <BreakdownRow
                label={`Round Wins (${POINTS.ROUND_WIN}/${POINTS.ROUND_SECOND})`}
                values={leaderboard.map(([pid, b]) => ({ pid, val: b.roundWins }))}
              />
              <BreakdownRow
                label={`Net Birdies (+${POINTS.BIRDIE}/ea)`}
                values={leaderboard.map(([pid, b]) => ({ pid, val: b.birdies }))}
              />
              <BreakdownRow
                label={`Net Eagles (+${POINTS.EAGLE}/ea)`}
                values={leaderboard.map(([pid, b]) => ({ pid, val: b.eagles }))}
              />
            </div>

            {/* Live projections */}
            {showLive && (
              <div className="space-y-1.5 text-xs mt-3 pt-3 border-t border-slate-700/50">
                <div className="text-[10px] text-sky-400/70 font-semibold uppercase tracking-wider mb-1">
                  If Weekend Ended Now
                </div>
                <BreakdownRow
                  label={`90-Hole Match (${POINTS.OVERALL_MATCH})`}
                  values={leaderboard.map(([pid, b]) => ({ pid, val: b.overallMatch }))}
                  projected
                  detail={formatMatchPlayStatus(
                    trip.matchPlay90.cumulativeStatus,
                    trip.matchPlay90.holesPlayed,
                    90,
                    'Sam',
                    'Cole',
                  )}
                />
                <BreakdownRow
                  label={`Weekend FIR Leader (+${POINTS.FIR_LEADER})`}
                  values={leaderboard.map(([pid, b]) => ({ pid, val: b.firLeader }))}
                  projected
                />
                <BreakdownRow
                  label={`Weekend GIR Leader (+${POINTS.GIR_LEADER})`}
                  values={leaderboard.map(([pid, b]) => ({ pid, val: b.girLeader }))}
                  projected
                />
              </div>
            )}
          </div>
        )}

        {/* 90-Hole Match */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-emerald-500/20">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">
            90-Hole Match
          </div>
          <p className="text-xl font-bold text-emerald-400">
            {formatMatchPlayStatus(
              trip.matchPlay90.cumulativeStatus,
              trip.matchPlay90.holesPlayed,
              90,
              'Sam',
              'Cole',
            )}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {trip.matchPlay90.holesPlayed} of 90 holes played
          </p>
        </div>

        {/* Completed Rounds */}
        <div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            Rounds ({completedRounds.length}/5)
          </div>
          {completedRounds.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl p-6 text-center text-slate-500 text-sm">
              No rounds completed yet
            </div>
          ) : (
            <div className="space-y-2">
              {completedRounds.map((round) => {
                const course = getCourse(round.courseId);
                const roundIndex = trip.rounds.indexOf(round);
                const { first } = getRoundWinner(round);
                return (
                  <button
                    key={round.id}
                    onClick={() => onEditRound(roundIndex)}
                    className="w-full bg-slate-800 rounded-xl p-3 flex items-center justify-between
                      active:bg-slate-700 transition-colors text-left"
                  >
                    <div>
                      <span className="text-white font-medium text-sm">Round {roundIndex + 1}</span>
                      <span className="text-slate-500 text-xs ml-2">{course?.name}</span>
                      {first && (
                        <span className="text-amber-400 text-xs ml-2">
                          {getPlayerName(first)} won
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 capitalize">{round.format}</span>
                      {round.endedEarly && (
                        <span className="text-xs text-amber-400">{round.holesCompleted}H</span>
                      )}
                      <span className="text-slate-400 text-xs">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievements */}
        {(trip.achievements ?? []).length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-4 border border-amber-500/20">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">
              Achievements ({(trip.achievements ?? []).length})
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...(trip.achievements ?? [])].reverse().map((ach) => (
                <div
                  key={ach.id}
                  className="flex items-start gap-2.5 bg-slate-700/40 rounded-xl p-2.5"
                >
                  <span className="text-xl flex-shrink-0">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold text-xs">{ach.title}</span>
                      <span className="text-slate-600 text-[10px]">R{ach.roundIndex + 1}{ach.hole ? ` #${ach.hole}` : ''}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-snug mt-0.5">{ach.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        {completedRounds.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">
              Stats
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-slate-400">Fairways</div>
                <div className="text-white font-medium">
                  {players.map((p) => `${p.name} ${trip.bonuses.fairwaysHit[p.id]}`).join(' | ')}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-slate-400">GIR</div>
                <div className="text-white font-medium">
                  {players.map((p) => `${p.name} ${trip.bonuses.greensInReg[p.id]}`).join(' | ')}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-slate-400">Birdies</div>
                <div className="text-white font-medium">
                  {players.map((p) => `${p.name} ${trip.bonuses.netBirdies[p.id]}`).join(' | ')}
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-2">
                <div className="text-slate-400">Eagles</div>
                <div className="text-white font-medium">
                  {players.map((p) => `${p.name} ${trip.bonuses.netEagles[p.id]}`).join(' | ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          {canStartNew && (
            <button
              onClick={onNewRound}
              className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-semibold
                text-lg active:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              Start Round {completedRounds.length + 1}
            </button>
          )}

          {completedRounds.length > 0 && (
            <>
              <button
                onClick={onViewScores}
                className="w-full py-3.5 rounded-xl bg-slate-700 text-white font-medium
                  active:bg-slate-600 transition-colors"
              >
                View Full Scorecard
              </button>
              <button
                onClick={async () => {
                  try {
                    await shareScorecard(trip);
                    setToast('Scorecard exported!');
                  } catch {
                    setToast('Export failed');
                  }
                }}
                className="w-full py-3.5 rounded-xl bg-amber-700/40 text-amber-300 font-medium
                  active:bg-amber-700/60 transition-colors border border-amber-600/30"
              >
                Share Scorecard
              </button>
            </>
          )}

          <button
            onClick={onLeaveTrip}
            className="w-full py-3 rounded-xl text-slate-500 text-sm font-medium
              active:text-slate-300 transition-colors"
          >
            Leave Trip
          </button>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  values,
  projected,
  detail,
}: {
  label: string;
  values: { pid: PlayerId; val: number }[];
  projected?: boolean;
  detail?: string;
}) {
  return (
    <div className={`rounded-lg px-3 py-1.5 ${projected ? 'bg-sky-500/5' : 'bg-slate-700/30'}`}>
      <div className="flex items-center justify-between">
        <span className={`truncate mr-2 ${projected ? 'text-sky-400/70' : 'text-slate-400'}`}>{label}</span>
        <div className="flex gap-3 flex-shrink-0">
          {values.map((v) => (
            <span key={v.pid} className={`font-medium tabular-nums min-w-[40px] text-right ${
              v.val > 0 ? (projected ? 'text-sky-400' : 'text-emerald-400') : 'text-slate-600'
            }`}>
              {v.val}
            </span>
          ))}
        </div>
      </div>
      {detail && (
        <div className="text-[10px] text-sky-400/50 mt-0.5">{detail}</div>
      )}
    </div>
  );
}
