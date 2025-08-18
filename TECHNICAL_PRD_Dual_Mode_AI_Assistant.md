# Technical Product Requirements Document (PRD)
## Dual-Mode AI Assistant System

### Version: 1.0
### Date: January 2025
### Document Type: Technical PRD

---

## Executive Summary

### Product Vision
A comprehensive AI-powered assistant system that seamlessly supports both **Simple Inference Mode** for direct Q&A on Google Drive documents and **Action Workflow Mode** for complex multi-step operations like candidate extraction and personalized email campaigns.

### Business Objectives
- **Operational Efficiency**: Reduce manual document analysis and email campaign creation time by 80%
- **User Experience**: Provide intuitive dual-mode interaction supporting both quick queries and complex workflows
- **Scalability**: Build extensible architecture supporting future workflow types beyond email campaigns
- **Integration**: Leverage existing Bull Queue/Redis infrastructure and Google Drive API integration

### Key Success Metrics
- **Response Time**: < 30 seconds for simple inference, < 5 minutes for complex workflows
- **Accuracy**: 90%+ confidence score for document analysis and contact extraction
- **Adoption**: 80% of users utilize both modes within 30 days
- **Extensibility**: Support for 3+ additional workflow types within 6 months

---

## Technical Architecture

### High-Level System Design

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Next.js UI Components]
        Chat[Chat Interface]
        WorkflowUI[Workflow Dashboard]
    end
    
    subgraph "API Layer"
        Router[Intent Detection Router]
        SimpleAPI[Simple Inference API]
        WorkflowAPI[Workflow Engine API]
        AuthAPI[Authentication API]
    end
    
    subgraph "AI Processing Layer"
        OpenAI[OpenAI GPT-5/GPT-4]
        IntentEngine[Intent Classification]
        DocumentProcessor[Document Analysis]
        EmailGenerator[Email Generation]
    end
    
    subgraph "Workflow Engine"
        WorkflowManager[Workflow Manager]
        ActionRegistry[Action Registry]
        ValidationEngine[Validation Engine]
        ApprovalSystem[Review/Approval System]
    end
    
    subgraph "Queue System"
        BullQueue[Bull Queue Manager]
        DocQueue[Document Analysis Queue]
        EmailQueue[Email Generation Queue]
        WorkflowQueue[Workflow Execution Queue]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL Database)]
        Redis[(Redis Cache/Queue)]
        DriveAPI[Google Drive API]
        GmailAPI[Gmail API]
    end
    
    subgraph "External Services"
        GoogleDrive[Google Drive Documents]
        GoogleAuth[Google OAuth]
        EmailServices[Email Delivery Services]
    end

    UI --> Router
    Chat --> SimpleAPI
    WorkflowUI --> WorkflowAPI
    
    Router --> IntentEngine
    Router --> SimpleAPI
    Router --> WorkflowAPI
    
    SimpleAPI --> OpenAI
    SimpleAPI --> DocumentProcessor
    
    WorkflowAPI --> WorkflowManager
    WorkflowManager --> ActionRegistry
    WorkflowManager --> BullQueue
    
    BullQueue --> DocQueue
    BullQueue --> EmailQueue
    BullQueue --> WorkflowQueue
    
    DocumentProcessor --> DriveAPI
    EmailGenerator --> GmailAPI
    
    DocQueue --> PostgreSQL
    EmailQueue --> Redis
    WorkflowQueue --> PostgreSQL
    
    DriveAPI --> GoogleDrive
    GmailAPI --> EmailServices
    AuthAPI --> GoogleAuth
```

### Core Components Architecture

#### 1. Intent Detection System
**Technology**: OpenAI Function Calling + Custom Classification Logic

```typescript
interface IntentDetectionResult {
  mode: 'simple' | 'workflow';
  confidence: number;
  inferredAction?: WorkflowActionType;
  parameters: Record<string, unknown>;
  requiresClarification: boolean;
}

enum WorkflowActionType {
  CANDIDATE_EXTRACTION = 'candidate_extraction',
  EMAIL_CAMPAIGN = 'email_campaign',
  DOCUMENT_SUMMARY = 'document_summary',
  BULK_PERSONALIZATION = 'bulk_personalization',
  // Extensible for future actions
}
```

#### 2. Hybrid Processing Engine
**Simple Mode**: Direct OpenAI inference with document context
**Workflow Mode**: Multi-step orchestration via Bull Queue system

#### 3. Extensible Action Registry
**Pattern**: Plugin-based architecture for workflow actions
**Interface**: Standardized action contract for easy extension

### Technology Stack Integration

#### Current Infrastructure Utilization
- **Queue System**: Existing Bull Queue with Redis backend
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth with Google OAuth
- **API Framework**: Next.js App Router
- **AI Integration**: OpenAI SDK with GPT-5/GPT-4 fallback

#### New Components Required
- **Intent Classification Engine**: OpenAI function calling wrapper
- **Workflow Engine**: State machine for multi-step actions
- **Action Registry**: Plugin system for extensible workflows
- **Review/Approval System**: Human-in-the-loop validation

---

## API Specifications

### 1. Intent Detection Endpoint

```typescript
// POST /api/ai-assistant/intent
interface IntentDetectionRequest {
  query: string;
  documentContext?: {
    documentId: string;
    documentType: string;
    contentPreview?: string;
  };
  userContext: {
    email: string;
    preferences?: UserPreferences;
  };
}

interface IntentDetectionResponse {
  success: boolean;
  result: IntentDetectionResult;
  suggestedClarifications?: string[];
  estimatedProcessingTime?: number;
}
```

### 2. Simple Inference Endpoint

```typescript
// POST /api/ai-assistant/inference
interface SimpleInferenceRequest {
  query: string;
  documentId: string;
  contextScope: 'document' | 'section' | 'page';
  responseFormat: 'text' | 'structured' | 'json';
}

interface SimpleInferenceResponse {
  success: boolean;
  result: {
    answer: string;
    confidence: number;
    sources: Array<{
      documentId: string;
      pageNumber?: number;
      excerpt: string;
    }>;
    relatedQuestions?: string[];
  };
  processingTimeMs: number;
}
```

### 3. Workflow Engine Endpoints

```typescript
// POST /api/ai-assistant/workflow/create
interface WorkflowCreateRequest {
  workflowType: WorkflowActionType;
  sourceDocumentId: string;
  configuration: WorkflowConfiguration;
  reviewRequired: boolean;
}

interface WorkflowCreateResponse {
  success: boolean;
  workflowId: string;
  estimatedCompletionTime: string;
  jobIds: string[];
}

// GET /api/ai-assistant/workflow/{workflowId}/status
interface WorkflowStatusResponse {
  success: boolean;
  workflow: {
    id: string;
    status: WorkflowStatus;
    progress: number;
    currentStep: string;
    completedSteps: string[];
    results?: WorkflowResults;
    requiresApproval?: boolean;
    approvalDetails?: ApprovalRequest;
  };
}

// POST /api/ai-assistant/workflow/{workflowId}/approve
interface WorkflowApprovalRequest {
  approved: boolean;
  modifications?: Record<string, unknown>;
  comments?: string;
}
```

### 4. Email Campaign Workflow Endpoints

```typescript
// POST /api/ai-assistant/workflow/email-campaign
interface EmailCampaignWorkflowRequest {
  sourceDocumentId: string;
  configuration: {
    extractionCriteria: {
      candidateFields: string[];
      minimumQualifications?: string[];
      rankingCriteria?: string[];
    };
    emailTemplate: {
      subject: string;
      bodyTemplate: string;
      personalizationFields: string[];
    };
    campaignSettings: {
      batchSize: number;
      sendDelay: number;
      reviewRequired: boolean;
    };
  };
}

// GET /api/ai-assistant/workflow/email-campaign/{workflowId}/preview
interface EmailCampaignPreviewResponse {
  success: boolean;
  preview: {
    extractedCandidates: Array<CandidateData>;
    sampleEmails: Array<{
      recipient: CandidateData;
      subject: string;
      content: string;
      personalizationApplied: Record<string, string>;
    }>;
    deliveryEstimate: {
      totalRecipients: number;
      estimatedSendTime: string;
      batchSchedule: Array<{ batchNumber: number; sendTime: string; recipientCount: number }>;
    };
  };
}
```

---

## Data Models

### Core Workflow Schema Extensions

```sql
-- Extend existing adminAssistantWorkflows table
ALTER TABLE admin_assistant_workflows 
ADD COLUMN workflow_version TEXT DEFAULT '1.0',
ADD COLUMN parent_workflow_id INTEGER REFERENCES admin_assistant_workflows(id),
ADD COLUMN approval_status TEXT DEFAULT 'none', -- 'none', 'pending', 'approved', 'rejected'
ADD COLUMN approval_details JSONB DEFAULT '{}',
ADD COLUMN execution_context JSONB DEFAULT '{}';

-- Intent detection cache table
CREATE TABLE admin_assistant_intent_cache (
  id SERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  query_text TEXT NOT NULL,
  detected_intent JSONB NOT NULL,
  confidence INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(query_hash)
);

-- Workflow action definitions
CREATE TABLE admin_assistant_workflow_actions (
  id SERIAL PRIMARY KEY,
  action_type TEXT NOT NULL UNIQUE,
  action_name TEXT NOT NULL,
  description TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  schema_definition JSONB NOT NULL,
  implementation_class TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Workflow execution steps
CREATE TABLE admin_assistant_workflow_steps (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES admin_assistant_workflows(id),
  step_name TEXT NOT NULL,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'skipped'
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_details JSONB DEFAULT '{}',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email campaign specific data
CREATE TABLE admin_assistant_email_campaigns (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES admin_assistant_workflows(id) UNIQUE,
  campaign_name TEXT NOT NULL,
  source_document_id TEXT NOT NULL,
  extraction_results JSONB NOT NULL,
  email_template JSONB NOT NULL,
  recipient_data JSONB NOT NULL,
  delivery_status JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### TypeScript Interface Definitions

```typescript
// Core workflow interfaces
interface WorkflowConfiguration {
  workflowType: WorkflowActionType;
  parameters: Record<string, unknown>;
  reviewRequired: boolean;
  batchProcessing?: {
    batchSize: number;
    delayBetweenBatches: number;
  };
  notificationSettings?: {
    onComplete: boolean;
    onFailure: boolean;
    onApprovalRequired: boolean;
  };
}

interface WorkflowResults {
  success: boolean;
  data: Record<string, unknown>;
  metrics: {
    processingTimeMs: number;
    stepCount: number;
    retryCount: number;
    confidenceScore?: number;
  };
  deliverables?: Array<{
    type: string;
    url?: string;
    content?: unknown;
  }>;
}

// Email campaign specific interfaces
interface CandidateData {
  name: string;
  email: string;
  phone?: string;
  linkedIn?: string;
  experience?: string;
  skills?: string[];
  qualifications?: string[];
  rankingScore?: number;
  extractionConfidence: number;
  sourceLocation: {
    pageNumber: number;
    sectionTitle?: string;
  };
}

interface EmailCampaignConfiguration {
  extractionCriteria: {
    requiredFields: string[];
    optionalFields: string[];
    qualificationFilters: string[];
    rankingWeights: Record<string, number>;
  };
  emailGeneration: {
    template: EmailTemplate;
    personalizationStrategy: string;
    toneAndStyle: string;
  };
  deliverySettings: {
    batchSize: number;
    sendInterval: number;
    timeZone: string;
    businessHoursOnly: boolean;
  };
}

interface EmailTemplate {
  subject: string;
  bodyTemplate: string;
  variables: Array<{
    name: string;
    type: 'candidate_field' | 'document_data' | 'static';
    source?: string;
    defaultValue?: string;
  }>;
  signature?: string;
}
```

---

## Implementation Phases

### Phase 1: Foundation & Simple Inference Mode (Weeks 1-3)

#### Objectives
- Establish intent detection system
- Implement simple inference mode
- Create foundational workflow architecture

#### Deliverables

**Week 1: Core Infrastructure**
- ✅ Intent detection API endpoint with OpenAI function calling
- ✅ Database schema updates for workflow and intent caching
- ✅ Basic workflow engine framework
- ✅ Authentication integration with existing NextAuth system

**Week 2: Simple Inference Implementation**
- ✅ Document context retrieval from Google Drive API
- ✅ Simple inference processing with GPT-5/GPT-4 fallback
- ✅ Response caching using Redis
- ✅ Error handling and retry logic

**Week 3: UI Integration & Testing**
- ✅ Chat interface for simple inference mode
- ✅ Document selection and context management
- ✅ Response display with source citations
- ✅ Unit and integration tests for simple mode

#### Success Criteria
- Intent detection accuracy > 85%
- Simple inference response time < 10 seconds
- 95% uptime for inference endpoints
- Complete test coverage for core components

### Phase 2: Email Campaign Workflow (Weeks 4-7)

#### Objectives
- Implement candidate extraction workflow
- Build email generation and personalization system
- Create review/approval workflow

#### Deliverables

**Week 4: Document Analysis & Extraction**
- ✅ Candidate extraction from Google Drive documents
- ✅ Structured data extraction with confidence scoring
- ✅ Integration with existing documentAnalysisQueue
- ✅ Validation and quality assurance logic

**Week 5: Email Generation System**
- ✅ Template-based email generation
- ✅ Personalization engine with candidate data
- ✅ Email preview and validation system
- ✅ Integration with existing emailGenerationQueue

**Week 6: Review & Approval System**
- ✅ Draft email review interface
- ✅ Bulk edit and modification capabilities
- ✅ Approval workflow with notifications
- ✅ Audit trail for all approval actions

**Week 7: Campaign Execution & Monitoring**
- ✅ Batch email sending with rate limiting
- ✅ Delivery status tracking
- ✅ Campaign metrics and analytics
- ✅ Error handling and retry mechanisms

#### Success Criteria
- Candidate extraction accuracy > 90%
- Email personalization quality score > 85%
- Campaign setup time < 15 minutes
- 100% audit trail coverage

### Phase 3: Advanced Features & Optimization (Weeks 8-10)

#### Objectives
- Implement advanced workflow features
- Optimize performance and scalability
- Add comprehensive monitoring

#### Deliverables

**Week 8: Advanced Workflow Features**
- ✅ Multi-document workflow support
- ✅ Conditional workflow branching
- ✅ Workflow templates and presets
- ✅ Bulk operation optimization

**Week 9: Performance & Scalability**
- ✅ Advanced caching strategies
- ✅ Queue optimization and load balancing
- ✅ Background processing improvements
- ✅ Resource usage monitoring

**Week 10: Monitoring & Analytics**
- ✅ Comprehensive workflow analytics
- ✅ Performance monitoring dashboards
- ✅ User behavior analytics
- ✅ System health monitoring

#### Success Criteria
- Support for 1000+ concurrent workflows
- 99.9% system uptime
- Average workflow completion time < 5 minutes
- Comprehensive monitoring coverage

### Phase 4: Extensibility & Future Workflows (Weeks 11-12)

#### Objectives
- Implement plugin architecture for new workflow types
- Create documentation and developer tools
- Plan future workflow extensions

#### Deliverables

**Week 11: Plugin Architecture**
- ✅ Standardized workflow action interface
- ✅ Plugin registration and management system
- ✅ Development tools for new workflow types
- ✅ Example plugin implementations

**Week 12: Documentation & Future Planning**
- ✅ Complete API documentation
- ✅ Developer guides for workflow creation
- ✅ Architecture documentation
- ✅ Roadmap for additional workflow types

#### Success Criteria
- Plugin architecture supports 3+ workflow types
- Complete documentation coverage
- Developer onboarding time < 2 hours
- Clear roadmap for 6-month extension plan

---

## Workflow Engine Specifications

### Core Workflow Architecture

#### Workflow State Machine
```typescript
enum WorkflowStatus {
  CREATED = 'created',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

interface WorkflowStep {
  id: string;
  name: string;
  type: StepType;
  dependencies: string[];
  configuration: Record<string, unknown>;
  retryPolicy: RetryPolicy;
  timeoutMs: number;
}

enum StepType {
  DOCUMENT_ANALYSIS = 'document_analysis',
  DATA_EXTRACTION = 'data_extraction',
  AI_GENERATION = 'ai_generation',
  VALIDATION = 'validation',
  APPROVAL_GATE = 'approval_gate',
  EMAIL_SEND = 'email_send',
  NOTIFICATION = 'notification'
}
```

#### Action Registry Pattern
```typescript
abstract class WorkflowAction {
  abstract readonly actionType: WorkflowActionType;
  abstract readonly version: string;
  abstract readonly schema: JSONSchema;
  
  abstract async execute(
    context: WorkflowContext,
    configuration: unknown
  ): Promise<WorkflowStepResult>;
  
  abstract async validate(configuration: unknown): Promise<ValidationResult>;
  abstract async preview(context: WorkflowContext): Promise<PreviewResult>;
}

class EmailCampaignAction extends WorkflowAction {
  readonly actionType = WorkflowActionType.EMAIL_CAMPAIGN;
  readonly version = '1.0';
  readonly schema = emailCampaignSchema;
  
  async execute(context: WorkflowContext, config: EmailCampaignConfiguration) {
    // Implementation details
  }
}
```

### Email Campaign Workflow Specification

#### Step-by-Step Process Flow
```mermaid
graph TD
    A[Start Email Campaign] --> B[Document Analysis]
    B --> C[Candidate Extraction]
    C --> D[Data Validation]
    D --> E[Email Generation]
    E --> F[Preview Creation]
    F --> G{Review Required?}
    G -->|Yes| H[Approval Gate]
    G -->|No| I[Batch Preparation]
    H --> J{Approved?}
    J -->|Yes| K[Apply Modifications]
    J -->|No| L[Workflow Cancelled]
    K --> I
    I --> M[Email Sending]
    M --> N[Delivery Tracking]
    N --> O[Campaign Completion]
    
    style A fill:#e1f5fe
    style G fill:#fff3e0
    style H fill:#ffebee
    style O fill:#e8f5e8
```

#### Candidate Extraction Logic
```typescript
interface CandidateExtractionConfig {
  requiredFields: Array<{
    fieldName: string;
    extractionPrompt: string;
    validationRegex?: string;
    required: boolean;
  }>;
  qualificationCriteria: Array<{
    criterion: string;
    weight: number;
    evaluationPrompt: string;
  }>;
  rankingStrategy: {
    method: 'weighted_score' | 'ai_ranking' | 'manual';
    maxCandidates?: number;
    minimumScore?: number;
  };
}

class CandidateExtractor {
  async extractCandidates(
    document: DocumentContent,
    config: CandidateExtractionConfig
  ): Promise<CandidateExtractionResult> {
    // Multi-pass extraction strategy
    const candidates = await this.performInitialExtraction(document, config);
    const validatedCandidates = await this.validateCandidates(candidates, config);
    const rankedCandidates = await this.rankCandidates(validatedCandidates, config);
    
    return {
      candidates: rankedCandidates,
      extractionMetrics: this.calculateMetrics(candidates, validatedCandidates),
      confidenceScore: this.calculateOverallConfidence(rankedCandidates)
    };
  }
}
```

### Review/Approval System Architecture

#### Approval Workflow Design
```typescript
interface ApprovalRequest {
  workflowId: string;
  requestType: 'email_campaign' | 'bulk_operation' | 'data_export';
  summary: {
    actionDescription: string;
    impactAssessment: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  reviewableContent: {
    extractedData?: CandidateData[];
    generatedEmails?: EmailPreview[];
    proposedActions?: string[];
  };
  approvalDeadline: string;
  autoApprovalEligible: boolean;
}

class ApprovalSystem {
  async createApprovalRequest(workflow: Workflow): Promise<ApprovalRequest> {
    const request = this.buildApprovalRequest(workflow);
    
    // Check auto-approval eligibility
    if (await this.isAutoApprovalEligible(request)) {
      return this.processAutoApproval(request);
    }
    
    // Send for manual review
    await this.sendForReview(request);
    return request;
  }
  
  async processApprovalResponse(
    workflowId: string,
    response: ApprovalResponse
  ): Promise<void> {
    // Apply modifications if any
    if (response.modifications) {
      await this.applyModifications(workflowId, response.modifications);
    }
    
    // Update workflow status
    await this.updateWorkflowStatus(workflowId, response.approved);
    
    // Resume workflow execution if approved
    if (response.approved) {
      await this.resumeWorkflow(workflowId);
    }
  }
}
```

---

## Integration Specifications

### Google Drive Integration

#### Document Access & Analysis
```typescript
class GoogleDriveService {
  async getDocumentContent(
    fileId: string,
    userCredentials: OAuth2Credentials
  ): Promise<DocumentContent> {
    const driveFile = await this.googleDriveAPI.files.get({ fileId });
    
    switch (driveFile.mimeType) {
      case 'application/vnd.google-apps.document':
        return this.extractGoogleDocContent(fileId, userCredentials);
      case 'application/vnd.google-apps.spreadsheet':
        return this.extractSpreadsheetContent(fileId, userCredentials);
      case 'application/pdf':
        return this.extractPDFContent(fileId, userCredentials);
      default:
        throw new Error(`Unsupported document type: ${driveFile.mimeType}`);
    }
  }
  
  private async extractGoogleDocContent(
    fileId: string,
    credentials: OAuth2Credentials
  ): Promise<GoogleDocContent> {
    const docs = google.docs({ version: 'v1', auth: credentials });
    const document = await docs.documents.get({ documentId: fileId });
    
    return this.parseGoogleDocStructure(document.data);
  }
}
```

#### Content Structure Analysis
```typescript
interface DocumentContent {
  id: string;
  title: string;
  mimeType: string;
  content: {
    rawText: string;
    structuredContent: DocumentSection[];
    metadata: DocumentMetadata;
  };
  lastModified: string;
  permissions: DocumentPermissions;
}

interface DocumentSection {
  type: 'heading' | 'paragraph' | 'table' | 'list';
  content: string;
  formatting?: TextFormatting;
  position: {
    pageNumber?: number;
    startIndex: number;
    endIndex: number;
  };
  subsections?: DocumentSection[];
}
```

### Email Integration

#### Gmail API Integration
```typescript
class EmailDeliveryService {
  async sendCampaignEmails(
    campaign: EmailCampaign,
    emails: GeneratedEmail[]
  ): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];
    
    // Process in batches to respect rate limits
    for (const batch of this.createBatches(emails, campaign.batchSize)) {
      const batchResults = await this.sendEmailBatch(batch, campaign);
      results.push(...batchResults);
      
      // Respect send interval
      if (batch !== emails[emails.length - 1]) {
        await this.delay(campaign.sendInterval);
      }
    }
    
    return results;
  }
  
  private async sendEmailBatch(
    emails: GeneratedEmail[],
    campaign: EmailCampaign
  ): Promise<DeliveryResult[]> {
    const promises = emails.map(email => this.sendSingleEmail(email, campaign));
    return Promise.allSettled(promises);
  }
}
```

### Queue System Integration

#### Enhanced Bull Queue Configuration
```typescript
// Enhanced queue configuration for workflow processing
export const workflowQueue = new Bull('workflow execution', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 100,
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    delay: 0,
  },
  settings: {
    stalledInterval: 30000,
    maxStalledCount: 3,
  },
});

// Workflow-specific job processors
workflowQueue.process('email_campaign', 5, async (job) => {
  const workflowEngine = new WorkflowEngine();
  return workflowEngine.executeEmailCampaign(job.data);
});

workflowQueue.process('document_analysis', 10, async (job) => {
  const documentProcessor = new DocumentProcessor();
  return documentProcessor.analyzeDocument(job.data);
});

// Queue monitoring and health checks
workflowQueue.on('stalled', (job) => {
  console.warn(`Workflow job ${job.id} has stalled`);
  // Implement alerting logic
});

workflowQueue.on('progress', (job, progress) => {
  // Update workflow progress in database
  updateWorkflowProgress(job.data.workflowId, progress);
});
```

---

## Security Specifications

### Authentication & Authorization

#### OAuth 2.0 Integration
- **Google OAuth**: Existing NextAuth integration with Google provider
- **Scope Management**: Granular permissions for Drive and Gmail access
- **Token Management**: Secure token storage and refresh handling
- **Session Security**: Encrypted session storage with expiration

#### Permission Model
```typescript
interface UserPermissions {
  googleDrive: {
    read: boolean;
    write: boolean;
    shareableLinks: boolean;
  };
  gmail: {
    send: boolean;
    read: boolean;
    modify: boolean;
  };
  workflows: {
    create: boolean;
    execute: boolean;
    approve: boolean;
    monitor: boolean;
  };
}

class PermissionValidator {
  async validateWorkflowPermissions(
    userEmail: string,
    workflowType: WorkflowActionType
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userEmail);
    const requiredPermissions = this.getWorkflowRequiredPermissions(workflowType);
    
    return this.hasRequiredPermissions(permissions, requiredPermissions);
  }
}
```

### Data Protection

#### Sensitive Data Handling
- **PII Protection**: Automatic detection and masking of sensitive data
- **Encryption**: At-rest encryption for all stored data
- **Audit Trails**: Comprehensive logging of all data access
- **Data Retention**: Configurable retention policies with automatic cleanup

#### Security Validations
```typescript
interface SecurityValidation {
  piiDetection: boolean;
  contentFiltering: boolean;
  recipientValidation: boolean;
  domainRestrictions: string[];
}

class SecurityValidator {
  async validateEmailCampaign(
    campaign: EmailCampaign
  ): Promise<ValidationResult> {
    const validations = await Promise.all([
      this.detectPII(campaign.emailContent),
      this.validateRecipients(campaign.recipients),
      this.checkDomainRestrictions(campaign.senderDomain),
      this.scanForMaliciousContent(campaign.emailContent)
    ]);
    
    return this.aggregateValidationResults(validations);
  }
}
```

---

## Performance Specifications

### Scalability Requirements

#### System Capacity Targets
- **Concurrent Users**: 1,000+ simultaneous users
- **Document Processing**: 10,000 documents/hour
- **Email Campaigns**: 100,000 emails/hour
- **API Response Times**: 95th percentile < 2 seconds

#### Performance Optimization Strategies

```typescript
// Caching Strategy
interface CacheStrategy {
  documentContent: {
    ttl: 3600; // 1 hour
    maxSize: '1GB';
    evictionPolicy: 'LRU';
  };
  aiInference: {
    ttl: 86400; // 24 hours
    maxSize: '500MB';
    keyStrategy: 'contentHash';
  };
  intentDetection: {
    ttl: 300; // 5 minutes
    maxSize: '100MB';
    keyStrategy: 'queryHash';
  };
}

class PerformanceOptimizer {
  async optimizeDocumentProcessing(
    documents: string[]
  ): Promise<ProcessingPlan> {
    // Parallel processing with intelligent batching
    const batches = this.createOptimalBatches(documents);
    const processingPlan = this.calculateResourceAllocation(batches);
    
    return processingPlan;
  }
  
  async optimizeQueueProcessing(): Promise<void> {
    // Dynamic queue scaling based on load
    const queueMetrics = await this.getQueueMetrics();
    const scalingDecision = this.calculateScalingNeeds(queueMetrics);
    
    await this.applyScalingDecision(scalingDecision);
  }
}
```

### Monitoring & Observability

#### Key Performance Indicators
```typescript
interface PerformanceMetrics {
  apiMetrics: {
    requestRate: number;
    responseTime: {
      p50: number;
      p95: number;
      p99: number;
    };
    errorRate: number;
  };
  workflowMetrics: {
    completionRate: number;
    averageExecutionTime: number;
    failureRate: number;
    retryRate: number;
  };
  queueMetrics: {
    throughput: number;
    backlog: number;
    processingTime: number;
    workerUtilization: number;
  };
  resourceMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
}
```

---

## Testing Strategy

### Comprehensive Testing Framework

#### Test Categories
1. **Unit Tests**: Individual component functionality
2. **Integration Tests**: API and service interactions
3. **End-to-End Tests**: Complete workflow validation
4. **Performance Tests**: Load and stress testing
5. **Security Tests**: Vulnerability and penetration testing

#### Testing Implementation
```typescript
// Example test structure for email campaign workflow
describe('Email Campaign Workflow', () => {
  describe('Candidate Extraction', () => {
    it('should extract candidates with high confidence', async () => {
      const document = await loadTestDocument('resume-collection.pdf');
      const extractor = new CandidateExtractor();
      
      const result = await extractor.extractCandidates(document, defaultConfig);
      
      expect(result.candidates).toHaveLength(5);
      expect(result.confidenceScore).toBeGreaterThan(0.85);
      expect(result.candidates[0]).toHaveProperty('email');
    });
  });
  
  describe('Email Generation', () => {
    it('should generate personalized emails', async () => {
      const candidates = loadTestCandidates();
      const generator = new EmailGenerator();
      
      const emails = await generator.generatePersonalizedEmails(
        candidates,
        emailTemplate
      );
      
      expect(emails).toHaveLength(candidates.length);
      emails.forEach((email, index) => {
        expect(email.content).toContain(candidates[index].name);
        expect(email.subject).toContain(candidates[index].experience);
      });
    });
  });
});
```

### Test Data Management
- **Synthetic Data**: Generated test documents and candidate data
- **Anonymized Real Data**: Scrubbed production data for testing
- **Mock Services**: Simulated external API responses
- **Test Isolation**: Independent test environments

---

## Deployment & Operations

### Infrastructure Requirements

#### Production Environment
```yaml
# Docker Compose configuration
version: '3.8'
services:
  app:
    image: ai-assistant:latest
    environment:
      - REDIS_HOST=redis
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
    depends_on:
      - redis
      - postgres
    replicas: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=ai_assistant
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  queue-worker:
    image: ai-assistant:latest
    command: npm run queue:worker
    environment:
      - REDIS_HOST=redis
      - DATABASE_URL=postgresql://user:pass@postgres:5432/db
    replicas: 5
```

#### Scaling Strategy
- **Horizontal Scaling**: Multiple app instances behind load balancer
- **Queue Workers**: Dedicated worker processes for background jobs
- **Database Scaling**: Read replicas for analytics and reporting
- **Caching Layer**: Redis cluster for distributed caching

### Monitoring & Alerting

#### Health Checks
```typescript
class HealthCheckService {
  async performHealthCheck(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabaseConnectivity(),
      this.checkRedisConnectivity(),
      this.checkGoogleAPIConnectivity(),
      this.checkOpenAIConnectivity(),
      this.checkQueueHealth(),
    ]);
    
    return this.aggregateHealthStatus(checks);
  }
}
```

#### Alerting Configuration
- **Service Downtime**: Immediate alerts for service failures
- **Performance Degradation**: Alerts for response time increases
- **Queue Backlog**: Alerts for job processing delays
- **Error Rate Spikes**: Alerts for increased error rates

---

## Success Metrics & KPIs

### Business Metrics
- **Time Savings**: 80% reduction in manual document processing time
- **Accuracy Improvement**: 90%+ accuracy in candidate extraction
- **User Adoption**: 75% weekly active user rate
- **Workflow Completion**: 95% successful workflow completion rate

### Technical Metrics
- **System Uptime**: 99.9% availability
- **Response Times**: 95th percentile < 5 seconds
- **Queue Processing**: < 5 minute average workflow completion
- **Resource Efficiency**: 80% CPU utilization during peak hours

### Quality Metrics
- **AI Confidence**: 85%+ average confidence score
- **User Satisfaction**: 4.5/5 user rating
- **Error Rate**: < 2% workflow failure rate
- **Review Overhead**: < 10% workflows requiring manual intervention

---

## Risk Assessment & Mitigation

### Technical Risks

#### High-Impact Risks
1. **OpenAI API Limitations**: Rate limiting affecting throughput
   - **Mitigation**: Implement intelligent rate limiting and fallback strategies
   
2. **Google API Changes**: Breaking changes to Drive or Gmail APIs
   - **Mitigation**: Version pinning and comprehensive API monitoring
   
3. **Data Processing Accuracy**: AI extraction errors affecting email campaigns
   - **Mitigation**: Multi-stage validation and human review workflows

#### Medium-Impact Risks
1. **Queue System Failures**: Job processing interruptions
   - **Mitigation**: Queue redundancy and automatic retry mechanisms
   
2. **Database Performance**: Scaling issues with workflow data
   - **Mitigation**: Database optimization and read replica implementation

### Security Risks
1. **Data Privacy**: Unauthorized access to sensitive documents
   - **Mitigation**: Comprehensive access controls and audit trails
   
2. **Email Delivery**: Potential for spam or inappropriate content
   - **Mitigation**: Content filtering and approval workflows

### Operational Risks
1. **Resource Scaling**: Inability to handle peak loads
   - **Mitigation**: Auto-scaling configuration and load testing
   
2. **Dependency Management**: Third-party service failures
   - **Mitigation**: Circuit breakers and graceful degradation

---

## Future Roadmap

### 6-Month Extensions
1. **Advanced Analytics Workflows**: Document insights and trend analysis
2. **CRM Integration**: Salesforce and HubSpot connectivity
3. **Multi-language Support**: International document processing
4. **Advanced Personalization**: ML-driven content optimization

### 12-Month Vision
1. **Voice Interface**: Speech-to-workflow capabilities
2. **Mobile Applications**: Native iOS and Android apps
3. **Enterprise Features**: Multi-tenant architecture and admin controls
4. **AI Workflow Builder**: Visual workflow design interface

---

## Conclusion

This technical PRD outlines a comprehensive dual-mode AI assistant system that leverages existing infrastructure while introducing advanced workflow capabilities. The phased implementation approach ensures steady progress with clear success criteria and risk mitigation strategies.

The extensible architecture supports future growth while the current focus on email campaigns provides immediate business value. The integration with existing Bull Queue and Google APIs minimizes development overhead while maximizing functionality.

Success depends on careful implementation of the intent detection system, robust workflow engine, and comprehensive testing across all integration points. The monitoring and performance specifications ensure the system can scale to meet enterprise demands while maintaining high reliability and user satisfaction.

---

**Document Status**: Final Technical PRD v1.0  
**Next Review**: After Phase 1 completion  
**Approval Required**: Technical Architecture Review Board