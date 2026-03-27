import { useMemo } from 'react';
import { useTripStore } from '../../store/tripStore';
import { getHoleOrder, getCompletedHoles } from '../../lib/scoring';

interface HoleGridProps {
  onSelectHole: (index: number) => void;
  onClose: () => void;
}

export function HoleGrid({ onSelectHole, onClose }: HoleGridProps) {
  const trip = useTripStore((s) => s.trip);
  const activeRoundIndex = useTripStore((s) => s.activeRoundIndex);
  const currentHoleIndex = useTripStore((s) => s.currentHoleIndex);

  const round = activeRoundIndex !== null ? trip?.rounds[activeRoundIndex] ?? null : null;

  const holeOrder = useMemo(
    () => getHoleOrder(round?.startingHole ?? 1),
    [round?.startingHole],
  );

  const completedHoles = useMemo(
    () => (round ? getCompletedHoles(round.scores, holeOrder) : []),
    [round?.scores, holeOrder],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-t-3xl w-full max-w-lg p-6 pb-10 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold text-lg">Hole Navigator</h3>
          <button
            onClick={onClose}
            className="text-slate-400 active:text-white p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Front Nine */}
        <div className="mb-4">
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            Front 9
          </div>
          <div className="grid grid-cols-9 gap-1.5">
            {holeOrder.slice(0, 9).map((hole, idx) => {
              const isComplete = completedHoles.includes(hole);
              const isCurrent = idx === currentHoleIndex;
              return (
                <button
                  key={hole}
                  onClick={() => {
                    onSelectHole(idx);
                    onClose();
                  }}
                  className={`aspect-square rounded-lg flex items-center justify-center
                    text-sm font-medium transition-colors relative
                    ${isCurrent
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                      : isComplete
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                >
                  {hole}
                  {isComplete && !isCurrent && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Back Nine */}
        <div>
          <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">
            Back 9
          </div>
          <div className="grid grid-cols-9 gap-1.5">
            {holeOrder.slice(9, 18).map((hole, idx) => {
              const actualIdx = idx + 9;
              const isComplete = completedHoles.includes(hole);
              const isCurrent = actualIdx === currentHoleIndex;
              return (
                <button
                  key={hole}
                  onClick={() => {
                    onSelectHole(actualIdx);
                    onClose();
                  }}
                  className={`aspect-square rounded-lg flex items-center justify-center
                    text-sm font-medium transition-colors relative
                    ${isCurrent
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                      : isComplete
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                >
                  {hole}
                  {isComplete && !isCurrent && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
