import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import * as crypto from 'crypto';

/**
 * POST /api/aiuser/generate
 * Generate fake AI users for bot players
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { number } = body;

    if (!number || typeof number !== 'number' || number <= 0) {
      return NextResponse.json(
        { error: 'Invalid number. Must be a positive integer' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Generate AI users
    const aiUsers = [];
    for (let i = 0; i < number; i++) {
      // Generate random Ethereum address
      const randomBytes = crypto.randomBytes(20);
      const address = '0x' + randomBytes.toString('hex');

      // Random wallet balance (300-2000)
      const wallet = Math.random() * 1700 + 300;

      // Random username (50% chance)
      const username = Math.random() > 0.5 
        ? `user_${crypto.randomBytes(4).toString('hex')}`
        : '';

      // Random avatar from DiceBear API
      const shortId = crypto.randomBytes(4).toString('hex');
      const avatar = `https://api.dicebear.com/8.x/avataaars/svg?seed=${shortId}`;

      aiUsers.push({
        crypto: address,
        wallet: wallet.toFixed(2),
        avatar: avatar,
        total_deposited: 0,
        total_withdraw: 0,
        username: username,
        crash: 0,
        mine: 0,
        coinflip: 0,
      });
    }

    // Insert into database
    const { data, error } = await supabase
      .from('ai_users')
      .insert(aiUsers)
      .select();

    if (error) {
      return NextResponse.json(
        { error: `Failed to create AI users: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      users: data,
    });
  } catch (error) {
    console.error('AI user generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}


