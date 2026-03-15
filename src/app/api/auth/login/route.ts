import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { findUserByEmail, updateUserLastLogin, addAuditLog } from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

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

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      accessToken,
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
