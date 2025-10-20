import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Non-fatal: allow running without DB for initial dev
  console.warn('DATABASE_URL not set. DB features will be disabled.');
}

export const pool = connectionString
  ? new Pool({ connectionString, max: 5 })
  : undefined;

export const db = pool ? drizzle(pool) : undefined as unknown as ReturnType<typeof drizzle>;







