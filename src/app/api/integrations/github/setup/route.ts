import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { saveUserIntegration } from '@/lib/integrations/auth-manager';
import { validateGitHubToken } from '@/lib/integrations/crypto';
import { Octokit } from '@octokit/rest';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ 
        error: 'GitHub token is required' 
      }, { status: 400 });
    }

    // Validate token format
    if (!validateGitHubToken(token)) {
      return NextResponse.json({ 
        error: 'Invalid GitHub token format' 
      }, { status: 400 });
    }

    // Test the token by making an API call
    try {
      const octokit = new Octokit({ auth: token });
      const { data: user } = await octokit.users.getAuthenticated();
      
      // Verify user has necessary permissions by making a simple API call
      await octokit.repos.listForAuthenticatedUser({
        per_page: 1
      });

      // Save the integration
      await saveUserIntegration(
        session.user.email,
        'github',
        token,
        ['repo:read', 'user:read'],
        undefined // GitHub personal access tokens don't typically expire
      );

      return NextResponse.json({ 
        success: true,
        user: {
          login: user.login,
          name: user.name,
          email: user.email
        },
        message: 'GitHub integration configured successfully'
      });

    } catch (githubError: unknown) {
      console.error('GitHub API error:', githubError);
      
      if (githubError && typeof githubError === 'object' && 'status' in githubError) {
        if (githubError.status === 401) {
          return NextResponse.json({ 
            error: 'Invalid GitHub token - authentication failed' 
          }, { status: 400 });
        }
        
        if (githubError.status === 403) {
          return NextResponse.json({ 
            error: 'GitHub token lacks required permissions' 
          }, { status: 400 });
        }
      }

      return NextResponse.json({ 
        error: 'Failed to verify GitHub token' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('GitHub setup error:', error);
    return NextResponse.json(
      { error: 'Failed to configure GitHub integration' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Implement removal of GitHub integration
    // This would delete the user's GitHub integration from the database
    
    return NextResponse.json({ 
      message: 'GitHub integration removal not yet implemented' 
    }, { status: 501 });

  } catch (error) {
    console.error('GitHub removal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove GitHub integration' },
      { status: 500 }
    );
  }
}