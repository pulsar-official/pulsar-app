import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/', '/sign-in', '/sign-up', '/auth/callback', '/auth/reset-password', '/sso-callback',
  '/api/stripe/', '/api/beta-count', '/api/auth/', '/api/powersync/jwks',
  '/checkout', '/sitemap.xml', '/robots.txt', '/features', '/pricing',
  '/privacy', '/terms', '/waitlist', '/changelog',
]

// Only these emails may access the app dashboard
const DASHBOARD_ALLOWLIST = ['yoshigar304@gmail.com']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: object }[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Authenticated but not on the allowlist — block dashboard access
  if (user && !isPublic && !DASHBOARD_ALLOWLIST.includes(user.email ?? '')) {
    return NextResponse.redirect(new URL('/waitlist', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
