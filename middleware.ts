import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyBasicAuth } from '@/lib/auth/admin'

export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (!verifyBasicAuth(authHeader)) {
    return new NextResponse('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure Area"',
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
