import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tokenManager } from '@/lib/integrations/token-manager';
import { Octokit } from '@octokit/rest';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Support cross-app requests with headers
    const userEmail = req.headers.get('X-User-Email') || session.user.email;
    const requestingApp = req.headers.get('X-Requesting-App') || 'direct';

    // Validate user email matches session (security check)
    if (userEmail !== session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's GitHub token
    const token = await tokenManager.getProviderToken(userEmail, 'github');
    if (!token) {
      return NextResponse.json({ 
        error: 'GitHub integration not configured' 
      }, { status: 400 });
    }

    const octokit = new Octokit({ auth: token });
    
    // Get GitHub username from token
    const { data: user } = await octokit.users.getAuthenticated();
    
    // Search for issues assigned to user
    const { data: searchResult } = await octokit.search.issuesAndPullRequests({
      q: `assignee:${user.login} is:open type:issue`,
      sort: 'updated',
      order: 'desc',
      per_page: 50
    });

    const issues = searchResult.items.map(issue => ({
      id: issue.id,
      number: issue.number,
      title: issue.title,
      repository: issue.repository_url.split('/').slice(-2).join('/'),
      url: issue.html_url,
      updatedAt: issue.updated_at,
      labels: issue.labels?.map(label => 
        typeof label === 'string' ? label : label.name
      ) || [],
      priority: calculateIssuePriority(issue)
    }));

    return NextResponse.json({
      issues,
      total: searchResult.total_count,
      user: user.login,
      requestingApp
    });

  } catch (error) {
    console.error('GitHub integration error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch GitHub issues' },
      { status: 500 }
    );
  }
}

interface GitHubLabel {
  id?: number;
  node_id?: string;
  url?: string;
  name?: string;
  color?: string;
  default?: boolean;
  description?: string | null;
}

interface GitHubIssue {
  labels?: GitHubLabel[];
  updated_at: string;
}

function calculateIssuePriority(issue: GitHubIssue): 'high' | 'medium' | 'low' {
  // Priority calculation based on labels, age, etc.
  const labels = issue.labels?.map((l) => l.name).filter((name): name is string => Boolean(name)) || [];
  
  if (labels.some((label) => label.includes('urgent') || label.includes('critical'))) {
    return 'high';
  }
  
  const daysSinceUpdate = (Date.now() - new Date(issue.updated_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate > 7) {
    return 'high';
  }
  
  if (daysSinceUpdate > 3) {
    return 'medium';
  }
  
  return 'low';
}