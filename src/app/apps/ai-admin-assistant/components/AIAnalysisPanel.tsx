"use client";

import React from 'react';
import { Bot, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AnalysisResult {
  status: 'pending' | 'processing' | 'completed' | 'error';
  summary?: string;
  keyPoints?: string[];
  contacts?: Array<{ name: string; email: string; role?: string }>;
  tasks?: string[];
  confidence?: number;
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
        return 'Analyzing document with GPT-5...';
      case 'completed':
        return `Analysis complete (${analysis.confidence}% confidence)`;
      case 'error':
        return 'Analysis failed - please try again';
      default:
        return 'Ready to analyze';
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {getStatusIcon()}
          AI Document Analysis
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{getStatusText()}</p>
      
      <div className="rounded-lg border bg-background">
        {!analysis || analysis.status === 'pending' ? (
          <div className="p-6 text-center text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>AI analysis will be implemented in Phase 2</p>
            <p className="text-sm mt-2">GPT-5 integration with document content extraction</p>
          </div>
        ) : analysis.status === 'processing' ? (
          <div className="p-6 text-center">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
            <p>Processing document...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take 5-15 seconds</p>
          </div>
        ) : analysis.status === 'completed' ? (
          <div className="p-4 space-y-6">
            {analysis.summary && (
              <div>
                <h4 className="font-semibold mb-2">Document Summary</h4>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
              </div>
            )}
            
            {analysis.keyPoints && analysis.keyPoints.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Points</h4>
                <ul className="space-y-1">
                  {analysis.keyPoints.map((point, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0"></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {analysis.contacts && analysis.contacts.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Extracted Contacts</h4>
                <div className="space-y-2">
                  {analysis.contacts.map((contact, index) => (
                    <div key={index} className="text-sm rounded-lg border p-2">
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-muted-foreground">{contact.email}</div>
                      {contact.role && <div className="text-muted-foreground text-xs">{contact.role}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {analysis.tasks && analysis.tasks.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Action Items</h4>
                <ul className="space-y-1">
                  {analysis.tasks.map((task, index) => (
                    <li key={index} className="text-sm flex items-start gap-2">
                      <span className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-red-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p>Analysis failed</p>
            <p className="text-sm mt-2">Please try again or check your document permissions</p>
          </div>
        )}
      </div>
    </div>
  );
}