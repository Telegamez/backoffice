# Implementation Guide: Dual-Mode AI Assistant

### Version: 1.0
### Date: August 14, 2025
### Author: Gemini AI Assistant

---

## 1. Introduction

This document provides a step-by-step implementation plan to build the Dual-Mode AI Assistant as specified in the `TECHNICAL_PRD_Dual_Mode_AI_Assistant.md`. It is based on a thorough review of the existing codebase and is designed to bridge the gap between the current state and the final product vision.

The guide is broken down into sequential milestones, each with specific, actionable tasks. Completing these milestones in order will ensure that foundational components are built first, leading to a robust and scalable final product.

## 2. Current Status Summary

The project is in its early stages. Key foundational pieces are in place, but core functionality is missing.

-   **Implemented:**
    -   Basic NextAuth authentication with Google OAuth.
    -   A `DriveService` for fetching document metadata and content (with some limitations).
    -   An asynchronous job for document analysis using OpenAI.
    -   A UI in `/src/app/apps/mail-assistant` for selecting documents and triggering this analysis.
    -   Redis integration for Bull job queues.

-   **Missing or Incomplete:**
    -   The core database schema for workflows, intent caching, and actions is largely unimplemented.
    -   The primary API endpoints (`/intent`, `/inference`, `/workflow/*`) do not exist.
    -   There is no workflow engine, state machine, or action registry.
    -   The Simple Inference mode is asynchronous and relies on UI polling, not the fast, synchronous API specified in the PRD.
    -   Redis is not used for response caching.
    -   All features from Phase 2 (Email Campaign Workflow) and beyond are unimplemented.

## 3. Implementation Roadmap

This roadmap is designed to build the application logically, starting with the backend foundation and moving toward the user-facing features.

### **Milestone 1: Foundational Backend & API Layer**

**Objective:** Establish the core database schema and create the primary synchronous APIs required for the assistant's dual-mode functionality.

#### **Task 1.1: Complete the Database Schema**

-   **Action:** Modify the Drizzle schema to match the PRD.
-   **File to Modify:** `src/db/db-schema.ts`
-   **Details:**
    1.  **Alter `adminAssistantWorkflows` Table:** Add the following columns:
        -   `workflow_version: text`
        -   `parent_workflow_id: integer`
        -   `approval_status: text`
        -   `approval_details: jsonb`
        -   `execution_context: jsonb`
    2.  **Create New Tables:** Add the definitions for the following new tables as specified in the PRD:
        -   `admin_assistant_intent_cache`
        -   `admin_assistant_workflow_actions`
        -   `admin_assistant_workflow_steps`
        -   `admin_assistant_email_campaigns`
    3.  **Generate & Run Migrations:** After updating the schema, run `npm run db:generate:local` and `npm run db:migrate:local` to apply the changes.

---

#### **Task 1.2: Build the Intent Detection API**

-   **Action:** Create the endpoint that will serve as the main router for all user queries.
-   **File to Create:** `src/app/api/ai-assistant/intent/route.ts`
-   **Details:**
    1.  Implement a `POST` handler that accepts a `query` and `documentContext`.
    2.  Use the OpenAI SDK (`@ai-sdk/openai`) with the `generateObject` function to classify the user's intent based on the `IntentDetectionResult` interface from the PRD.
    3.  The logic should determine whether the query is for `simple` inference or a `workflow`.
    4.  Return the structured intent object. For now, this can be a direct pass-through from the AI model.

---

#### **Task 1.3: Implement the Synchronous Simple Inference API**

-   **Action:** Create a fast, synchronous endpoint for direct Q&A on documents, as required by the PRD.
-   **File to Create:** `src/app/api/ai-assistant/inference/route.ts`
-   **Details:**
    1.  Implement a `POST` handler that accepts a `query` and `documentId`.
    2.  **Refactor Existing Logic:** Adapt the analysis logic from `src/lib/jobs/document-analysis.ts` to run synchronously in the API route.
    3.  Instantiate the `DriveService` to fetch the document content.
    4.  Call the OpenAI API to get the answer.
    5.  Return the `SimpleInferenceResponse` object, including the answer, confidence, and sources.
    6.  This endpoint should be designed for speed and should not use a job queue.

### **Milestone 2: UI Integration & Performance**

**Objective:** Refactor the existing UI to use the new synchronous APIs and implement a proper caching layer to meet performance targets.

#### **Task 2.1: Refactor the Frontend for New APIs**

-   **Action:** Update the Mail Assistant UI to provide a real-time experience.
-   **File to Modify:** `src/app/apps/mail-assistant/page.tsx`
-   **Details:**
    1.  Modify the `handleAnalyzeDocument` function (or create a new one).
    2.  Instead of calling `/api/mail-assistant/analyze`, it should first call the new `/api/ai-assistant/intent` endpoint.
    3.  Based on the response, it should then call the `/api/ai-assistant/inference` endpoint.
    4.  **Remove Polling:** The `pollForResults` function should be removed entirely. The UI should update directly with the response from the `inference` API call.

---

#### **Task 2.2: Implement Redis Caching**

-   **Action:** Introduce a Redis caching layer for the Simple Inference API to improve response times and reduce redundant API calls.
-   **File to Create:** `src/lib/services/redis-cache-service.ts`
-   **Files to Modify:** `src/app/api/ai-assistant/inference/route.ts`
-   **Details:**
    1.  In `redis-cache-service.ts`, create a simple service with `get` and `set` methods for interacting with your Redis instance.
    2.  In the `inference` API route, before fetching document content or calling OpenAI, check the Redis cache for an existing result based on a key generated from the `documentId` and `query`.
    3.  If a cached result exists, return it immediately.
    4.  If not, perform the analysis and then store the result in Redis with a TTL (e.g., 1 hour) before returning the response.

### **Milestone 3: Core Workflow Engine**

**Objective:** Build the foundational components of the workflow engine that will orchestrate multi-step processes.

#### **Task 3.1: Scaffold the Workflow Engine & Action Registry**

-   **Action:** Create the core classes and interfaces for managing workflows.
-   **Files to Create:**
    -   `src/lib/workflow/workflow-manager.ts`
    -   `src/lib/workflow/action-registry.ts`
    -   `src/lib/workflow/actions/base-action.ts` (defining the abstract `WorkflowAction` class)
-   **Details:**
    1.  Define the `WorkflowStatus` enum and core interfaces (`WorkflowStep`, etc.) from the PRD.
    2.  Implement the `WorkflowManager` class with methods to `create`, `start`, and `monitor` workflows.
    3.  Implement the `ActionRegistry` to load and manage different workflow action classes.

---

#### **Task 3.2: Create Workflow API Endpoints**

-   **Action:** Implement the APIs for creating and checking the status of workflows.
-   **Files to Create:**
    -   `src/app/api/ai-assistant/workflow/create/route.ts`
    -   `src/app/api/ai-assistant/workflow/[workflowId]/status/route.ts`
-   **Details:**
    1.  The `create` endpoint should validate the `workflowType` against the `ActionRegistry`, create a new workflow record in the database using the `WorkflowManager`, and add the initial job to the Bull queue.
    2.  The `status` endpoint should query the database for the workflow's current state and return the `WorkflowStatusResponse`.

### **Milestone 4 & Beyond: Email Campaign Implementation**

With the foundational engine in place, the team can begin implementing the specific workflows outlined in the PRD, starting with the Email Campaign.

-   **Task 4.1: Implement Candidate Extraction Action**
-   **Task 4.2: Implement Email Generation Action**
-   **Task 4.3: Develop the Review & Approval System UI and API**
-   **Task 4.4: Implement Campaign Execution & Monitoring**

These tasks will involve creating new `WorkflowAction` classes, developing new UI components, and integrating with the Bull queue system for asynchronous processing.

---

## 4. Conclusion

This guide provides a structured path to realizing the vision of the Dual-Mode AI Assistant. By focusing on building a strong backend foundation first (Milestone 1), then connecting the UI for a seamless simple-mode experience (Milestone 2), the team will be well-positioned to tackle the more complex asynchronous workflows (Milestones 3 and 4) efficiently.
