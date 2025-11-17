import { Server as SocketIOServer, Namespace } from 'socket.io';
import { verifyToken } from '@/lib/jwt';
import { createServerClient } from '@/lib/supabase';
import { CRASH_CONFIG, TRANSACTION_TYPES, GAME_TYPES, GAME_STATES, BOT_CONFIG, CRASH_GAME_CONFIG, type BetType } from '@/types/database';
import * as crypto from 'crypto';

interface CrashSocket extends Socket {
  user?: {
    id: string;
    address: string;
    username: string;
    avatar: string;
    wallet: number;
  };
  logged?: boolean;
}

interface Socket {
  id: string;
  emit: (event: string, ...args: unknown[]) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  disconnect: () => void;
}

let currentGame: {
  id: string | null;
  status: number;
  crashPoint: number | null;
  startedAt: Date | null;
  players: Record<string, BetType>;
  privateSeed: string | null;
  privateHash: string | null;
  publicSeed: string | null;
  currentMultiplier: number; // Track current multiplier for cashouts
} = {
  id: null,
  status: GAME_STATES.Starting,
  crashPoint: null,
  startedAt: null,
  players: {},
  privateSeed: null,
  privateHash: null,
  publicSeed: null,
  currentMultiplier: 1.0,
};

// Game interval and timeout variables (for future use)
// let gameInterval: NodeJS.Timeout | null = null;
// let gameStartTimeout: NodeJS.Timeout | null = null;

export function setupCrashNamespace(io: SocketIOServer) {
  const crashNamespace = io.of('/crash');

  crashNamespace.on('connection', (socket: CrashSocket) => {
    console.log(`Client connected to /crash: ${socket.id}`);

    // Authentication
    socket.on('auth', async (data: unknown) => {
      const authData = data as { token: string; address: string };
      try {
        const payload = verifyToken(authData.token);
        
        if (payload.address !== authData.address) {
          socket.emit('auth-error', 'Your token isn\'t an approved token');
          return;
        }

        const supabase = createServerClient();
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('crypto', authData.address)
          .single();

        if (!user) {
          socket.emit('auth-error', 'User not found');
          return;
        }

        socket.user = {
          id: user.id,
          address: user.crypto,
          username: user.username || '',
          avatar: user.avatar,
          wallet: Number(user.wallet),
        };
        socket.logged = true;

        socket.emit('auth-success', { wallet: socket.user.wallet });
        
        // Send current game state immediately after auth
        socket.emit('game-user-list', { players: currentGame.players });
        socket.emit('currrent-crash-state', currentGame.status);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('expired')) {
            socket.emit('expire-error', 'Token has expired');
          } else {
            socket.emit('auth-error', error.message);
          }
        } else {
          socket.emit('auth-error', 'Authentication failed');
        }
      }
    });

    // Get game history
    socket.on('get-history', async () => {
      try {
        const supabase = createServerClient();
        const { data } = await supabase
          .from('crash_games')
          .select('*')
          .eq('status', GAME_STATES.Blocking)
          .order('created_at', { ascending: false })
          .limit(8);

        socket.emit('crashgame-history', data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    });

    // Get current game data
    socket.on('game-data', () => {
      console.log(`Sending game data to ${socket.id}, players count:`, Object.keys(currentGame.players).length);
      socket.emit('game-user-list', { players: currentGame.players });
    });

    // Get current state
    socket.on('current-state', () => {
      socket.emit('currrent-crash-state', currentGame.status);
    });

    // Join game
    socket.on('join-game', async (target: unknown, betAmount: unknown) => {
      const targetNum = typeof target === 'number' ? target : -1;
      const betAmountNum = typeof betAmount === 'number' ? betAmount : 0;
      try {
        if (!socket.logged || !socket.user) {
          socket.emit('game-join-error', 'Access denied');
          return;
        }

        if (currentGame.status !== GAME_STATES.Starting) {
          socket.emit('game-join-error', 'Game is currently in progress!');
          return;
        }

        if (typeof betAmountNum !== 'number' || betAmountNum < CRASH_CONFIG.MIN_BET || betAmountNum > CRASH_CONFIG.MAX_BET) {
          socket.emit('game-join-error', 'Invalid betAmount type!');
          return;
        }

        if (socket.user.wallet < betAmountNum) {
          socket.emit('game-join-error', 'You can\'t afford this bet!');
          return;
        }

        // Check if already joined
        if (currentGame.players[socket.user.id]) {
          socket.emit('game-join-error', 'You have already joined this game!');
          return;
        }

        const supabase = createServerClient();

        // Deduct bet from wallet
        const { data: updatedUser } = await supabase
          .from('users')
          .update({
            wallet: (socket.user.wallet - betAmountNum).toFixed(2),
          })
          .eq('id', socket.user.id)
          .select()
          .single();

        if (updatedUser) {
          socket.user.wallet = Number(updatedUser.wallet);
        }

        // Create transaction
        await supabase
          .from('transactions')
          .insert({
            user_id: socket.user.id,
            tran_type: TRANSACTION_TYPES.BET,
            wallet_address: socket.user.address,
            amount: betAmountNum,
            game: GAME_TYPES.CRASH,
          });

        // Add player to game
        currentGame.players[socket.user.id] = {
          playerID: socket.user.id,
          username: socket.user.username,
          avatar: socket.user.avatar,
          betAmount: betAmountNum,
          status: GAME_STATES.Playing,
          autoCashOut: targetNum > 0 ? Math.floor(targetNum * 100) : -1,
          crypto: socket.user.address,
        };

        socket.emit('update_wallet', socket.user.wallet);
        crashNamespace.emit('game-user-list', { players: currentGame.players });
      } catch (error) {
        console.error('Join game error:', error);
        socket.emit('game-join-error', 'Failed to join game');
      }
    });

    // Cashout
    socket.on('bet-cashout', async () => {
      try {
        console.log(`Cashout request from ${socket.id}, user:`, socket.user?.id);
        
        if (!socket.logged || !socket.user) {
          console.log('Cashout denied: Not logged in');
          socket.emit('bet-cashout-error', 'Access denied');
          return;
        }

        const player = currentGame.players[socket.user.id];
        if (!player) {
          console.log(`Cashout denied: Player ${socket.user.id} not in game`);
          socket.emit('bet-cashout-error', 'You are not in this game');
          return;
        }
        
        console.log(`Player ${socket.user.id} cashout attempt - status: ${player.status}, game status: ${currentGame.status}, current multiplier: ${currentGame.currentMultiplier}`);

        // Check if player has already cashed out
        if (player.status === GAME_STATES.CashedOut) {
          socket.emit('bet-cashout-error', 'You have already cashed out!');
          return;
        }

        // Double-check player is still in Playing status
        if (player.status !== GAME_STATES.Playing) {
          socket.emit('bet-cashout-error', `Invalid player status: ${player.status}`);
          return;
        }

        if (currentGame.status !== GAME_STATES.InProgress) {
          socket.emit('bet-cashout-error', 'The game has already ended!');
          return;
        }

        // Use the current multiplier from the game
        const currentMultiplier = currentGame.currentMultiplier;

        if (currentMultiplier < CRASH_CONFIG.MIN_CASHOUT) {
          socket.emit('bet-cashout-error', `The minimum cashout is ${CRASH_CONFIG.MIN_CASHOUT}x! Current: ${currentMultiplier.toFixed(2)}x`);
          return;
        }

        const payout = player.betAmount * currentMultiplier;
        player.status = GAME_STATES.CashedOut;
        player.stoppedAt = currentMultiplier;
        player.winningAmount = payout;

        const supabase = createServerClient();
        const { data: updatedUser } = await supabase
          .from('users')
          .update({
            wallet: (socket.user.wallet + payout).toFixed(2),
          })
          .eq('id', socket.user.id)
          .select()
          .single();

        if (updatedUser) {
          socket.user.wallet = Number(updatedUser.wallet);
        }

        console.log(`Cashout successful for ${socket.user.id}: ${currentMultiplier.toFixed(2)}x, payout: ${payout.toFixed(2)}`);
        socket.emit('bet-cashout-success', { multiplier: currentMultiplier, payout });
        socket.emit('update_wallet', socket.user.wallet);
        crashNamespace.emit('game-user-list', { players: currentGame.players });
      } catch (error) {
        console.error('Cashout error:', error);
        socket.emit('bet-cashout-error', 'Failed to cashout');
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected from /crash: ${socket.id}`);
    });
  });

  // Start game loop
  startCrashGameLoop(crashNamespace).catch(console.error);
}

async function startCrashGameLoop(namespace: Namespace) {
  while (true) {
    // Create new game
    await createNewCrashGame(namespace);
    
    // Wait for game to complete
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (currentGame.status === GAME_STATES.Over || currentGame.status === GAME_STATES.Blocking) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, CRASH_GAME_CONFIG.GAME_STATUS_CHECK_INTERVAL);
    });

    // Wait before next game
    await new Promise(resolve => setTimeout(resolve, CRASH_CONFIG.RESTART_WAIT_TIME));
  }
}

async function createNewCrashGame(namespace: Namespace) {
  // Generate private seed
  const privateSeed = crypto.randomBytes(256).toString('hex');
  const privateHash = crypto.createHash('sha256').update(privateSeed).digest('hex');

  // Get public seed from EOS (simplified - implement actual EOS call)
  const publicSeed = await getPublicSeed();

  // Calculate crash point
  const crashPoint = calculateCrashPoint(privateSeed, publicSeed);

  // Clear previous game players (except keep bots for continuity if desired)
  // For now, we'll clear all players and add fresh bots
  currentGame = {
    id: null,
    status: GAME_STATES.Starting,
    crashPoint: crashPoint / 100, // Convert to multiplier
    startedAt: null,
    players: {}, // Clear all players from previous game
    privateSeed,
    privateHash,
    publicSeed,
    currentMultiplier: 1.0, // Reset multiplier
  };

  // Add bot players (8-11 bots per game)
  await addBotPlayers(namespace);

  // Wait before starting
  await new Promise(resolve => setTimeout(resolve, CRASH_CONFIG.START_WAIT_TIME));

  namespace.emit('game-start');
  currentGame.status = GAME_STATES.InProgress;
  currentGame.startedAt = new Date();
  
  // Emit updated player list with bots
  namespace.emit('game-user-list', { players: currentGame.players });

  // Start game tick
  const startTime = Date.now();
  const tickInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const multiplier = calculateMultiplier(elapsed);
    
    // Update current multiplier for cashout calculations
    currentGame.currentMultiplier = multiplier;

    // Check for auto cashouts (both bots and real users)
    checkAutoCashouts(multiplier, namespace);

    if (multiplier >= currentGame.crashPoint!) {
      // Game crashed
      clearInterval(tickInterval);
      endGame(namespace);
    } else {
      namespace.emit('game-tick', { multiplier, elapsed });
    }
  }, CRASH_CONFIG.TICK_RATE);
}

function calculateMultiplier(ms: number): number {
  const growthFunc = (ms: number) => Math.floor(100 * Math.pow(Math.E, CRASH_GAME_CONFIG.GROWTH_RATE * ms));
  return growthFunc(ms) / 100;
}

function calculateCrashPoint(privateSeed: string, publicSeed: string): number {
  const hash = crypto.createHmac('sha256', privateSeed).update(publicSeed).digest('hex');

  // Check special case
  if (isCrashHashDivisible(hash, CRASH_GAME_CONFIG.SPECIAL_CASE_MOD)) {
    return CRASH_GAME_CONFIG.SPECIAL_CRASH_POINT; // 1.09x
  }

  const h = parseInt(hash.slice(0, CRASH_GAME_CONFIG.HASH_SLICE_LENGTH), 16);
  const e = Math.pow(2, 52);
  return Math.floor((100 * e - h) / (e - h));
}

function isCrashHashDivisible(hash: string, mod: number): boolean {
  const val = parseInt(hash.slice(0, 8), 16);
  return val % mod === 0;
}

async function getPublicSeed(): Promise<string> {
  // TODO: Implement EOS blockchain call
  // For now, return a placeholder
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Add bot players to the current game
 * Randomly selects 8-11 AI users and gives them random bets
 */
async function addBotPlayers(namespace: Namespace) {
  try {
    const supabase = createServerClient();
    
    // Fetch AI users from database
    const { data: aiUsers, error } = await supabase
      .from('ai_users')
      .select('*')
      .limit(BOT_CONFIG.AI_USER_POOL_SIZE); // Get a pool of AI users to choose from

    if (error || !aiUsers || aiUsers.length === 0) {
      console.warn('No AI users found, skipping bot players');
      return;
    }

    // Randomly select bots within configured range
    const numBots = Math.floor(Math.random() * (BOT_CONFIG.MAX_BOTS - BOT_CONFIG.MIN_BOTS + 1)) + BOT_CONFIG.MIN_BOTS;
    const selectedBots = [];
    const shuffled = [...aiUsers].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(numBots, shuffled.length); i++) {
      selectedBots.push(shuffled[i]);
    }

    // Add each bot as a player
    for (const bot of selectedBots) {
      // Random bet amount (0.1-120.2, weighted towards lower amounts)
      const betAmount = getWeightedBetAmount();
      
      // Random auto cashout target (105-2000, weighted distribution)
      const autoCashout = getWeightedAutoCashout();
      
      // Create bet entry
      const betEntry: BetType = {
        playerID: bot.id,
        username: bot.username || `user_${bot.crypto.slice(0, 6)}`,
        avatar: bot.avatar,
        betAmount: betAmount,
        autoCashOut: autoCashout, // Auto cashout multiplier (in hundredths, e.g., 105 = 1.05x)
        status: GAME_STATES.Playing,
        stoppedAt: 0,
        winningAmount: 0,
        crypto: bot.crypto,
        forcedCashout: false,
      };

      currentGame.players[bot.id] = betEntry;
    }

    console.log(`Added ${selectedBots.length} bot players to the game. Total players:`, Object.keys(currentGame.players).length);
    
    // Emit updated player list immediately so connected clients see bots
    namespace.emit('game-user-list', { players: currentGame.players });
  } catch (error) {
    console.error('Error adding bot players:', error);
  }
}

/**
 * Get weighted random bet amount (0.1-120.2)
 * Weighted towards lower amounts
 */
function getWeightedBetAmount(): number {
  const rand = Math.random();
  
  // Weighted distribution towards lower bet amounts
  // 60% chance: MIN_BET to 10
  // 25% chance: 10 to 50
  // 10% chance: 50 to 100
  // 5% chance: 100 to MAX_BET
  if (rand < 0.6) {
    return Number((Math.random() * (10 - CRASH_CONFIG.MIN_BET) + CRASH_CONFIG.MIN_BET).toFixed(2));
  } else if (rand < 0.85) {
    return Number((Math.random() * 40 + 10).toFixed(2));
  } else if (rand < 0.95) {
    return Number((Math.random() * 50 + 50).toFixed(2));
  } else {
    const maxBet = Math.min(CRASH_CONFIG.MAX_BET, 120.2); // Cap at reasonable max for bots
    return Number((Math.random() * (maxBet - 100) + 100).toFixed(2));
  }
}

/**
 * Get weighted random auto cashout target (105-2000)
 * 105 = 1.05x, 2000 = 20.00x
 * Weighted towards lower multipliers
 */
function getWeightedAutoCashout(): number {
  const rand = Math.random();
  
  // 40% chance: 1.05x-2.00x (105-200)
  // 30% chance: 2.00x-5.00x (200-500)
  // 20% chance: 5.00x-10.00x (500-1000)
  // 10% chance: 10.00x-20.00x (1000-2000)
  if (rand < 0.4) {
    return Math.floor(Math.random() * 95 + 105); // 105-200
  } else if (rand < 0.7) {
    return Math.floor(Math.random() * 300 + 200); // 200-500
  } else if (rand < 0.9) {
    return Math.floor(Math.random() * 500 + 500); // 500-1000
  } else {
    return Math.floor(Math.random() * 1000 + 1000); // 1000-2000
  }
}

/**
 * Check and process auto cashouts for all players (bots and real users)
 */
async function checkAutoCashouts(currentMultiplier: number, namespace: Namespace) {
  const multiplierHundredths = Math.floor(currentMultiplier * 100);
  const supabase = createServerClient();
  
  for (const [playerId, player] of Object.entries(currentGame.players)) {
    // Only process players that are still playing and have auto cashout set
    if (player.status === GAME_STATES.Playing && player.autoCashOut > 0) {
      // Check if multiplier reached player's auto cashout target
      if (multiplierHundredths >= player.autoCashOut) {
        // Auto cashout this player
        const cashoutMultiplier = player.autoCashOut / 100;
        const payout = player.betAmount * cashoutMultiplier;
        
        player.status = GAME_STATES.CashedOut;
        player.stoppedAt = cashoutMultiplier;
        player.winningAmount = payout;
        
        try {
          // Try to find user in users table first (real user)
          const { data: user } = await supabase
            .from('users')
            .select('wallet')
            .eq('id', playerId)
            .single();
          
          if (user) {
            // Real user - update wallet and notify via socket
            const newWallet = Number(user.wallet) + payout;
            await supabase
              .from('users')
              .update({ wallet: newWallet.toFixed(2) })
              .eq('id', playerId);
            
            // Emit wallet update to the specific user's socket
            const userSocket = Array.from(namespace.sockets.values()).find(
              (s: any) => s.user?.id === playerId && s.logged
            ) as any;
            
            if (userSocket) {
              userSocket.user.wallet = newWallet;
              userSocket.emit('update_wallet', newWallet);
              userSocket.emit('bet-cashout-success', { multiplier: cashoutMultiplier, payout });
            }
            
            console.log(`User ${player.username} auto cashed out at ${cashoutMultiplier.toFixed(2)}x`);
          } else {
            // Bot - update bot's wallet in database
            const { data: botUser } = await supabase
              .from('ai_users')
              .select('wallet')
              .eq('id', playerId)
              .single();
            
            if (botUser) {
              const newWallet = Number(botUser.wallet) + payout;
              await supabase
                .from('ai_users')
                .update({ wallet: newWallet.toFixed(2) })
                .eq('id', playerId);
            }
            console.log(`Bot ${player.username} auto cashed out at ${cashoutMultiplier.toFixed(2)}x`);
          }
        } catch (error) {
          console.error(`Error updating wallet for ${playerId}:`, error);
        }
      }
    }
  }
  
  // Emit updated player list after processing cashouts
  namespace.emit('game-user-list', { players: currentGame.players });
}

async function endGame(namespace: Namespace) {
  currentGame.status = GAME_STATES.Over;
  
  // Process payouts
  const supabase = createServerClient();
  
  for (const [, player] of Object.entries(currentGame.players)) {
    if (player.status === GAME_STATES.Playing) {
      // Player didn't cashout - lost bet
      // Already deducted, no action needed
    } else if (player.status === GAME_STATES.CashedOut) {
      // Player cashed out - already paid
    }
  }

  // Save game to database
  const { data: savedGame, error: saveError } = await supabase
    .from('crash_games')
    .insert({
      crash_point: currentGame.crashPoint,
      players: currentGame.players,
      private_seed: currentGame.privateSeed,
      private_head: currentGame.privateHash,
      public_seed: currentGame.publicSeed,
      status: GAME_STATES.Blocking,
      started_at: currentGame.startedAt?.toISOString(),
      user_counts: Object.keys(currentGame.players).length,
    })
    .select()
    .single();

  if (saveError) {
    console.error('Error saving crash game:', saveError);
  } else {
    console.log('Crash game saved:', savedGame);
  }

  namespace.emit('game-end', { crashPoint: currentGame.crashPoint });
  
  // Emit updated history after game ends
  setTimeout(async () => {
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from('crash_games')
        .select('*')
        .eq('status', GAME_STATES.Blocking)
        .order('created_at', { ascending: false })
        .limit(8);

      namespace.emit('crashgame-history', data || []);
    } catch (error) {
      console.error('Error fetching updated history:', error);
    }
  }, CRASH_GAME_CONFIG.HISTORY_UPDATE_DELAY);
}

