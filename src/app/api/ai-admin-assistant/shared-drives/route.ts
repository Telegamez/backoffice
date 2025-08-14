import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DriveService } from '@/lib/services/drive-service';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Initialize Drive service
    const driveService = new DriveService(session.user.email);

    // Get shared drives
    const drives = await driveService.getSharedDrives();

    return NextResponse.json({
      success: true,
      drives,
    });
  } catch (error) {
    console.error('Error fetching shared drives:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to fetch shared drives'
      },
      { status: 500 }
    );
  }
}