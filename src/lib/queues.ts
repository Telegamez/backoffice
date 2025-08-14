import Bull from 'bull';
// Redis configuration for Bull queues
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Document analysis queue
export const documentAnalysisQueue = new Bull('document analysis', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10, // Keep last 10 completed jobs
    removeOnFail: 50,     // Keep last 50 failed jobs
    attempts: 3,          // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,        // Start with 2 second delay
    },
    delay: 0,             // No initial delay
  },
});

// Email generation queue
export const emailGenerationQueue = new Bull('email generation', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    delay: 0,
  },
});

// Daily summary queue
export const dailySummaryQueue = new Bull('daily summary', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 20,
    attempts: 2,
    backoff: {
      type: 'exponential', 
      delay: 5000,
    },
    delay: 0,
  },
});

// Cleanup queue for cache maintenance
export const cleanupQueue = new Bull('cleanup', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 10,
    attempts: 1,
    delay: 0,
  },
});

// Queue event handlers
documentAnalysisQueue.on('completed', (job, result) => {
  console.log(`Document analysis job ${job.id} completed:`, result);
});

documentAnalysisQueue.on('failed', (job, err) => {
  console.error(`Document analysis job ${job.id} failed:`, err);
});

emailGenerationQueue.on('completed', (job, result) => {
  console.log(`Email generation job ${job.id} completed:`, result);
});

emailGenerationQueue.on('failed', (job, err) => {
  console.error(`Email generation job ${job.id} failed:`, err);
});

// Export job types
export interface DocumentAnalysisJobData {
  userEmail: string;
  documentId: string;
  documentType: string;
  documentName?: string;
  analysisTypes: ('summary' | 'key_points' | 'contacts' | 'tasks')[];
  requestId?: string;
}

export interface EmailGenerationJobData {
  userEmail: string;
  workflowId: string;
  documentId: string;
  recipients: Array<{
    email: string;
    name?: string;
    personalizationData?: Record<string, string>;
  }>;
  emailTemplate?: string;
  analysisResults: unknown;
}

export interface DailySummaryJobData {
  userEmail: string;
  date: string;
  includeGitHub?: boolean;
  includeCalendar?: boolean;
}

export interface CleanupJobData {
  type: 'ai_cache' | 'audit_logs' | 'workflows';
  olderThanDays: number;
}

// Job helper functions
export async function addDocumentAnalysisJob(data: DocumentAnalysisJobData) {
  return await documentAnalysisQueue.add('analyze-document', data, {
    jobId: `doc-analysis-${data.documentId}-${Date.now()}`,
  });
}

export async function addEmailGenerationJob(data: EmailGenerationJobData) {
  return await emailGenerationQueue.add('generate-emails', data, {
    jobId: `email-gen-${data.workflowId}-${Date.now()}`,
  });
}

export async function addDailySummaryJob(data: DailySummaryJobData) {
  return await dailySummaryQueue.add('generate-summary', data, {
    jobId: `daily-summary-${data.userEmail}-${data.date}`,
  });
}

export async function addCleanupJob(data: CleanupJobData) {
  return await cleanupQueue.add('cleanup', data);
}

// Queue status functions
export async function getQueueStatus(queueName: string) {
  let queue;
  switch (queueName) {
    case 'document-analysis':
      queue = documentAnalysisQueue;
      break;
    case 'email-generation':
      queue = emailGenerationQueue;
      break;
    case 'daily-summary':
      queue = dailySummaryQueue;
      break;
    case 'cleanup':
      queue = cleanupQueue;
      break;
    default:
      throw new Error(`Unknown queue: ${queueName}`);
  }

  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
  ]);

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
  };
}

export async function getAllQueuesStatus() {
  const [docAnalysis, emailGen, dailySummary, cleanup] = await Promise.all([
    getQueueStatus('document-analysis'),
    getQueueStatus('email-generation'),
    getQueueStatus('daily-summary'),
    getQueueStatus('cleanup'),
  ]);

  return {
    'document-analysis': docAnalysis,
    'email-generation': emailGen,
    'daily-summary': dailySummary,
    'cleanup': cleanup,
  };
}