import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
    integrations?: Array<{
      providerId: string;
      connected: boolean;
      scopes: string[];
      capabilities: string[];
      lastUsed?: Date;
      expiresAt?: Date;
    }>;
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
  }
}