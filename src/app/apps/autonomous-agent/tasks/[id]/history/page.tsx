'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Execution {
  id: number;
  taskId: number;
  startedAt: string;
  completedAt: string | null;
  status: string;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  executionTimeMs: number | null;
}

export default function TaskHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [taskId]);

  async function loadHistory() {
    try {
      const response = await fetch(`/api/autonomous-agent/tasks/${taskId}/history`);
      if (!response.ok) {
        throw new Error('Failed to load execution history');
      }
      const data = await response.json();
      setExecutions(data.executions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading execution history...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/apps/autonomous-agent"
              className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
            >
              ← Back to Tasks
            </Link>
            <h1 className="text-3xl font-bold">Execution History</h1>
          </div>
          <button
            onClick={() => loadHistory()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Refresh
          </button>
        </div>

        {executions.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-600">
            No execution history yet. Run the task to see results here.
          </div>
        ) : (
          <div className="space-y-4">
            {executions.map((execution) => (
              <div
                key={execution.id}
                className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        Execution #{execution.id}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          execution.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : execution.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {execution.status}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <strong>Started:</strong>{' '}
                        {new Date(execution.startedAt).toLocaleString()}
                      </div>
                      {execution.completedAt && (
                        <div>
                          <strong>Completed:</strong>{' '}
                          {new Date(execution.completedAt).toLocaleString()}
                        </div>
                      )}
                      {execution.executionTimeMs !== null && (
                        <div>
                          <strong>Duration:</strong> {execution.executionTimeMs}ms
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {execution.errorMessage && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-sm">
                    <strong className="text-red-800">Error:</strong>
                    <p className="text-red-700 mt-1">{execution.errorMessage}</p>
                  </div>
                )}

                {execution.result && (
                  <div className="mt-4">
                    <button
                      onClick={(e) => {
                        const details = e.currentTarget.nextElementSibling as HTMLElement;
                        if (details) {
                          details.classList.toggle('hidden');
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View Details →
                    </button>
                    <div className="hidden mt-2 p-4 bg-gray-50 rounded text-xs overflow-x-auto">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(execution.result, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
