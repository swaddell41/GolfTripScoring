import type { ShotgunAlert } from '../../lib/shotgun';

interface ShotgunModalProps {
  alert: ShotgunAlert;
  onDismiss: () => void;
}

export function ShotgunModal({ alert, onDismiss }: ShotgunModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-amber-500/30
        animate-slide-up">
        {/* Shotgun cat */}
        <div className="text-center mb-4">
          <img
            src="/shotgun-cat.png"
            alt="Shotgun a beer!"
            className="w-40 h-40 mx-auto rounded-xl object-cover"
          />
        </div>

        <h3 className="text-xl font-extrabold text-amber-400 text-center mb-2">
          SHOTGUN ALERT
        </h3>

        <p className="text-white text-center text-sm font-semibold mb-3">
          {alert.leader} is running away with it!
        </p>

        <div className="bg-slate-700/50 rounded-xl p-3 space-y-1.5 mb-4">
          {alert.reason90Hole && (
            <p className="text-slate-300 text-xs text-center">
              {alert.reason90Hole}
            </p>
          )}
          {alert.reasonRound && (
            <p className="text-slate-300 text-xs text-center">
              {alert.reasonRound}
            </p>
          )}
        </div>

        <p className="text-amber-400/80 text-center text-sm font-bold mb-1">
          Time to shotgun a beer, {alert.leader}!
        </p>
        <p className="text-slate-500 text-center text-[10px] italic mb-5">
          (If they want to, of course. No pressure... but also yes pressure.)
        </p>

        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-xl bg-amber-600 text-white font-semibold
            active:bg-amber-700 transition-colors text-sm"
        >
          Got it, crack one open
        </button>
      </div>
    </div>
  );
}
