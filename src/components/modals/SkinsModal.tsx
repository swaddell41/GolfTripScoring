import type { PlayerId } from '../../types';
import { players } from '../../config/players';

interface SkinsModalProps {
  carriedSkins: number;
  tiedPlayers: PlayerId[];
  onSelect: (winner: PlayerId | 'split') => void;
  onCancel: () => void;
}

export function SkinsModal({
  carriedSkins,
  tiedPlayers,
  onSelect,
  onCancel,
}: SkinsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-2">Hole 18 Tie-Breaker</h3>
        <p className="text-slate-300 text-sm mb-1">
          The last hole ended in a tie with{' '}
          <span className="text-emerald-400 font-semibold">{carriedSkins} skin{carriedSkins !== 1 ? 's' : ''}</span>{' '}
          on the line.
        </p>
        <p className="text-slate-400 text-xs mb-5">
          Pick a winner or split the remaining skins.
        </p>
        <div className="space-y-2 mb-4">
          {tiedPlayers.map((pid) => {
            const player = players.find((p) => p.id === pid);
            return (
              <button
                key={pid}
                onClick={() => onSelect(pid)}
                className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white
                  font-medium text-sm active:bg-emerald-600 transition-colors text-left"
              >
                {player?.name ?? pid} wins
              </button>
            );
          })}
          <button
            onClick={() => onSelect('split')}
            className="w-full px-4 py-3 rounded-xl bg-sky-700 text-white
              font-medium text-sm active:bg-sky-600 transition-colors"
          >
            Split evenly
          </button>
        </div>
        <button
          onClick={onCancel}
          className="w-full px-4 py-2 rounded-xl text-slate-400 text-sm
            active:text-slate-200 transition-colors"
        >
          Decide later
        </button>
      </div>
    </div>
  );
}
