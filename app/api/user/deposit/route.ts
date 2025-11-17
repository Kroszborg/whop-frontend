import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/utils/auth';
import type { DepositRequest, DepositResponse } from '@/types/database';
import { TRANSACTION_TYPES } from '@/types/database';

/**
 * POST /api/user/deposit
 * Process user deposit (Phase 1: Internal only, no blockchain verification)
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(req);
    
    const body: DepositRequest = await req.json();
    const { amount, address } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid deposit amount' },
        { status: 400 }
      );
    }

    if (!address || address !== payload.address) {
      return NextResponse.json(
        { error: 'Address mismatch' },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('crypto', address)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update wallet and total_deposited
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        wallet: (Number(user.wallet) + amount).toFixed(2),
        total_deposited: (Number(user.total_deposited) + amount).toFixed(2),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update wallet' },
        { status: 500 }
      );
    }

    // Create transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        tran_type: TRANSACTION_TYPES.DEPOSIT,
        wallet_address: address,
        amount: amount,
        // txid: body.txHash, // Phase 2: Store transaction hash
      });

    if (txError) {
      console.error('Transaction record error:', txError);
      // Don't fail the request if transaction logging fails
    }

    const response: DepositResponse = {
      amount: Number(updatedUser.wallet),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Deposit error:', error);
    
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


