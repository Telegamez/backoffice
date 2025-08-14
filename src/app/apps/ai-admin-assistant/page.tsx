"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Mail, Calendar, Bot } from 'lucide-react';
import { clientGitHubIntegration, type DailySummary, type GitHubIssue } from './lib/client-integration';

export default function AIAdminAssistantDashboard() {
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);

  useEffect(() => {
    // Get user session and load daily summary
    loadUserAndSummary();
  }, []);

  const loadUserAndSummary = async () => {
    try {
      // In a real implementation, you'd get the session on the server side
      // For now, we'll simulate a user email for demonstration
      const mockUserEmail = "user@telegamez.com";

      // Load base summary (simulate document analysis data)
      const baseSummary: DailySummary = {
        date: new Date().toISOString().split('T')[0],
        documentsAnalyzed: 0,
        emailsGenerated: 0,
        timeSaved: 0
      };

      // Enhance with GitHub integration if available
      const enhancedSummary = await clientGitHubIntegration.enhanceDailySummaryWithGitHub(
        baseSummary,
        mockUserEmail
      );

      setDailySummary(enhancedSummary);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Admin Assistant</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered automation for Google Workspace document-to-email workflows
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled>
            Google Workspace (Connected)
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/integrations'}
          >
            Manage Auth
          </Button>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Documents Analyzed</div>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-primary mt-2">0</div>
          <div className="text-sm text-muted-foreground">+0% from last month</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Emails Generated</div>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-primary mt-2">0</div>
          <div className="text-sm text-muted-foreground">+0% from last month</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Time Saved</div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold text-primary mt-2">0h</div>
          <div className="text-sm text-muted-foreground">This week</div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="rounded-xl border bg-card p-4 mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Workflow Actions</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">Document Analysis</div>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Select a Google Drive document to analyze and extract key insights for email campaigns
            </div>
            <Button className="w-full" disabled>
              <Bot className="h-4 w-4 mr-2" />
              Analyze Document (Coming Soon)
            </Button>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">Email Campaigns</div>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Create personalized email campaigns based on document analysis
            </div>
            <Button variant="outline" className="w-full" disabled>
              <Mail className="h-4 w-4 mr-2" />
              View Campaigns (Coming Soon)
            </Button>
          </div>
        </div>
      </div>


      {/* GitHub Issues (if available) */}
      {dailySummary?.developmentTasks?.githubIssues && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Active GitHub Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailySummary.developmentTasks.githubIssues.map((issue: GitHubIssue) => (
                <div key={issue.id} className="p-3 border rounded-lg">
                  <a 
                    href={issue.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {issue.title}
                  </a>
                  <p className="text-sm text-gray-600 mt-1">{issue.repository}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {issue.labels.map(label => (
                      <span key={label} className="px-2 py-1 bg-gray-100 text-xs rounded">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {(dailySummary.developmentTasks.totalActiveIssues ?? 0) > 5 && (
              <p className="text-sm text-gray-600 mt-3">
                Showing 5 of {dailySummary.developmentTasks.totalActiveIssues} active issues
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Daily Summary */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Daily Workflow Intelligence</h2>
        </div>
        <div className="rounded-lg border bg-background p-6">
          <div className="text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Daily intelligence summary will appear here once OAuth is configured</p>
            <p className="text-sm mt-2">Grant Google Workspace permissions to get started</p>
            {dailySummary?.developmentTasks?.githubIssues && (
              <p className="text-sm mt-2 text-blue-600">
                ✓ GitHub integration active - {dailySummary.developmentTasks.githubIssues.length} issues loaded
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}