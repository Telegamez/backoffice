"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Mail, Calendar, Bot } from 'lucide-react';

export default function AIAdminAssistantDashboard() {
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
            Connect Google Workspace
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
          </div>
        </div>
      </div>
    </div>
  );
}