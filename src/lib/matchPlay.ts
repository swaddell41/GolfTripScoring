import type { PlayerId, HoleScore, MatchPlay90State, DailyMatchPlayState, HoleConfig } from '../types';
import { calculateMatchPlayStrokes } from './handicap';

export function calculateMatchPlayHoleResult(
  player1Score: HoleScore,
  player2Score: HoleScore,
  matchStrokeAlloc: Record<number, number>,
  receivingPlayer: 1 | 2 | null,
): number {
  let p1Net = player1Score.grossScore;
  let p2Net = player2Score.grossScore;

  const strokes = matchStrokeAlloc[player1Score.hole] || 0;
  if (receivingPlayer === 1) {
    p1Net -= strokes;
  } else if (receivingPlayer === 2) {
    p2Net -= strokes;
  }

  if (p1Net < p2Net) return 1;  // player1 wins hole
  if (p2Net < p1Net) return -1; // player2 wins hole
  return 0; // halved
}

export function calculate90HoleMatchStatus(
  rounds: {
    scores: Record<PlayerId, HoleScore[]>;
    courseHandicaps: Record<PlayerId, number>;
    holes: HoleConfig[];
    completedHoles: number[];
  }[],
  player1: PlayerId,
  player2: PlayerId,
): MatchPlay90State {
  let cumulativeStatus = 0;
  let totalHolesPlayed = 0;
  const roundStatuses: number[] = [];

  for (const round of rounds) {
    const p1Hcp = round.courseHandicaps[player1];
    const p2Hcp = round.courseHandicaps[player2];
    const { receivingPlayer, allocation } = calculateMatchPlayStrokes(
      p1Hcp,
      p2Hcp,
      round.holes,
    );

    let roundStatus = 0;
    for (const hole of round.completedHoles) {
      const p1Score = round.scores[player1]?.find((s) => s.hole === hole);
      const p2Score = round.scores[player2]?.find((s) => s.hole === hole);
      if (!p1Score || !p2Score) continue;

      const result = calculateMatchPlayHoleResult(
        p1Score,
        p2Score,
        allocation,
        receivingPlayer,
      );
      roundStatus += result;
      cumulativeStatus += result;
      totalHolesPlayed++;
    }
    roundStatuses.push(roundStatus);
  }

  return {
    player1,
    player2,
    cumulativeStatus,
    holesPlayed: totalHolesPlayed,
    roundStatuses,
  };
}

export function formatMatchPlayStatus(
  status: number,
  holesPlayed: number,
  totalHoles: number,
  player1Name: string,
  player2Name: string,
): string {
  const holesRemaining = totalHoles - holesPlayed;

  if (holesPlayed === totalHoles || holesRemaining === 0) {
    if (status > 0) return `${player1Name} wins ${status}UP`;
    if (status < 0) return `${player2Name} wins ${Math.abs(status)}UP`;
    return 'All Square (Tied)';
  }

  if (Math.abs(status) > holesRemaining) {
    const winner = status > 0 ? player1Name : player2Name;
    return `${winner} wins ${Math.abs(status)}&${holesRemaining}`;
  }

  if (status > 0) return `${player1Name} ${status}UP`;
  if (status < 0) return `${player2Name} ${Math.abs(status)}UP`;
  return 'All Square';
}

export function calculateDailyMatchPlay(
  scores: Record<PlayerId, HoleScore[]>,
  courseHandicaps: Record<PlayerId, number>,
  holes: HoleConfig[],
  completedHoles: number[],
  player1: PlayerId,
  player2: PlayerId,
): DailyMatchPlayState {
  const { receivingPlayer, allocation } = calculateMatchPlayStrokes(
    courseHandicaps[player1],
    courseHandicaps[player2],
    holes,
  );

  let status = 0;
  let holesPlayed = 0;

  for (const hole of completedHoles) {
    const p1Score = scores[player1]?.find((s) => s.hole === hole);
    const p2Score = scores[player2]?.find((s) => s.hole === hole);
    if (!p1Score || !p2Score) continue;

    const result = calculateMatchPlayHoleResult(
      p1Score,
      p2Score,
      allocation,
      receivingPlayer,
    );
    status += result;
    holesPlayed++;
  }

  const holesRemaining = 18 - holesPlayed;
  let result = 'In Progress';
  if (holesPlayed === 18 || Math.abs(status) > holesRemaining) {
    if (status > 0) result = `${player1} wins`;
    else if (status < 0) result = `${player2} wins`;
    else result = 'Halved';
  }

  return {
    type: 'matchPlay',
    player1,
    player2,
    status,
    holesPlayed,
    result,
  };
}
