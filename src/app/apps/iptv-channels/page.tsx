import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import IPTVChannelsClient from './page-client';

export const dynamic = 'force-dynamic';

export default async function IPTVChannelsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  return <IPTVChannelsClient />;
}
