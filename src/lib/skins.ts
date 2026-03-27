import type { PlayerId, HoleScore, SkinsState, SkinResult } from '../types';

export function calculateSkins(
  scores: Record<PlayerId, HoleScore[]>,
  completedHoles: number[],
  tieBreaker?: { winner: PlayerId | 'split' } | null,
): SkinsState {
  const playerIds = Object.keys(scores) as PlayerId[];
  const results: SkinResult[] = [];
  let carryover = 0;

  for (let i = 0; i < completedHoles.length; i++) {
    const hole = completedHoles[i];
    const isLastHole = i === completedHoles.length - 1;

    const holeScores = playerIds.map((pid) => ({
      playerId: pid,
      netScore: scores[pid]?.find((s) => s.hole === hole)?.netScore ?? 99,
    }));

    const minScore = Math.min(...holeScores.map((s) => s.netScore));
    const winners = holeScores.filter((s) => s.netScore === minScore);

    if (winners.length === 1) {
      results.push({
        hole,
        winner: winners[0].playerId,
        carried: carryover > 0,
        value: 1 + carryover,
      });
      carryover = 0;
    } else {
      if (isLastHole && completedHoles.length === 18 && tieBreaker) {
        if (tieBreaker.winner === 'split') {
          for (const w of winners) {
            results.push({
              hole,
              winner: w.playerId,
              carried: carryover > 0,
              value: (1 + carryover) / winners.length,
            });
          }
          carryover = 0;
        } else {
          results.push({
            hole,
            winner: tieBreaker.winner,
            carried: carryover > 0,
            value: 1 + carryover,
          });
          carryover = 0;
        }
      } else {
        results.push({
          hole,
          winner: null,
          carried: true,
          value: 0,
        });
        carryover += 1;
      }
    }
  }

  return {
    type: 'skins',
    results,
    carryover,
    tieBreaker: tieBreaker ?? null,
  };
}

export function getSkinsTotals(
  state: SkinsState,
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const r of state.results) {
    if (r.winner) {
      totals[r.winner] = (totals[r.winner] || 0) + r.value;
    }
  }
  return totals;
}

export function needsTieBreaker(state: SkinsState, totalHoles: number): boolean {
  if (state.results.length < totalHoles) return false;
  const lastResult = state.results[state.results.length - 1];
  return lastResult?.winner === null && state.carryover > 0;
}
