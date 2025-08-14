// Client-side integration utilities (no database imports)
export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  repository: string;
  url: string;
  updatedAt: string;
  labels: string[];
}

export interface DailySummary {
  date: string;
  documentsAnalyzed?: number;
  emailsGenerated?: number;
  timeSaved?: number;
  developmentTasks?: {
    githubIssues?: GitHubIssue[];
    totalActiveIssues?: number;
  };
  [key: string]: unknown;
}

export class ClientGitHubIntegration {
  async getUserGitHubIssues(userEmail: string): Promise<GitHubIssue[]> {
    try {
      const response = await fetch('/api/integrations/github/user-issues', {
        headers: {
          'X-User-Email': userEmail,
          'X-Requesting-App': 'ai-admin-assistant'
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

  async enhanceDailySummaryWithGitHub(
    summary: DailySummary,
    userEmail: string
  ): Promise<DailySummary> {
    const issues = await this.getUserGitHubIssues(userEmail);
    
    if (issues.length > 0) {
      return {
        ...summary,
        developmentTasks: {
          githubIssues: issues.slice(0, 5), // Top 5 recent issues
          totalActiveIssues: issues.length
        }
      };
    }

    return summary;
  }

  async isGitHubAvailable(userEmail: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/integrations/status?app=ai-admin-assistant&userEmail=${encodeURIComponent(userEmail)}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      const githubIntegration = data.integrations?.find(
        (integration: { capability: string; available: boolean }) => integration.capability === 'github.user_issues'
      );
      
      return githubIntegration?.available || false;
    } catch (error) {
      console.error('Failed to check GitHub availability:', error);
      return false;
    }
  }
}

export const clientGitHubIntegration = new ClientGitHubIntegration();