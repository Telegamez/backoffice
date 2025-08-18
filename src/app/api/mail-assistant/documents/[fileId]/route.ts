import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DriveService } from '@/lib/services/drive-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileId: string }> }
) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = await context.params;
    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 });
    }

    // Initialize Drive service
    const driveService = new DriveService(session.user.email);

    // Get document
    const document = await driveService.getDocument(fileId);

    return NextResponse.json({
      success: true,
      document,
    });
  } catch (error) {
    console.error('Error getting document:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get document',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}