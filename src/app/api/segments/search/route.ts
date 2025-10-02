import { NextResponse } from 'next/server';
import { db } from '@/db';
import { timelineSegments } from '@/db/db-schema';
import { ilike, or, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') ?? '').trim();
    if (!q) return NextResponse.json({ ids: [] });

    // Simple case-insensitive search across title and JSON fields via text cast
    const like = `%${q}%`;
    const rows = await db
      .select({ slug: timelineSegments.slug })
      .from(timelineSegments)
      .where(
        or(
          ilike(timelineSegments.title, like),
          sql`(${timelineSegments.deliverables}::text) ILIKE ${like}`,
          sql`(${timelineSegments.keyWork}::text) ILIKE ${like}`,
          sql`(array_to_string(${timelineSegments.categories}, ',') ILIKE ${like})`
        )
      );

    return NextResponse.json({ ids: rows.map((r) => r.slug) });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};


