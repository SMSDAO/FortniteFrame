import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getBillingRecords, addBillingRecord, getAuditLogs, findUserById } from '@/lib/db';
import { z } from 'zod';

const addSchema = z.object({
  userId: z.string(),
  event: z.string(),
  amount: z.number(),
  currency: z.string().default('USD'),
});

function extractToken(request: NextRequest): string | null {
  return request.cookies.get('accessToken')?.value
    ?? (request.headers.get('authorization')?.startsWith('Bearer ')
      ? request.headers.get('authorization')!.slice(7)
      : null);
}

export async function GET(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    const isAdmin = payload.role === 'Admin' || payload.role === 'Auditor';

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || undefined;

    // Non-admin users can only view their own billing
    const targetUserId = isAdmin ? userId : payload.userId;

    const records = getBillingRecords(targetUserId, 100);
    const auditLogs = isAdmin ? getAuditLogs(50) : [];

    // Per-user totals for admin view
    const summary = isAdmin
      ? records.reduce<Record<string, number>>((acc, r) => {
          acc[r.userId] = (acc[r.userId] || 0) + r.amount;
          return acc;
        }, {})
      : null;

    return NextResponse.json({ records, auditLogs, summary });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (payload.role !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const user = findUserById(parsed.data.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const record = addBillingRecord(parsed.data);
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
