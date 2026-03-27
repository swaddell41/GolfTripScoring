import { useState } from 'react';
import { useTripStore } from '../../store/tripStore';
import { players } from '../../config/players';
import { getCourse } from '../../config/courses';
import { getHoleOrder, getCompletedHoles, getNetTotalForRound, getGrossTotalForRound } from '../../lib/scoring';
import { formatMatchPlayStatus } from '../../lib/matchPlay';
import { shareScorecard } from '../../lib/exportScorecard';
import { AppShell } from '../layout/AppShell';
import { Toast } from '../shared/Toast';
import type {
  Round,
  SkinsState,
  NinesState,
  StablefordState,
  StrokePlayState,
  DailyMatchPlayState,
} from '../../types';

interface FullScorecardProps {
  onBack: () => void;
}

export function FullScorecard({ onBack }: FullScorecardProps) {
  const trip = useTripStore((s) => s.trip);
  const [toast, setToast] = useState<string | null>(null);

  if (!trip) return null;

  return (
    <AppShell title="Tampa Extravaganza Scores" onBack={onBack}>
      <div className="flex-1 p-4 pb-8 space-y-6 overflow-y-auto">
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        {/* 90-Hole Match Status */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-emerald-500/30">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            90-Hole Match (Sam vs Cole)
          </h3>
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
            {trip.matchPlay90.holesPlayed} holes played
          </p>
        </div>

        {/* Bonus Trackers */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Bonus Trackers
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <BonusStatCard
              label="Fairways Hit"
              values={[
                { name: 'Sam', val: `${trip.bonuses.fairwaysHit.sam}/${trip.bonuses.fairwayAttempts.sam}` },
                { name: 'Cole', val: `${trip.bonuses.fairwaysHit.cole}/${trip.bonuses.fairwayAttempts.cole}` },
              ]}
            />
            <BonusStatCard
              label="Greens in Reg"
              values={[
                { name: 'Sam', val: `${trip.bonuses.greensInReg.sam}/${trip.bonuses.girAttempts.sam}` },
                { name: 'Cole', val: `${trip.bonuses.greensInReg.cole}/${trip.bonuses.girAttempts.cole}` },
              ]}
            />
            <BonusStatCard
              label="Birdies"
              values={players.map((p) => ({
                name: p.name,
                val: `${trip.bonuses.netBirdies[p.id]}`,
              }))}
            />
            <BonusStatCard
              label="Eagles"
              values={players.map((p) => ({
                name: p.name,
                val: `${trip.bonuses.netEagles[p.id]}`,
              }))}
            />
          </div>
        </div>

        {/* Achievements */}
        {(trip.achievements ?? []).length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-4 border border-amber-500/20">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Achievements ({(trip.achievements ?? []).length})
            </h3>
            <div className="space-y-2">
              {(trip.achievements ?? []).map((ach) => (
                <div key={ach.id} className="flex items-start gap-2.5 bg-slate-700/40 rounded-xl p-2.5">
                  <span className="text-xl flex-shrink-0">{ach.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold text-xs">{ach.title}</span>
                      <span className="text-slate-600 text-[10px]">
                        R{ach.roundIndex + 1}{ach.hole ? ` #${ach.hole}` : ''}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-snug mt-0.5">{ach.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-Round Scorecards */}
        {trip.rounds.map((round, idx) => (
          <RoundCard key={round.id} round={round} roundNum={idx + 1} />
        ))}

        {/* Export */}
        <button
          onClick={async () => {
            try {
              await shareScorecard(trip);
              setToast('Scorecard exported!');
            } catch {
              setToast('Export failed');
            }
          }}
          className="w-full py-4 rounded-2xl bg-amber-700/40 text-amber-300 font-semibold
            text-lg active:bg-amber-700/60 transition-colors border border-amber-600/30"
        >
          Share Scorecard
        </button>
      </div>
    </AppShell>
  );
}

function RoundCard({ round, roundNum }: { round: Round; roundNum: number }) {
  const course = getCourse(round.courseId);
  const tee = round.teeData;
  if (!tee) return null;

  const holeOrder = getHoleOrder(round.startingHole);
  const completed = getCompletedHoles(round.scores, holeOrder);

  return (
    <div className="bg-slate-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-white font-bold text-sm">Round {roundNum}</h3>
          <p className="text-xs text-slate-500">{course?.name} - {tee.name} Tees</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500">
            {round.endedEarly ? `${round.holesCompleted} holes` : '18 holes'}
          </span>
          <div className="text-xs text-emerald-400 capitalize">{round.format}</div>
        </div>
      </div>

      {/* Score Table */}
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-slate-500 py-1.5 pr-2 font-medium">Hole</th>
              {completed.map((h) => (
                <th key={h} className="text-center text-slate-500 py-1.5 px-0.5 font-medium min-w-[24px]">{h}</th>
              ))}
              <th className="text-center text-slate-400 py-1.5 pl-2 font-semibold">Tot</th>
            </tr>
            <tr className="border-b border-slate-700/50">
              <td className="text-left text-slate-600 py-1 pr-2">Par</td>
              {completed.map((h) => {
                const hc = tee.holes.find((x) => x.hole === h);
                return <td key={h} className="text-center text-slate-600 py-1 px-0.5">{hc?.par}</td>;
              })}
              <td className="text-center text-slate-600 py-1 pl-2">
                {completed.reduce((s, h) => s + (tee.holes.find((x) => x.hole === h)?.par ?? 0), 0)}
              </td>
            </tr>
          </thead>
          <tbody>
            {players.filter((p) => round.activePlayers?.includes(p.id) ?? true).map((player) => {
              const playerScores = round.scores[player.id] ?? [];
              const grossTotal = getGrossTotalForRound(playerScores, completed);
              const netTotal = getNetTotalForRound(playerScores, completed);

              return (
                <tr key={player.id} className="border-b border-slate-700/30">
                  <td className="text-left text-white py-1.5 pr-2 font-medium">{player.name}</td>
                  {completed.map((h) => {
                    const score = playerScores.find((s) => s.hole === h);
                    const hc = tee.holes.find((x) => x.hole === h);
                    const par = hc?.par ?? 4;
                    const gross = score?.grossScore ?? 0;
                    const diff = gross - par;
                    return (
                      <td key={h} className="text-center py-1.5 px-0.5">
                        <span className={`${
                          diff <= -2 ? 'text-yellow-400 font-bold'
                          : diff === -1 ? 'text-red-400 font-semibold'
                          : diff === 0 ? 'text-white'
                          : diff === 1 ? 'text-sky-400'
                          : 'text-sky-600'
                        }`}>{gross || '-'}</span>
                      </td>
                    );
                  })}
                  <td className="text-center py-1.5 pl-2">
                    <div className="text-white font-semibold">{grossTotal}</div>
                    <div className="text-emerald-400 text-[10px]">Net {netTotal}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Format Results */}
      <div className="mt-3 pt-3 border-t border-slate-700">
        <FormatResult round={round} />
      </div>
    </div>
  );
}

function FormatResult({ round }: { round: Round }) {
  const state = round.formatState;
  const roundPlayers = players.filter((p) => round.activePlayers?.includes(p.id) ?? true);

  switch (state.type) {
    case 'skins': {
      const s = state as SkinsState;
      const totals: Record<string, number> = {};
      for (const r of s.results) {
        if (r.winner) {
          totals[r.winner] = (totals[r.winner] || 0) + r.value;
        }
      }
      return (
        <div>
          <Label text="Skins Results" />
          <div className="flex gap-3">
            {roundPlayers.map((p) => (
              <Chip key={p.id} name={p.name} value={`${totals[p.id] || 0}`} />
            ))}
          </div>
        </div>
      );
    }
    case 'nines': {
      const n = state as NinesState;
      return (
        <div>
          <Label text="Nines (5-3-1) Results" />
          <div className="flex gap-3">
            {roundPlayers.map((p) => (
              <Chip key={p.id} name={p.name} value={`${n.points[p.id]}`} />
            ))}
          </div>
        </div>
      );
    }
    case 'stableford': {
      const st = state as StablefordState;
      return (
        <div>
          <Label text="Stableford Results" />
          <div className="flex gap-3">
            {roundPlayers.map((p) => (
              <Chip key={p.id} name={p.name} value={`${st.points[p.id]} pts`} />
            ))}
          </div>
        </div>
      );
    }
    case 'strokePlay': {
      const sp = state as StrokePlayState;
      return (
        <div>
          <Label text="Stroke Play Results" />
          <div className="flex gap-3">
            {roundPlayers.map((p) => (
              <Chip key={p.id} name={p.name} value={`${sp.totals[p.id]}`} />
            ))}
          </div>
        </div>
      );
    }
    case 'matchPlay': {
      const mp = state as DailyMatchPlayState;
      const p1 = players.find((p) => p.id === mp.player1);
      const p2 = players.find((p) => p.id === mp.player2);
      return (
        <div>
          <Label text="Match Play Result" />
          <p className="text-emerald-400 font-medium text-sm">
            {formatMatchPlayStatus(mp.status, mp.holesPlayed, 18, p1?.name ?? '', p2?.name ?? '')}
          </p>
        </div>
      );
    }
    default:
      return null;
  }
}

function Label({ text }: { text: string }) {
  return (
    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
      {text}
    </div>
  );
}

function Chip({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex-1 bg-slate-700/50 rounded-lg p-2 text-center">
      <div className="text-xs text-slate-400">{name}</div>
      <div className="text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function BonusStatCard({
  label,
  values,
}: {
  label: string;
  values: { name: string; val: string }[];
}) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <div className="text-xs text-slate-400 font-medium mb-1.5">{label}</div>
      {values.map((v) => (
        <div key={v.name} className="flex justify-between text-xs">
          <span className="text-slate-300">{v.name}</span>
          <span className="text-white font-semibold">{v.val}</span>
        </div>
      ))}
    </div>
  );
}
