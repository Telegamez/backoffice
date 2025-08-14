import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tokenManager } from '@/lib/integrations/token-manager';
import { GithubSyncInput, syncIssues, syncPullRequests } from '@/lib/github';

export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
  try {
    // Get the authenticated user session
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in' },
        { status: 401 }
      );
    }

    // Get user's GitHub token from unified authentication system
    const githubToken = await tokenManager.getProviderToken(session.user.email, 'github');
    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub integration not connected. Please connect GitHub in your integrations.' },
        { status: 400 }
      );
    }

    const json = await req.json().catch(() => ({}));
    const { repo, perPage, maxPages } = GithubSyncInput.parse({
      ...json,
      token: githubToken // Override with user's token
    });

    const [issuesRes, prsRes] = await Promise.all([
      syncIssues(repo, githubToken, perPage, maxPages),
      syncPullRequests(repo, githubToken, perPage, maxPages),
    ]);

    return NextResponse.json({
      repo,
      issuesSynced: issuesRes.count,
      prsSynced: prsRes.count,
      syncedAt: new Date().toISOString(),
      user: session.user.email
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
};


