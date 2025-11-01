import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import Checker from 'iptv-checker';

export const maxDuration = 600; // 10 minutes for merge + validation

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      files,
      dedupeBy = 'streamURL',
      skipValidation = false,
      timeout = 10,
      parallel = 10,
      retry = 2
    } = body;

    if (!files || !Array.isArray(files) || files.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 files are required for merging' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    console.log(`[IPTV Merge] Merging ${files.length} files`);

    // Validate filenames
    const invalidFile = files.find((f: string) => f.includes('..') || f.includes('/'));
    if (invalidFile) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Read and merge all files
    const outputDir = join(process.cwd(), 'public', 'iptv-output');
    const allChannels: any[] = [];
    const sourceFiles: string[] = [];

    for (const filename of files) {
      const filePath = join(outputDir, filename);
      try {
        const content = await readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (data.channels && Array.isArray(data.channels)) {
          allChannels.push(...data.channels);
          sourceFiles.push(filename);
        }
      } catch (error) {
        console.error(`[IPTV Merge] Error reading ${filename}:`, error);
      }
    }

    console.log(`[IPTV Merge] Loaded ${allChannels.length} channels from ${sourceFiles.length} files`);

    // Deduplicate
    const seenKeys = new Set<string>();
    const uniqueChannels: any[] = [];

    for (const channel of allChannels) {
      let key: string;

      switch (dedupeBy) {
        case 'name':
          key = (channel.name || '').toLowerCase().trim();
          break;
        case 'both':
          key = `${(channel.name || '').toLowerCase().trim()}|${channel.streamURL || channel.url || ''}`;
          break;
        case 'streamURL':
        default:
          key = channel.streamURL || channel.url || channel.stream || '';
          break;
      }

      if (key && !seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueChannels.push(channel);
      }
    }

    console.log(`[IPTV Merge] Deduplicated to ${uniqueChannels.length} unique channels (removed ${allChannels.length - uniqueChannels.length} duplicates)`);

    let finalChannels = uniqueChannels;
    let validationMeta: any = null;

    // Validate if not skipped
    if (!skipValidation) {
      console.log(`[IPTV Merge] Starting validation...`);

      const checker = new Checker({
        timeout: timeout * 1000,
        parallel,
        retry,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });

      const channels = uniqueChannels.map(ch => ({
        name: ch.name || ch.channel || 'Unknown',
        url: ch.streamURL || ch.url || ch.stream
      }));

      const validChannels: any[] = [];
      let processedCount = 0;

      for await (const result of checker.checkPlaylist(channels)) {
        processedCount++;

        if (processedCount % 50 === 0) {
          console.log(`[IPTV Merge] Validation progress: ${processedCount}/${channels.length}`);
        }

        const originalChannel = uniqueChannels.find(
          ch => (ch.streamURL || ch.url || ch.stream) === result.url
        );

        if (result.status.ok && originalChannel) {
          validChannels.push(originalChannel);
        }
      }

      finalChannels = validChannels;
      validationMeta = {
        total: uniqueChannels.length,
        valid: validChannels.length,
        invalid: uniqueChannels.length - validChannels.length,
        duration_seconds: Math.floor((Date.now() - startTime) / 1000)
      };

      console.log(`[IPTV Merge] Validation complete: ${validChannels.length} valid channels`);
    }

    // Renumber channels
    finalChannels.forEach((ch, idx) => {
      ch.number = idx + 1;
    });

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Prepare output
    const outputData = {
      metadata: {
        source: 'merge-workflow',
        generated_at: new Date().toISOString(),
        total_channels: finalChannels.length,
        merge_stats: {
          source_files: sourceFiles,
          total_loaded: allChannels.length,
          after_deduplication: uniqueChannels.length,
          duplicates_removed: allChannels.length - uniqueChannels.length,
          dedupe_method: dedupeBy
        },
        validation: skipValidation ? 'skipped' : validationMeta,
        duration_seconds: duration
      },
      channels: finalChannels
    };

    // Save to output directory
    const filename = `channels-merged-${Date.now()}.json`;
    const outputPath = join(outputDir, filename);
    await writeFile(outputPath, JSON.stringify(outputData, null, 2));

    console.log(`[IPTV Merge] Complete! Saved to ${filename} (${duration}s)`);

    return NextResponse.json({
      success: true,
      filename,
      metadata: outputData.metadata
    });
  } catch (error) {
    console.error('[IPTV Merge] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Merge failed' },
      { status: 500 }
    );
  }
}
