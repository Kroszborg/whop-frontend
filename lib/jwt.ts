import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@/types/database';

// Standardized JWT secret (use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_SIGNIN_SECRET || '540skeh2006h2kl34jzzsd23';

// Token expiry (1 hour)
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';

/**
 * Generate JWT token for user authentication
 */
export function generateToken(payload: JwtPayload): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JwtPayload {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Extract token from Authorization header or cookie
 */
export function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie (for Socket.IO compatibility)
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return cookies.jwt || null;
  }

  return null;
}


