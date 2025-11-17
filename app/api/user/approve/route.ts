import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/utils/auth';
import type { ApproveRequest, ApproveResponse } from '@/types/database';
import { TRANSACTION_TYPES } from '@/types/database';

/**
 * POST /api/user/approve
 * Process withdrawal (Phase 1: Internal only, no blockchain transfer)
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const payload = await authenticateRequest(req);
    
    const body: ApproveRequest = await req.json();
    const { amount, address } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
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

    // Check sufficient balance
    if (Number(user.wallet) < amount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Update wallet and total_withdraw
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        wallet: (Number(user.wallet) - amount).toFixed(2),
        total_withdraw: (Number(user.total_withdraw) + amount).toFixed(2),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      return NextResponse.json(
        { error: 'Failed to process withdrawal' },
        { status: 500 }
      );
    }

    // Create transaction record
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        tran_type: TRANSACTION_TYPES.WITHDRAW,
        wallet_address: address,
        amount: amount,
      });

    if (txError) {
      console.error('Transaction record error:', txError);
      // Don't fail the request if transaction logging fails
    }

    // Phase 2: Here we would transfer tokens on blockchain
    // For now, just return success

    const response: ApproveResponse = {
      success: true,
      message: 'Withdrawal processed successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Withdrawal error:', error);
    
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


