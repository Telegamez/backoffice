import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { TaskList } from './components/TaskList';

export default async function AutonomousAgentPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/api/auth/signin');
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Autonomous Agent Scheduler</h1>
        <p className="text-gray-600">
          Create and manage scheduled tasks that run automatically based on your natural language instructions.
        </p>
      </div>

      <TaskList userEmail={session.user.email} />
    </div>
  );
}
