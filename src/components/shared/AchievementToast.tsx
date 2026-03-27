import { useEffect, useState } from 'react';
import type { Achievement } from '../../types';

interface AchievementToastProps {
  achievement: Achievement;
  onDone: () => void;
}

export function AchievementToast({ achievement, onDone }: AchievementToastProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 50);
    const t2 = setTimeout(() => setPhase('exit'), 4000);
    const t3 = setTimeout(onDone, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-[60] transition-all duration-500 ease-out ${
        phase === 'enter'
          ? 'opacity-0 -translate-y-4 scale-95'
          : phase === 'show'
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-2 scale-95'
      }`}
    >
      <div className="bg-gradient-to-r from-amber-900/95 to-slate-800/95 backdrop-blur-sm
        rounded-2xl shadow-2xl border border-amber-500/40 max-w-sm mx-auto overflow-hidden">
        {achievement.image && (
          <img
            src={achievement.image}
            alt=""
            className="w-full h-24 object-cover object-center"
          />
        )}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-3xl flex-shrink-0 mt-0.5">{achievement.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-0.5">
                Achievement Unlocked
              </div>
              <div className="text-white font-bold text-sm leading-tight">
                {achievement.title}
              </div>
              <div className="text-amber-200/70 text-xs mt-1 leading-snug">
                {achievement.message}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AchievementQueueProps {
  achievements: Achievement[];
  onClear: () => void;
}

export function AchievementQueue({ achievements, onClear }: AchievementQueueProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [achievements.length]);

  if (achievements.length === 0 || currentIndex >= achievements.length) {
    if (achievements.length > 0 && currentIndex >= achievements.length) {
      onClear();
    }
    return null;
  }

  return (
    <AchievementToast
      key={achievements[currentIndex].id}
      achievement={achievements[currentIndex]}
      onDone={() => {
        const next = currentIndex + 1;
        if (next >= achievements.length) {
          onClear();
        } else {
          setCurrentIndex(next);
        }
      }}
    />
  );
}
