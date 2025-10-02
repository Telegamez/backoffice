'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TaskCreator } from './TaskCreator';

interface Task {
  id: number;
  name: string;
  description: string | null;
  scheduleCron: string;
  timezone: string;
  enabled: boolean;
  status: string;
  lastRun: string | null;
  nextRun: string | null;
  createdAt: string;
}

export function TaskList({ userEmail }: { userEmail: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const response = await fetch('/api/autonomous-agent/tasks');
      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }
      const data = await response.json();
      setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(taskId: number, enabled: boolean) {
    try {
      const response = await fetch(`/api/autonomous-agent/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Reload tasks
      await loadTasks();
    } catch (error) {
      console.error('Failed to toggle task:', error);
      alert('Failed to update task');
    }
  }

  async function deleteTask(taskId: number) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/autonomous-agent/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Reload tasks
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task');
    }
  }

  async function executeTask(taskId: number) {
    try {
      const response = await fetch(`/api/autonomous-agent/tasks/${taskId}/execute`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to execute task');
      }

      alert('Task execution started! Check the history tab to see results.');
    } catch (error) {
      console.error('Failed to execute task:', error);
      alert('Failed to execute task');
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading tasks...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => setShowCreator(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Task
        </button>
      </div>

      {showCreator && (
        <TaskCreator
          onClose={() => setShowCreator(false)}
          onTaskCreated={() => {
            setShowCreator(false);
            loadTasks();
          }}
        />
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No tasks yet. Create your first task to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{task.name}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : task.status === 'pending_approval'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {task.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-gray-600 mb-3">{task.description}</p>
                  )}

                  <div className="text-sm text-gray-500 space-y-1">
                    <div>
                      <strong>Schedule:</strong> {task.scheduleCron} ({task.timezone})
                    </div>
                    {task.lastRun && (
                      <div>
                        <strong>Last Run:</strong> {new Date(task.lastRun).toLocaleString()}
                      </div>
                    )}
                    {task.nextRun && (
                      <div>
                        <strong>Next Run:</strong> {new Date(task.nextRun).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {task.status === 'pending_approval' && (
                    <Link
                      href={`/apps/autonomous-agent/tasks/${task.id}`}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                    >
                      Review & Approve
                    </Link>
                  )}

                  {task.status === 'approved' && (
                    <>
                      <button
                        onClick={() => toggleTask(task.id, !task.enabled)}
                        className={`px-3 py-1 text-sm rounded transition ${
                          task.enabled
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {task.enabled ? 'Disable' : 'Enable'}
                      </button>

                      <button
                        onClick={() => executeTask(task.id)}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                      >
                        Run Now
                      </button>
                    </>
                  )}

                  <Link
                    href={`/apps/autonomous-agent/tasks/${task.id}/history`}
                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                  >
                    History
                  </Link>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
