import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Trip,
  Round,
  PlayerId,
  HoleScore,
  DailyFormat,
  FormatState,
  SkinsState,
  HoleConfig,
  TeeConfig,
  Achievement,
} from '../types';
import { players } from '../config/players';
import {
  calculateAllCourseHandicaps,
  allocateStrokes,
  getTotalPar,
} from '../lib/handicap';
import {
  createHoleScore,
  getHoleOrder,
  getCompletedHoles,
  calculateStablefordPoints,
} from '../lib/scoring';
import { calculateSkins } from '../lib/skins';
import { calculateNines } from '../lib/nines';
import { calculate90HoleMatchStatus } from '../lib/matchPlay';
import { calculateDailyMatchPlay } from '../lib/matchPlay';
import { calculateBonuses, createEmptyBonuses } from '../lib/bonuses';

function generateTripId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function createScoresForPlayers(playerIds: PlayerId[]): Record<PlayerId, HoleScore[]> {
  const scores: Partial<Record<PlayerId, HoleScore[]>> = {};
  for (const pid of playerIds) {
    scores[pid] = [];
  }
  return scores as Record<PlayerId, HoleScore[]>;
}

function getInitialFormatState(format: DailyFormat, activePlayers: PlayerId[]): FormatState {
  const zeroPoints: Partial<Record<PlayerId, number>> = {};
  const emptyHolePoints: Partial<Record<PlayerId, number[]>> = {};
  for (const pid of activePlayers) {
    zeroPoints[pid] = 0;
    emptyHolePoints[pid] = [];
  }

  switch (format) {
    case 'skins':
      return { type: 'skins', results: [], carryover: 0, tieBreaker: null };
    case 'nines':
      return { type: 'nines', points: zeroPoints as Record<PlayerId, number>, holeResults: [] };
    case 'stableford':
      return { type: 'stableford', points: zeroPoints as Record<PlayerId, number>, holePoints: emptyHolePoints as Record<PlayerId, number[]> };
    case 'strokePlay':
      return { type: 'strokePlay', totals: zeroPoints as Record<PlayerId, number> };
    case 'matchPlay':
      return { type: 'matchPlay', player1: activePlayers[0] ?? 'sam', player2: activePlayers[1] ?? 'cole', status: 0, holesPlayed: 0, result: 'In Progress' };
  }
}

interface TripStore {
  trip: Trip | null;
  activeRoundIndex: number | null;
  currentHoleIndex: number;

  createTrip: () => string;
  loadTrip: (trip: Trip) => void;

  startRound: (config: {
    courseId: string;
    teeId: string;
    teeData: TeeConfig;
    activePlayers: PlayerId[];
    startingHole: 1 | 10;
    format: DailyFormat;
    handicapAllowance: number;
    matchPlayPlayers?: { player1: PlayerId; player2: PlayerId };
  }) => void;

  setScore: (playerId: PlayerId, hole: number, grossScore: number) => void;
  confirmHoleScores: (hole: number) => void;
  clearHoleScores: (hole: number) => void;
  setFairway: (playerId: PlayerId, hole: number, hit: boolean | null) => void;
  setGir: (playerId: PlayerId, hole: number, hit: boolean) => void;
  addAchievement: (achievement: Achievement) => void;

  setCurrentHoleIndex: (index: number) => void;
  navigateHole: (direction: 'next' | 'prev') => void;

  completeRound: () => void;
  endRoundEarly: () => void;
  editRound: (roundIndex: number) => void;
  finishEditingRound: () => void;

  setSkinsTieBreaker: (winner: PlayerId | 'split') => void;

  recalculateFormats: () => void;

  revealScores: () => void;
  hideScores: () => void;

  getActiveRound: () => Round | null;
  getHoleOrder: () => number[];
  getCurrentHole: () => number;
  getHoleConfig: (hole: number) => HoleConfig | undefined;
  getCompletedHoles: () => number[];
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trip: null,
      activeRoundIndex: null,
      currentHoleIndex: 0,

      createTrip: () => {
        const id = generateTripId();
        const trip: Trip = {
          id,
          rounds: [],
          matchPlay90: {
            player1: 'sam',
            player2: 'cole',
            cumulativeStatus: 0,
            holesPlayed: 0,
            roundStatuses: [],
          },
          bonuses: createEmptyBonuses(),
          lastUpdated: Date.now(),
          revealed: false,
          achievements: [],
        };
        set({ trip, activeRoundIndex: null, currentHoleIndex: 0 });
        return id;
      },

      loadTrip: (trip: Trip) => {
        const activeIdx = trip.rounds.findIndex((r) => !r.isComplete);
        set({
          trip,
          activeRoundIndex: activeIdx >= 0 ? activeIdx : null,
          currentHoleIndex: 0,
        });
      },

      startRound: (config) => {
        const state = get();
        if (!state.trip) return;

        const tee = config.teeData;
        const active = config.activePlayers;

        const totalPar = getTotalPar(tee.holes);
        const allHandicaps = calculateAllCourseHandicaps(
          players.filter((p) => active.includes(p.id)),
          tee.slope,
          tee.rating,
          totalPar,
          config.handicapAllowance,
        );

        const lowestHcp = Math.min(...active.map((pid) => allHandicaps[pid]));
        const playingHandicaps: Partial<Record<PlayerId, number>> = {};
        const strokeAllocations: Partial<Record<PlayerId, Record<number, number>>> = {};
        for (const pid of active) {
          playingHandicaps[pid] = allHandicaps[pid] - lowestHcp;
          strokeAllocations[pid] = allocateStrokes(playingHandicaps[pid]!, tee.holes);
        }

        const round: Round = {
          id: `round-${state.trip.rounds.length + 1}`,
          courseId: config.courseId,
          teeId: config.teeId,
          teeData: tee,
          activePlayers: active,
          startingHole: config.startingHole,
          format: config.format,
          handicapAllowance: config.handicapAllowance,
          courseHandicaps: allHandicaps,
          playingHandicaps: playingHandicaps as Record<PlayerId, number>,
          strokeAllocations: strokeAllocations as Record<PlayerId, Record<number, number>>,
          scores: createScoresForPlayers(active),
          formatState: getInitialFormatState(config.format, active),
          isComplete: false,
          endedEarly: false,
          holesCompleted: 0,
          matchPlayPlayers: config.matchPlayPlayers,
        };

        const newRounds = [...state.trip.rounds, round];
        set({
          trip: {
            ...state.trip,
            rounds: newRounds,
            lastUpdated: Date.now(),
          },
          activeRoundIndex: newRounds.length - 1,
          currentHoleIndex: 0,
        });
      },

      setScore: (playerId, hole, grossScore) => {
        const state = get();
        if (!state.trip || state.activeRoundIndex === null) return;

        const round = state.trip.rounds[state.activeRoundIndex];
        const holeConfig = get().getHoleConfig(hole);
        if (!holeConfig) return;

        const strokesReceived = round.strokeAllocations[playerId]?.[hole] ?? 0;
        const existingScore = round.scores[playerId]?.find((s) => s.hole === hole);

        const newScore = createHoleScore(
          hole,
          grossScore,
          holeConfig.par,
          strokesReceived,
          existingScore?.fairwayHit ?? (holeConfig.par === 3 ? null : false),
          existingScore?.gir ?? false,
        );

        const updatedScores = round.scores[playerId]?.filter((s) => s.hole !== hole) ?? [];
        updatedScores.push(newScore);
        updatedScores.sort((a, b) => a.hole - b.hole);

        const newRounds = [...state.trip.rounds];
        newRounds[state.activeRoundIndex] = {
          ...round,
          scores: {
            ...round.scores,
            [playerId]: updatedScores,
          },
        };

        set({
          trip: {
            ...state.trip,
            rounds: newRounds,
            lastUpdated: Date.now(),
          },
        });
      },

      confirmHoleScores: (hole) => {
        const state = get();
        if (!state.trip || state.activeRoundIndex === null) return;

        const round = state.trip.rounds[state.activeRoundIndex];
        const holeConfig = round.teeData.holes.find((h) => h.hole === hole);
        if (!holeConfig) return;

        let changed = false;
        const updatedScoresMap = { ...round.scores };

        for (const pid of round.activePlayers) {
          const hasScore = round.scores[pid]?.some((s) => s.hole === hole);
          if (!hasScore) {
            const strokesReceived = round.strokeAllocations[pid]?.[hole] ?? 0;
            const score = createHoleScore(
              hole,
              holeConfig.par,
              holeConfig.par,
              strokesReceived,
              holeConfig.par === 3 ? null : false,
              false,
            );
            const arr = [...(updatedScoresMap[pid] ?? []), score];
            arr.sort((a, b) => a.hole - b.hole);
            updatedScoresMap[pid] = arr;
            changed = true;
          }
        }

        if (changed) {
          const newRounds = [...state.trip.rounds];
          newRounds[state.activeRoundIndex] = {
            ...round,
            scores: updatedScoresMap,
          };

          set({
            trip: { ...state.trip, rounds: newRounds, lastUpdated: Date.now() },
          });
        }

        get().recalculateFormats();
      },

      clearHoleScores: (hole) => {
        const state = get();
        if (!state.trip || state.activeRoundIndex === null) return;

        const round = state.trip.rounds[state.activeRoundIndex];
        const updatedScoresMap = { ...round.scores };

        for (const pid of round.activePlayers) {
          updatedScoresMap[pid] = (updatedScoresMap[pid] ?? []).filter((s) => s.hole !== hole);
        }

        const newRounds = [...state.trip.rounds];
        newRounds[state.activeRoundIndex] = {
          ...round,
          scores: updatedScoresMap,
        };

        set({
          trip: { ...state.trip, rounds: newRounds, lastUpdated: Date.now() },
        });

        get().recalculateFormats();
      },

      setFairway: (playerId, hole, hit) => {
        const state = get();
        if (!state.trip || state.activeRoundIndex === null) return;

        const round = state.trip.rounds[state.activeRoundIndex];
        const existing = round.scores[playerId]?.find((s) => s.hole === hole);
        if (!existing) return;

        const updatedScores = round.scores[playerId].map((s) =>
          s.hole === hole ? { ...s, fairwayHit: hit } : s,
        );

        const newRounds = [...state.trip.rounds];
        newRounds[state.activeRoundIndex] = {
          ...round,
          scores: { ...round.scores, [playerId]: updatedScores },
        };

        set({
          trip: { ...state.trip, rounds: newRounds, lastUpdated: Date.now() },
        });
      },

      setGir: (playerId, hole, hit) => {
        const state = get();
        if (!state.trip || state.activeRoundIndex === null) return;

        const round = state.trip.rounds[state.activeRoundIndex];
        const existing = round.scores[playerId]?.find((s) => s.hole === hole);
        if (!existing) return;

        const updatedScores = round.scores[playerId].map((s) =>
          s.hole === hole ? { ...s, gir: hit } : s,
        );

        const newRounds = [...state.trip.rounds];
        newRounds[state.activeRoundIndex] = {
          ...round,
          scores: { ...round.scores, [playerId]: updatedScores },
        };

        set({
          trip: { ...state.trip, rounds: newRounds, lastUpdated: Date.now() },
        });
      },

      setCurrentHoleIndex: (index) => set({ currentHoleIndex: index }),

      navigateHole: (direction) => {
        const state = get();
        const holeOrder = state.getHoleOrder();
        const maxIndex = holeOrder.length - 1;
        if (direction === 'next') {
          set({ currentHoleIndex: Math.min(state.currentHoleIndex + 1, maxIndex) });
        } else {
          set({ currentHoleIndex: Math.max(state.currentHoleIndex - 1, 0) });
        }
      },

      completeRound: () => {
        const state = get();
        if (!state.trip || state.activeRoundIndex === null) return;

        const round = state.trip.rounds[state.activeRoundIndex];
        const completedHoles = get().getCompletedHoles();

        const newRounds = [...state.trip.rounds];
        newRounds[state.activeRoundIndex] = {
          ...round,
          isComplete: true,
          holesCompleted: completedHoles.length,
        };

        const trip = { ...state.trip, rounds: newRounds, lastUpdated: Date.now() };

        const roundData = newRounds.map((r) => {
          const holes = r.teeData.holes;
          const order = getHoleOrder(r.startingHole);
          return {
            scores: r.scores,
            courseHandicaps: r.courseHandicaps,
            holes,
            completedHoles: r.isComplete
              ? getCompletedHoles(r.scores, order)
              : order.slice(0, r.holesCompleted),
          };
        });

        trip.matchPlay90 = calculate90HoleMatchStatus(roundData, 'sam', 'cole');
        trip.bonuses = calculateBonuses(roundData);

        set({ trip, activeRoundIndex: null, currentHoleIndex: 0 });
      },

      endRoundEarly: () => {
        const state = get();
        if (!state.trip || state.activeRoundIndex === null) return;

        const round = state.trip.rounds[state.activeRoundIndex];
        const completedHoles = get().getCompletedHoles();

        const newRounds = [...state.trip.rounds];
        newRounds[state.activeRoundIndex] = {
          ...round,
          isComplete: true,
          endedEarly: true,
          holesCompleted: completedHoles.length,
        };

        const trip = { ...state.trip, rounds: newRounds, lastUpdated: Date.now() };

        const roundData = newRounds.map((r) => {
          const holes = r.teeData.holes;
          const order = getHoleOrder(r.startingHole);
          return {
            scores: r.scores,
            courseHandicaps: r.courseHandicaps,
            holes,
            completedHoles: r.isComplete
              ? getCompletedHoles(r.scores, order)
              : order.slice(0, r.holesCompleted),
          };
        });

        trip.matchPlay90 = calculate90HoleMatchStatus(roundData, 'sam', 'cole');
        trip.bonuses = calculateBonuses(roundData);

        set({ trip, activeRoundIndex: null, currentHoleIndex: 0 });
      },

      editRound: (roundIndex) => {
        const state = get();
        if (!state.trip) return;
        const round = state.trip.rounds[roundIndex];
        if (!round) return;

        set({
          activeRoundIndex: roundIndex,
          currentHoleIndex: 0,
        });
      },

      finishEditingRound: () => {
        const state = get();
        if (!state.trip || state.activeRoundIndex === null) return;

        const round = state.trip.rounds[state.activeRoundIndex];
        const holeOrder = getHoleOrder(round.startingHole);
        const completed = getCompletedHoles(round.scores, holeOrder);

        const newRounds = [...state.trip.rounds];
        newRounds[state.activeRoundIndex] = {
          ...round,
          isComplete: true,
          holesCompleted: completed.length,
        };

        const trip = { ...state.trip, rounds: newRounds, lastUpdated: Date.now() };

        const roundData = newRounds.map((r) => {
          const order = getHoleOrder(r.startingHole);
          return {
            scores: r.scores,
            courseHandicaps: r.courseHandicaps,
            holes: r.teeData.holes,
            completedHoles: r.isComplete
              ? getCompletedHoles(r.scores, order)
              : order.slice(0, r.holesCompleted),
          };
        });

        trip.matchPlay90 = calculate90HoleMatchStatus(roundData, 'sam', 'cole');
        trip.bonuses = calculateBonuses(roundData);

        set({ trip, activeRoundIndex: null, currentHoleIndex: 0 });
      },

      addAchievement: (achievement) => {
        const state = get();
        if (!state.trip) return;

        const existing = state.trip.achievements ?? [];
        if (existing.some((a) => a.id === achievement.id)) return;

        set({
          trip: {
            ...state.trip,
            achievements: [...existing, achievement],
            lastUpdated: Date.now(),
          },
        });
      },

      setSkinsTieBreaker: (winner) => {
        const state = get();
        if (!state.trip || state.activeRoundIndex === null) return;

        const round = state.trip.rounds[state.activeRoundIndex];
        if (round.format !== 'skins') return;

        const completedHoles = get().getCompletedHoles();
        const newFormatState = calculateSkins(
          round.scores,
          completedHoles,
          { winner },
        );

        const newRounds = [...state.trip.rounds];
        newRounds[state.activeRoundIndex] = {
          ...round,
          formatState: newFormatState,
        };

        set({
          trip: { ...state.trip, rounds: newRounds, lastUpdated: Date.now() },
        });
      },

      recalculateFormats: () => {
        const state = get();
        if (!state.trip || state.activeRoundIndex === null) return;

        const round = state.trip.rounds[state.activeRoundIndex];
        const completedHoles = get().getCompletedHoles();
        const holes = round.teeData.holes;
        const active = round.activePlayers;

        let formatState: FormatState;

        switch (round.format) {
          case 'skins': {
            const existing = round.formatState as SkinsState;
            formatState = calculateSkins(
              round.scores,
              completedHoles,
              existing.tieBreaker,
            );
            break;
          }
          case 'nines':
            formatState = calculateNines(round.scores, completedHoles);
            break;
          case 'stableford': {
            const points: Record<string, number> = {};
            const holePoints: Record<string, number[]> = {};
            for (const pid of active) {
              points[pid] = 0;
              holePoints[pid] = [];
            }
            for (const hole of completedHoles) {
              const holeConfig = holes.find((h) => h.hole === hole);
              if (!holeConfig) continue;
              for (const pid of active) {
                const score = round.scores[pid]?.find((s) => s.hole === hole);
                if (score) {
                  const pts = calculateStablefordPoints(score.netScore, holeConfig.par);
                  points[pid] += pts;
                  holePoints[pid].push(pts);
                }
              }
            }
            formatState = {
              type: 'stableford',
              points: points as Record<PlayerId, number>,
              holePoints: holePoints as Record<PlayerId, number[]>,
            };
            break;
          }
          case 'strokePlay': {
            const totals: Record<string, number> = {};
            for (const pid of active) {
              totals[pid] = 0;
              for (const hole of completedHoles) {
                const score = round.scores[pid]?.find((s) => s.hole === hole);
                if (score) totals[pid] += score.netScore;
              }
            }
            formatState = {
              type: 'strokePlay',
              totals: totals as Record<PlayerId, number>,
            };
            break;
          }
          case 'matchPlay': {
            const mp = round.matchPlayPlayers ?? { player1: active[0] as PlayerId, player2: active[1] as PlayerId };
            formatState = calculateDailyMatchPlay(
              round.scores,
              round.courseHandicaps,
              holes,
              completedHoles,
              mp.player1,
              mp.player2,
            );
            break;
          }
        }

        const newRounds = [...state.trip.rounds];
        newRounds[state.activeRoundIndex] = {
          ...round,
          formatState,
          holesCompleted: completedHoles.length,
        };

        const roundData = newRounds.map((r) => {
          const order = getHoleOrder(r.startingHole);
          return {
            scores: r.scores,
            courseHandicaps: r.courseHandicaps,
            holes: r.teeData.holes,
            completedHoles: getCompletedHoles(r.scores, order),
          };
        });

        const matchPlay90 = calculate90HoleMatchStatus(roundData, 'sam', 'cole');
        const bonuses = calculateBonuses(roundData);

        set({
          trip: {
            ...state.trip,
            rounds: newRounds,
            matchPlay90,
            bonuses,
            lastUpdated: Date.now(),
          },
        });
      },

      revealScores: () => {
        const state = get();
        if (!state.trip) return;
        set({ trip: { ...state.trip, revealed: true } });
      },

      hideScores: () => {
        const state = get();
        if (!state.trip) return;
        set({ trip: { ...state.trip, revealed: false } });
      },

      getActiveRound: () => {
        const state = get();
        if (!state.trip || state.activeRoundIndex === null) return null;
        return state.trip.rounds[state.activeRoundIndex] ?? null;
      },

      getHoleOrder: () => {
        const round = get().getActiveRound();
        if (!round) return Array.from({ length: 18 }, (_, i) => i + 1);
        return getHoleOrder(round.startingHole);
      },

      getCurrentHole: () => {
        const holeOrder = get().getHoleOrder();
        return holeOrder[get().currentHoleIndex] ?? 1;
      },

      getHoleConfig: (hole: number) => {
        const round = get().getActiveRound();
        if (!round) return undefined;
        return round.teeData.holes.find((h) => h.hole === hole);
      },

      getCompletedHoles: () => {
        const round = get().getActiveRound();
        if (!round) return [];
        const holeOrder = get().getHoleOrder();
        return getCompletedHoles(round.scores, holeOrder);
      },
    }),
    {
      name: 'golf-trip-storage',
      partialize: (state) => ({
        trip: state.trip,
        activeRoundIndex: state.activeRoundIndex,
        currentHoleIndex: state.currentHoleIndex,
      }),
    },
  ),
);
