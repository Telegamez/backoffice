'use client';

import { useState } from 'react';

interface TaskCreatorProps {
  onClose: () => void;
  onTaskCreated: () => void;
}

interface TaskPreview {
  task: {
    id: number;
    name: string;
    description?: string;
    scheduleCron: string;
    timezone: string;
    actions: unknown[];
    personalization: unknown;
    enabled: boolean;
    status: string;
  };
  interpretation: unknown;
  preview: string;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  message?: string;
}

export function TaskCreator({ onClose, onTaskCreated }: TaskCreatorProps) {
  const [prompt, setPrompt] = useState('');
  const [recipients, setRecipients] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<TaskPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const examplePrompts = [
    'Every morning at 7am Pacific, email me my calendar and trending AI news',
    'Every Monday at 9am, send me a summary of last week\'s YouTube videos about LangChain',
    'Daily at 6pm, search for new content about startups and email me the top 5 results',
  ];

  const addRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, value: string) => {
    const updated = [...recipients];
    updated[index] = value;
    setRecipients(updated);
  };

  async function handleSubmit() {
    if (!prompt.trim()) {
      setError('Please enter a task description');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Filter out empty recipients
      const validRecipients = recipients.filter(r => r.trim());

      const response = await fetch('/api/autonomous-agent/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          recipients: validRecipients.length > 0 ? validRecipients : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create task');
      }

      const data = await response.json();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!preview?.task?.id) return;

    try {
      const response = await fetch(`/api/autonomous-agent/tasks/${preview.task.id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve task');
      }

      onTaskCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve task');
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Create New Task</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {!preview ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your task in natural language
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Every morning at 7am, email me my calendar and trending AI news"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Recipients (optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  If not specified, emails will be sent from tele@telegames.ai to user@example.com
                </p>
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="email"
                      value={recipient}
                      onChange={(e) => updateRecipient(index, e.target.value)}
                      placeholder="recipient@example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {recipients.length > 1 && (
                      <button
                        onClick={() => removeRecipient(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addRecipient}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-2"
                >
                  + Add another recipient
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Example prompts:</p>
                <div className="space-y-2">
                  {examplePrompts.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrompt(example)}
                      className="block w-full text-left text-sm bg-gray-50 p-3 rounded hover:bg-gray-100 transition"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Task'}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Task Preview</h3>
                <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                  {preview.preview}
                </pre>
              </div>

              {preview.validation?.warnings?.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="font-medium text-yellow-800 mb-2">Warnings:</p>
                  <ul className="list-disc list-inside text-sm text-yellow-700">
                    {preview.validation.warnings.map((warning: string, idx: number) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {preview.validation?.errors?.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-800 mb-2">Errors:</p>
                  <ul className="list-disc list-inside text-sm text-red-700">
                    {preview.validation.errors.map((error: string, idx: number) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-blue-800">
                  {preview.message}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  Approve & Activate
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
