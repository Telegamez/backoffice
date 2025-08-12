import ClientHome, { type ServerSegment } from './pageClient';
import { fetchSegments } from '@/lib/segments';
export const dynamic = 'force-dynamic';

export default async function Home() {
  const rows = await fetchSegments();
  return <ClientHome segments={rows as unknown as ServerSegment[]} />;
}

