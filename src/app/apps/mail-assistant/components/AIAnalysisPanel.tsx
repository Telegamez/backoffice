"use client";

import React from 'react';
import { Bot, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AnalysisResult {
  status: 'pending' | 'processing' | 'completed' | 'error';
  answer?: string;
  confidence?: number;
  sources?: Array<{ documentId: string; excerpt: string; }>;
}

interface AIAnalysisPanelProps {
  analysis?: AnalysisResult;
}

export default function AIAnalysisPanel({ analysis }: AIAnalysisPanelProps) {
  const getStatusIcon = () => {
    switch (analysis?.status) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bot className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (analysis?.status) {
      case 'processing':
        return 'Getting answer from AI...';
      case 'completed':
        return `Answer received (${analysis.confidence}% confidence)`;
      case 'error':
        return 'Failed to get answer';
      default:
        return 'Ready to answer your question';
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {getStatusIcon()}
          AI Answer
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{getStatusText()}</p>
      
      <div className="rounded-lg border bg-background">
        {!analysis || analysis.status === 'pending' ? (
          <div className="p-6 text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>The answer to your question will appear here.</p>
          </div>
        ) : analysis.status === 'processing' ? (
          <div className="p-6 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
            <p>Finding the answer in the document...</p>
          </div>
        ) : analysis.status === 'completed' ? (
          <div className="p-4 space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Answer</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.answer}</p>
            </div>
            {analysis.sources && analysis.sources.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Source</h4>
                <div className="text-xs text-muted-foreground p-2 border rounded-md bg-muted">
                  "{analysis.sources[0].excerpt}"
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Could not get an answer.</p>
            <p className="text-sm mt-2">{analysis.answer || 'An unknown error occurred.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}