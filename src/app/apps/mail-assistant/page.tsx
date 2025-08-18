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
  answer?: string;
  confidence?: number;
  sources?: Array<{ documentId: string; excerpt: string; }>;
}

export default function MailAssistantDashboard() {
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DriveDocument | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [inferenceText, setInferenceText] = useState('');

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
    setInferenceText('');
  };

  const handleAnalyzeDocument = async () => {
    if (!selectedDocument) return;

    setIsAnalyzing(true);
    setAnalysisResult({ status: 'processing' });

    try {
      // Step 1: Call the new Intent Detection API
      const intentResponse = await fetch('/api/ai-assistant/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: inferenceText,
          documentContext: {
            documentId: selectedDocument.id,
            documentType: selectedDocument.mimeType,
            contentPreview: '', // Preview can be omitted for now
          },
        }),
      });

      const intentData = await intentResponse.json();

      if (!intentData.success) {
        throw new Error('Failed to detect intent');
      }

      // Step 2: Based on intent, call the appropriate API
      if (intentData.result.mode === 'simple') {
        const inferenceResponse = await fetch('/api/ai-assistant/inference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: inferenceText,
            documentId: selectedDocument.id,
          }),
        });

        const inferenceData = await inferenceResponse.json();

        if (inferenceData.success) {
          setAnalysisResult({
            status: 'completed',
            answer: inferenceData.result.answer,
            confidence: inferenceData.result.confidence,
            sources: inferenceData.result.sources,
          });
        } else {
          throw new Error(inferenceData.error || 'Inference API failed');
        }
      } else {
        // Placeholder for workflow logic
        setAnalysisResult({
          status: 'error',
          answer: 'Workflow mode is not yet implemented.',
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisResult({
        status: 'error',
        answer: error instanceof Error ? error.message : 'An unknown error occurred.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mail Assistant</h1>
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      Ask
                    </>
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-3 mb-4">
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
              <div className="space-y-2">
                <label htmlFor="inference-text" className="text-sm font-medium">
                  Your Question
                </label>
                <textarea
                  id="inference-text"
                  placeholder="Ask a question about this document..."
                  value={inferenceText}
                  onChange={(e) => setInferenceText(e.target.value)}
                  rows={3}
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </div>
          )}
          <AIAnalysisPanel analysis={analysisResult || undefined} />
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

    </div>
  );
}