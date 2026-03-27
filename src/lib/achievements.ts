import type { Trip, PlayerId, Round, Achievement, SkinsState, DailyMatchPlayState } from '../types';
import { players } from '../config/players';
import { getHoleOrder, getCompletedHoles } from './scoring';

function name(pid: PlayerId): string {
  return players.find((p) => p.id === pid)?.name ?? pid;
}

interface AchievementDef {
  type: string;
  icon: string;
  check: (ctx: CheckContext) => AchievementHit[];
}

interface AchievementHit {
  playerId: PlayerId;
  hole?: number;
  title: string;
  message: string;
  image?: string;
}

interface CheckContext {
  trip: Trip;
  round: Round;
  roundIndex: number;
  completedHoles: number[];
  previousCompletedCount: number;
}

const PIRATE_CHEERS = [
  'Arrr!',
  'Shiver me timbers!',
  'Yo ho ho!',
  'Blimey!',
  'Avast!',
  'By Blackbeard\'s ghost!',
  'Walk the plank!',
];

function pirateCheer(): string {
  return PIRATE_CHEERS[Math.floor(Math.random() * PIRATE_CHEERS.length)];
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    type: 'first_blood',
    icon: '🗡️',
    check: ({ trip, round, completedHoles }) => {
      if (round.format !== 'skins') return [];
      const fs = round.formatState as SkinsState;
      const allPrevAch = trip.achievements ?? [];
      if (allPrevAch.some((a) => a.type === 'first_blood')) return [];

      const firstWin = fs.results.find((r) => r.winner !== null);
      if (!firstWin || !completedHoles.includes(firstWin.hole)) return [];

      return [{
        playerId: firstWin.winner!,
        hole: firstWin.hole,
        title: 'First Blood',
        message: `${pirateCheer()} ${name(firstWin.winner!)} plundered the first skin of the trip!`,
      }];
    },
  },
  {
    type: 'net_eagle',
    icon: '🦅',
    check: ({ round, completedHoles, previousCompletedCount }) => {
      const hits: AchievementHit[] = [];
      const newHoles = completedHoles.slice(previousCompletedCount);

      for (const hole of newHoles) {
        const hc = round.teeData.holes.find((h) => h.hole === hole);
        if (!hc) continue;
        for (const pid of round.activePlayers) {
          const score = round.scores[pid]?.find((s) => s.hole === hole);
          if (score && score.netScore <= hc.par - 2) {
            hits.push({
              playerId: pid,
              hole,
              title: 'Sandbagged!',
              message: `${name(pid)} just made a net eagle on hole ${hole}... suspicious 🤨`,
            });
          }
        }
      }
      return hits;
    },
  },
  {
    type: 'net_birdie',
    icon: '🐦',
    check: ({ round, completedHoles, previousCompletedCount }) => {
      const hits: AchievementHit[] = [];
      const newHoles = completedHoles.slice(previousCompletedCount);

      for (const hole of newHoles) {
        const hc = round.teeData.holes.find((h) => h.hole === hole);
        if (!hc) continue;
        for (const pid of round.activePlayers) {
          const score = round.scores[pid]?.find((s) => s.hole === hole);
          if (score && score.netScore === hc.par - 1) {
            hits.push({
              playerId: pid,
              hole,
              title: 'Birdie Raid',
              message: `${pirateCheer()} ${name(pid)} snagged a net birdie on ${hole}!`,
            });
          }
        }
      }
      return hits;
    },
  },
  {
    type: 'double_par',
    icon: '💀',
    check: ({ round, completedHoles, previousCompletedCount }) => {
      const hits: AchievementHit[] = [];
      const newHoles = completedHoles.slice(previousCompletedCount);

      for (const hole of newHoles) {
        const hc = round.teeData.holes.find((h) => h.hole === hole);
        if (!hc) continue;
        for (const pid of round.activePlayers) {
          const score = round.scores[pid]?.find((s) => s.hole === hole);
          if (score && score.grossScore >= hc.par * 2) {
            hits.push({
              playerId: pid,
              hole,
              title: 'Double Par Club',
              message: `Welcome aboard the Double Par Club, ${name(pid)}! 🏴‍☠️ That hole made Davy Jones proud.`,
              image: '/cat-bunker.png',
            });
          }
        }
      }
      return hits;
    },
  },
  {
    type: 'ace',
    icon: '🏴‍☠️',
    check: ({ round, completedHoles, previousCompletedCount }) => {
      const hits: AchievementHit[] = [];
      const newHoles = completedHoles.slice(previousCompletedCount);

      for (const hole of newHoles) {
        for (const pid of round.activePlayers) {
          const score = round.scores[pid]?.find((s) => s.hole === hole);
          if (score && score.grossScore === 1) {
            hits.push({
              playerId: pid,
              hole,
              title: 'HOLE IN ONE!',
              message: `🎉 ${name(pid)} ACED hole ${hole}! DRINKS ON ${name(pid).toUpperCase()}!!! 🍺🏴‍☠️`,
            });
          }
        }
      }
      return hits;
    },
  },
  {
    type: 'skin_streak',
    icon: '⚔️',
    check: ({ trip, round, roundIndex }) => {
      if (round.format !== 'skins') return [];
      const fs = round.formatState as SkinsState;
      const hits: AchievementHit[] = [];

      for (const pid of round.activePlayers) {
        let streak = 0;
        for (const r of fs.results) {
          if (r.winner === pid) {
            streak++;
            if (streak >= 3) {
              const achId = `skin_streak_${roundIndex}_${pid}_${r.hole}`;
              if (!(trip.achievements ?? []).some((a) => a.id === achId)) {
                hits.push({
                  playerId: pid,
                  hole: r.hole,
                  title: 'Skin Pirate',
                  message: `${name(pid)} won 3 skins in a row! Someone stop this pirate! ⚔️`,
                });
              }
            }
          } else {
            streak = 0;
          }
        }
      }
      return hits;
    },
  },
  {
    type: 'comeback_hole',
    icon: '🔥',
    check: ({ round, completedHoles, previousCompletedCount }) => {
      if (round.format !== 'matchPlay' && round.format !== 'skins') return [];

      if (round.format === 'matchPlay') {
        const mp = round.formatState as DailyMatchPlayState;
        const newHoles = completedHoles.slice(previousCompletedCount);

        for (const hole of newHoles) {
          const holeIdx = completedHoles.indexOf(hole);
          if (holeIdx < 3) continue;

          const prevHoles = completedHoles.slice(0, holeIdx);
          let prevStatus = 0;
          for (const ph of prevHoles) {
            const s1 = round.scores[mp.player1]?.find((s) => s.hole === ph);
            const s2 = round.scores[mp.player2]?.find((s) => s.hole === ph);
            if (s1 && s2) {
              if (s1.netScore < s2.netScore) prevStatus++;
              else if (s2.netScore < s1.netScore) prevStatus--;
            }
          }

          const wasDown3OrMore = Math.abs(prevStatus) >= 3;
          if (wasDown3OrMore && Math.abs(mp.status) < Math.abs(prevStatus)) {
            const comebackPid = prevStatus > 0 ? mp.player2 : mp.player1;
            return [{
              playerId: comebackPid,
              hole,
              title: 'Comeback Kid',
              message: `${pirateCheer()} ${name(comebackPid)} refuses to walk the plank! Clawing back from ${Math.abs(prevStatus)} down!`,
            }];
          }
        }
      }
      return [];
    },
  },
  {
    type: 'halved_streak',
    icon: '⚖️',
    check: ({ round }) => {
      if (round.format !== 'skins') return [];
      const fs = round.formatState as SkinsState;

      let carryStreak = 0;
      for (const r of fs.results) {
        if (r.winner === null) carryStreak++;
        else carryStreak = 0;
      }

      if (carryStreak >= 4) {
        return [{
          playerId: round.activePlayers[0],
          title: 'Buried Treasure',
          message: `${carryStreak} skins carried in a row! There's ${carryStreak + 1} skins buried on the next hole! 💰`,
        }];
      }
      return [];
    },
  },
  {
    type: 'iron_man',
    icon: '🎯',
    check: ({ round, completedHoles }) => {
      if (completedHoles.length < 18) return [];
      const hits: AchievementHit[] = [];

      for (const pid of round.activePlayers) {
        const scores = round.scores[pid] ?? [];
        const firAttempts = scores.filter((s) => s.fairwayHit !== null);
        const firHit = firAttempts.filter((s) => s.fairwayHit === true);
        if (firAttempts.length >= 10 && firHit.length >= 6) {
          hits.push({
            playerId: pid,
            title: 'Iron Man',
            message: `${name(pid)} hit ${firHit.length}/${firAttempts.length} fairways! Can't miss today! 🎯`,
          });
        }
      }
      return hits;
    },
  },
  {
    type: 'sniper',
    icon: '🔫',
    check: ({ round, completedHoles }) => {
      if (completedHoles.length < 18) return [];
      const hits: AchievementHit[] = [];

      for (const pid of round.activePlayers) {
        const scores = round.scores[pid] ?? [];
        const girHit = scores.filter((s) => s.gir === true);
        if (girHit.length >= 6) {
          hits.push({
            playerId: pid,
            title: 'Sniper',
            message: `${name(pid)} hit ${girHit.length}/18 greens! Zeroing in on every flag! 🏴‍☠️`,
          });
        }
      }
      return hits;
    },
  },
  {
    type: 'the_closer',
    icon: '🏆',
    check: ({ round, completedHoles }) => {
      if (completedHoles.length < 18) return [];
      const holeOrder = getHoleOrder(round.startingHole);
      const last3 = holeOrder.slice(15, 18);
      const hits: AchievementHit[] = [];

      for (const pid of round.activePlayers) {
        let wonAll3 = true;
        for (const hole of last3) {
          const hc = round.teeData.holes.find((h) => h.hole === hole);
          if (!hc) { wonAll3 = false; break; }

          const playerScore = round.scores[pid]?.find((s) => s.hole === hole);
          if (!playerScore) { wonAll3 = false; break; }

          const others = round.activePlayers.filter((p) => p !== pid);
          const isBest = others.every((other) => {
            const otherScore = round.scores[other]?.find((s) => s.hole === hole);
            return otherScore ? playerScore.netScore < otherScore.netScore : true;
          });
          if (!isBest) { wonAll3 = false; break; }
        }

        if (wonAll3) {
          hits.push({
            playerId: pid,
            title: 'The Closer',
            message: `${pirateCheer()} ${name(pid)} won the last 3 holes! That's how a captain finishes!`,
          });
        }
      }
      return hits;
    },
  },
  {
    type: 'bogey_free',
    icon: '🧹',
    check: ({ round, completedHoles }) => {
      if (completedHoles.length < 9) return [];
      const hits: AchievementHit[] = [];
      const holeOrder = getHoleOrder(round.startingHole);
      const front9 = holeOrder.slice(0, 9);
      const back9 = holeOrder.slice(9, 18);

      for (const pid of round.activePlayers) {
        const scores = round.scores[pid] ?? [];

        for (const nine of [front9, back9]) {
          const nineScores = nine
            .filter((h) => completedHoles.includes(h))
            .map((h) => scores.find((s) => s.hole === h))
            .filter(Boolean) as typeof scores;

          if (nineScores.length < 9) continue;

          const noDoubleBogey = nineScores.every((s) => {
            const hc = round.teeData.holes.find((h) => h.hole === s.hole);
            return hc ? s.netScore <= hc.par + 1 : false;
          });

          if (noDoubleBogey) {
            const label = nine === front9 ? 'front nine' : 'back nine';
            hits.push({
              playerId: pid,
              title: 'Clean Sweep',
              message: `${name(pid)} avoided the double on the ${label} (net)! Smooth sailing! 🧹`,
            });
            break;
          }
        }
      }
      return hits;
    },
  },
];

export function checkAchievements(
  trip: Trip,
  roundIndex: number,
  previousCompletedCount: number,
): Achievement[] {
  const round = trip.rounds[roundIndex];
  if (!round) return [];

  const holeOrder = getHoleOrder(round.startingHole);
  const completedHoles = getCompletedHoles(round.scores, holeOrder);

  if (completedHoles.length <= previousCompletedCount) return [];

  const ctx: CheckContext = {
    trip,
    round,
    roundIndex,
    completedHoles,
    previousCompletedCount,
  };

  const existing = new Set((trip.achievements ?? []).map((a) => a.id));
  const newAchievements: Achievement[] = [];

  for (const def of ACHIEVEMENT_DEFS) {
    const hits = def.check(ctx);
    for (const hit of hits) {
      const id = `${def.type}_${roundIndex}_${hit.playerId}_${hit.hole ?? 'round'}`;
      if (existing.has(id)) continue;
      existing.add(id);

      newAchievements.push({
        id,
        type: def.type,
        playerId: hit.playerId,
        roundIndex,
        hole: hit.hole,
        title: hit.title,
        message: hit.message,
        icon: def.icon,
        image: hit.image,
        timestamp: Date.now(),
      });
    }
  }

  return newAchievements;
}
