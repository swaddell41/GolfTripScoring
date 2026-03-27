import type { PlayerId, HoleScore, HoleConfig, BonusTrackers } from '../types';
import { isNetBirdie, isNetEagle } from './scoring';

export function createEmptyBonuses(): BonusTrackers {
  return {
    fairwaysHit: { sam: 0, cole: 0, niko: 0 },
    fairwayAttempts: { sam: 0, cole: 0, niko: 0 },
    greensInReg: { sam: 0, cole: 0, niko: 0 },
    girAttempts: { sam: 0, cole: 0, niko: 0 },
    netBirdies: { sam: 0, cole: 0, niko: 0 },
    netEagles: { sam: 0, cole: 0, niko: 0 },
  };
}

export function calculateBonuses(
  allRoundData: {
    scores: Record<PlayerId, HoleScore[]>;
    holes: HoleConfig[];
    completedHoles: number[];
  }[],
): BonusTrackers {
  const bonuses = createEmptyBonuses();

  for (const round of allRoundData) {
    const activePlayers = Object.keys(round.scores) as PlayerId[];

    for (const hole of round.completedHoles) {
      const holeConfig = round.holes.find((h) => h.hole === hole);
      if (!holeConfig) continue;

      const isPar3 = holeConfig.par === 3;

      for (const playerId of activePlayers) {
        const score = round.scores[playerId]?.find((s) => s.hole === hole);
        if (!score) continue;

        if (!isPar3) {
          bonuses.fairwayAttempts[playerId]++;
          if (score.fairwayHit) {
            bonuses.fairwaysHit[playerId]++;
          }
        }

        bonuses.girAttempts[playerId]++;
        if (score.gir) {
          bonuses.greensInReg[playerId]++;
        }

        if (isNetEagle(score.netScore, holeConfig.par)) {
          bonuses.netEagles[playerId]++;
          bonuses.netBirdies[playerId]++;
        } else if (isNetBirdie(score.netScore, holeConfig.par)) {
          bonuses.netBirdies[playerId]++;
        }
      }
    }
  }

  return bonuses;
}
