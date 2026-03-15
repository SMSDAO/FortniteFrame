/**
 * In-memory database layer for development/demo.
 * In production, replace with Prisma + PostgreSQL using DATABASE_URL.
 *
 * Environment variables required for production:
 *   DATABASE_URL=postgresql://user:password@host:5432/fortniteframe
 */

import bcrypt from 'bcryptjs';

export type Role = 'Admin' | 'Developer' | 'User' | 'Auditor';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  createdAt: string;
  lastLogin: string | null;
  active: boolean;
  usageCount: number;
  usageLimit: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  ip: string | null;
}

export interface BillingRecord {
  id: string;
  userId: string;
  event: string;
  amount: number;
  currency: string;
  timestamp: string;
}

// Seed admin user (change password in production via env)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const adminHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);
const devHash = bcrypt.hashSync('dev123', 10);
const userHash = bcrypt.hashSync('user123', 10);

// In-memory store (replace with Prisma in production)
const users: User[] = [
  {
    id: '1',
    email: 'admin@fortniteframe.app',
    passwordHash: adminHash,
    name: 'Admin User',
    role: 'Admin',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    active: true,
    usageCount: 0,
    usageLimit: -1, // unlimited
  },
  {
    id: '2',
    email: 'dev@fortniteframe.app',
    passwordHash: devHash,
    name: 'Dev User',
    role: 'Developer',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    active: true,
    usageCount: 42,
    usageLimit: 10000,
  },
  {
    id: '3',
    email: 'user@fortniteframe.app',
    passwordHash: userHash,
    name: 'Regular User',
    role: 'User',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    active: true,
    usageCount: 15,
    usageLimit: 500,
  },
];

const auditLogs: AuditLog[] = [];
const billingRecords: BillingRecord[] = [];

// ---- User operations ----

export function findUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email === email);
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function getAllUsers(): User[] {
  return users.map(({ passwordHash: _ph, ...rest }) => ({ ...rest, passwordHash: '' }));
}

export function updateUserLastLogin(id: string): void {
  const user = users.find((u) => u.id === id);
  if (user) {
    user.lastLogin = new Date().toISOString();
  }
}

export function createUser(data: Omit<User, 'id' | 'passwordHash'> & { password: string }): User {
  const { password, ...rest } = data;
  const newUser: User = {
    id: String(Date.now()),
    ...rest,
    passwordHash: bcrypt.hashSync(password, 10),
  };
  users.push(newUser);
  return newUser;
}

export function updateUserRole(id: string, role: Role): boolean {
  const user = users.find((u) => u.id === id);
  if (!user) return false;
  user.role = role;
  return true;
}

export function incrementUsage(id: string): void {
  const user = users.find((u) => u.id === id);
  if (user) {
    user.usageCount += 1;
  }
}

// ---- Audit log operations ----

export function addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
  const log: AuditLog = {
    id: String(Date.now()),
    ...entry,
    timestamp: new Date().toISOString(),
  };
  auditLogs.unshift(log);
  // keep last 500 entries
  if (auditLogs.length > 500) auditLogs.pop();
  return log;
}

export function getAuditLogs(limit = 50): AuditLog[] {
  return auditLogs.slice(0, limit);
}

// ---- Billing operations ----

export function addBillingRecord(entry: Omit<BillingRecord, 'id' | 'timestamp'>): BillingRecord {
  const record: BillingRecord = {
    id: String(Date.now()),
    ...entry,
    timestamp: new Date().toISOString(),
  };
  billingRecords.unshift(record);
  return record;
}

export function getBillingRecords(userId?: string, limit = 50): BillingRecord[] {
  const records = userId ? billingRecords.filter((r) => r.userId === userId) : billingRecords;
  return records.slice(0, limit);
}

// ---- Metrics ----

export function getSystemMetrics() {
  const now = Date.now();
  return {
    uptime: process.uptime(),
    timestamp: new Date(now).toISOString(),
    users: {
      total: users.length,
      active: users.filter((u) => u.active).length,
    },
    auditLogs: auditLogs.length,
    billingRecords: billingRecords.length,
    memory: process.memoryUsage(),
  };
}
