'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './use-socket';
import type { BetType } from '@/types/database';

interface CrashGameState {
  status: number;
  crashPoint: number | null;
  multiplier: number;
  players: Record<string, BetType>;
  history: any[];
}

export function useCrashGame(token?: string, address?: string) {
  const [gameState, setGameState] = useState<CrashGameState>({
    status: 1, // Starting
    crashPoint: null,
    multiplier: 1.0,
    players: {},
    history: [],
  });

  const { socket, isConnected, isAuthenticated, emit, on, off } = useSocket({
    namespace: '/crash',
    token,
    address,
  });

  // Listen to game events
  useEffect(() => {
    if (!isConnected || !isAuthenticated) return;

    const handleGameStart = (...args: unknown[]) => {
      setGameState(prev => ({ ...prev, status: 2, multiplier: 1.0 })); // InProgress
    };

    const handleGameTick = (...args: unknown[]) => {
      const data = args[0] as { multiplier: number; elapsed: number };
      if (data && typeof data.multiplier === 'number') {
        setGameState(prev => ({ ...prev, multiplier: data.multiplier }));
      }
    };

    const handleGameEnd = (...args: unknown[]) => {
      const data = args[0] as { crashPoint: number };
      if (data && typeof data.crashPoint === 'number') {
        setGameState(prev => ({ 
          ...prev, 
          status: 3, // Over
          crashPoint: data.crashPoint,
          multiplier: data.crashPoint,
        }));
      }
    };

    const handleGameUserList = (...args: unknown[]) => {
      const data = args[0] as { players: Record<string, BetType> };
      if (data && data.players) {
        console.log('Received game-user-list:', Object.keys(data.players).length, 'players');
        setGameState(prev => ({ ...prev, players: data.players }));
      }
    };

    const handleCurrentState = (...args: unknown[]) => {
      const status = args[0] as number;
      if (typeof status === 'number') {
        setGameState(prev => ({ ...prev, status }));
      }
    };

    const handleHistory = (...args: unknown[]) => {
      const history = args[0] as any[];
      if (Array.isArray(history)) {
        console.log('Received crash game history:', history);
        setGameState(prev => ({ ...prev, history: history || [] }));
      }
    };

    const handleWalletUpdate = (...args: unknown[]) => {
      const wallet = args[0] as number;
      if (typeof wallet === 'number') {
        console.log('Wallet updated:', wallet);
        // Update user balance in localStorage/auth
        const stored = localStorage.getItem('auth');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            user.amount = wallet;
            localStorage.setItem('auth', JSON.stringify(user));
            // Trigger a custom event to notify useAuth hook
            window.dispatchEvent(new CustomEvent('wallet-updated', { detail: { wallet } }));
          } catch (error) {
            console.error('Error updating wallet in localStorage:', error);
          }
        }
      }
    };

    const handleCashoutSuccess = (...args: unknown[]) => {
      const data = args[0] as { multiplier: number; payout: number };
      if (data) {
        console.log('Cashout successful:', data);
      }
    };

    const handleCashoutError = (...args: unknown[]) => {
      const error = args[0] as string;
      if (typeof error === 'string') {
        console.error('Cashout error:', error);
      }
    };

    const handleJoinError = (...args: unknown[]) => {
      const error = args[0] as string;
      if (typeof error === 'string') {
        console.error('Join error:', error);
      }
    };

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

    // Request initial state
    emit('get-history');
    emit('game-data');
    emit('current-state');

    return () => {
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
    console.log('Cashout called - isConnected:', isConnected, 'isAuthenticated:', isAuthenticated);
    if (isConnected && isAuthenticated) {
      console.log('Emitting bet-cashout event');
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

