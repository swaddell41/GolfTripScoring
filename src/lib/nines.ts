import type { PlayerId, HoleScore, NinesState, NinesHoleResult } from '../types';

const POINTS = { best: 5, middle: 3, worst: 1 };

export function calculateNinesHole(
  scores: Record<PlayerId, HoleScore[]>,
  hole: number,
): NinesHoleResult {
  const playerIds = Object.keys(scores) as PlayerId[];

  const holeScores = playerIds.map((pid) => ({
    playerId: pid,
    netScore: scores[pid]?.find((s) => s.hole === hole)?.netScore ?? 99,
  }));

  holeScores.sort((a, b) => a.netScore - b.netScore);

  const rankings: NinesHoleResult['rankings'] = [];

  if (holeScores.length !== 3) {
    for (const s of holeScores) {
      rankings.push({ playerId: s.playerId, netScore: s.netScore, points: 3 });
    }
    return { hole, rankings };
  }

  const [first, second, third] = holeScores;
  const allTied = first.netScore === second.netScore && second.netScore === third.netScore;
  const topTied = first.netScore === second.netScore && second.netScore !== third.netScore;
  const bottomTied = second.netScore === third.netScore && first.netScore !== second.netScore;

  if (allTied) {
    // 3/3/3
    rankings.push({ playerId: first.playerId, netScore: first.netScore, points: 3 });
    rankings.push({ playerId: second.playerId, netScore: second.netScore, points: 3 });
    rankings.push({ playerId: third.playerId, netScore: third.netScore, points: 3 });
  } else if (topTied) {
    // Two tied for best: (5+3)/2 = 4 each, worst gets 1
    rankings.push({ playerId: first.playerId, netScore: first.netScore, points: 4 });
    rankings.push({ playerId: second.playerId, netScore: second.netScore, points: 4 });
    rankings.push({ playerId: third.playerId, netScore: third.netScore, points: 1 });
  } else if (bottomTied) {
    // Best gets 5, two tied for worst: (3+1)/2 = 2 each
    rankings.push({ playerId: first.playerId, netScore: first.netScore, points: 5 });
    rankings.push({ playerId: second.playerId, netScore: second.netScore, points: 2 });
    rankings.push({ playerId: third.playerId, netScore: third.netScore, points: 2 });
  } else {
    // No ties: 5/3/1
    rankings.push({ playerId: first.playerId, netScore: first.netScore, points: POINTS.best });
    rankings.push({ playerId: second.playerId, netScore: second.netScore, points: POINTS.middle });
    rankings.push({ playerId: third.playerId, netScore: third.netScore, points: POINTS.worst });
  }

  return { hole, rankings };
}

export function calculateNines(
  scores: Record<PlayerId, HoleScore[]>,
  completedHoles: number[],
): NinesState {
  const playerIds = Object.keys(scores) as PlayerId[];
  const points: Record<string, number> = {};
  for (const pid of playerIds) {
    points[pid] = 0;
  }

  const holeResults: NinesHoleResult[] = [];

  for (const hole of completedHoles) {
    const result = calculateNinesHole(scores, hole);
    holeResults.push(result);
    for (const r of result.rankings) {
      points[r.playerId] = (points[r.playerId] || 0) + r.points;
    }
  }

  return {
    type: 'nines',
    points: points as Record<PlayerId, number>,
    holeResults,
  };
}
