/**
 * JWT authentication utilities.
 * JWT_SECRET must be provided via environment variable in production.
 */

import jwt from 'jsonwebtoken';
import type { Role } from './db';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    // Development-only fallback — not used in production
    return 'dev-only-insecure-secret-change-me';
  }
  return secret;
}

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_TTL, algorithm: 'HS256' });
}

export function signRefreshToken(payload: Pick<TokenPayload, 'userId'>): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: REFRESH_TOKEN_TTL, algorithm: 'HS256' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as TokenPayload;
}

/**
 * RBAC permission matrix.
 * Each role has a set of allowed actions.
 */
export const PERMISSIONS: Record<Role, string[]> = {
  Admin: ['*'],
  Developer: ['read:users', 'read:metrics', 'read:logs', 'manage:api', 'read:billing'],
  User: ['read:own', 'write:own', 'read:billing:own'],
  Auditor: ['read:users', 'read:metrics', 'read:logs', 'read:billing', 'read:audit'],
};

export function hasPermission(role: Role, action: string): boolean {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes('*') || perms.includes(action);
}
