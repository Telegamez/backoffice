import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DriveService } from '@/lib/services/drive-service';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // Initialize Drive service
    const driveService = new DriveService(session.user.email);

    // Get documents
    const documents = await driveService.listDocuments(query || undefined, pageSize);

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
      query: query || undefined,
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}