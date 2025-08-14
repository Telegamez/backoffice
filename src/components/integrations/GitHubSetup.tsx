'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ExternalLink, Github, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface GitHubSetupProps {
  isConnected?: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

export function GitHubSetup({ isConnected = false, onConnectionChange }: GitHubSetupProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<{ login: string; name?: string; email?: string } | null>(null);

  const handleConnect = async () => {
    if (!token.trim()) {
      setError('Please enter a GitHub token');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/integrations/github/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect GitHub');
      }

      setSuccess(data.message);
      setUserInfo(data.user);
      setToken(''); // Clear token for security
      onConnectionChange?.(true);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect GitHub');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/github/setup', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect GitHub');
      }

      setSuccess('GitHub integration disconnected');
      setUserInfo(null);
      onConnectionChange?.(false);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect GitHub');
    } finally {
      setLoading(false);
    }
  };

  if (isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Integration
            <Badge variant="default" className="ml-auto">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {userInfo && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm">
                <p className="font-medium">Connected as: {userInfo.login}</p>
                {userInfo.name && <p className="text-gray-600">{userInfo.name}</p>}
                {userInfo.email && <p className="text-gray-600">{userInfo.email}</p>}
              </div>
            </div>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => window.location.href = '/apps/ai-admin-assistant'}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Return to AI Admin Assistant
            </Button>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={loading}
            >
              Disconnect
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => window.open('https://github.com/settings/tokens', '_blank')}
              title="Manage GitHub Tokens"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          Connect GitHub
          <Badge variant="secondary" className="ml-auto">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Connected
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>Connect your GitHub account to enable:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Access to your assigned issues</li>
            <li>Repository activity in daily summaries</li>
            <li>Cross-app GitHub data sharing</li>
          </ul>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              GitHub Personal Access Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p>Required permissions: <code>repo:read</code>, <code>user:read</code></p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleConnect}
            disabled={loading || !token.trim()}
            className="flex-1"
          >
            {loading ? 'Connecting...' : 'Connect with Token'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://github.com/settings/tokens/new?scopes=repo,user:read&description=Backoffice%20Integration', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Create Token
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => window.location.href = '/api/integrations/github/oauth/authorize'}
          disabled={loading}
          className="w-full"
        >
          <Github className="h-4 w-4 mr-2" />
          Connect with GitHub OAuth
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Go to GitHub → Settings → Developer settings → Personal access tokens</p>
          <p>• Generate a new token with <code>repo</code> and <code>user:read</code> permissions</p>
          <p>• Copy and paste the token above</p>
        </div>
      </CardContent>
    </Card>
  );
}