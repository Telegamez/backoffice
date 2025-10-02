import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tokenManager } from '@/lib/integrations/token-manager';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> }
) {
  const { provider } = await context.params;
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // provider already extracted from params above

    // Get the token before revoking (for proper cleanup)
    const token = await tokenManager.getProviderToken(session.user.email, provider);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Integration not found or already disconnected' },
        { status: 404 }
      );
    }

    // Revoke the token with the provider if possible
    try {
      if (provider === 'github') {
        // Revoke GitHub token using the OAuth app endpoint
        await fetch(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/token`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString('base64')}`,
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({ access_token: token })
        });
      } else if (provider === 'google') {
        // Revoke Google token
        await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
          method: 'POST'
        });
      }
    } catch (revokeError) {
      console.error(`Failed to revoke ${provider} token with provider:`, revokeError);
      // Continue with local removal even if remote revocation fails
    }

    // Remove the integration from our database
    await tokenManager.revokeProviderToken(session.user.email, provider);

    return NextResponse.json({ 
      success: true, 
      message: `${provider} integration disconnected successfully` 
    });

  } catch (error) {
    console.error('Integration disconnect error:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}