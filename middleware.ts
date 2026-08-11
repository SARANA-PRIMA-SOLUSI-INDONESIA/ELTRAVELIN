import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

const ROLE_ACCESS: Record<string, string[]> = {
  SUPER_ADMIN: [
    '/admin',
    '/admin/schedules',
    '/admin/master',
    '/admin/drivers',
    '/admin/driver-schedules',
    '/admin/vehicles',
    '/admin/promos',
    '/admin/bookings',
    '/admin/reports',
    '/admin/settings',
    '/admin/partnership-logo',
    '/admin/users',
    '/admin/test-wa',
    '/admin/test-mail',
    '/admin/confirm-pool',
    '/admin/simulate-moota',
  ],
  ADMIN: [
    '/admin',
    '/admin/schedules',
    '/admin/master/banner',
    '/admin/drivers',
    '/admin/driver-schedules',
    '/admin/bookings',
    '/admin/reports',
    '/admin/confirm-pool',
    '/admin/simulate-moota',
  ],
  CS: [
    '/admin',
    '/admin/schedules',
    '/admin/bookings',
    '/admin/confirm-pool',
    '/admin/simulate-moota',
  ],
};

function canAccess(pathname: string, role: string): boolean {
  const allowedPrefixes = ROLE_ACCESS[role] || ROLE_ACCESS.ADMIN;
  return allowedPrefixes.some((prefix) => {
    if (prefix === '/admin') {
      return pathname === '/admin';
    }
    return pathname === prefix || pathname.startsWith(prefix + '/');
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const session = request.cookies.get('session')?.value;
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const payload = await decrypt(session);
      if (!canAccess(pathname, payload.role || 'ADMIN')) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect admin API routes
  if (pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/login')) {
    const session = request.cookies.get('session')?.value;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const payload = await decrypt(session);
      const apiPath = pathname.replace('/api', '');
      if (!canAccess(apiPath, payload.role || 'ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
