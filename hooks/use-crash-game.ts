'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from './use-socket';
import type { BetType } from '@/types/database';

interface CrashGameState {
  status: number;
  crashPoint: number | null;
  multiplier: number;
  players: Record<string, BetType>;
  history: any[];
  countdown: number;
  startTime: number | null;
}

export function useCrashGame(token?: string, address?: string) {
  // Load history from localStorage on mount
  const loadHistoryFromStorage = () => {
    // Check if we're in the browser (not SSR)
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem('crash-game-history');
      if (stored) {
        const history = JSON.parse(stored);
        return Array.isArray(history) ? history.slice(0, 20) : []; // Keep last 20
      }
    } catch (error) {
      console.error('Error loading history from localStorage:', error);
    }
    return [];
  };

  const [gameState, setGameState] = useState<CrashGameState>({
    status: 1, // Starting
    crashPoint: null,
    multiplier: 1.0,
    players: {},
    history: loadHistoryFromStorage(),
    countdown: 10,
    startTime: null,
  });

  const initialDataRequested = useRef(false);

  const { socket, isConnected, isAuthenticated, emit, on, off } = useSocket({
    namespace: '/crash',
    token,
    address,
  });

  // Save history to localStorage whenever it changes
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    if (gameState.history.length > 0) {
      try {
        localStorage.setItem('crash-game-history', JSON.stringify(gameState.history.slice(0, 20)));
      } catch (error) {
        console.error('Error saving history to localStorage:', error);
      }
    }
  }, [gameState.history]);

  // Reset initial data requested flag when disconnected
  useEffect(() => {
    if (!isConnected) {
      initialDataRequested.current = false;
    }
  }, [isConnected]);

  // Listen to game events
  useEffect(() => {
    if (!isConnected || !isAuthenticated) return;

    const handleGameStart = (...args: unknown[]) => {
      const data = args[0] as { startTime?: number };
      console.log('🚀 GAME-START EVENT RECEIVED (game in progress):', data);
      setGameState(prev => ({
        ...prev,
        status: 2, // InProgress
        multiplier: 1.0,
        startTime: data?.startTime || Date.now(),
      }));
    };

    const handleGameStarting = (...args: unknown[]) => {
      const data = args[0] as { countdown?: number };
      console.log('🟢 GAME-STARTING EVENT RECEIVED:', data);
      setGameState(prev => ({
        ...prev,
        status: 1, // Starting
        countdown: data?.countdown || 10,
        multiplier: 1.0,
      }));
    };

    const handleGameTick = (...args: unknown[]) => {
      const data = args[0] as { multiplier: number; elapsed: number };
      if (data && typeof data.multiplier === 'number') {
        setGameState(prev => ({ ...prev, multiplier: data.multiplier }));
      }
    };

    const handleGameEnd = (...args: unknown[]) => {
      const data = args[0] as { crashPoint: number };
      console.log('💥 GAME-END EVENT RECEIVED (crashed at):', data);
      if (data && typeof data.crashPoint === 'number') {
        setGameState(prev => ({
          ...prev,
          status: 3, // Over
          crashPoint: data.crashPoint,
          multiplier: data.crashPoint,
        }));

        // After game ends, backend should trigger 'game-starting' with countdown
        // This will show the 10-second timer for players to place bets
        console.log('⏰ Waiting for backend to send game-starting event with countdown...');
      }
    };

    const handleGameUserList = (...args: unknown[]) => {
      const data = args[0] as { players: Record<string, BetType> };
      if (data && data.players) {
        // Only log occasionally to reduce console spam
        // console.log('Received game-user-list:', Object.keys(data.players).length, 'players');
        setGameState(prev => ({ ...prev, players: data.players }));
      }
    };

    const handleCurrentState = (...args: unknown[]) => {
      const status = args[0] as number;
      console.log('📊 CURRENT-STATE EVENT RECEIVED:', status);
      if (typeof status === 'number') {
        setGameState(prev => ({ ...prev, status }));
      }
    };

    const handleHistory = (...args: unknown[]) => {
      const history = args[0] as any[];
      if (Array.isArray(history)) {
        // console.log('Received crash game history:', history);
        setGameState(prev => ({ ...prev, history: history || [] }));
      }
    };

    const handleWalletUpdate = (...args: unknown[]) => {
      const data = args[0] as number | { wallet: number; profit?: number };
      let wallet: number;
      let profit: number | undefined;

      if (typeof data === 'number') {
        wallet = data;
      } else {
        wallet = data.wallet;
        profit = data.profit;
      }

      if (typeof wallet === 'number') {
        // console.log('Wallet updated:', wallet, 'profit:', profit);
        // Update user balance in localStorage/auth
        const stored = localStorage.getItem('auth');
        if (stored) {
          try {
            const oldUser = JSON.parse(stored);
            const oldAmount = oldUser.amount || 0;
            const change = wallet - oldAmount;

            oldUser.amount = wallet;
            localStorage.setItem('auth', JSON.stringify(oldUser));
            // Trigger a custom event to notify useAuth hook with profit info
            window.dispatchEvent(new CustomEvent('wallet-updated', {
              detail: { wallet, change, profit: profit || change }
            }));
          } catch (error) {
            console.error('Error updating wallet in localStorage:', error);
          }
        }
      }
    };

    const handleCashoutSuccess = (...args: unknown[]) => {
      const data = args[0] as { multiplier: number; payout: number };
      if (data) {
        // console.log('Cashout successful:', data);
      }
    };

    const handleCashoutError = (...args: unknown[]) => {
      const error = args[0] as string;
      if (typeof error === 'string') {
        console.error('Cashout error:', error);
        // Emit custom event for UI to show error
        window.dispatchEvent(new CustomEvent('game-error', {
          detail: { type: 'cashout', message: error }
        }));
      }
    };

    const handleJoinError = (...args: unknown[]) => {
      const error = args[0] as string;
      if (typeof error === 'string') {
        console.error('Join error:', error);
        // Emit custom event for UI to show error
        window.dispatchEvent(new CustomEvent('game-error', {
          detail: { type: 'join', message: error }
        }));
      }
    };

    on('game-starting', handleGameStarting);
    on('game-start', handleGameStart);
    on('game-tick', handleGameTick);
    on('game-end', handleGameEnd);
    on('game-user-list', handleGameUserList);
    on('currrent-crash-state', handleCurrentState);
    on('crashgame-history', handleHistory);
    on('update_wallet', handleWalletUpdate);
    on('bet-cashout-success', handleCashoutSuccess);
    on('bet-cashout-error', handleCashoutError);
    on('game-join-error', handleJoinError);

    // Request initial state only once per connection
    if (!initialDataRequested.current) {
      initialDataRequested.current = true;
      emit('get-history');
      emit('current-state');
      // Don't repeatedly call game-data as it causes excessive re-rendering
      // The backend should push updates automatically
    }

    return () => {
      off('game-starting', handleGameStarting);
      off('game-start', handleGameStart);
      off('game-tick', handleGameTick);
      off('game-end', handleGameEnd);
      off('game-user-list', handleGameUserList);
      off('currrent-crash-state', handleCurrentState);
      off('crashgame-history', handleHistory);
      off('update_wallet', handleWalletUpdate);
      off('bet-cashout-success', handleCashoutSuccess);
      off('bet-cashout-error', handleCashoutError);
      off('game-join-error', handleJoinError);
    };
  }, [isConnected, isAuthenticated, emit, on, off]);

  const joinGame = useCallback((target: number, betAmount: number) => {
    if (isConnected && isAuthenticated) {
      emit('join-game', target, betAmount);
    }
  }, [isConnected, isAuthenticated, emit]);

  const cashout = useCallback(() => {
    // console.log('Cashout called - isConnected:', isConnected, 'isAuthenticated:', isAuthenticated);
    if (isConnected && isAuthenticated) {
      // console.log('Emitting bet-cashout event');
      emit('bet-cashout');
    } else {
      console.warn('Cannot cashout - not connected or not authenticated');
    }
  }, [isConnected, isAuthenticated, emit]);

  return {
    gameState,
    joinGame,
    cashout,
    isConnected,
    isAuthenticated,
  };
}

