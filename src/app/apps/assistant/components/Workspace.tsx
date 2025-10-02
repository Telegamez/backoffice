"use client";

import React, { useState } from 'react';
import { Bot, FileText, Mail, Check, X } from 'lucide-react';
import DocumentSelector, { DriveDocument } from './DocumentSelector';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// Define the types of content the Workspace can display
interface WelcomeState {
  type: 'welcome';
}

interface DocumentSelectState {
  type: 'document_select';
  onDocumentSelect: (document: DriveDocument) => void;
}

interface InferenceState {
  type: 'inference_result';
  answer: string;
  sources: Array<{ documentId: string; excerpt: string }>;
}

interface WorkflowReviewState {
  type: 'workflow_review';
  workflowId: number;
  drafts: Array<{ recipientEmail: string; subject: string; content: string }>;
}

export type WorkspaceState = WelcomeState | DocumentSelectState | InferenceState | WorkflowReviewState;

interface WorkspaceProps {
  state: WorkspaceState;
}

const Workspace: React.FC<WorkspaceProps> = ({ state }) => {
  const [drafts, setDrafts] = useState(state.type === 'workflow_review' ? state.drafts : []);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const handleDraftEdit = (index: number, field: 'subject' | 'content', value: string) => {
    const newDrafts = [...drafts];
    newDrafts[index][field] = value;
    setDrafts(newDrafts);
  };

  const handleApproval = async (approved: boolean) => {
    if (state.type !== 'workflow_review') return;
    setIsApproving(true);
    try {
      await fetch(`/api/ai-assistant/workflow/${state.workflowId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, modifications: { finalDrafts: drafts } }),
      });
      setApprovalStatus(approved ? 'approved' : 'rejected');
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="flex-grow border rounded-md p-4 overflow-y-auto">
      {state.type === 'welcome' && (
        <div className="text-center text-muted-foreground h-full flex flex-col justify-center items-center">
          <Bot className="h-16 w-16 mb-4 opacity-50" />
          <h2 className="text-lg font-semibold">AI Assistant Workspace</h2>
          <p>Please select a document to begin.</p>
        </div>
      )}

      {state.type === 'document_select' && (
        <DocumentSelector onDocumentSelect={state.onDocumentSelect} />
      )}

      {state.type === 'inference_result' && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> Inference Result</h3>
          <div>
            <h4 className="font-semibold mb-2">Answer</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{state.answer}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Source</h4>
            <div className="text-xs text-muted-foreground p-2 border rounded-md bg-muted">
              &quot;{state.sources[0].excerpt}&quot;
            </div>
          </div>
        </div>
      )}

      {state.type === 'workflow_review' && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Mail className="h-5 w-5" /> Review Email Campaign</h3>
          <p className="text-sm text-muted-foreground">Please review and edit the drafts below before approving.</p>
          
          <div className="space-y-4">
            {drafts.map((draft, index) => (
              <div key={index} className="p-3 border rounded space-y-2">
                <p className="text-sm font-medium">To: {draft.recipientEmail}</p>
                <Input
                  value={draft.subject}
                  onChange={(e) => handleDraftEdit(index, 'subject', e.target.value)}
                />
                <Textarea
                  value={draft.content}
                  onChange={(e) => handleDraftEdit(index, 'content', e.target.value)}
                  rows={5}
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            {approvalStatus === 'pending' ? (
              <div className="flex gap-2">
                <Button onClick={() => handleApproval(true)} disabled={isApproving}>
                  <Check className="h-4 w-4 mr-2" /> Approve & Send
                </Button>
                <Button variant="outline" onClick={() => handleApproval(false)} disabled={isApproving}>
                  <X className="h-4 w-4 mr-2" /> Reject
                </Button>
              </div>
            ) : (
              <p className={`font-semibold ${approvalStatus === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                Campaign {approvalStatus}.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspace;
