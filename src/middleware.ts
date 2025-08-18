import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth"; // Commented out to avoid Edge Runtime issues

// Middleware to protect routes and enforce authentication
export async function middleware(req: NextRequest) {
  // Middleware disabled - auth handled at page level
  return NextResponse.next();
}

// This config specifies which paths the middleware should apply to
export const config = {
  // Temporarily disable middleware for testing
  // matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
  matcher: [],
};