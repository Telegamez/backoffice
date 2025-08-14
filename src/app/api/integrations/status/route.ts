import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { registry } from '@/lib/integrations/registry';
import { tokenManager } from '@/lib/integrations/token-manager';
import { getApplicationById } from '@/lib/applications';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('app');

    if (!appId) {
      // Return all user integrations
      const integrations = await tokenManager.getUserIntegrationStatus(session.user.email);
      return NextResponse.json({ integrations });
    }

    // Return integrations for specific app
    const app = getApplicationById(appId);
    if (!app?.integrations) {
      return NextResponse.json({ integrations: [] });
    }

    const requirements = [
      ...app.integrations.required.map(req => ({ ...req, priority: 'required' as const })),
      ...app.integrations.optional.map(req => ({ ...req, priority: 'optional' as const }))
    ];

    const userIntegrations = await tokenManager.getUserIntegrationStatus(session.user.email);
    
    const integrationStatus = requirements.map(req => {
      const capability = registry.getCapability(req.capability);
      const userIntegration = userIntegrations.find(
        ui => ui.providerId === capability?.providerId
      );

      // Check if user has required scopes for this capability
      let hasRequiredScopes = false;
      if (userIntegration?.connected && capability) {
        hasRequiredScopes = capability.requiredScopes.every(scope => 
          userIntegration.scopes.includes(scope)
        );
      }

      return {
        ...req,
        capability: req.capability,
        name: capability?.name || req.capability,
        description: capability?.description || '',
        available: userIntegration?.connected && hasRequiredScopes,
        reason: !userIntegration?.connected 
          ? 'not_configured' 
          : !hasRequiredScopes 
            ? 'insufficient_scopes' 
            : 'available',
        lastUsed: userIntegration?.lastUsed,
        providerId: capability?.providerId
      };
    });

    return NextResponse.json({ integrations: integrationStatus });

  } catch (error) {
    console.error('Integration status error:', error);
    return NextResponse.json(
      { error: 'Failed to get integration status' },
      { status: 500 }
    );
  }
}