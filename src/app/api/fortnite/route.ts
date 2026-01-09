import { NextRequest, NextResponse } from 'next/server';
import { getPlayerStats } from '@/lib/fortnite';

/**
 * API Route to fetch Fortnite player stats
 * GET /api/fortnite?user=username
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('user');

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }

    const stats = await getPlayerStats(username);

    if (!stats.success) {
      return NextResponse.json(
        { error: stats.error || 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    return NextResponse.json(stats.data, { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
