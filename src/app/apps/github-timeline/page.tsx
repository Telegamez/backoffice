import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import ClientHome, { type ServerSegment } from './pageClient';
import { fetchSegments } from '@/lib/segments';

export const dynamic = 'force-dynamic';

export default async function GitHubTimelinePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  const rows = await fetchSegments();
  return <ClientHome segments={rows as unknown as ServerSegment[]} />;
}