import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/utils/auth';
import type { TransactionHistoryRequest } from '@/types/database';

/**
 * POST /api/transaction/history
 * Get transaction history by type
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(req);
    
    const body: TransactionHistoryRequest = await req.json();
    const { type } = body;

    if (!type || ![1, 2, 3].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid transaction type. Must be 1 (deposit), 2 (withdraw), or 3 (bet)' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('crypto', payload.address)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('tran_type', type)
      .order('created', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Get user data separately and merge
    const { data: userData } = await supabase
      .from('users')
      .select('crypto, username, avatar')
      .eq('id', user.id)
      .single();

    const data = transactions?.map(tx => ({
      ...tx,
      user: userData ? {
        crypto: userData.crypto,
        username: userData.username,
        avatar: userData.avatar,
      } : null,
    }));

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Transaction history error:', error);
    
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

