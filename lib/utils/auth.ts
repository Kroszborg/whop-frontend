import { createServerClient } from '@/lib/supabase';
import { verifyToken } from '@/lib/jwt';
import type { JwtPayload } from '@/types/database';

/**
 * Authenticate request using JWT token
 * Returns the decoded JWT payload if valid
 */
export async function authenticateRequest(req: Request): Promise<JwtPayload> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Access denied');
  }

  const token = authHeader.substring(7);
  
  try {
    const payload = verifyToken(token);
    return payload;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Invalid token');
  }
}

/**
 * Get user by wallet address
 */
export async function getUserByAddress(address: string) {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('crypto', address)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Database error: ${error.message}`);
  }

  return data;
}

/**
 * Create new user with random avatar
 */
export async function createUser(address: string) {
  const supabase = createServerClient();
  const { AVATARS } = await import('@/types/database');
  
  // Select random avatar
  const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];

  const { data, error } = await supabase
    .from('users')
    .insert({
      crypto: address,
      wallet: 0,
      avatar: randomAvatar,
      total_deposited: 0,
      total_withdraw: 0,
      username: '',
      crash: 0,
      mine: 0,
      coinflip: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return data;
}

/**
 * Get or create user by address
 */
export async function getOrCreateUser(address: string) {
  let user = await getUserByAddress(address);
  
  if (!user) {
    user = await createUser(address);
  }

  return user;
}


