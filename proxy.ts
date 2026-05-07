import { NextRequest, NextResponse } from 'next/server'
import { fetchAuthSession } from 'aws-amplify/auth/server'
import { runWithAmplifyServerContext } from '@/utils/amplify'
import { getUserGroups } from '@/utils/roles'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  const session = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: (contextSpec) => fetchAuthSession(contextSpec),
  })

  const authenticated = !!session.tokens
  const groups = getUserGroups(session)

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === '/login'
  const isSignUpPage = pathname === '/sign-up'
  const isWelcomePage = pathname === '/welcome'
  const isAuthPage = isLoginPage || isSignUpPage || isWelcomePage

  const hasAnyRole = groups.some((role) => ['admin', 'executive', 'user'].includes(role))

  if (authenticated) {
    // 1. Logged in but NO roles -> restricted to /welcome
    if (!hasAnyRole) {
      if (isWelcomePage) return response
      return NextResponse.redirect(new URL('/welcome', request.url))
    }

    // 2. Logged in and HAS roles -> redirected away from auth pages
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // 3. Feature-specific RBAC
    if (pathname.startsWith('/budget-explorer')) {
      const hasAccess = groups.includes('admin') || groups.includes('executive')
      if (!hasAccess) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    if (pathname.startsWith('/admin')) {
      const hasAccess = groups.includes('admin')
      if (!hasAccess) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }

    return response
  }

  // Not authenticated
  if (isLoginPage || isSignUpPage) {
    return response
  }

  return NextResponse.redirect(
    new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url),
  )
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
