import { NextResponse } from 'next/server';
import { mapGithubToWeeklySegments } from '@/lib/mapTimeline';

export const POST = async (req: Request) => {
  const body = await req.json().catch(() => ({} as { start?: string; end?: string }));
  const res = await mapGithubToWeeklySegments({ start: body.start, end: body.end });
  return NextResponse.json(res);
};




