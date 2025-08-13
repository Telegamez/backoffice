"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, FolderOpen, Bot } from 'lucide-react';

export default function DocumentPicker() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Select Document from Google Drive
        </h2>
      </div>
      <div className="rounded-lg border bg-background p-6">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="mb-4">Google Drive integration will be available in Phase 2</p>
          <p className="text-sm mb-6">
            Connect your Google Workspace to browse and analyze documents
          </p>
          <Button disabled className="mb-2">
            <Bot className="h-4 w-4 mr-2" />
            Connect Google Drive
          </Button>
          <p className="text-xs text-muted-foreground">
            Requires OAuth configuration with Drive API access
          </p>
        </div>
      </div>
    </div>
  );
}