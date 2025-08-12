import { db } from '@/lib/db';
import { timelineSegments } from '@/db/db-schema';

export type SegmentRow = typeof timelineSegments.$inferSelect;

export const fetchSegments = async (): Promise<SegmentRow[]> => {
  if (!db) return [] as SegmentRow[];
  const rows = await db.select().from(timelineSegments);
  return rows;
};




