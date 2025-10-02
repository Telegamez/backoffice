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
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({
    type: 'document_select',
    onDocumentSelect: (doc) => handleDocumentSelect(doc),
  });
  const [selectedDocument, setSelectedDocument] = useState<DriveDocument | null>(null);

  const handleDocumentSelect = (document: DriveDocument) => {
    setSelectedDocument(document);
    setWorkspaceState({ type: 'welcome' });
    // Add a message to the chat indicating the document has been selected
    const systemMessage: Message = {
      id: `sys-${Date.now()}`,
      sender: 'assistant',
      content: `Selected document: "${document.name}". You can now ask questions about it.`,
    };
    setMessages([systemMessage]);
  };

  const handleSendMessage = async (messageContent: string) => {
    if (!selectedDocument) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: messageContent,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setWorkspaceState({ type: 'welcome' });

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
        const assistantMessage: Message = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: "I've identified this as a workflow request. I will now prepare the email campaign for your review in the workspace.",
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Create the workflow
        const createResponse = await fetch('/api/ai-assistant/workflow/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflowType: WorkflowActionType.EMAIL_CAMPAIGN, // Assuming this is the detected type
            sourceDocumentId: selectedDocument.id,
            configuration: {}, // Add config from intent if available
          }),
        });
        const createData = await createResponse.json();
        if (!createData.success) throw new Error('Failed to create workflow.');

        // Fetch the preview data
        const previewResponse = await fetch(`/api/ai-assistant/workflow/email-campaign/${createData.workflowId}/preview`);
        const previewData = await previewResponse.json();
        if (!previewData.success) throw new Error('Failed to fetch workflow preview.');

        // Update the workspace to show the review UI
        setWorkspaceState({
          type: 'workflow_review',
          workflowId: createData.workflowId,
          drafts: previewData.preview.sampleEmails,
        });
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

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Left Panel: Dialogue */}
      <div className="w-1/2 border-r border-border p-4 flex flex-col h-full">
        <h1 className="text-xl font-bold mb-4 flex-shrink-0">Dialogue</h1>
        <div className="flex-grow overflow-hidden">
          <ChatHistory messages={messages} />
        </div>
        <div className="mt-4 flex-shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading || !selectedDocument} // Disable input until doc is selected
          />
        </div>
      </div>

      {/* Right Panel: Workspace */}
      <div className="w-1/2 p-4 flex flex-col h-full">
        <h1 className="text-xl font-bold mb-4 flex-shrink-0">Workspace</h1>
        <div className="flex-grow overflow-hidden">
          <Workspace state={workspaceState} />
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
