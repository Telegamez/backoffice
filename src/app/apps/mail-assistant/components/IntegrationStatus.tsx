'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { clientGitHubIntegration } from '../lib/client-integration';

interface IntegrationStatusProps {
  userEmail?: string | null;
}

export function IntegrationStatus({ userEmail }: IntegrationStatusProps) {
  const [githubAvailable, setGithubAvailable] = useState(false);
  const [githubIssues, setGithubIssues] = useState<Array<{ id: number; title: string; repository: string }>>([]);

  const checkGitHubIntegration = useCallback(async () => {
    if (!userEmail) return;

    const available = await clientGitHubIntegration.isGitHubAvailable(userEmail);
    setGithubAvailable(available);

    if (available) {
      const issues = await clientGitHubIntegration.getUserGitHubIssues(userEmail);
      setGithubIssues(issues);
    }
  }, [userEmail]);

  useEffect(() => {
    if (userEmail) {
      checkGitHubIntegration();
    }
  }, [userEmail, checkGitHubIntegration]);

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-medium mb-4">Available Integrations</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {githubAvailable ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-gray-400" />
              )}
              <span>GitHub Issues</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={githubAvailable ? "default" : "secondary"}>
                {githubAvailable ? "Connected" : "Optional"}
              </Badge>
              {githubAvailable && githubIssues.length > 0 && (
                <Badge variant="outline">
                  {githubIssues.length} active issues
                </Badge>
              )}
            </div>
          </div>

          {githubAvailable && githubIssues.length > 0 && (
            <div className="ml-6 space-y-1">
              <p className="text-sm text-gray-600">Recent Issues:</p>
              {githubIssues.slice(0, 3).map(issue => (
                <div key={issue.id} className="text-xs text-gray-500">
                  • {issue.title} ({issue.repository})
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}