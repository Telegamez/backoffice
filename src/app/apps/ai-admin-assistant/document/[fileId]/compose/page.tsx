"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Users, Send, Edit, Eye } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmailCampaignComposePage() {
  const router = useRouter();
  const params = useParams();
  const fileId = params.fileId as string;
  const [activeTab, setActiveTab] = useState('recipients');

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/apps/ai-admin-assistant/document/${fileId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Analysis
        </Button>
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Create Email Campaign</h1>
            <p className="text-sm text-muted-foreground mt-1">Document: {fileId}</p>
          </div>
        </header>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {/* Main Campaign Builder */}
        <div className="md:col-span-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Campaign Builder
              </h2>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recipients">Recipients</TabsTrigger>
                <TabsTrigger value="compose">Compose</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recipients" className="mt-4">
                <div className="rounded-lg border bg-background p-6">
                  <div className="text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Recipient management will be implemented in Phase 3</p>
                    <p className="text-sm mt-2">Import from document analysis or manual entry</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="compose" className="mt-4">
                <div className="rounded-lg border bg-background p-6">
                  <div className="text-center text-muted-foreground">
                    <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>AI email generation will be implemented in Phase 3</p>
                    <p className="text-sm mt-2">Powered by GPT-5 with document context</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4">
                <div className="rounded-lg border bg-background p-6">
                  <div className="text-center text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Email previews will appear here</p>
                    <p className="text-sm mt-2">Review and edit before sending</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Campaign Settings Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3">
              <h2 className="text-lg font-semibold">Campaign Settings</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Campaign Name</label>
                <input 
                  type="text" 
                  placeholder="Untitled Campaign"
                  className="w-full px-3 py-2 rounded border bg-background text-sm"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject Template</label>
                <input 
                  type="text" 
                  placeholder="AI-generated subject"
                  className="w-full px-3 py-2 rounded border bg-background text-sm"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3">
              <h2 className="text-lg font-semibold">Campaign Actions</h2>
            </div>
            <div className="space-y-3">
              <Button className="w-full" disabled>
                <Send className="h-4 w-4 mr-2" />
                Send Campaign
              </Button>
              <Button variant="outline" className="w-full" disabled>
                Save Draft
              </Button>
              <Button variant="outline" className="w-full" disabled>
                Schedule Send
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3">
              <h2 className="text-lg font-semibold">Progress</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Recipients</span>
                  <span className="text-muted-foreground">0/0</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full w-0"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Emails Generated</span>
                  <span className="text-muted-foreground">0/0</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full w-0"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}