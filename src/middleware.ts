import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Middleware to protect routes and enforce authentication
export async function middleware(req: NextRequest) {
  // Try to read the session token
  let token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Try alternative cookie name for newer Auth.js versions
  if (!token) {
    token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: "__Secure-authjs.session-token",
    });
  }
  
  if (!token) {
    // Use NEXTAUTH_URL as the canonical base URL
    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
    
    const signInUrl = new URL('/api/auth/signin', baseUrl);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    
    return NextResponse.redirect(signInUrl);
  }
  
  return NextResponse.next();
}

// This config specifies which paths the middleware should apply to
export const config = {
  // Match all paths except for:
  // - API auth routes
  // - _next/static files
  // - _next/image files
  // - favicon.ico
  // - Public assets
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};