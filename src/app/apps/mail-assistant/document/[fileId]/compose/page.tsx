"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, /* Users, */ Send, /* Edit, */ Eye, Check, X } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Mock data for the UI
const mockCandidates = [
  { name: 'John Doe', email: 'john.doe@example.com', role: 'Senior Developer' },
  { name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Product Manager' },
];

const mockInitialEmails = [
  { recipient: 'john.doe@example.com', subject: 'Opportunity at Our Company', content: 'Dear John, based on your experience...' },
  { recipient: 'jane.smith@example.com', subject: 'Following Up', content: 'Hi Jane, your profile is impressive...' },
];

export default function EmailCampaignComposePage() {
  const router = useRouter();
  const params = useParams();
  const fileId = params.fileId as string;
  const [activeTab, setActiveTab] = useState('recipients');
  const [isApproving, setIsApproving] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [emailDrafts, setEmailDrafts] = useState(mockInitialEmails);

  // Placeholder workflowId for the approval API call
  const workflowId = 123;

  const handleDraftEdit = (index: number, field: 'subject' | 'content', value: string) => {
    const newDrafts = [...emailDrafts];
    newDrafts[index][field] = value;
    setEmailDrafts(newDrafts);
  };

  const handleApproval = async (approved: boolean) => {
    setIsApproving(true);
    try {
      const response = await fetch(`/api/ai-assistant/workflow/${workflowId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved,
          // Send the final, edited drafts as modifications
          modifications: {
            finalDrafts: emailDrafts,
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setApprovalStatus(data.newStatus);
      } else {
        // Handle error display
      }
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/apps/mail-assistant/document/${fileId}`)}
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
                Campaign Review
              </h2>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recipients">Recipients ({mockCandidates.length})</TabsTrigger>
                <TabsTrigger value="compose">Email Drafts ({emailDrafts.length})</TabsTrigger>
                <TabsTrigger value="preview">Live Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="recipients" className="mt-4">
                <div className="rounded-lg border bg-background p-4 space-y-3">
                  {mockCandidates.map(c => (
                    <div key={c.email} className="p-2 border rounded">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-sm text-muted-foreground">{c.email}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="compose" className="mt-4">
                <div className="rounded-lg border bg-background p-4 space-y-4">
                  {emailDrafts.map((draft, index) => (
                    <div key={draft.recipient} className="p-3 border rounded space-y-2">
                      <Input
                        value={draft.subject}
                        onChange={(e) => handleDraftEdit(index, 'subject', e.target.value)}
                        className="font-semibold"
                      />
                      <Textarea
                        value={draft.content}
                        onChange={(e) => handleDraftEdit(index, 'content', e.target.value)}
                        className="text-sm text-muted-foreground"
                        rows={4}
                      />
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4">
                <div className="rounded-lg border bg-background p-6">
                  <div className="text-center text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Live email previews will be implemented later.</p>
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

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3">
              <h2 className="text-lg font-semibold">Approval Actions</h2>
            </div>
            {approvalStatus === 'pending' ? (
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  onClick={() => handleApproval(true)}
                  disabled={isApproving}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve & Send
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => handleApproval(false)}
                  disabled={isApproving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Campaign
                </Button>
              </div>
            ) : (
              <div className={`p-2 rounded text-center font-semibold ${approvalStatus === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {approvalStatus === 'approved' ? 'Campaign Approved' : 'Campaign Rejected'}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}