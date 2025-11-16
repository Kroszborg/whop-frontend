export type PlayerStatus = 'IN-PLAY' | 'CASHED' | 'BUST';

export interface Player {
  id: string;
  username: string;
  avatar: string;
  betAmount: number;
  status: PlayerStatus;
  cashedAt?: number;
  profit?: number;
  currentMultiplier?: number;
}

export interface MultiplierBadge {
  value: number;
  color: 'green' | 'purple' | 'orange' | 'dark' | 'cyan' | 'yellow';
}

export interface GameState {
  currentMultiplier: number;
  currentProfit: number;
  isPlaying: boolean;
  totalPlayers: number;
  totalBetPool: number;
}

export type BetMode = 'manual' | 'auto';
