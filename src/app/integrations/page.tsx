'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, ExternalLink, Loader2, Settings, Clock, Users, ArrowLeft } from 'lucide-react';

interface ProviderStatus {
  providerId: string;
  providerName: string;
  connected: boolean;
  scopes: string[];
  capabilities: string[];
  lastUsed?: Date;
  expiresAt?: Date;
}

interface Session {
  user?: {
    email?: string;
  };
}

export default function IntegrationsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    // Get session on client side
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(sessionData => {
        setSession(sessionData);
        if (sessionData?.user?.email) {
          loadProviderStatus();
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const loadProviderStatus = async () => {
    try {
      const response = await fetch('/api/integrations/status');
      const data = await response.json();
      
      // Transform the data to show provider-level status
      const providerMap = new Map<string, ProviderStatus>();
      
      // Initialize known providers
      providerMap.set('google', {
        providerId: 'google',
        providerName: 'Google Workspace',
        connected: false,
        scopes: [],
        capabilities: []
      });
      
      providerMap.set('github', {
        providerId: 'github',
        providerName: 'GitHub',
        connected: false,
        scopes: [],
        capabilities: []
      });

      // Update with actual integration data
      data.integrations?.forEach((integration: {
        providerId: string;
        connected: boolean;
        scopes?: string[];
        capabilities?: string[];
        lastUsed?: string;
        expiresAt?: string;
      }) => {
        const provider = providerMap.get(integration.providerId);
        if (provider) {
          provider.connected = integration.connected;
          provider.scopes = integration.scopes || [];
          provider.capabilities = integration.capabilities || [];
          provider.lastUsed = integration.lastUsed ? new Date(integration.lastUsed) : undefined;
          provider.expiresAt = integration.expiresAt ? new Date(integration.expiresAt) : undefined;
        }
      });

      setProviders(Array.from(providerMap.values()));
    } catch (error) {
      console.error('Failed to load provider status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (providerId: string) => {
    setConnecting(providerId);
    
    try {
      if (providerId === 'github') {
        window.location.href = `/api/integrations/connect/github?callbackUrl=${encodeURIComponent('/integrations')}`;
      } else if (providerId === 'google') {
        // Google is handled through main auth - this shouldn't normally happen
        window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent('/integrations')}`;
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (providerId: string) => {
    if (confirm(`Are you sure you want to disconnect ${providerId}? This will affect all applications that use this integration.`)) {
      try {
        const response = await fetch(`/api/integrations/disconnect/${providerId}`, {
          method: 'POST'
        });
        
        if (response.ok) {
          await loadProviderStatus();
        } else {
          alert('Failed to disconnect integration');
        }
      } catch (error) {
        console.error('Disconnect failed:', error);
        alert('Failed to disconnect integration');
      }
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <p>Please sign in to manage your integrations.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading integrations...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Authentication Management</h1>
      </div>
      
      <p className="text-gray-600">
        Manage your external service connections. These integrations are shared across all applications in the backoffice.
      </p>

      <div className="grid gap-6">
        {providers.map(provider => (
          <ProviderCard
            key={provider.providerId}
            provider={provider}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            connecting={connecting === provider.providerId}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>
            <strong>Primary Authentication:</strong> You&apos;re signed in with Google ({session?.user?.email}). 
            This provides access to Google Workspace integrations.
          </p>
          <p>
            <strong>Additional Integrations:</strong> Connect other services like GitHub to enable 
            cross-application features like viewing GitHub issues in AI summaries.
          </p>
          <p>
            <strong>Shared Access:</strong> Once connected, these integrations work across all 
            applications without needing to authenticate again.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface ProviderCardProps {
  provider: ProviderStatus;
  onConnect: (providerId: string) => void;
  onDisconnect: (providerId: string) => void;
  connecting: boolean;
}

function ProviderCard({ provider, onConnect, onDisconnect, connecting }: ProviderCardProps) {
  const isGooglePrimary = provider.providerId === 'google';
  
  return (
    <Card className={provider.connected ? 'border-green-200' : 'border-gray-200'}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{provider.providerName}</span>
            {provider.connected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-gray-400" />
            )}
            {isGooglePrimary && (
              <Badge variant="secondary" className="text-xs">
                Primary Auth
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={provider.connected ? "default" : "destructive"}>
              {provider.connected ? "Connected" : "Not Connected"}
            </Badge>
            
            {provider.connected && !isGooglePrimary && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDisconnect(provider.providerId)}
              >
                Disconnect
              </Button>
            )}
            
            {!provider.connected && (
              <Button
                size="sm"
                onClick={() => onConnect(provider.providerId)}
                disabled={connecting}
              >
                {connecting ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <ExternalLink className="h-3 w-3 mr-1" />
                )}
                Connect
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {provider.connected && (
          <>
            <div>
              <h4 className="font-medium mb-2">Capabilities ({provider.capabilities.length})</h4>
              <div className="flex flex-wrap gap-1">
                {provider.capabilities.map(capability => (
                  <Badge key={capability} variant="outline" className="text-xs">
                    {capability}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Granted Scopes</h4>
              <div className="flex flex-wrap gap-1">
                {provider.scopes.map(scope => (
                  <Badge key={scope} variant="secondary" className="text-xs">
                    {scope}
                  </Badge>
                ))}
              </div>
            </div>
            
            {provider.lastUsed && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                Last used: {provider.lastUsed.toLocaleDateString()} at {provider.lastUsed.toLocaleTimeString()}
              </div>
            )}
            
            {provider.expiresAt && (
              <div className="text-xs text-gray-500">
                Token expires: {provider.expiresAt.toLocaleDateString()}
              </div>
            )}
          </>
        )}
        
        {!provider.connected && (
          <div className="text-sm text-gray-600">
            {provider.providerId === 'github' && (
              <p>Connect GitHub to enable repository access, issue tracking, and development insights across applications.</p>
            )}
            {provider.providerId === 'google' && (
              <p>This is your primary authentication provider. If disconnected, you&apos;ll need to sign in again.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}