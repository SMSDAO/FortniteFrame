import { NextResponse } from 'next/server';
import { getSystemMetrics } from '@/lib/db';

export async function GET() {
  try {
    const metrics = getSystemMetrics();
    return NextResponse.json({
      status: 'healthy',
      ...metrics,
    });
  } catch {
    return NextResponse.json({ status: 'unhealthy' }, { status: 503 });
  }
}
