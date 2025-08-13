import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
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
        // For other providers, we can add different checks or allow them by default.
        return true;
      } catch (error) {
        console.error('Unexpected error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      try {
        if (user) {
          // No database operations - just pass email and id through
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
});