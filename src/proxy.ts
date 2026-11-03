import { NextResponse, type NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

/** 需要登录才能访问的页面（含其子路由） */
const PROTECTED_PREFIXES = [
  '/expenses',
  '/income',
  '/notes',
  '/settings',
  '/gallery',
  '/upload',
  '/search',
];

const AUTH_PAGES = ['/login', '/register'];

function needsAuth(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get('token')?.value;
  const user = token ? verifyToken(token) : null;

  // 已登录还去登录/注册页，直接回首页
  if (user && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (!needsAuth(pathname) || user) {
    return NextResponse.next();
  }

  // 未登录访问受保护页面：带上原地址跳登录，登录后可以跳回去
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('redirect', `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // 排除静态资源与接口，其余页面都走这里
    '/((?!api|_next/static|_next/image|favicon.ico|apple-icon.png|icon.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|woff2?|txt|xml)$).*)',
  ],
};
