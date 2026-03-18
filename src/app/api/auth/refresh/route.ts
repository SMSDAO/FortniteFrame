import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signAccessToken, signRefreshToken } from '@/lib/auth';
import { findUserById } from '@/lib/db';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const payload = verifyToken(refreshToken);
    const user = findUserById(payload.userId);
    if (!user || !user.active) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Issue a new access token and rotate the refresh token
    const newAccessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    const newRefreshToken = signRefreshToken({ userId: user.id });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    response.cookies.set('accessToken', newAccessToken, {
      ...COOKIE_OPTS,
      maxAge: 60 * 15, // 15 minutes
    });
    response.cookies.set('refreshToken', newRefreshToken, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
  }
}
