'use client';

import { useState, useEffect, useCallback } from 'react';
import { signIn as apiSignIn, type SignInResponse } from '@/lib/api-client';

interface AuthState {
  user: SignInResponse | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setAuthState({ user, loading: false, error: null });
      } catch {
        localStorage.removeItem('auth');
        setAuthState({ user: null, loading: false, error: null });
      }
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }

    // Listen for wallet updates from Socket.IO
    const handleWalletUpdate = (event: CustomEvent<{ wallet: number }>) => {
      const stored = localStorage.getItem('auth');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          user.amount = event.detail.wallet;
          localStorage.setItem('auth', JSON.stringify(user));
          setAuthState(prev => ({ ...prev, user }));
        } catch (error) {
          console.error('Error updating wallet:', error);
        }
      }
    };

    window.addEventListener('wallet-updated', handleWalletUpdate as EventListener);
    return () => {
      window.removeEventListener('wallet-updated', handleWalletUpdate as EventListener);
    };
  }, []);

  const signIn = useCallback(async (address: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const user = await apiSignIn(address);
      localStorage.setItem('auth', JSON.stringify(user));
      setAuthState({ user, loading: false, error: null });
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('auth');
    setAuthState({ user: null, loading: false, error: null });
  }, []);

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signOut,
    isAuthenticated: !!authState.user,
    token: authState.user?.auth,
    address: authState.user?.walletAddress,
  };
}

