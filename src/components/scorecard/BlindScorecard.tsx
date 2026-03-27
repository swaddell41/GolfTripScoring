import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useTripStore } from '../../store/tripStore';
import { getCourse } from '../../config/courses';
import { getHoleOrder, getCompletedHoles } from '../../lib/scoring';
import { HoleEntry } from './HoleEntry';
import { HoleGrid } from './HoleGrid';
import { GameStatus } from './GameStatus';
import { RoundReview } from './RoundReview';
import { EndRoundModal } from '../modals/EndRoundModal';
import { ConfirmModal } from '../modals/ConfirmModal';
import { SkinsModal } from '../modals/SkinsModal';
import { ShotgunModal } from '../modals/ShotgunModal';
import { needsTieBreaker } from '../../lib/skins';
import { checkShotgunAlert, type ShotgunAlert } from '../../lib/shotgun';
import { checkAchievements } from '../../lib/achievements';
import { AchievementQueue } from '../shared/AchievementToast';
import type { SkinsState, PlayerId, Achievement } from '../../types';

interface BlindScorecardProps {
  onComplete: () => void;
  onReveal: () => void;
}

export function BlindScorecard({ onComplete, onReveal }: BlindScorecardProps) {
  const trip = useTripStore((s) => s.trip);
  const activeRoundIndex = useTripStore((s) => s.activeRoundIndex);
  const currentHoleIndex = useTripStore((s) => s.currentHoleIndex);
  const navigateHole = useTripStore((s) => s.navigateHole);
  const setCurrentHoleIndex = useTripStore((s) => s.setCurrentHoleIndex);
  const completeRound = useTripStore((s) => s.completeRound);
  const finishEditingRound = useTripStore((s) => s.finishEditingRound);
  const confirmHoleScores = useTripStore((s) => s.confirmHoleScores);
  const setSkinsTieBreaker = useTripStore((s) => s.setSkinsTieBreaker);

  const round = activeRoundIndex !== null ? trip?.rounds[activeRoundIndex] ?? null : null;
  const isEditing = round?.isComplete ?? false;

  const holeOrder = useMemo(
    () => getHoleOrder(round?.startingHole ?? 1),
    [round?.startingHole],
  );

  const completedHoles = useMemo(
    () => (round ? getCompletedHoles(round.scores, holeOrder) : []),
    [round?.scores, holeOrder],
  );

  const currentHole = holeOrder[currentHoleIndex] ?? 1;
  const holeConfig = round?.teeData.holes.find((h) => h.hole === currentHole);
  const course = round ? getCourse(round.courseId) : null;

  const addAchievement = useTripStore((s) => s.addAchievement);

  const [showGrid, setShowGrid] = useState(false);
  const [showEndRound, setShowEndRound] = useState(false);
  const [showRevealConfirm, setShowRevealConfirm] = useState(false);
  const [showSkinsTie, setShowSkinsTie] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [shotgunAlert, setShotgunAlert] = useState<ShotgunAlert | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const shotgunDismissedForHoles = useRef<number>(0);
  const lastRoundAlertHole = useRef<number>(0);
  const prevCompletedCount = useRef<number>(0);

  useEffect(() => {
    if (!trip || isEditing) return;
    const count = completedHoles.length;
    if (count <= shotgunDismissedForHoles.current) return;

    const alert = checkShotgunAlert(trip, activeRoundIndex, lastRoundAlertHole.current);
    if (alert) {
      if (alert.reasonRound) {
        lastRoundAlertHole.current = count;
      }
      setShotgunAlert(alert);
    }
  }, [completedHoles.length, trip, activeRoundIndex, isEditing]);

  const roundHolesCompleted = round?.holesCompleted ?? 0;

  useEffect(() => {
    if (!trip || activeRoundIndex === null || isEditing) return;
    if (roundHolesCompleted <= prevCompletedCount.current) return;

    const newAch = checkAchievements(trip, activeRoundIndex, prevCompletedCount.current);
    prevCompletedCount.current = roundHolesCompleted;

    if (newAch.length > 0) {
      for (const a of newAch) addAchievement(a);
      setPendingAchievements((prev) => [...prev, ...newAch]);
    }
  }, [roundHolesCompleted, trip, activeRoundIndex, isEditing, addAchievement]);

  const confirmAndNavigate = useCallback(
    (direction: 'next' | 'prev') => {
      confirmHoleScores(currentHole);
      navigateHole(direction);
    },
    [confirmHoleScores, currentHole, navigateHole],
  );

  const confirmAndJumpToHole = useCallback(
    (idx: number) => {
      confirmHoleScores(currentHole);
      setCurrentHoleIndex(idx);
    },
    [confirmHoleScores, currentHole, setCurrentHoleIndex],
  );

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => confirmAndNavigate('next'),
    onSwipedRight: () => confirmAndNavigate('prev'),
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  const handleFinishRound = useCallback(() => {
    confirmHoleScores(currentHole);
    setShowReview(true);
  }, [confirmHoleScores, currentHole]);

  const handleCompleteRound = useCallback(() => {
    if (!round) return;

    if (round.format === 'skins') {
      const skinsState = round.formatState as SkinsState;
      if (needsTieBreaker(skinsState, 18)) {
        setShowReview(false);
        setShowSkinsTie(true);
        return;
      }
    }

    completeRound();
    onComplete();
  }, [round, completeRound, onComplete]);

  const handleLeaveRound = useCallback(() => {
    confirmHoleScores(currentHole);
    setShowEndRound(false);
    onComplete();
  }, [currentHole, confirmHoleScores, onComplete]);

  const handleFinishEditing = useCallback(() => {
    confirmHoleScores(currentHole);
    finishEditingRound();
    onComplete();
  }, [currentHole, confirmHoleScores, finishEditingRound, onComplete]);

  const handleSkinsTieBreaker = useCallback(
    (winner: PlayerId | 'split') => {
      setSkinsTieBreaker(winner);
      setShowSkinsTie(false);
      completeRound();
      onComplete();
    },
    [setSkinsTieBreaker, completeRound, onComplete],
  );

  if (!round || !holeConfig || !trip) return null;

  const isLastHole = currentHoleIndex === 17;

  if (showReview) {
    return (
      <RoundReview
        onConfirm={handleCompleteRound}
        onBack={() => setShowReview(false)}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">
              {course?.name ?? 'Round'}
            </span>
            {isEditing && (
              <span className="text-xs text-amber-400 font-medium bg-amber-400/10 px-2 py-0.5 rounded-full">
                Editing
              </span>
            )}
            <span className="text-slate-500 text-xs">
              {completedHoles.length}/18
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGrid(true)}
              className="p-2 text-slate-400 active:text-white transition-colors"
              aria-label="Hole grid"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
            </button>
            {isEditing ? (
              <button
                onClick={handleFinishEditing}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold
                  active:bg-emerald-700 transition-colors"
              >
                Done
              </button>
            ) : (
              <DropdownMenu
                onReveal={() => setShowRevealConfirm(true)}
                onEndRound={() => setShowEndRound(true)}
              />
            )}
          </div>
        </div>
      </header>

      {/* Hole Entry */}
      <div {...swipeHandlers} className="flex-1 flex flex-col">
        <HoleEntry hole={currentHole} holeConfig={holeConfig} />
      </div>

      {/* Hole Navigation */}
      <div className="border-t border-slate-800 bg-slate-900">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => confirmAndNavigate('prev')}
            disabled={currentHoleIndex === 0}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium
              disabled:opacity-30 active:bg-slate-700 transition-colors"
          >
            Prev
          </button>
          <div className="flex gap-1">
            {holeOrder.map((h, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-colors
                  ${idx === currentHoleIndex ? 'bg-emerald-400' : completedHoles.includes(h) ? 'bg-slate-600' : 'bg-slate-800'}`}
              />
            ))}
          </div>
          {isLastHole ? (
            <button
              onClick={handleFinishRound}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold
                active:bg-emerald-700 transition-colors"
            >
              Finish
            </button>
          ) : (
            <button
              onClick={() => confirmAndNavigate('next')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium
                active:bg-slate-700 transition-colors"
            >
              Next
            </button>
          )}
        </div>
        <GameStatus />
      </div>

      {/* Modals */}
      {showGrid && (
        <HoleGrid
          onSelectHole={(idx) => confirmAndJumpToHole(idx)}
          onClose={() => setShowGrid(false)}
        />
      )}

      {showEndRound && (
        <EndRoundModal
          holesCompleted={completedHoles.length}
          onConfirm={handleLeaveRound}
          onCancel={() => setShowEndRound(false)}
        />
      )}

      {showRevealConfirm && (
        <ConfirmModal
          title="Reveal Scores"
          message="This will show all cumulative gross and net scores."
          secondMessage="Are you sure you want to see all scores? This spoils the blind scorecard!"
          confirmText="Reveal"
          doubleConfirm
          onConfirm={() => {
            setShowRevealConfirm(false);
            onReveal();
          }}
          onCancel={() => setShowRevealConfirm(false)}
        />
      )}

      {showSkinsTie && round.format === 'skins' && (
        <SkinsModal
          carriedSkins={(round.formatState as SkinsState).carryover}
          tiedPlayers={round.activePlayers}
          onSelect={handleSkinsTieBreaker}
          onCancel={() => setShowSkinsTie(false)}
        />
      )}

      {shotgunAlert && (
        <ShotgunModal
          alert={shotgunAlert}
          onDismiss={() => {
            shotgunDismissedForHoles.current = completedHoles.length;
            setShotgunAlert(null);
          }}
        />
      )}

      <AchievementQueue
        achievements={pendingAchievements}
        onClear={() => setPendingAchievements([])}
      />
    </div>
  );
}

function DropdownMenu({
  onReveal,
  onEndRound,
}: {
  onReveal: () => void;
  onEndRound: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-slate-400 active:text-white transition-colors"
        aria-label="Menu"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-slate-700 rounded-xl shadow-xl border border-slate-600 py-1 min-w-[180px]">
            <MenuItem
              label="Reveal Scores"
              onClick={() => { setOpen(false); onReveal(); }}
            />
            <MenuItem
              label="Leave Round"
              onClick={() => { setOpen(false); onEndRound(); }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm font-medium
        ${danger ? 'text-red-400 active:bg-red-500/10' : 'text-slate-200 active:bg-slate-600'}
        transition-colors`}
    >
      {label}
    </button>
  );
}
