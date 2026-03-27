import type { HoleConfig, HoleScore, PlayerId } from '../types';

export function getMaxScore(par: number): number {
  return par * 2;
}

export function capScore(grossScore: number, par: number): number {
  return Math.min(grossScore, getMaxScore(par));
}

export function calculateNetScore(grossScore: number, strokesReceived: number): number {
  return grossScore - strokesReceived;
}

export function createHoleScore(
  hole: number,
  grossScore: number,
  par: number,
  strokesReceived: number,
  fairwayHit: boolean | null,
  gir: boolean,
): HoleScore {
  const capped = capScore(grossScore, par);
  return {
    hole,
    grossScore: capped,
    netScore: calculateNetScore(capped, strokesReceived),
    strokesReceived,
    fairwayHit,
    gir,
  };
}

export function calculateStablefordPoints(netScore: number, par: number): number {
  const diff = netScore - par;
  if (diff <= -2) return 3; // net eagle or better
  if (diff === -1) return 2; // net birdie
  if (diff === 0) return 1;  // net par
  return 0;                   // net bogey or worse
}

export function getNetTotalForRound(
  scores: HoleScore[],
  completedHoles?: number[],
): number {
  const filtered = completedHoles
    ? scores.filter((s) => completedHoles.includes(s.hole))
    : scores;
  return filtered.reduce((sum, s) => sum + s.netScore, 0);
}

export function getGrossTotalForRound(
  scores: HoleScore[],
  completedHoles?: number[],
): number {
  const filtered = completedHoles
    ? scores.filter((s) => completedHoles.includes(s.hole))
    : scores;
  return filtered.reduce((sum, s) => sum + s.grossScore, 0);
}

export function isNetBirdie(netScore: number, par: number): boolean {
  return netScore <= par - 1;
}

export function isNetEagle(netScore: number, par: number): boolean {
  return netScore <= par - 2;
}

export function getHoleOrder(startingHole: 1 | 10): number[] {
  if (startingHole === 1) {
    return Array.from({ length: 18 }, (_, i) => i + 1);
  }
  return [10, 11, 12, 13, 14, 15, 16, 17, 18, 1, 2, 3, 4, 5, 6, 7, 8, 9];
}

export function getCompletedHoles(
  scores: Record<PlayerId, HoleScore[]>,
  holeOrder: number[],
): number[] {
  const allPlayerIds = Object.keys(scores) as PlayerId[];
  if (allPlayerIds.length === 0) return [];

  return holeOrder.filter((hole) =>
    allPlayerIds.every((pid) =>
      scores[pid]?.some((s) => s.hole === hole && s.grossScore > 0),
    ),
  );
}

export function getScoreForHole(
  scores: HoleScore[],
  hole: number,
): HoleScore | undefined {
  return scores.find((s) => s.hole === hole);
}

export function getParForHoles(holes: HoleConfig[], holeNumbers: number[]): number {
  return holes
    .filter((h) => holeNumbers.includes(h.hole))
    .reduce((sum, h) => sum + h.par, 0);
}
