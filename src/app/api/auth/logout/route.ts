import { NextResponse } from 'next/server';

const COOKIE_CLEAR = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 0,
  path: '/',
};

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.set('accessToken', '', COOKIE_CLEAR);
  response.cookies.set('refreshToken', '', COOKIE_CLEAR);
  return response;
}
