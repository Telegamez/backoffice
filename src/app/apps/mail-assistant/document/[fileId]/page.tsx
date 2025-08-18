"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Bot, Users, Mail } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function DocumentAnalysisPage() {
  const router = useRouter();
  const params = useParams();
  const fileId = params.fileId as string;

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/apps/mail-assistant')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Document Analysis</h1>
            <p className="text-sm text-muted-foreground mt-1">File ID: {fileId}</p>
          </div>
        </header>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {/* Document Info & Analysis */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Information
              </h2>
            </div>
            <div className="rounded-lg border bg-background p-6">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Document loading and analysis will be implemented in Phase 2</p>
                <p className="text-sm mt-2">Google Drive API integration required</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Analysis Results
              </h2>
            </div>
            <div className="rounded-lg border bg-background p-6">
              <div className="text-center text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>AI analysis results will appear here</p>
                <p className="text-sm mt-2">Powered by GPT-5</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Extracted Contacts
              </h2>
            </div>
            <div className="rounded-lg border bg-background p-4">
              <div className="text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No contacts extracted yet</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3">
              <h2 className="text-lg font-semibold">Quick Actions</h2>
            </div>
            <div className="space-y-3">
              <Button 
                className="w-full" 
                disabled
                onClick={() => router.push(`/apps/mail-assistant/document/${fileId}/compose`)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Create Email Campaign
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <Bot className="h-4 w-4 mr-2" />
                Re-analyze Document
              </Button>
              <Button variant="outline" className="w-full" disabled>
                <FileText className="h-4 w-4 mr-2" />
                Export Analysis
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}