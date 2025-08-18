// Server-side data fetching - auth imported but not used in current implementation
import { getUserIntegrationStatus } from '@/lib/integrations/auth-manager';
import type { GitHubIssue, DailySummary } from './github-integration';

// Server-side data fetching functions
export async function getGitHubIssuesForUser(userEmail: string): Promise<GitHubIssue[]> {
  try {
    // This would be called from a server component or API route
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/integrations/github/user-issues`, {
      headers: {
        'X-User-Email': userEmail,
        'X-Requesting-App': 'mail-assistant'
      }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.issues || [];
  } catch (error) {
    console.warn('Failed to get GitHub issues:', error);
    return [];
  }
}

export async function checkGitHubIntegrationStatus(userEmail: string): Promise<boolean> {
  try {
    const status = await getUserIntegrationStatus(userEmail, 'github');
    return status.connected;
  } catch (error) {
    console.warn('Failed to check GitHub integration status:', error);
    return false;
  }
}

export async function getEnhancedDailySummary(userEmail: string): Promise<DailySummary> {
  const baseSummary: DailySummary = {
    date: new Date().toISOString().split('T')[0],
    documentsAnalyzed: 0,
    emailsGenerated: 0,
    timeSaved: 0
  };

  try {
    // Check if GitHub integration is available
    const githubAvailable = await checkGitHubIntegrationStatus(userEmail);
    
    if (githubAvailable) {
      const issues = await getGitHubIssuesForUser(userEmail);
      
      if (issues.length > 0) {
        return {
          ...baseSummary,
          developmentTasks: {
            githubIssues: issues.slice(0, 5), // Top 5 recent issues
            totalActiveIssues: issues.length
          }
        };
      }
    }

    return baseSummary;
  } catch (error) {
    console.warn('Failed to enhance daily summary:', error);
    return baseSummary;
  }
}