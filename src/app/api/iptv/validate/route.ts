import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import Checker from 'iptv-checker';

export const maxDuration = 600; // 10 minutes for validation

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const timeout = parseInt(formData.get('timeout') as string) || 10;
    const parallel = parseInt(formData.get('parallel') as string) || 10;
    const retry = parseInt(formData.get('retry') as string) || 2;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Parse uploaded file
    const fileContent = await file.text();
    const channelData = JSON.parse(fileContent);

    if (!channelData.channels || !Array.isArray(channelData.channels)) {
      return NextResponse.json({ error: 'Invalid channel file format' }, { status: 400 });
    }

    const startTime = Date.now();
    console.log(`[IPTV Validate] Starting validation of ${channelData.channels.length} channels`);

    // Configure iptv-checker
    const checker = new Checker({
      timeout: timeout * 1000, // convert to ms
      parallel,
      retry,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    // Prepare channels for validation
    const channels = channelData.channels.map((ch: any) => ({
      name: ch.name || ch.channel || 'Unknown',
      url: ch.streamURL || ch.url || ch.stream
    }));

    // Validate all channels
    const validChannels: any[] = [];
    const invalidChannels: any[] = [];
    let processedCount = 0;

    for await (const result of checker.checkPlaylist(channels)) {
      processedCount++;

      if (processedCount % 50 === 0) {
        console.log(`[IPTV Validate] Progress: ${processedCount}/${channels.length}`);
      }

      const originalChannel = channelData.channels.find(
        (ch: any) => (ch.streamURL || ch.url || ch.stream) === result.url
      );

      if (result.status.ok && originalChannel) {
        validChannels.push(originalChannel);
      } else if (originalChannel) {
        invalidChannels.push(originalChannel);
      }
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[IPTV Validate] Validation complete: ${validChannels.length} valid, ${invalidChannels.length} invalid (${duration}s)`);

    // Renumber valid channels
    validChannels.forEach((ch, idx) => {
      ch.number = idx + 1;
    });

    // Prepare output
    const outputData = {
      metadata: {
        source: 'validation-workflow',
        generated_at: new Date().toISOString(),
        original_file: file.name,
        total_channels: validChannels.length,
        validation: {
          total: channels.length,
          valid: validChannels.length,
          invalid: invalidChannels.length,
          duration_seconds: duration
        },
        validation_config: {
          timeout,
          parallel,
          retry
        }
      },
      channels: validChannels
    };

    // Save to output directory
    const filename = `channels-validated-${Date.now()}.json`;
    const outputPath = join(process.cwd(), 'public', 'iptv-output', filename);
    await writeFile(outputPath, JSON.stringify(outputData, null, 2));

    return NextResponse.json({
      success: true,
      filename,
      metadata: outputData.metadata
    });
  } catch (error) {
    console.error('[IPTV Validate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Validation failed' },
      { status: 500 }
    );
  }
}
