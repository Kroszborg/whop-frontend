import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/transaction/sitehistory
 * Get all site transactions
 */
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: siteTransactions, error } = await supabase
      .from('site_transactions')
      .select('*')
      .order('time', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch site transactions' },
        { status: 500 }
      );
    }

    // Get user data for transactions that have user_id
    const userIds = siteTransactions
      ?.filter(st => st.user_id)
      .map(st => st.user_id) || [];

    interface UserData {
      crypto: string;
      username: string;
      avatar: string;
    }
    
    let userDataMap: Record<string, UserData> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, crypto, username, avatar')
        .in('id', userIds);

      if (users) {
        userDataMap = users.reduce((acc, user) => {
          acc[user.id] = {
            crypto: user.crypto,
            username: user.username,
            avatar: user.avatar,
          };
          return acc;
        }, {} as Record<string, UserData>);
      }
    }

    const data = siteTransactions?.map(st => ({
      ...st,
      user: st.user_id ? userDataMap[st.user_id] || null : null,
    }));

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Site history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

