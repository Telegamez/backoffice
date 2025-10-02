import { db } from '@/db';
import { timelineSegments } from '@/db/db-schema';
// import { asc, desc, eq } from 'drizzle-orm';
// import { openai } from '@ai-sdk/openai';

export type SegmentRow = typeof timelineSegments.$inferSelect;

export const fetchSegments = async (): Promise<SegmentRow[]> => {
  if (!db) return [] as SegmentRow[];
  const rows = await db.select().from(timelineSegments);
  return rows;
};




