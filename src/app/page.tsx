import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import ApplicationSelector from '@/components/ApplicationSelector';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  return <ApplicationSelector userEmail={session.user.email || undefined} />;
}

