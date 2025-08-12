import { NextResponse } from 'next/server';
import { GithubSyncInput, syncIssues, syncPullRequests } from '@/lib/github';

export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
  try {
    const json = await req.json().catch(() => ({}));
    const { repo, token, perPage, maxPages } = GithubSyncInput.parse(json);

    const [issuesRes, prsRes] = await Promise.all([
      syncIssues(repo, token ?? process.env.GITHUB_TOKEN, perPage, maxPages),
      syncPullRequests(repo, token ?? process.env.GITHUB_TOKEN, perPage, maxPages),
    ]);

    return NextResponse.json({
      repo,
      issuesSynced: issuesRes.count,
      prsSynced: prsRes.count,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
};


