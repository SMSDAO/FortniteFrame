import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getAllUsers, updateUserRole, createUser, addAuditLog } from '@/lib/db';
import type { Role } from '@/lib/db';
import { z } from 'zod';

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.enum(['Admin', 'Developer', 'User', 'Auditor']),
});

const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['Admin', 'Developer', 'User', 'Auditor']),
});

function getAdminPayload(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value
    ?? (request.headers.get('authorization')?.startsWith('Bearer ')
      ? request.headers.get('authorization')!.slice(7)
      : null);
  if (!token) throw new Error('Unauthorized');
  const payload = verifyToken(token);
  if (payload.role !== 'Admin') throw new Error('Forbidden');
  return payload;
}

export async function GET(request: NextRequest) {
  try {
    getAdminPayload(request);
    return NextResponse.json(getAllUsers());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminPayload = getAdminPayload(request);
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    let newUser;
    try {
      newUser = createUser({
        ...parsed.data,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        active: true,
        usageCount: 0,
        usageLimit: 500,
      });
    } catch (createErr) {
      const createMsg = createErr instanceof Error ? createErr.message : 'Error';
      if (createMsg.includes('already in use')) {
        return NextResponse.json({ error: createMsg }, { status: 409 });
      }
      throw createErr;
    }

    addAuditLog({
      userId: adminPayload.userId,
      action: 'create_user',
      resource: `user:${newUser.id}`,
      ip: request.headers.get('x-forwarded-for') || null,
    });

    return NextResponse.json({ id: newUser.id, email: newUser.email, role: newUser.role }, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 401 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminPayload = getAdminPayload(request);
    const body = await request.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { userId, role } = parsed.data;
    const updated = updateUserRole(userId, role as Role);

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    addAuditLog({
      userId: adminPayload.userId,
      action: 'update_role',
      resource: `user:${userId}`,
      ip: request.headers.get('x-forwarded-for') || null,
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 401 });
  }
}
