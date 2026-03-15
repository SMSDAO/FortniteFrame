/**
 * JWT authentication utilities.
 * Secret is loaded from JWT_SECRET environment variable.
 */

import jwt from 'jsonwebtoken';
import type { Role } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

export function signRefreshToken(payload: Pick<TokenPayload, 'userId'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
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
