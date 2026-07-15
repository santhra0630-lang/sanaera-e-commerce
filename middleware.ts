import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Phase 2: just gates /account behind a session. Phase 4 will extend this
// with role/permission checks for /admin (redirecting non-admins to /403
// rather than /login, so the route's existence isn't confirmed to them).
export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);
  const isAccountRoute = req.nextUrl.pathname.startsWith("/account");

  if (isAccountRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/account/:path*"],
};
