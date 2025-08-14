import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { tokenManager } from './integrations/token-manager';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Primary authentication provider - Google only (for login)
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            // Base scopes for login
            'openid',
            'email',
            'profile',
            // Enhanced scopes for Workspace integration
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/gmail.modify',
            'https://www.googleapis.com/auth/calendar.readonly'
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent'        // Force consent to get refresh token
        }
      }
    })
    // GitHub will be handled through a separate OAuth flow for secondary integration
  ],
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt",
  },
  events: {
    signOut: async (message) => {
      // Future enhancement: revoke tokens on signout
      if ('token' in message && message.token?.email) {
        console.log(`User ${message.token.email} signed out - token revocation not yet implemented`);
      }
    }
  },
  pages: {
    signIn: '/api/auth/signin',
    error: '/api/auth/error',
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async signIn({ account, profile }) {
      try {
        if (account?.provider === "google") {
          // Profile must exist, have a verified email, and match the required domain.
          if (profile?.email_verified && profile.email?.endsWith("@telegamez.com")) {
            console.log(`Successful sign-in for user: ${profile.email}`);
            return true;
          } else {
            console.warn(`Sign-in attempt denied for user: ${profile?.email} (verified: ${profile?.email_verified}, domain match: ${profile?.email?.endsWith("@telegamez.com")})`);
            return false;
          }
        }
        // Only Google is configured as a NextAuth provider
        // For other providers, we can add different checks or allow them by default.
        return true;
      } catch (error) {
        console.error('Unexpected error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, account, user }) {
      try {
        // Store Google OAuth tokens when user authenticates (primary provider only)
        if (account && user?.email && account.provider === 'google') {
          await tokenManager.saveProviderToken(
            user.email,
            'google',
            account.access_token!,
            account.refresh_token,
            account.scope?.split(' ') || [],
            account.expires_at ? new Date(account.expires_at * 1000) : undefined
          );
        }
        
        if (user) {
          token.email = user.email;
          token.id = user.id;
        }
        return token;
      } catch (error) {
        console.error('Unexpected error in jwt callback:', error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (token?.email && session.user) {
          session.user.email = token.email as string;
          session.user.id = token.id as string;
          
          // Add integration status to session
          // This will be populated by a future enhancement
          session.integrations = [];
        }
        return session;
      } catch (error) {
        console.error('Unexpected error in session callback:', error);
        return session;
      }
    }
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    pkceCodeVerifier: {
      name: "next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      }
    }
  },
});