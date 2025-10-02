"use client";

import React, { useState } from 'react';
import ChatHistory, { Message } from './components/ChatHistory';
import ChatInput from './components/ChatInput';
import Workspace, { WorkspaceState } from './components/Workspace';
import { DriveDocument } from './components/DocumentSelector';
import { WorkflowActionType } from '@/lib/workflow/actions/base-action';

const AssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DriveDocument | null>(null);

  const handleDocumentSelect = (document: DriveDocument) => {
    setSelectedDocument(document);
    setWorkspaceState({ type: 'welcome', selectedDocument: document });
    // Add a message to the chat indicating the document has been selected
    const systemMessage: Message = {
      id: `sys-${Date.now()}`,
      sender: 'assistant',
      content: `Selected document: "${document.name}". You can now ask questions about it.`,
    };
    setMessages([systemMessage]);
  };

  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({
    type: 'document_select',
    onDocumentSelect: handleDocumentSelect,
  });

  const handleSendMessage = async (messageContent: string) => {
    if (!selectedDocument) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: messageContent,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setWorkspaceState({ type: 'welcome', selectedDocument });

    try {
      // Step 1: Call the Intent Detection API
      const intentResponse = await fetch('/api/ai-assistant/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: messageContent,
          documentContext: {
            documentId: selectedDocument.id,
            documentType: selectedDocument.mimeType,
          },
        }),
      });

      const intentData = await intentResponse.json();
      if (!intentData.success) throw new Error('Failed to detect intent.');

      // Step 2: Handle the intent
      if (intentData.result.mode === 'simple') {
        const inferenceResponse = await fetch('/api/ai-assistant/inference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: messageContent,
            documentId: selectedDocument.id,
          }),
        });

        const inferenceData = await inferenceResponse.json();
        if (!inferenceData.success) throw new Error(inferenceData.error || 'Inference failed.');

        const assistantMessage: Message = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: inferenceData.result.answer,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        setWorkspaceState({
          type: 'inference_result',
          answer: inferenceData.result.answer,
          sources: inferenceData.result.sources,
        });
      } else {
        // Handle workflow intent
        const inferredAction = intentData.result.inferredAction || 'EMAIL_CAMPAIGN';

        // Map uppercase intent results to enum values
        const workflowTypeMap: Record<string, WorkflowActionType> = {
          EMAIL_CAMPAIGN: WorkflowActionType.EMAIL_CAMPAIGN,
          CREATE_SHEET: WorkflowActionType.CREATE_SHEET,
          CREATE_DOC: WorkflowActionType.CREATE_DOC,
          CREATE_SLIDE: WorkflowActionType.CREATE_SLIDE,
        };

        const workflowType = workflowTypeMap[inferredAction] || WorkflowActionType.EMAIL_CAMPAIGN;

        const workflowMessages: Record<string, string> = {
          [WorkflowActionType.EMAIL_CAMPAIGN]: "I've identified this as an email campaign request. Preparing emails for your review...",
          [WorkflowActionType.CREATE_SHEET]: "I'll create a Google Sheet with this data. Preparing the spreadsheet for your review...",
          [WorkflowActionType.CREATE_DOC]: "I'll create a Google Doc with this content. Preparing the document for your review...",
        };

        const assistantMessage: Message = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: workflowMessages[workflowType] || "Processing your workflow request...",
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Create the workflow with conversation context
        const createResponse = await fetch('/api/ai-assistant/workflow/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowType,
            sourceDocumentId: selectedDocument.id,
            configuration: {
              conversationContext: messages.map(m => m.content).join('\n'),
              userRequest: messageContent,
            },
          }),
        });
        const createData = await createResponse.json();
        if (!createData.success) throw new Error('Failed to create workflow.');

        // Fetch the preview data based on workflow type
        const previewEndpoints: Record<WorkflowActionType, string> = {
          [WorkflowActionType.EMAIL_CAMPAIGN]: `/api/ai-assistant/workflow/email-campaign/${createData.workflowId}/preview`,
          [WorkflowActionType.CREATE_SHEET]: `/api/ai-assistant/workflow/drive-sheet/${createData.workflowId}/preview`,
          [WorkflowActionType.CREATE_DOC]: `/api/ai-assistant/workflow/drive-doc/${createData.workflowId}/preview`,
          [WorkflowActionType.CREATE_SLIDE]: `/api/ai-assistant/workflow/drive-slide/${createData.workflowId}/preview`,
          [WorkflowActionType.CANDIDATE_EXTRACTION]: '',
          [WorkflowActionType.EMAIL_GENERATION]: '',
          [WorkflowActionType.EMAIL_SEND]: '',
          [WorkflowActionType.DOCUMENT_SUMMARY]: '',
          [WorkflowActionType.BULK_PERSONALIZATION]: '',
        };

        const previewUrl = previewEndpoints[workflowType];
        if (!previewUrl) throw new Error(`Unknown workflow type: ${workflowType}`);

        const previewResponse = await fetch(previewUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationContext: messages.map(m => m.content).join('\n'),
            userRequest: messageContent,
          }),
        });
        const previewData = await previewResponse.json();
        if (!previewData.success) throw new Error('Failed to fetch workflow preview.');

        // Update the workspace based on workflow type
        if (workflowType === WorkflowActionType.EMAIL_CAMPAIGN) {
          setWorkspaceState({
            type: 'workflow_review',
            workflowId: createData.workflowId,
            drafts: previewData.preview.sampleEmails,
          });
        } else if (workflowType === WorkflowActionType.CREATE_SHEET) {
          setWorkspaceState({
            type: 'artifact_preview',
            workflowId: createData.workflowId,
            artifactType: 'sheet',
            preview: previewData.preview,
          });
        } else if (workflowType === WorkflowActionType.CREATE_DOC) {
          setWorkspaceState({
            type: 'artifact_preview',
            workflowId: createData.workflowId,
            artifactType: 'doc',
            preview: previewData.preview,
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      const assistantMessage: Message = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        content: `Error: ${errorMessage}`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeDocument = () => {
    setSelectedDocument(null);
    setMessages([]);
    setWorkspaceState({ type: 'document_select', onDocumentSelect: handleDocumentSelect });
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Left Panel: Dialogue */}
      <div className="w-1/2 border-r border-border flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 p-4 pb-2 flex items-center justify-between">
          <h1 className="text-xl font-bold">Dialogue</h1>
          {selectedDocument && (
            <button
              onClick={handleChangeDocument}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Change Document
            </button>
          )}
        </div>

        {/* Chat History - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 min-h-0">
          <ChatHistory messages={messages} />
        </div>

        {/* Chat Input - Pinned to Bottom */}
        <div className="flex-shrink-0 p-4 pt-2 border-t border-border bg-background">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading || !selectedDocument} // Disable input until doc is selected
          />
        </div>
      </div>

      {/* Right Panel: Workspace */}
      <div className="w-1/2 flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 p-4 pb-2">
          <h1 className="text-xl font-bold">Workspace</h1>
        </div>

        {/* Workspace Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 min-h-0">
          <Workspace state={workspaceState} />
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
