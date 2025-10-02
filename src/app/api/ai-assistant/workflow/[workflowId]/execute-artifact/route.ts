import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DriveService } from '@/lib/services/drive-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflowId: workflowIdStr } = await params;
    const workflowId = parseInt(workflowIdStr, 10);

    if (isNaN(workflowId)) {
      return NextResponse.json(
        { error: 'Invalid workflow ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { artifactType, title, data, content } = body;

    const driveService = new DriveService(session.user.email);

    let result;
    if (artifactType === 'sheet') {
      if (!data || !Array.isArray(data)) {
        return NextResponse.json(
          { error: 'Invalid sheet data' },
          { status: 400 }
        );
      }
      result = await driveService.createSheet(title, data);
    } else if (artifactType === 'doc') {
      if (!content) {
        return NextResponse.json(
          { error: 'Invalid document content' },
          { status: 400 }
        );
      }
      result = await driveService.createDoc(title, content);
    } else {
      return NextResponse.json(
        { error: 'Unknown artifact type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      webViewLink: result.webViewLink,
    });

  } catch (error) {
    console.error('Error executing artifact creation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create artifact',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
