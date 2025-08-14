import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { addDocumentAnalysisJob } from '@/lib/queues';
import { z } from 'zod';

const AnalyzeRequestSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  documentType: z.string().optional(),
  documentName: z.string().optional(),
  analysisTypes: z.array(z.enum(['summary', 'key_points', 'contacts', 'tasks'])).min(1, 'At least one analysis type is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = AnalyzeRequestSchema.parse(body);

    // Add job to queue
    const job = await addDocumentAnalysisJob({
      userEmail: session.user.email,
      documentId: validatedData.documentId,
      documentType: validatedData.documentType || 'unknown',
      documentName: validatedData.documentName,
      analysisTypes: validatedData.analysisTypes,
      requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Document analysis job started',
      estimatedTime: '5-15 seconds',
    });
  } catch (error) {
    console.error('Error starting document analysis:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to start document analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}