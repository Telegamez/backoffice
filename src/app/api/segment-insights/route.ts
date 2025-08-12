import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { segmentInsights } from '@/db/db-schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  if (!db) return NextResponse.json({ insights: [] });
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ insights: [] });
  const rows = await db
    .select()
    .from(segmentInsights)
    .where(eq(segmentInsights.slug, slug))
    .orderBy(desc(segmentInsights.createdAt))
    .limit(1);
  return NextResponse.json({ insights: rows });
};


