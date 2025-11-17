import { NextRequest, NextResponse } from 'next/server';
import { generateToken } from '@/lib/jwt';
import { getOrCreateUser } from '@/lib/utils/auth';
import type { SignInRequest, SignInResponse } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const body: SignInRequest = await req.json();
    const { address } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Get or create user
    const user = await getOrCreateUser(address);

    // Generate JWT token
    const token = generateToken({ address: user.crypto });

    // Return response matching backend format
    const response: SignInResponse = {
      walletAddress: user.crypto,
      amount: Number(user.wallet),
      avatar: user.avatar,
      auth: token,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Sign-in error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Test endpoint
export async function GET() {
  return NextResponse.json({ message: 'Test auth router' });
}


