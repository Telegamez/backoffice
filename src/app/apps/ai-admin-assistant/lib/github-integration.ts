import { integrationClient } from '@/lib/integrations/client';

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
  developmentTasks?: {
    githubIssues?: GitHubIssue[];
    totalActiveIssues?: number;
  };
  [key: string]: unknown;
}

export class AIAssistantGitHubIntegration {
  async getUserGitHubIssues(userEmail: string): Promise<GitHubIssue[]> {
    try {
      const result = await integrationClient.getData<{
        issues: GitHubIssue[];
        total: number;
      }>({
        capability: 'github.user_issues',
        userEmail,
        requestingApp: 'ai-admin-assistant'
      });

      return result?.issues || [];
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
    return integrationClient.isCapabilityAvailable('github.user_issues', userEmail);
  }
}

export const gitHubIntegration = new AIAssistantGitHubIntegration();