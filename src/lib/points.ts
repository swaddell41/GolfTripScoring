import type {
  Trip,
  PlayerId,
  Round,
  SkinsState,
  NinesState,
  StablefordState,
  StrokePlayState,
  DailyMatchPlayState,
} from '../types';
import { getSkinsTotals } from './skins';

export const POINTS = {
  OVERALL_MATCH: 20,
  ROUND_WIN: 5,
  ROUND_SECOND: 2,
  BIRDIE: 1,
  EAGLE: 3,
  FIR_LEADER: 5,
  GIR_LEADER: 5,
} as const;

export interface PointsBreakdown {
  overallMatch: number;
  roundWins: number;
  birdies: number;
  eagles: number;
  firLeader: number;
  girLeader: number;
  total: number;
}

export function getRoundWinner(round: Round): { first: PlayerId | null; second: PlayerId | null } {
  const active = round.activePlayers;
  if (active.length < 2) return { first: null, second: null };

  const fs = round.formatState;

  switch (fs.type) {
    case 'skins': {
      const totals = getSkinsTotals(fs as SkinsState);
      const sorted = active
        .map((pid) => ({ pid, val: totals[pid] ?? 0 }))
        .sort((a, b) => b.val - a.val);
      if (sorted.length === 0 || sorted[0].val === 0) return { first: null, second: null };
      const first = sorted[0].pid;
      const second = sorted.length >= 2 && sorted[1].val > 0 ? sorted[1].pid : null;
      if (sorted.length >= 2 && sorted[0].val === sorted[1].val) return { first: null, second: null };
      return { first, second };
    }
    case 'nines': {
      const n = fs as NinesState;
      const sorted = active
        .map((pid) => ({ pid, val: n.points[pid] ?? 0 }))
        .sort((a, b) => b.val - a.val);
      if (sorted[0].val === 0) return { first: null, second: null };
      if (sorted.length >= 2 && sorted[0].val === sorted[1].val) return { first: null, second: null };
      const first = sorted[0].pid;
      const second = sorted.length >= 2 ? sorted[1].pid : null;
      if (sorted.length >= 3 && sorted[1].val === sorted[2].val) {
        return { first, second: null };
      }
      return { first, second };
    }
    case 'stableford': {
      const st = fs as StablefordState;
      const sorted = active
        .map((pid) => ({ pid, val: st.points[pid] ?? 0 }))
        .sort((a, b) => b.val - a.val);
      if (sorted[0].val === 0) return { first: null, second: null };
      if (sorted.length >= 2 && sorted[0].val === sorted[1].val) return { first: null, second: null };
      const first = sorted[0].pid;
      const second = sorted.length >= 2 ? sorted[1].pid : null;
      if (sorted.length >= 3 && sorted[1].val === sorted[2].val) {
        return { first, second: null };
      }
      return { first, second };
    }
    case 'strokePlay': {
      const sp = fs as StrokePlayState;
      const sorted = active
        .map((pid) => ({ pid, val: sp.totals[pid] ?? 0 }))
        .sort((a, b) => a.val - b.val);
      if (sorted.length >= 2 && sorted[0].val === sorted[1].val) return { first: null, second: null };
      const first = sorted[0].pid;
      const second = sorted.length >= 2 ? sorted[1].pid : null;
      if (sorted.length >= 3 && sorted[1].val === sorted[2].val) {
        return { first, second: null };
      }
      return { first, second };
    }
    case 'matchPlay': {
      const mp = fs as DailyMatchPlayState;
      if (mp.status > 0) return { first: mp.player1, second: mp.player2 };
      if (mp.status < 0) return { first: mp.player2, second: mp.player1 };
      return { first: null, second: null };
    }
    default:
      return { first: null, second: null };
  }
}

export function calculatePoints(trip: Trip): Record<PlayerId, PointsBreakdown> {
  const allPlayers: PlayerId[] = ['sam', 'cole', 'niko'];
  const result: Record<string, PointsBreakdown> = {};

  for (const pid of allPlayers) {
    result[pid] = {
      overallMatch: 0,
      roundWins: 0,
      birdies: 0,
      eagles: 0,
      firLeader: 0,
      girLeader: 0,
      total: 0,
    };
  }

  // 90-hole match (Sam vs Cole only)
  const mp90 = trip.matchPlay90;
  if (mp90.cumulativeStatus > 0) {
    result[mp90.player1].overallMatch = POINTS.OVERALL_MATCH;
  } else if (mp90.cumulativeStatus < 0) {
    result[mp90.player2].overallMatch = POINTS.OVERALL_MATCH;
  } else if (mp90.holesPlayed > 0) {
    result[mp90.player1].overallMatch = POINTS.OVERALL_MATCH / 2;
    result[mp90.player2].overallMatch = POINTS.OVERALL_MATCH / 2;
  }

  // Round wins
  const completedRounds = trip.rounds.filter((r) => r.isComplete);
  for (const round of completedRounds) {
    const { first, second } = getRoundWinner(round);
    if (first) {
      result[first].roundWins += POINTS.ROUND_WIN;
    }
    if (second && round.activePlayers.length >= 3) {
      result[second].roundWins += POINTS.ROUND_SECOND;
    }
  }

  // Birdie & eagle bonuses
  for (const pid of allPlayers) {
    const birdieCount = trip.bonuses.netBirdies[pid] ?? 0;
    const eagleCount = trip.bonuses.netEagles[pid] ?? 0;
    // Eagles are already counted in netBirdies, so birdies-only = birdieCount - eagleCount
    result[pid].birdies = (birdieCount - eagleCount) * POINTS.BIRDIE;
    result[pid].eagles = eagleCount * POINTS.EAGLE;
  }

  // FIR leader (+5 to whoever has the most)
  const firCounts = allPlayers.map((pid) => ({
    pid,
    count: trip.bonuses.fairwaysHit[pid] ?? 0,
  }));
  const maxFir = Math.max(...firCounts.map((f) => f.count));
  if (maxFir > 0) {
    const firLeaders = firCounts.filter((f) => f.count === maxFir);
    for (const leader of firLeaders) {
      result[leader.pid].firLeader = POINTS.FIR_LEADER / firLeaders.length;
    }
  }

  // GIR leader (+5 to whoever has the most)
  const girCounts = allPlayers.map((pid) => ({
    pid,
    count: trip.bonuses.greensInReg[pid] ?? 0,
  }));
  const maxGir = Math.max(...girCounts.map((g) => g.count));
  if (maxGir > 0) {
    const girLeaders = girCounts.filter((g) => g.count === maxGir);
    for (const leader of girLeaders) {
      result[leader.pid].girLeader = POINTS.GIR_LEADER / girLeaders.length;
    }
  }

  // Sum totals
  for (const pid of allPlayers) {
    const b = result[pid];
    b.total = b.overallMatch + b.roundWins + b.birdies + b.eagles + b.firLeader + b.girLeader;
  }

  return result as Record<PlayerId, PointsBreakdown>;
}
