# AI Admin Assistant Phase 1 Infrastructure Implementation Guide

**Target Audience**: DevOps Engineers, Infrastructure Specialists, Backend Developers  
**Phase**: Phase 1B - Infrastructure Foundation  
**Estimated Time**: 1-2 weeks  
**Prerequisites**: Database schema completed, OAuth configured

## Overview

This guide covers implementing the missing infrastructure components required for AI Admin Assistant Phase 1. The focus is on Redis caching, background job processing, and Google API integration to enable core document-to-email workflows.

## Infrastructure Components

### 1. Redis Infrastructure Setup

#### 1.1 Docker Compose Configuration

Add Redis service to `docker-compose.yml`:

```yaml
services:
  # ... existing services

  redis:
    image: redis:7-alpine
    container_name: telegamez_redis
    restart: unless-stopped
    command: redis-server --maxmemory 4gb --maxmemory-policy allkeys-lru
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  # ... existing volumes
  redis_data:
```

#### 1.2 Package Installation

Add Redis client packages:

```bash
npm install redis bull ioredis @bull-board/api @bull-board/ui
npm install --save-dev @types/bull
```

#### 1.3 Redis Connection Configuration

Create `/src/lib/redis.ts`:

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

export default redis;
```

### 2. Background Job Processing

#### 2.1 Bull Queue Setup

Create `/src/lib/queues.ts`:

```typescript
import Bull from 'bull';
import redis from './redis';

// Document analysis queue
export const documentAnalysisQueue = new Bull('document analysis', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Email generation queue
export const emailGenerationQueue = new Bull('email generation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});
```

#### 2.2 Job Processors

Create `/src/lib/jobs/document-analysis.ts`:

```typescript
import { documentAnalysisQueue } from '../queues';
import { db } from '../db';
import { adminAssistantAudit, adminAssistantAiCache } from '@/db/db-schema';

interface DocumentAnalysisJob {
  userEmail: string;
  documentId: string;
  documentType: string;
  analysisTypes: string[];
}

documentAnalysisQueue.process('analyze-document', async (job) => {
  const startTime = Date.now();
  const { userEmail, documentId, documentType, analysisTypes }: DocumentAnalysisJob = job.data;

  try {
    // Update job progress
    await job.progress(10);

    // TODO: Implement Google Drive API document fetching
    // TODO: Implement AI analysis with OpenAI
    // TODO: Cache results in adminAssistantAiCache
    
    await job.progress(100);

    // Log successful completion
    await db.insert(adminAssistantAudit).values({
      userEmail,
      actionType: 'ai_inference',
      resourceId: documentId,
      resourceType: documentType,
      operation: 'analyze',
      details: {
        analysisTypes,
        processingTime: Date.now() - startTime,
        aiModel: 'gpt-5',
      },
      success: true,
      responseTimeMs: Date.now() - startTime,
    });

    return { success: true, documentId, analysisTypes };
  } catch (error) {
    // Log failure
    await db.insert(adminAssistantAudit).values({
      userEmail,
      actionType: 'ai_inference',
      resourceId: documentId,
      resourceType: documentType,
      operation: 'analyze',
      details: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      },
      success: false,
      responseTimeMs: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
});
```

### 3. Google API Integration

#### 3.1 Package Installation

```bash
npm install googleapis google-auth-library
npm install --save-dev @types/google.apps.script
```

#### 3.2 Service Account Configuration

Create `/src/lib/google-api.ts`:

```typescript
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Service Account configuration for domain-wide delegation
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
};

export class GoogleAPIClient {
  private jwtClient: JWT;

  constructor(userEmail: string) {
    this.jwtClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      subject: userEmail, // Impersonate this user
    });
  }

  async getDriveClient() {
    await this.jwtClient.authorize();
    return google.drive({ version: 'v3', auth: this.jwtClient });
  }

  async getGmailClient() {
    await this.jwtClient.authorize();
    return google.gmail({ version: 'v1', auth: this.jwtClient });
  }

  async getCalendarClient() {
    await this.jwtClient.authorize();
    return google.calendar({ version: 'v3', auth: this.jwtClient });
  }
}
```

#### 3.3 Drive API Service

Create `/src/lib/services/drive-service.ts`:

```typescript
import { GoogleAPIClient } from '../google-api';
import { db } from '../db';
import { adminAssistantAudit } from '@/db/db-schema';

export class DriveService {
  private googleClient: GoogleAPIClient;
  private userEmail: string;

  constructor(userEmail: string) {
    this.userEmail = userEmail;
    this.googleClient = new GoogleAPIClient(userEmail);
  }

  async getDocument(fileId: string) {
    const startTime = Date.now();
    
    try {
      const drive = await this.googleClient.getDriveClient();
      
      // Get file metadata
      const fileResponse = await drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,createdTime,modifiedTime',
      });

      // Get file content based on type
      let content = '';
      if (fileResponse.data.mimeType === 'application/vnd.google-apps.document') {
        // Export Google Docs as plain text
        const exportResponse = await drive.files.export({
          fileId,
          mimeType: 'text/plain',
        });
        content = exportResponse.data as string;
      } else if (fileResponse.data.mimeType === 'application/pdf') {
        // For PDFs, we'd need additional processing
        // This is a placeholder for PDF text extraction
        content = 'PDF content extraction not yet implemented';
      }

      // Log successful access
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        resourceId: fileId,
        resourceType: fileResponse.data.mimeType || 'unknown',
        operation: 'read',
        details: {
          fileName: fileResponse.data.name || 'unknown',
          fileSize: fileResponse.data.size ? parseInt(fileResponse.data.size) : 0,
        },
        success: true,
        responseTimeMs: Date.now() - startTime,
      });

      return {
        ...fileResponse.data,
        content,
      };
    } catch (error) {
      // Log failure
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        resourceId: fileId,
        operation: 'read',
        details: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
        success: false,
        responseTimeMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async listDocuments(query?: string, pageSize: number = 20) {
    const startTime = Date.now();
    
    try {
      const drive = await this.googleClient.getDriveClient();
      
      const searchQuery = query 
        ? `name contains '${query}' and (mimeType='application/vnd.google-apps.document' or mimeType='application/pdf')`
        : "mimeType='application/vnd.google-apps.document' or mimeType='application/pdf'";

      const response = await drive.files.list({
        q: searchQuery,
        pageSize,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime)',
        orderBy: 'modifiedTime desc',
      });

      // Log successful access
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        operation: 'list',
        details: {
          query,
          resultCount: response.data.files?.length || 0,
        },
        success: true,
        responseTimeMs: Date.now() - startTime,
      });

      return response.data.files || [];
    } catch (error) {
      // Log failure
      await db.insert(adminAssistantAudit).values({
        userEmail: this.userEmail,
        actionType: 'drive_read',
        operation: 'list',
        details: {
          query,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
        success: false,
        responseTimeMs: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
```

### 4. Environment Configuration

#### 4.1 Required Environment Variables

Add to `.env.local`:

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Google API Service Account (for domain-wide delegation)
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=service-account@your-project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your-client-id

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-5
```

#### 4.2 Docker Environment Updates

Update docker-compose.yml environment for web service:

```yaml
web:
  # ... existing configuration
  environment:
    # ... existing environment variables
    REDIS_HOST: redis
    REDIS_PORT: 6379
```

## Implementation Steps

### Step 1: Infrastructure Setup

1. **Start Redis container**:
   ```bash
   docker-compose up -d redis
   ```

2. **Install packages**:
   ```bash
   npm install redis bull ioredis googleapis google-auth-library
   ```

3. **Test Redis connection**:
   ```bash
   docker exec -it telegamez_redis redis-cli ping
   ```

### Step 2: Google API Setup

1. **Create Google Cloud Service Account**:
   - Go to Google Cloud Console
   - Create new service account
   - Download JSON credentials
   - Enable Domain-Wide Delegation

2. **Configure workspace admin consent**:
   - Add service account client ID to workspace
   - Grant necessary scopes

3. **Test API access**:
   - Create simple test script
   - Verify document listing works

### Step 3: Background Jobs Setup

1. **Create job processors**:
   - Document analysis job
   - Email generation job
   - Cleanup jobs

2. **Set up job monitoring**:
   - Bull Board UI integration
   - Basic metrics logging

### Step 4: Integration Testing

1. **End-to-end workflow test**:
   - Trigger document analysis job
   - Verify Redis caching
   - Check audit logging

2. **Error handling validation**:
   - Test API failures
   - Verify retry mechanisms
   - Check error logging

## Testing & Validation

### Unit Tests

```typescript
// Test Redis connection
describe('Redis Connection', () => {
  it('should connect and ping successfully', async () => {
    const result = await redis.ping();
    expect(result).toBe('PONG');
  });
});

// Test Google API client
describe('Google API Client', () => {
  it('should authenticate and list documents', async () => {
    const driveService = new DriveService('test@telegamez.com');
    const documents = await driveService.listDocuments();
    expect(Array.isArray(documents)).toBe(true);
  });
});
```

### Integration Tests

```typescript
// Test job processing
describe('Document Analysis Job', () => {
  it('should process document analysis job', async () => {
    const job = await documentAnalysisQueue.add('analyze-document', {
      userEmail: 'test@telegamez.com',
      documentId: 'test-doc-id',
      documentType: 'application/vnd.google-apps.document',
      analysisTypes: ['summary', 'key_points'],
    });

    // Wait for job completion
    const result = await job.finished();
    expect(result.success).toBe(true);
  });
});
```

## Monitoring & Troubleshooting

### Health Checks

Create `/src/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { GoogleAPIClient } from '@/lib/google-api';

export async function GET() {
  const health = {
    redis: false,
    googleApi: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Test Redis
    await redis.ping();
    health.redis = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  try {
    // Test Google API
    const client = new GoogleAPIClient('test@telegamez.com');
    await client.getDriveClient();
    health.googleApi = true;
  } catch (error) {
    console.error('Google API health check failed:', error);
  }

  const allHealthy = health.redis && health.googleApi;
  
  return NextResponse.json(health, { 
    status: allHealthy ? 200 : 503 
  });
}
```

### Common Issues

1. **Redis Connection Failed**:
   - Check Docker container status
   - Verify network connectivity
   - Check environment variables

2. **Google API Authentication Failed**:
   - Verify service account credentials
   - Check domain-wide delegation setup
   - Validate OAuth scopes

3. **Job Processing Stuck**:
   - Check Redis memory usage
   - Monitor job queue depth
   - Review error logs

## Security Considerations

1. **Service Account Security**:
   - Use minimal required scopes
   - Rotate credentials regularly
   - Monitor usage logs

2. **Redis Security**:
   - Enable Redis AUTH if needed
   - Use private networks
   - Regular backup and monitoring

3. **Audit Logging**:
   - Log all API calls
   - Track job processing
   - Monitor error patterns

## Performance Optimization

1. **Redis Optimization**:
   - Configure memory limits
   - Use appropriate eviction policies
   - Monitor memory usage

2. **API Rate Limiting**:
   - Implement quota-aware requests
   - Use exponential backoff
   - Cache frequently accessed data

3. **Job Queue Optimization**:
   - Optimize concurrency settings
   - Configure appropriate timeouts
   - Monitor processing times

---

**Next Steps**: After completing this infrastructure setup, proceed to Phase 2: Core AI Integration and document analysis implementation.

**Dependencies**: Ensure Google Workspace domain admin access for service account delegation setup.

**Support**: Escalate infrastructure issues to DevOps team for production deployment assistance.