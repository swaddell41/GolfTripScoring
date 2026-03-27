import type { HoleConfig, PlayerId, Player } from '../types';

export function calculateCourseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number,
  allowance: number = 1.0,
): number {
  const raw = handicapIndex * (slopeRating / 113) + (courseRating - par);
  return Math.round(raw * allowance);
}

export function calculateAllCourseHandicaps(
  players: Player[],
  slope: number,
  rating: number,
  par: number,
  allowance: number,
): Record<PlayerId, number> {
  const result: Record<string, number> = {};
  for (const player of players) {
    result[player.id] = calculateCourseHandicap(
      player.handicapIndex,
      slope,
      rating,
      par,
      allowance,
    );
  }
  return result as Record<PlayerId, number>;
}

/**
 * Allocates strokes to holes based on stroke index.
 * Returns a map of hole number -> strokes received on that hole.
 * For course handicaps > 18, extra strokes wrap around (round-robin).
 */
export function allocateStrokes(
  courseHandicap: number,
  holes: HoleConfig[],
): Record<number, number> {
  const allocation: Record<number, number> = {};
  for (const hole of holes) {
    allocation[hole.hole] = 0;
  }

  if (courseHandicap <= 0) return allocation;

  const sortedByIndex = [...holes].sort((a, b) => a.strokeIndex - b.strokeIndex);
  let remaining = courseHandicap;
  let round = 0;

  while (remaining > 0) {
    for (const hole of sortedByIndex) {
      if (remaining <= 0) break;
      allocation[hole.hole] = round + 1;
      remaining--;
    }
    round++;
  }

  return allocation;
}

/**
 * For match play between two players, strokes are based on
 * the difference in course handicaps. The higher-handicap
 * player receives the difference.
 */
export function calculateMatchPlayStrokes(
  player1Handicap: number,
  player2Handicap: number,
  holes: HoleConfig[],
): {
  receivingPlayer: 1 | 2 | null;
  strokeDiff: number;
  allocation: Record<number, number>;
} {
  const diff = Math.abs(player1Handicap - player2Handicap);
  if (diff === 0) {
    const empty: Record<number, number> = {};
    for (const h of holes) empty[h.hole] = 0;
    return { receivingPlayer: null, strokeDiff: 0, allocation: empty };
  }

  const receivingPlayer: 1 | 2 = player1Handicap > player2Handicap ? 1 : 2;
  const allocation = allocateStrokes(diff, holes);

  return { receivingPlayer, strokeDiff: diff, allocation };
}

export function getTotalPar(holes: HoleConfig[]): number {
  return holes.reduce((sum, h) => sum + h.par, 0);
}
