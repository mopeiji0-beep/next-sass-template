import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // Handle internationalization
  const response = intlMiddleware(request);

  // Handle authentication - use getToken for Edge Runtime compatibility
  const token = await getToken({ 
    req: request,
    secret: process.env.AUTH_SECRET 
  });
  const isLoggedIn = !!token;
  const { pathname } = request.nextUrl;

  // Check if pathname includes locale
  const pathnameHasLocale = routing.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Extract path without locale
  const pathWithoutLocale = pathnameHasLocale
    ? pathname.split("/").slice(2).join("/") || "/"
    : pathname;

  // Protect dashboard routes
  if (pathWithoutLocale.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", request.url);
      if (pathnameHasLocale) {
        const locale = pathname.split("/")[1];
        loginUrl.pathname = `/${locale}/login`;
      }
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect logged-in users away from login/register
  if (isLoggedIn && (pathWithoutLocale === "/login" || pathWithoutLocale === "/register")) {
    const dashboardUrl = new URL("/dashboard", request.url);
    if (pathnameHasLocale) {
      const locale = pathname.split("/")[1];
      dashboardUrl.pathname = `/${locale}/dashboard`;
    }
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};