import { useMemo } from 'react';
import { useTripStore } from '../../store/tripStore';
import { players as allPlayers } from '../../config/players';
import { getMaxScore } from '../../lib/scoring';
import type { PlayerId, HoleConfig } from '../../types';
import { useState, useCallback } from 'react';
import { Toast } from '../shared/Toast';

interface HoleEntryProps {
  hole: number;
  holeConfig: HoleConfig;
}

export function HoleEntry({ hole, holeConfig }: HoleEntryProps) {
  const trip = useTripStore((s) => s.trip);
  const activeRoundIndex = useTripStore((s) => s.activeRoundIndex);
  const setScore = useTripStore((s) => s.setScore);
  const clearHoleScores = useTripStore((s) => s.clearHoleScores);
  const round = activeRoundIndex !== null ? trip?.rounds[activeRoundIndex] ?? null : null;

  const roundPlayers = useMemo(
    () => allPlayers.filter((p) => round?.activePlayers.includes(p.id)),
    [round?.activePlayers],
  );
  const setFairway = useTripStore((s) => s.setFairway);
  const setGir = useTripStore((s) => s.setGir);
  const [toast, setToast] = useState<string | null>(null);

  const isPar3 = holeConfig.par === 3;
  const maxScore = getMaxScore(holeConfig.par);

  const handleScoreChange = useCallback(
    (playerId: PlayerId, delta: number) => {
      if (!round) return;
      const existing = round.scores[playerId]?.find((s) => s.hole === hole);
      const wasScored = !!existing && existing.grossScore > 0;
      const current = existing?.grossScore ?? holeConfig.par;
      const newScore = Math.max(1, Math.min(maxScore, current + delta));

      setScore(playerId, hole, newScore);

      if (wasScored && delta !== 0) {
        setToast('Scores updated');
      }
    },
    [round, hole, holeConfig.par, maxScore, setScore],
  );

  if (!round) return null;

  const holeHasScores = roundPlayers.some(
    (p) => round.scores[p.id]?.some((s) => s.hole === hole),
  );

  const handleClearHole = () => {
    clearHoleScores(hole);
    setToast('Hole cleared');
  };

  return (
    <div className="flex flex-col h-full px-4 py-3">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Hole Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2">
          <div className="w-16" />
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider flex-1">
            Hole {hole}
          </div>
          <div className="w-16 text-right">
            {holeHasScores && (
              <button
                onClick={handleClearHole}
                className="text-[10px] text-slate-500 active:text-red-400 transition-colors
                  font-medium uppercase tracking-wider"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-1">
          <span className="text-3xl font-bold text-white">Par {holeConfig.par}</span>
          <span className="text-xs text-slate-500">{holeConfig.yardage} yds</span>
          <span className="text-xs text-slate-500">SI {holeConfig.strokeIndex}</span>
        </div>
      </div>

      {/* Player Score Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {roundPlayers.map((player) => {
          const existing = round.scores[player.id]?.find((s) => s.hole === hole);
          const currentScore = existing?.grossScore ?? holeConfig.par;
          const strokes = round.strokeAllocations[player.id]?.[hole] ?? 0;

          return (
            <div
              key={player.id}
              className="bg-slate-800 rounded-2xl p-4 border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-white font-semibold">{player.name}</span>
                  {strokes > 0 && (
                    <span className="ml-2 text-xs text-sky-400 font-medium">
                      {'●'.repeat(strokes)}
                    </span>
                  )}
                </div>
              </div>

              {/* Score Stepper */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => handleScoreChange(player.id, -1)}
                  disabled={currentScore <= 1}
                  className="w-14 h-14 rounded-xl bg-slate-700 text-white text-2xl font-bold
                    flex items-center justify-center
                    disabled:opacity-30 disabled:cursor-not-allowed
                    active:bg-slate-600 transition-colors"
                >
                  -
                </button>
                <div className="w-20 text-center">
                  <div className={`text-4xl font-bold tabular-nums
                    ${currentScore < holeConfig.par ? 'text-red-400'
                      : currentScore === holeConfig.par ? 'text-white'
                      : currentScore === holeConfig.par + 1 ? 'text-amber-400'
                      : 'text-amber-600'}`}
                  >
                    {currentScore}
                  </div>
                </div>
                <button
                  onClick={() => handleScoreChange(player.id, 1)}
                  disabled={currentScore >= maxScore}
                  className="w-14 h-14 rounded-xl bg-slate-700 text-white text-2xl font-bold
                    flex items-center justify-center
                    disabled:opacity-30 disabled:cursor-not-allowed
                    active:bg-slate-600 transition-colors"
                >
                  +
                </button>
              </div>

              {/* Stat Toggles */}
              <div className="flex gap-2 mt-3">
                {!isPar3 && (
                  <StatToggle
                    label="FIR"
                    active={existing?.fairwayHit === true}
                    onToggle={() => {
                      const current = existing?.fairwayHit === true;
                      if (!existing) {
                        setScore(player.id, hole, holeConfig.par);
                      }
                      setFairway(player.id, hole, current ? false : true);
                    }}
                  />
                )}
                <StatToggle
                  label="GIR"
                  active={existing?.gir === true}
                  onToggle={() => {
                    if (!existing) {
                      setScore(player.id, hole, holeConfig.par);
                    }
                    setGir(player.id, hole, !(existing?.gir === true));
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatToggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider
        transition-colors
        ${active
          ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50'
          : 'bg-slate-700/50 text-slate-500 border border-transparent'
        }`}
    >
      {label}
    </button>
  );
}
