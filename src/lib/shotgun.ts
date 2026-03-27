import type { Trip, Round, PlayerId } from '../types';
import type {
  SkinsState,
  NinesState,
  StablefordState,
  StrokePlayState,
  DailyMatchPlayState,
} from '../types';
import { getSkinsTotals } from './skins';

const MATCH_PLAY_90_THRESHOLD = 5;
const HYPOTHETICAL_HOLES = 3;
const COOLDOWN_HOLES = 3;
const MIN_HOLES_BEFORE_CHECK = 3;

export interface ShotgunAlert {
  leader: string;
  reason90Hole: string | null;
  reasonRound: string | null;
}

function isRunningAway(round: Round): { leader: string; detail: string } | null {
  const fs = round.formatState;
  const holesPlayed = round.holesCompleted;

  if (holesPlayed < MIN_HOLES_BEFORE_CHECK) return null;

  const active = round.activePlayers;
  if (active.length < 2) return null;

  switch (fs.type) {
    case 'skins': {
      const totals = getSkinsTotals(fs as SkinsState);
      const sorted = active
        .map((pid) => ({ pid, val: totals[pid] ?? 0 }))
        .sort((a, b) => b.val - a.val);
      if (sorted.length < 2) return null;
      const gap = sorted[0].val - sorted[1].val;
      const maxIn3 = HYPOTHETICAL_HOLES + (fs as SkinsState).carryover;
      if (gap > maxIn3 && sorted[0].pid !== 'sam') {
        return { leader: sorted[0].pid, detail: `${gap} skins ahead after ${holesPlayed} holes` };
      }
      return null;
    }
    case 'nines': {
      const n = fs as NinesState;
      const sorted = active
        .map((pid) => ({ pid, val: n.points[pid] ?? 0 }))
        .sort((a, b) => b.val - a.val);
      if (sorted.length < 2) return null;
      const gap = sorted[0].val - sorted[1].val;
      const maxIn3 = HYPOTHETICAL_HOLES * 5;
      if (gap > maxIn3 && sorted[0].pid !== 'sam') {
        return { leader: sorted[0].pid, detail: `${gap} pts ahead in Nines after ${holesPlayed} holes` };
      }
      return null;
    }
    case 'stableford': {
      const st = fs as StablefordState;
      const sorted = active
        .map((pid) => ({ pid, val: st.points[pid] ?? 0 }))
        .sort((a, b) => b.val - a.val);
      if (sorted.length < 2) return null;
      const gap = sorted[0].val - sorted[1].val;
      const maxIn3 = HYPOTHETICAL_HOLES * 3;
      if (gap > maxIn3 && sorted[0].pid !== 'sam') {
        return { leader: sorted[0].pid, detail: `${gap} pts ahead in Stableford after ${holesPlayed} holes` };
      }
      return null;
    }
    case 'strokePlay': {
      const sp = fs as StrokePlayState;
      const sorted = active
        .map((pid) => ({ pid, val: sp.totals[pid] ?? 0 }))
        .sort((a, b) => a.val - b.val);
      if (sorted.length < 2) return null;
      const gap = sorted[1].val - sorted[0].val;
      const maxIn3 = HYPOTHETICAL_HOLES * 4;
      if (gap > maxIn3 && sorted[0].pid !== 'sam') {
        return { leader: sorted[0].pid, detail: `${gap} strokes ahead after ${holesPlayed} holes` };
      }
      return null;
    }
    case 'matchPlay': {
      const mp = fs as DailyMatchPlayState;
      const status = mp.status;
      if (status === 0) return null;
      const leader = status > 0 ? mp.player1 : mp.player2;
      const lead = Math.abs(status);
      if (lead > HYPOTHETICAL_HOLES && leader !== 'sam') {
        return { leader, detail: `${lead} UP after ${holesPlayed} holes in Match Play` };
      }
      return null;
    }
    default:
      return null;
  }
}

export function checkShotgunAlert(
  trip: Trip,
  activeRoundIndex: number | null,
  lastRoundAlertHole: number,
): ShotgunAlert | null {
  let reason90Hole: string | null = null;
  let reasonRound: string | null = null;
  let leader: PlayerId | null = null;

  const mp90 = trip.matchPlay90;
  if (mp90.cumulativeStatus <= -MATCH_PLAY_90_THRESHOLD) {
    reason90Hole = `Cole is ${Math.abs(mp90.cumulativeStatus)} UP in the 90-hole match`;
    leader = 'cole';
  }

  if (activeRoundIndex !== null) {
    const round = trip.rounds[activeRoundIndex];
    if (round) {
      const holesPlayed = round.holesCompleted;
      const cooledOff = lastRoundAlertHole === 0 || holesPlayed >= lastRoundAlertHole + COOLDOWN_HOLES;

      if (cooledOff) {
        const roundCheck = isRunningAway(round);
        if (roundCheck) {
          reasonRound = roundCheck.detail;
          if (!leader) leader = roundCheck.leader as PlayerId;
        }
      }
    }
  }

  if (!reason90Hole && !reasonRound) return null;

  const leaderName = leader === 'cole' ? 'Cole' : leader === 'niko' ? 'Niko' : leader ?? 'Someone';

  return {
    leader: leaderName,
    reason90Hole,
    reasonRound,
  };
}
