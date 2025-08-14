import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tokenManager } from '@/lib/integrations/token-manager';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - session expired' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      const callbackUrl = '/integrations?error=' + encodeURIComponent(error);
      return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegamez.com'));
    }

    if (!code) {
      const callbackUrl = '/integrations?error=no_code';
      return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegamez.com'));
    }

    let parsedState;
    try {
      parsedState = JSON.parse(state || '{}');
    } catch {
      const callbackUrl = '/integrations?error=invalid_state';
      return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegamez.com'));
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      const callbackUrl = '/integrations?error=token_exchange_failed';
      return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegamez.com'));
    }

    // Get user information to verify the connection
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      const callbackUrl = '/integrations?error=user_fetch_failed';
      return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegamez.com'));
    }

    const userData = await userResponse.json();

    // Store the GitHub token using our unified token manager
    await tokenManager.saveProviderToken(
      session.user.email,
      'github',
      tokenData.access_token,
      tokenData.refresh_token || null,
      tokenData.scope?.split(',') || ['user:email', 'user:read', 'repo'],
      tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined
    );

    // Redirect back to the original page with success
    const callbackUrl = parsedState.callbackUrl || '/integrations';
    const successUrl = `${callbackUrl}?integration=github&status=connected&user=${encodeURIComponent(userData.login)}`;
    
    return NextResponse.redirect(new URL(successUrl, 'https://backoffice.telegamez.com'));

  } catch (error) {
    console.error('GitHub callback error:', error);
    const callbackUrl = '/integrations?error=callback_failed';
    return NextResponse.redirect(new URL(callbackUrl, 'https://backoffice.telegamez.com'));
  }
}