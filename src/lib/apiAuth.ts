import { NextResponse } from 'next/server';
import { getTokenFromRequest, verifyToken, type JWTPayload } from '@/lib/auth';

export type AuthResult =
  | { ok: true; payload: JWTPayload }
  | { ok: false; response: NextResponse };

/**
 * 校验请求的登录态。
 *
 * @example
 *   const auth = requireAuth(request);
 *   if (!auth.ok) return auth.response;
 *   // 之后可用 auth.payload.userId
 */
export function requireAuth(request: Request): AuthResult {
  const token = getTokenFromRequest(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: '未登录' }, { status: 401 }),
    };
  }
  const payload = verifyToken(token);
  if (!payload) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: '登录已过期' }, { status: 401 }),
    };
  }
  return { ok: true, payload };
}
