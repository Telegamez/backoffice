import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - must be signed in with Google first' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const callbackUrl = searchParams.get('callbackUrl') || '/integrations';

    // GitHub OAuth parameters
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID!);
    githubAuthUrl.searchParams.set('scope', 'user:email user:read repo');
    githubAuthUrl.searchParams.set('state', JSON.stringify({
      userEmail: session.user.email,
      callbackUrl,
      provider: 'github'
    }));
    githubAuthUrl.searchParams.set('redirect_uri', `https://backoffice.telegames.ai/api/integrations/connect/github/callback`);

    return NextResponse.redirect(githubAuthUrl.toString());

  } catch (error) {
    console.error('GitHub connection error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate GitHub connection' },
      { status: 500 }
    );
  }
}