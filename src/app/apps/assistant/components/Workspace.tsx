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
  selectedDocument?: DriveDocument;
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

interface ArtifactPreviewState {
  type: 'artifact_preview';
  workflowId: number;
  artifactType: 'sheet' | 'doc';
  preview: {
    title: string;
    data?: string[][];
    content?: string;
  };
}

export type WorkspaceState = WelcomeState | DocumentSelectState | InferenceState | WorkflowReviewState | ArtifactPreviewState;

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
        <div className="h-full flex flex-col">
          {state.selectedDocument && (
            <div className="mb-4 p-4 border rounded-md bg-muted/30">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {state.selectedDocument.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {state.selectedDocument.mimeType}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 flex flex-col justify-center items-center text-center text-muted-foreground">
            {state.selectedDocument ? (
              <>
                <Bot className="h-16 w-16 mb-4 opacity-50" />
                <h2 className="text-lg font-semibold">Ready to Assist</h2>
                <p className="text-sm mt-2 max-w-md">
                  Ask questions about the document or request actions like sending emails
                </p>
              </>
            ) : (
              <>
                <Bot className="h-16 w-16 mb-4 opacity-50" />
                <h2 className="text-lg font-semibold">AI Assistant Workspace</h2>
                <p>Please select a document to begin.</p>
              </>
            )}
          </div>
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

      {state.type === 'artifact_preview' && (
        <ArtifactPreview state={state} />
      )}
    </div>
  );
};

// Artifact Preview Component
const ArtifactPreview: React.FC<{ state: ArtifactPreviewState }> = ({ state }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState<'pending' | 'created' | 'failed'>('pending');
  const [artifactLink, setArtifactLink] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState(state.preview.title);
  const [editedContent, setEditedContent] = useState(state.preview.content || '');

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/ai-assistant/workflow/${state.workflowId}/execute-artifact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType: state.artifactType,
          title: editedTitle,
          data: state.preview.data,
          content: editedContent,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCreationStatus('created');
        setArtifactLink(result.webViewLink);
      } else {
        setCreationStatus('failed');
      }
    } catch (error) {
      console.error('Failed to create artifact:', error);
      setCreationStatus('failed');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5" />
        {state.artifactType === 'sheet' ? 'Google Sheet Preview' : 'Google Doc Preview'}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Title</label>
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="Document title"
          />
        </div>

        {state.artifactType === 'sheet' && state.preview.data && (
          <div className="border rounded-md overflow-auto">
            <table className="w-full text-sm">
              <tbody>
                {state.preview.data.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex === 0 ? 'bg-muted font-medium' : ''}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border p-2">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {state.artifactType === 'doc' && (
          <div>
            <label className="text-sm font-medium mb-1 block">Content</label>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
          </div>
        )}
      </div>

      <div className="pt-4 border-t">
        {creationStatus === 'pending' ? (
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={isCreating}>
              <Check className="h-4 w-4 mr-2" /> Create {state.artifactType === 'sheet' ? 'Sheet' : 'Doc'}
            </Button>
          </div>
        ) : creationStatus === 'created' ? (
          <div className="space-y-2">
            <p className="font-semibold text-green-600">
              {state.artifactType === 'sheet' ? 'Sheet' : 'Document'} created successfully!
            </p>
            {artifactLink && (
              <a
                href={artifactLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm inline-block"
              >
                Open in Google Drive →
              </a>
            )}
          </div>
        ) : (
          <p className="font-semibold text-red-600">
            Failed to create {state.artifactType === 'sheet' ? 'sheet' : 'document'}.
          </p>
        )}
      </div>
    </div>
  );
};

export default Workspace;
