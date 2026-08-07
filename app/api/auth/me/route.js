import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

export async function GET(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token && verifySession(token);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  return NextResponse.json({ email: session.email });
}
