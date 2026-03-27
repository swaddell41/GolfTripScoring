import type { Player } from '../types';

export const players: Player[] = [
  { id: 'sam', name: 'Sam', handicapIndex: 15.6 },
  { id: 'cole', name: 'Cole', handicapIndex: 9.3 },
  { id: 'niko', name: 'Niko', handicapIndex: 11.3 },
];

export const getPlayer = (id: string): Player | undefined =>
  players.find((p) => p.id === id);
