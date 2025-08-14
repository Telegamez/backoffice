import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Middleware to protect routes and enforce authentication
export async function middleware(req: NextRequest) {
  try {
    // Get session using NextAuth v5
    const session = await auth();
    
    if (!session?.user) {
      // Use NEXTAUTH_URL as the canonical base URL
      const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
      
      const signInUrl = new URL('/api/auth/signin', baseUrl);
      signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
      
      return NextResponse.redirect(signInUrl);
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware auth error:', error);
    
    // Fallback to signin on any auth error
    const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
    const signInUrl = new URL('/api/auth/signin', baseUrl);
    signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    
    return NextResponse.redirect(signInUrl);
  }
}

// This config specifies which paths the middleware should apply to
export const config = {
  // Temporarily disable middleware for testing
  // matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
  matcher: [],
};