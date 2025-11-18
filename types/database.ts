// Database types matching Supabase schema

export interface User {
  id: string;
  crypto: string; // Wallet address
  wallet: number;
  avatar: string;
  total_deposited: number;
  total_withdraw: number;
  username: string;
  nickname?: string;
  crash: number; // Win count
  mine: number; // Win count
  coinflip: number; // Win count
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  tran_type: number; // 1: deposit, 2: withdraw, 3: bet
  wallet_address: string;
  txid?: string;
  amount: number;
  game?: number; // 1: crash, 2: mine, 3: coinflip
  created: string;
}

export interface CrashGame {
  id: string;
  crash_point: number;
  players: Record<string, BetType>; // JSONB
  refunded_players: string[]; // UUID array
  private_seed?: string;
  private_head?: string;
  public_seed?: string;
  status: number; // 1: Starting, 2: InProgress, 3: Over, 4: Blocking, 5: Refunded
  started_at?: string;
  user_counts: number;
  created_at: string;
  updated_at: string;
}

export interface BetType {
  playerID: string;
  username: string;
  avatar: string;
  betAmount: number;
  status: number; // 1: Playing, 2: CashedOut
  stoppedAt?: number; // Multiplier when cashed out
  autoCashOut: number; // Target * 100, or -1
  winningAmount?: number;
  crypto: string;
  forcedCashout?: boolean;
  autobet?: boolean;
}

export interface CoinflipGame {
  id: string;
  player_id: string;
  started_at: string;
  crash_point?: number;
  state: number; // 1: Starting, 2: InProgress, 3: Over
  bet_amount?: number;
  created_at: string;
}

export interface MineGame {
  id: string;
  player_id: string;
  started_at: string;
  crash_point?: number;
  state: number; // 1: NotStarted, 2: Starting, 3: InProgress, 4: Over, 5: Blocking, 6: Refunded
  created_at: string;
}

export interface SiteTransaction {
  id: string;
  bet: number;
  type: number;
  time: string;
  multi: number; // Multiplier
  payout: number;
  reason: string;
  game: string; // 'crash', 'mine', 'coinflip'
  extra_data: {
    coinflipGameId?: string;
    crashGameId?: string;
    mineGameId?: string;
    transactionId?: string;
  };
  user_id?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  user_id?: string;
  sent_at: string;
}

export interface AIUser {
  id: string;
  crypto: string;
  wallet: number;
  avatar: string;
  total_deposited: number;
  total_withdraw: number;
  username: string;
  nickname?: string;
  crash: number;
  mine: number;
  coinflip: number;
  created_at: string;
  updated_at: string;
}

// Game state types
export interface GameStateType {
  id: string | null;
  status: number;
  crashPoint: number | null;
  startedAt: Date | null;
  duration: number | null;
  players: Record<string, BetType>;
  bots: Record<string, BetType>;
  pending: Record<string, PendingBetType>;
  botCount: number;
  pendingCount: number;
  pendingBets: PendingBetType[];
  privateSeed: string | null;
  privateHash: string | null;
  publicSeed: string | null;
  connectedUsers: Record<string, string>;
}

export interface PendingBetType {
  playerID: string;
  betAmount: number;
  autoCashOut?: number;
  username: string;
  crypto: string;
  avatar: string;
  winningAmount?: number;
  status?: number;
  stoppedAt?: number;
}

// JWT Payload
export interface JwtPayload {
  userId?: string;
  address: string;
}

// API Request/Response types
export interface SignInRequest {
  address: string;
}

export interface SignInResponse {
  walletAddress: string;
  amount: number; // User wallet balance
  avatar: string;
  auth: string; // JWT token
}

export interface DepositRequest {
  amount: number;
  address: string;
  txHash?: string; // Optional for Phase 1
}

export interface DepositResponse {
  amount: number; // Updated wallet balance
}

export interface ApproveRequest {
  amount: number;
  address: string;
}

export interface ApproveResponse {
  success: boolean;
  message?: string;
}

export interface TransactionHistoryRequest {
  type: number; // 1: deposit, 2: withdraw, 3: bet
}

// Game constants
export const GAME_STATES = {
  // Crash game states
  Starting: 1,
  InProgress: 2,
  Over: 3,
  Blocking: 4,
  Refunded: 5,
  // Bet states
  Playing: 1,
  CashedOut: 2,
} as const;

export const TRANSACTION_TYPES = {
  DEPOSIT: 1,
  WITHDRAW: 2,
  BET: 3,
} as const;

export const GAME_TYPES = {
  CRASH: 1,
  MINE: 2,
  COINFLIP: 3,
} as const;

// Game configuration
export const CRASH_CONFIG = {
  START_WAIT_TIME: 10000, // ms before game starts (betting phase)
  RESTART_WAIT_TIME: 2000, // ms between games
  TICK_RATE: 150, // ms between multiplier updates
  MIN_BET: 0.1,
  MAX_BET: 500,
  MIN_CASHOUT: 1.01, // Minimum multiplier for cashout
} as const;

export const AVATARS = [
  "https://i.imgur.com/GZx07Tc.png",
  "https://i.imgur.com/u43Wujr.png",
  "https://i.imgur.com/apOrNq9.png",
  "https://i.imgur.com/FCgT9XI.png",
  "https://i.imgur.com/J8sbtgK.png",
] as const;

export const BOT_CONFIG = {
  MIN_BOTS: 8,
  MAX_BOTS: 11,
  MIN_DELAY: 2000, // ms
  MAX_DELAY: 8000, // ms
  AI_USER_POOL_SIZE: 50, // Number of AI users to fetch for bot selection
} as const;

export const CRASH_GAME_CONFIG = {
  GROWTH_RATE: 0.00006, // Multiplier growth rate constant
  SPECIAL_CASE_MOD: 2000, // Modulo for special crash case check
  SPECIAL_CRASH_POINT: 109, // Special crash point in hundredths (1.09x)
  HASH_SLICE_LENGTH: 13, // Length of hash slice for crash point calculation
  GAME_STATUS_CHECK_INTERVAL: 100, // ms - How often to check game status
  HISTORY_UPDATE_DELAY: 500, // ms - Delay before emitting updated history after game ends
} as const;

export const MINE_CONFIG = {
  GRID_SIZE: 5, // 5x5 = 25 cells
  FREQUENCY_QUERY: [
    3, 1, 2, 1, 3, 1, 1, 2.5, 1, 1, 2, 2.5, 3, 2.5, 2, 1, 1, 2.5, 1, 1, 3, 1, 2, 1, 2
  ],
} as const;


