import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readdir, stat, unlink, readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const outputDir = join(process.cwd(), 'public', 'iptv-output');
    const files = await readdir(outputDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const fileDetails = await Promise.all(
      jsonFiles.map(async (filename) => {
        const filePath = join(outputDir, filename);
        const stats = await stat(filePath);

        // Try to read channel count from file
        let channelCount = 0;
        try {
          const content = await readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          channelCount = data.channels?.length || data.metadata?.total_channels || 0;
        } catch {
          // Ignore parse errors
        }

        return {
          filename,
          size: stats.size,
          created: stats.mtime.toISOString(),
          channelCount
        };
      })
    );

    // Sort by creation date (newest first)
    fileDetails.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return NextResponse.json(fileDetails);
  } catch (error) {
    console.error('[IPTV Files] Error listing files:', error);
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');

    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 });
    }

    // Validate filename (prevent path traversal)
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    if (!filename.endsWith('.json')) {
      return NextResponse.json({ error: 'Only JSON files can be deleted' }, { status: 400 });
    }

    const filePath = join(process.cwd(), 'public', 'iptv-output', filename);
    await unlink(filePath);

    console.log(`[IPTV Files] Deleted: ${filename}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[IPTV Files] Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
