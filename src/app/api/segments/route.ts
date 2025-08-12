import { NextResponse } from 'next/server';
import { fetchSegments } from '@/lib/segments';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  const rows = await fetchSegments();
  return NextResponse.json(rows);
};




