// API Client utilities for frontend

// For Next.js, API routes are on the same origin, so we can use relative paths
const API_BASE_URL = '';

export interface SignInResponse {
  walletAddress: string;
  amount: number;
  avatar: string;
  auth: string; // JWT token
}

export interface DepositResponse {
  amount: number;
}

export interface ApproveResponse {
  success: boolean;
  message?: string;
}

/**
 * Sign in with wallet address
 */
export async function signIn(address: string): Promise<SignInResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to sign in' }));
      throw new Error(errorData.error || `Sign in failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Sign in API response:', data);
    return data;
  } catch (error) {
    console.error('Sign in fetch error:', error);
    throw error;
  }
}

/**
 * Deposit funds (Phase 1: internal only)
 */
export async function deposit(amount: number, address: string, token: string, txHash?: string): Promise<DepositResponse> {
  const response = await fetch(`${API_BASE_URL}/api/user/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, address, txHash }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to deposit' }));
    throw new Error(error.error || 'Failed to deposit');
  }

  return response.json();
}

/**
 * Withdraw funds (Phase 1: internal only)
 */
export async function withdraw(amount: number, address: string, token: string): Promise<ApproveResponse> {
  const response = await fetch(`${API_BASE_URL}/api/user/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, address }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to withdraw' }));
    throw new Error(error.error || 'Failed to withdraw');
  }

  return response.json();
}

/**
 * Get crash leaderboard
 */
export async function getCrashRank() {
  const response = await fetch(`${API_BASE_URL}/api/user/getCrashRank`);
  if (!response.ok) {
    throw new Error('Failed to fetch crash leaderboard');
  }
  return response.json();
}

/**
 * Get mine leaderboard
 */
export async function getMineRank() {
  const response = await fetch(`${API_BASE_URL}/api/user/getMineRank`);
  if (!response.ok) {
    throw new Error('Failed to fetch mine leaderboard');
  }
  return response.json();
}

/**
 * Get coinflip leaderboard
 */
export async function getFlipRank() {
  const response = await fetch(`${API_BASE_URL}/api/user/getFlipRank`);
  if (!response.ok) {
    throw new Error('Failed to fetch coinflip leaderboard');
  }
  return response.json();
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(type: number, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/transaction/history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ type }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch transaction history');
  }
  return response.json();
}

/**
 * Get site transaction history
 */
export async function getSiteHistory() {
  const response = await fetch(`${API_BASE_URL}/api/transaction/sitehistory`);
  if (!response.ok) {
    throw new Error('Failed to fetch site history');
  }
  return response.json();
}

