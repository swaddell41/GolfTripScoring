export type PlayerId = 'sam' | 'cole' | 'niko';

export type DailyFormat =
  | 'skins'
  | 'nines'
  | 'stableford'
  | 'strokePlay'
  | 'matchPlay';

export interface Player {
  id: PlayerId;
  name: string;
  handicapIndex: number;
}

export interface HoleConfig {
  hole: number;
  par: number;
  strokeIndex: number;
  yardage: number;
}

export interface TeeConfig {
  id: string;
  name: string;
  rating: number;
  slope: number;
  yardage: number;
  holes: HoleConfig[];
}

export interface CourseConfig {
  id: string;
  name: string;
  tees: TeeConfig[];
}

export interface HoleScore {
  hole: number;
  grossScore: number;
  netScore: number;
  strokesReceived: number;
  fairwayHit: boolean | null;
  gir: boolean;
}

export interface SkinsState {
  type: 'skins';
  results: SkinResult[];
  carryover: number;
  tieBreaker?: { winner: PlayerId | 'split' } | null;
}

export interface SkinResult {
  hole: number;
  winner: PlayerId | null;
  carried: boolean;
  value: number;
}

export interface NinesState {
  type: 'nines';
  points: Record<PlayerId, number>;
  holeResults: NinesHoleResult[];
}

export interface NinesHoleResult {
  hole: number;
  rankings: { playerId: PlayerId; netScore: number; points: number }[];
}

export interface StablefordState {
  type: 'stableford';
  points: Record<PlayerId, number>;
  holePoints: Record<PlayerId, number[]>;
}

export interface StrokePlayState {
  type: 'strokePlay';
  totals: Record<PlayerId, number>;
}

export interface DailyMatchPlayState {
  type: 'matchPlay';
  player1: PlayerId;
  player2: PlayerId;
  status: number;
  holesPlayed: number;
  result: string;
}

export type FormatState =
  | SkinsState
  | NinesState
  | StablefordState
  | StrokePlayState
  | DailyMatchPlayState;

export interface MatchPlay90State {
  player1: PlayerId;
  player2: PlayerId;
  cumulativeStatus: number;
  holesPlayed: number;
  roundStatuses: number[];
}

export interface BonusTrackers {
  fairwaysHit: Record<PlayerId, number>;
  fairwayAttempts: Record<PlayerId, number>;
  greensInReg: Record<PlayerId, number>;
  girAttempts: Record<PlayerId, number>;
  netBirdies: Record<PlayerId, number>;
  netEagles: Record<PlayerId, number>;
}

export interface Round {
  id: string;
  courseId: string;
  teeId: string;
  teeData: TeeConfig;
  activePlayers: PlayerId[];
  startingHole: 1 | 10;
  format: DailyFormat;
  handicapAllowance: number;
  courseHandicaps: Record<PlayerId, number>;
  playingHandicaps: Record<PlayerId, number>;
  strokeAllocations: Record<PlayerId, Record<number, number>>;
  scores: Record<PlayerId, HoleScore[]>;
  formatState: FormatState;
  isComplete: boolean;
  endedEarly: boolean;
  holesCompleted: number;
  matchPlayPlayers?: { player1: PlayerId; player2: PlayerId };
}

export interface Achievement {
  id: string;
  type: string;
  playerId: PlayerId;
  roundIndex: number;
  hole?: number;
  title: string;
  message: string;
  icon: string;
  image?: string;
  timestamp: number;
}

export interface Trip {
  id: string;
  rounds: Round[];
  matchPlay90: MatchPlay90State;
  bonuses: BonusTrackers;
  lastUpdated: number;
  revealed: boolean;
  achievements?: Achievement[];
}
