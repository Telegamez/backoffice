import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DriveService } from '@/lib/services/drive-service';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { z } from 'zod';
import { redisCache } from '@/lib/services/redis-cache-service';
import { TelegamezContextManager } from '@/lib/context/telegamez-context';
import crypto from 'crypto';

// Define the request body schema based on the PRD
const SimpleInferenceRequestSchema = z.object({
  query: z.string(),
  documentId: z.string(),
  contextScope: z.enum(['document', 'section', 'page']).default('document'),
});

// Define a type for the cached result to ensure consistency
type InferenceResult = {
  answer: string;
  confidence: number;
  sources: Array<{ documentId: string; excerpt: string; }>;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = SimpleInferenceRequestSchema.parse(body);

    const startTime = Date.now();

    // Determine if Telegamez context should be included
    const shouldIncludeContext = TelegamezContextManager.shouldIncludeContext(
      validatedData.query
    );

    // Log context decision for debugging
    console.log('[AI Assistant Inference]', {
      query: validatedData.query.substring(0, 100),
      shouldIncludeContext,
      timestamp: new Date().toISOString(),
    });

    // Create a consistent cache key that includes context flag
    const cacheKey = TelegamezContextManager.generateCacheKey(
      'inference',
      { documentId: validatedData.documentId, query: validatedData.query },
      shouldIncludeContext
    );

    // Check Redis cache
    const cachedResult = await redisCache.get<InferenceResult>(cacheKey);
    if (cachedResult) {
      return NextResponse.json({
        success: true,
        result: cachedResult,
        processingTimeMs: Date.now() - startTime,
        fromCache: true,
      });
    }

    // Fetch document content
    const driveService = new DriveService(session.user.email);
    const document = await driveService.getDocument(validatedData.documentId);

    if (!document.content) {
      throw new Error('Document content could not be extracted.');
    }

    // Build base prompt
    const basePrompt = `
      Answer the user's query using the provided document content as your PRIMARY source.

      User Query: "${validatedData.query}"

      Document Content:
      ---
      ${document.content.substring(0, 8000)}
      ---

      Instructions:
      - If the question is about the document content (candidates, emails, data in the doc), answer based ONLY on the document.
      - If the question is about the company, startup, products, or organization (e.g., "what do you know about our company?", "tell me about Telegames"), you may use your company knowledge in addition to any relevant info from the document.
      - If the answer is not in the document and you don't have relevant company knowledge, state that clearly.
      - Always cite whether information came from the document or your company knowledge.
    `;

    // Add Telegamez context if relevant (only when user asks about company)
    const prompt = TelegamezContextManager.buildPromptWithContext(basePrompt, {
      query: validatedData.query,
      includeMinimal: false, // Use full context when company questions are asked
    });

    // Perform AI inference
    const { text: answer } = await generateText({
      model: openai('gpt-5'),
      prompt,
    });

    const processingTimeMs = Date.now() - startTime;

    // Construct the response
    const result: InferenceResult = {
      answer,
      confidence: 0.9, // Placeholder confidence
      sources: [
        {
          documentId: validatedData.documentId,
          excerpt: document.content.substring(0, 200) + '...', // Simple excerpt for now
        },
      ],
    };

    const response = {
      success: true,
      result,
      processingTimeMs,
      fromCache: false,
    };

    // Set result in Redis cache
    await redisCache.set(cacheKey, result, { ttl: 3600 }); // Cache for 1 hour

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in simple inference:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to perform inference' }, { status: 500 });
  }
}
