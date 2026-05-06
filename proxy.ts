import { NextRequest, NextResponse } from "next/server";
import { fetchAuthSession } from "aws-amplify/auth/server";
import { runWithAmplifyServerContext } from "@/utils/amplify";
import { getUserGroups } from "@/utils/roles";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();

  const session = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: (contextSpec) => fetchAuthSession(contextSpec),
  });

  const authenticated = !!session.tokens;
  const groups = getUserGroups(session);

  const isLoginPage = request.nextUrl.pathname === "/login";
  const isBudgetExplorerPage =
    request.nextUrl.pathname.startsWith("/budget-explorer");

  if (authenticated) {
    if (isLoginPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (isBudgetExplorerPage) {
      const hasAccess =
        groups.includes("admin") || groups.includes("executive");
      if (!hasAccess) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return response;
  }

  if (isLoginPage) {
    return response;
  }

  return NextResponse.redirect(
    new URL(
      `/login?redirect=${encodeURIComponent(request.nextUrl.pathname)}`,
      request.url,
    ),
  );
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
