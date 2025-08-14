"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FileText, Mail, Calendar, Bot, Loader2 } from 'lucide-react';
import { clientGitHubIntegration, type DailySummary, type GitHubIssue } from './lib/client-integration';
import DocumentPicker from './components/DocumentPicker';
import AIAnalysisPanel from './components/AIAnalysisPanel';

interface DriveDocument {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  modifiedTime?: string;
  webViewLink?: string;
}

interface AnalysisResult {
  status: 'pending' | 'processing' | 'completed' | 'error';
  summary?: string;
  keyPoints?: string[];
  contacts?: Array<{ name: string; email: string; role?: string }>;
  tasks?: string[];
  confidence?: number;
  jobId?: string;
}

export default function AIAdminAssistantDashboard() {
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DriveDocument | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadUserAndSummary();
  }, []);

  const loadUserAndSummary = async () => {
    try {
      const mockUserEmail = "user@telegamez.com";
      const baseSummary: DailySummary = {
        date: new Date().toISOString().split('T')[0],
        documentsAnalyzed: 0,
        emailsGenerated: 0,
        timeSaved: 0
      };

      const enhancedSummary = await clientGitHubIntegration.enhanceDailySummaryWithGitHub(
        baseSummary,
        mockUserEmail
      );

      setDailySummary(enhancedSummary);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const handleDocumentSelect = (document: DriveDocument) => {
    setSelectedDocument(document);
    setAnalysisResult(null);
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedDocument) return;

    setIsAnalyzing(true);
    setAnalysisResult({ status: 'processing' });

    try {
      const response = await fetch('/api/ai-admin-assistant/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          documentType: selectedDocument.mimeType,
          documentName: selectedDocument.name,
          analysisTypes: ['summary', 'key_points', 'contacts', 'tasks'],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult({
          status: 'processing',
          jobId: data.jobId,
        });

        // Poll for results (in a real app, you'd use WebSockets or Server-Sent Events)
        pollForResults(data.jobId);
      } else {
        setAnalysisResult({
          status: 'error',
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisResult({
        status: 'error',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pollForResults = (jobId: string) => {
    // Simulate polling for job completion
    // In a real implementation, you'd poll the job status endpoint
    const pollInterval = setInterval(() => {
      // For demo purposes, simulate completion after 3 seconds
      setTimeout(() => {
        setAnalysisResult({
          status: 'completed',
          summary: `Analysis complete for "${selectedDocument?.name}". This document contains project information and stakeholder communications.`,
          keyPoints: [
            'Project timeline spans Q3-Q4 2024',
            'Budget allocation of $150K approved',
            'Three key stakeholders identified',
            'Weekly reporting cadence established'
          ],
          contacts: [
            { name: 'John Smith', email: 'john.smith@company.com', role: 'Project Manager' },
            { name: 'Sarah Johnson', email: 'sarah.j@company.com', role: 'Stakeholder' }
          ],
          tasks: [
            'Schedule kickoff meeting',
            'Prepare project charter',
            'Set up weekly status reports',
            'Coordinate with development team'
          ],
          confidence: 89,
          jobId,
        });
        clearInterval(pollInterval);
      }, 3000);
    }, 1000);
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

      {/* Document Selection and Analysis */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <DocumentPicker 
          onDocumentSelect={handleDocumentSelect}
          selectedDocumentId={selectedDocument?.id}
        />
        <div className="space-y-4">
          <AIAnalysisPanel analysis={analysisResult || undefined} />
          {selectedDocument && (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Selected Document</h3>
                <Button
                  onClick={handleAnalyzeDocument}
                  disabled={isAnalyzing || analysisResult?.status === 'processing'}
                  className="w-auto"
                >
                  {isAnalyzing || analysisResult?.status === 'processing' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {selectedDocument.mimeType.includes('document') && '📄'}
                  {selectedDocument.mimeType.includes('spreadsheet') && '📊'}
                  {selectedDocument.mimeType.includes('pdf') && '📕'}
                </span>
                <div>
                  <h4 className="font-medium">{selectedDocument.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedDocument.mimeType}
                  </p>
                </div>
              </div>
            </div>
          )}
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