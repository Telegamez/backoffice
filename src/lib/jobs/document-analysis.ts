import { documentAnalysisQueue, DocumentAnalysisJobData } from '../queues';
import { DriveService } from '../services/drive-service';
import { db } from '@/db';
import { adminAssistantAudit, adminAssistantAiCache } from '@/db/db-schema';
import { and, eq, gt } from 'drizzle-orm';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import crypto from 'crypto';

// Schema for AI analysis results
const DocumentAnalysisSchema = z.object({
  summary: z.string().describe('A concise summary of the document content'),
  keyPoints: z.array(z.string()).describe('Key points and important information from the document'),
  contacts: z.array(z.object({
    name: z.string(),
    email: z.string().email().optional(),
    role: z.string().optional(),
  })).describe('Email addresses and contact information found in the document'),
  tasks: z.array(z.string()).describe('Action items, tasks, or next steps mentioned in the document'),
  confidence: z.number().min(0).max(100).describe('Confidence score for the analysis quality'),
});

type DocumentAnalysisResult = z.infer<typeof DocumentAnalysisSchema>;

// Create a hash for cache key
function createCacheKey(documentId: string, analysisTypes: string[], content: string, inferencePrompt?: string): string {
  const contentHash = crypto.createHash('md5').update(content).digest('hex');
  const typesStr = analysisTypes.sort().join(',');
  const promptHash = inferencePrompt ? crypto.createHash('md5').update(inferencePrompt).digest('hex') : '';
  return crypto.createHash('md5').update(`${documentId}-${typesStr}-${contentHash}-${promptHash}`).digest('hex');
}

// Check if we have cached results
async function getCachedAnalysis(
  documentId: string, 
  analysisTypes: string[], 
  content: string,
  inferencePrompt?: string
): Promise<DocumentAnalysisResult | null> {
  try {
    const cacheKey = createCacheKey(documentId, analysisTypes, content, inferencePrompt);
    
    const cached = await db
      .select()
      .from(adminAssistantAiCache)
      .where(
        eq(adminAssistantAiCache.cacheKey, cacheKey)
      )
      .limit(1);

    if (cached.length > 0) {
      return cached[0].cacheValue as DocumentAnalysisResult;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to get cached analysis:', error);
    return null;
  }
}

// Save analysis results to cache
async function saveAnalysisToCache(
  documentId: string,
  documentType: string,
  analysisTypes: string[],
  content: string,
  result: DocumentAnalysisResult,
  aiModel: string,
  inferencePrompt?: string
): Promise<void> {
  try {
    const cacheKey = createCacheKey(documentId, analysisTypes, content, inferencePrompt);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30-day expiration

    // Filter out contacts without emails for database storage
    const resultForDb = {
      ...result,
      contacts: result.contacts.filter(contact => contact.email && contact.email.trim() !== '').map(contact => ({
        name: contact.name,
        email: contact.email!,  // Safe to use ! since we filtered out empty emails
        role: contact.role
      }))
    };

    await db.insert(adminAssistantAiCache).values({
      cacheKey,
      cacheValue: resultForDb,
    }).onConflictDoUpdate({
      target: adminAssistantAiCache.cacheKey,
      set: {
        cacheValue: resultForDb,
      }
    });
  } catch (error) {
    console.warn('Failed to save analysis to cache:', error);
  }
}

// Perform AI analysis using OpenAI with GPT-5 and GPT-4 fallback
async function performAIAnalysis(
  content: string,
  documentName: string,
  analysisTypes: string[],
  inferencePrompt?: string
): Promise<{ result: DocumentAnalysisResult; modelUsed: string }> {
  let prompt = `
Analyze the following document and provide structured information:

Document Name: ${documentName}
Analysis Types Requested: ${analysisTypes.join(', ')}

Document Content:
${content}

Please provide:
1. A concise summary of the document content
2. Key points and important information
3. Any email addresses or contact information found (omit email field if not available)
4. Action items, tasks, or next steps mentioned
5. A confidence score (0-100) for the quality of this analysis

Focus on extracting actionable information that would be useful for email communications and workflow automation.
`;

  // If user provided a specific inference prompt, prioritize that
  if (inferencePrompt) {
    prompt = `
User's specific question/prompt: "${inferencePrompt}"

Document Name: ${documentName}
Document Content:
${content}

Please analyze the document to answer the user's specific question while still providing the required structured information:
1. A concise summary focused on answering the user's question
2. Key points relevant to the user's question
3. Any email addresses or contact information found (omit email field if not available)
4. Action items, tasks, or next steps related to the user's question
5. A confidence score (0-100) for the quality of this analysis

Prioritize information that directly addresses the user's question: "${inferencePrompt}"
`;
  }

  // Try GPT-5 first
  try {
    console.log('Attempting analysis with GPT-5...');
    const { object } = await generateObject({
      model: openai('gpt-5'),
      schema: DocumentAnalysisSchema,
      prompt,
      temperature: 0.1,
    });

    return { result: object, modelUsed: 'gpt-5' };
  } catch (gpt5Error) {
    console.warn('GPT-5 analysis failed, falling back to GPT-4:', gpt5Error);
    
    // Fallback to GPT-4
    try {
      console.log('Attempting analysis with GPT-4 fallback...');
      const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: DocumentAnalysisSchema,
        prompt,
        temperature: 0.1,
      });

      return { result: object, modelUsed: 'gpt-4o' };
    } catch (gpt4Error) {
      console.error('Both GPT-5 and GPT-4 analysis failed:', gpt4Error);
      throw new Error(`AI analysis failed with both models: GPT-5 (${gpt5Error instanceof Error ? gpt5Error.message : 'Unknown error'}), GPT-4 (${gpt4Error instanceof Error ? gpt4Error.message : 'Unknown error'})`);
    }
  }
}

// Process document analysis job
documentAnalysisQueue.process('analyze-document', async (job) => {
  const startTime = Date.now();
  const data: DocumentAnalysisJobData = job.data;
  
  console.log(`Starting document analysis for ${data.documentId}`);
  
  try {
    // Update job progress
    await job.progress(10);

    // Initialize Drive service
    const driveService = new DriveService(data.userEmail);
    
    // Get document content
    await job.progress(20);
    const document = await driveService.getDocument(data.documentId);
    
    if (!document.content) {
      throw new Error('Document content could not be extracted');
    }

    await job.progress(40);

    // Check for cached results first
    const cachedResult = await getCachedAnalysis(
      data.documentId, 
      data.analysisTypes, 
      document.content,
      data.inferencePrompt
    );

    let analysisResult: DocumentAnalysisResult;
    let modelUsed = 'cached';

    if (cachedResult) {
      console.log(`Using cached analysis for document ${data.documentId}`);
      analysisResult = cachedResult;
      await job.progress(90);
    } else {
      console.log(`Performing AI analysis for document ${data.documentId}`);
      await job.progress(50);

      // Perform AI analysis
      const aiResponse = await performAIAnalysis(
        document.content,
        document.name,
        data.analysisTypes,
        data.inferencePrompt
      );
      
      analysisResult = aiResponse.result;
      modelUsed = aiResponse.modelUsed;

      await job.progress(80);

      // Save to cache
      await saveAnalysisToCache(
        data.documentId,
        document.mimeType,
        data.analysisTypes,
        document.content,
        analysisResult,
        modelUsed,
        data.inferencePrompt
      );
    }

    await job.progress(95);

    // Log successful completion
    await db.insert(adminAssistantAudit).values({
      userEmail: data.userEmail,
      action: 'document_analysis',
      details: {
        documentId: data.documentId,
        documentType: document.mimeType,
        fileName: document.name,
        processingTime: Date.now() - startTime,
        aiModel: modelUsed,
        confidence: analysisResult.confidence,
        metadata: {
          analysisTypes: data.analysisTypes,
          cached: !!cachedResult,
          success: true,
          responseTimeMs: Date.now() - startTime,
        },
      },
    });

    await job.progress(100);

    console.log(`Document analysis completed for ${data.documentId}`);

    return {
      success: true,
      documentId: data.documentId,
      documentName: document.name,
      analysisTypes: data.analysisTypes,
      result: analysisResult,
      cached: !!cachedResult,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Document analysis failed for ${data.documentId}:`, error);

    // Log failure
    await db.insert(adminAssistantAudit).values({
      userEmail: data.userEmail,
      action: 'document_analysis_failed',
      details: {
        documentId: data.documentId,
        documentType: data.documentType,
        fileName: data.documentName,
        errorMessage,
        processingTime: Date.now() - startTime,
        metadata: {
          analysisTypes: data.analysisTypes,
          success: false,
          responseTimeMs: Date.now() - startTime,
        },
      },
    });

    throw error;
  }
});