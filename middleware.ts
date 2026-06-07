import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/applications",
  "/pipeline",
  "/analytics",
  "/reminders",
  "/settings",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.get("sb-access-token");

  if (!hasSession) {
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/applications/:path*",
    "/pipeline/:path*",
    "/analytics/:path*",
    "/reminders/:path*",
    "/settings/:path*",
  ],
};