import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSystemMetrics } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (payload.role !== 'Admin' && payload.role !== 'Developer' && payload.role !== 'Auditor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const metrics = getSystemMetrics();
    return NextResponse.json(metrics);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
