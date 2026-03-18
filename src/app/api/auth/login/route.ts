import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { findUserByEmail, updateUserLastLogin, addAuditLog } from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export async function POST(request: NextRequest) {
  // Parse body — return 400 for malformed JSON, not 500
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { email, password } = parsed.data;

    const user = findUserByEmail(email);
    if (!user || !user.active) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    updateUserLastLogin(user.id);

    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const refreshToken = signRefreshToken({ userId: user.id });

    addAuditLog({
      userId: user.id,
      action: 'login',
      resource: 'auth',
      ip: request.headers.get('x-forwarded-for') || null,
    });

    // Both tokens are stored in httpOnly cookies — never exposed to JS
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });

    response.cookies.set('accessToken', accessToken, {
      ...COOKIE_OPTS,
      maxAge: 60 * 15, // 15 minutes
    });

    response.cookies.set('refreshToken', refreshToken, {
      ...COOKIE_OPTS,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
