'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, ExternalLink, Loader2, Clock } from 'lucide-react';

interface IntegrationStatus {
  capability: string;
  name: string;
  description: string;
  purpose: string;
  priority: 'required' | 'optional';
  available: boolean;
  reason: string;
  lastUsed?: string;
  fallback: 'disable' | 'limited' | 'error';
  providerId?: string;
}

interface IntegrationSetupProps {
  appId: string;
  onIntegrationChange?: (integrations: IntegrationStatus[]) => void;
  showOptional?: boolean;
}

export function IntegrationSetup({ 
  appId, 
  onIntegrationChange,
  showOptional = true 
}: IntegrationSetupProps) {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    try {
      const response = await fetch(`/api/integrations/status?app=${appId}`);
      const data = await response.json();
      setIntegrations(data.integrations);
      onIntegrationChange?.(data.integrations);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  }, [appId, onIntegrationChange]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const handleConnect = async (capability: string, providerId?: string) => {
    setConnecting(capability);
    
    try {
      // Determine provider from capability or use provided providerId
      const provider = providerId || capability.split('.')[0];
      
      if (provider === 'google') {
        // For Google, user needs to sign out and sign in again with enhanced scopes
        // This should rarely happen since Google is the primary auth provider
        window.location.href = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(
          window.location.href
        )}`;
      } else if (provider === 'github') {
        // For GitHub, use dedicated integration OAuth flow (secondary integration)
        window.location.href = `/api/integrations/connect/github?callbackUrl=${encodeURIComponent(
          window.location.pathname
        )}`;
      } else {
        // For other providers, use the general connection flow
        window.location.href = `/api/integrations/connect/${provider}?callbackUrl=${encodeURIComponent(
          window.location.pathname
        )}`;
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setConnecting(null);
    }
  };

  const handleReconnect = async (capability: string, providerId?: string) => {
    // For reconnection, we use the same flow as connect
    // This handles scope updates and re-authorization
    await handleConnect(capability, providerId);
  };

  // Check for integration connection results in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const integration = urlParams.get('integration');
    const status = urlParams.get('status');
    
    if (integration && status === 'connected') {
      // Reload integrations to reflect the new connection
      loadIntegrations();
      
      // Clean up URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [loadIntegrations]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading integrations...</span>
        </CardContent>
      </Card>
    );
  }

  const requiredIntegrations = integrations.filter(i => i.priority === 'required');
  const optionalIntegrations = integrations.filter(i => i.priority === 'optional');
  const allRequiredConnected = requiredIntegrations.every(i => i.available);

  return (
    <div className="space-y-6">
      {/* App Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {allRequiredConnected ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            )}
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              {allRequiredConnected
                ? 'All required integrations are connected. This app is ready to use.'
                : 'Some required integrations are missing. Connect them to use this app.'}
            </p>
            {!allRequiredConnected && (
              <div className="text-xs text-gray-500">
                Required integrations must be connected for the app to function properly. 
                You can also manage all integrations from the{' '}
                <a href="/integrations" className="text-blue-600 hover:underline">
                  Integration Management page
                </a>.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Required Integrations */}
      {requiredIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Required Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requiredIntegrations.map(integration => (
              <IntegrationCard
                key={integration.capability}
                integration={integration}
                onConnect={handleConnect}
                onReconnect={handleReconnect}
                connecting={connecting === integration.capability}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Optional Integrations */}
      {showOptional && optionalIntegrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Optional Integrations</CardTitle>
            <p className="text-sm text-gray-600">
              These integrations enhance functionality but are not required.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {optionalIntegrations.map(integration => (
              <IntegrationCard
                key={integration.capability}
                integration={integration}
                onConnect={handleConnect}
                onReconnect={handleReconnect}
                connecting={connecting === integration.capability}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface IntegrationCardProps {
  integration: IntegrationStatus;
  onConnect: (capability: string, providerId?: string) => void;
  onReconnect: (capability: string, providerId?: string) => void;
  connecting: boolean;
}

function IntegrationCard({ 
  integration, 
  onConnect, 
  onReconnect, 
  connecting 
}: IntegrationCardProps) {
  const isRequired = integration.priority === 'required';
  const needsAttention = isRequired && !integration.available;
  const needsReconnection = integration.reason === 'insufficient_scopes';

  const getStatusColor = () => {
    if (integration.available) return 'text-green-500';
    if (needsAttention) return 'text-orange-500';
    return 'text-gray-400';
  };

  const getStatusMessage = () => {
    switch (integration.reason) {
      case 'available':
        return 'Connected';
      case 'not_configured':
        return 'Not Connected';
      case 'insufficient_scopes':
        return 'Needs Permission Update';
      default:
        return 'Unknown Status';
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
      needsAttention ? 'border-orange-200 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium">{integration.name}</h4>
          {integration.available ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className={`h-4 w-4 ${getStatusColor()}`} />
          )}
          {isRequired && (
            <Badge variant="outline" className="text-xs">
              Required
            </Badge>
          )}
          {needsReconnection && (
            <Badge variant="secondary" className="text-xs">
              Update Needed
            </Badge>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-1">{integration.purpose}</p>
        
        {integration.description && (
          <p className="text-xs text-gray-500 mb-1">{integration.description}</p>
        )}
        
        {integration.lastUsed && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3 w-3" />
            Last used: {new Date(integration.lastUsed).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Badge 
          variant={integration.available ? "default" : "destructive"}
          className="text-xs"
        >
          {getStatusMessage()}
        </Badge>
        
        {!integration.available && (
          <Button
            size="sm"
            onClick={() => onConnect(integration.capability, integration.providerId)}
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
        
        {needsReconnection && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReconnect(integration.capability, integration.providerId)}
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <ExternalLink className="h-3 w-3 mr-1" />
            )}
            Update
          </Button>
        )}
      </div>
    </div>
  );
}

// Compact version for use in app headers/sidebars
export function IntegrationStatusIndicator({ 
  appId, 
  showDetails = false 
}: { 
  appId: string; 
  showDetails?: boolean; 
}) {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch(`/api/integrations/status?app=${appId}`);
        const data = await response.json();
        setIntegrations(data.integrations);
      } catch (error) {
        console.error('Failed to load integration status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [appId]);

  if (loading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  const requiredIntegrations = integrations.filter(i => i.priority === 'required');
  const allRequiredConnected = requiredIntegrations.every(i => i.available);
  const missingCount = requiredIntegrations.filter(i => !i.available).length;

  if (allRequiredConnected) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="h-4 w-4" />
        {showDetails && <span className="text-xs">Ready</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-orange-600">
      <AlertCircle className="h-4 w-4" />
      {showDetails && (
        <span className="text-xs">
          {missingCount} integration{missingCount > 1 ? 's' : ''} needed
        </span>
      )}
    </div>
  );
}