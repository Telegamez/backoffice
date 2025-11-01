import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import Checker from 'iptv-checker';

export const maxDuration = 600; // 10 minutes for validation
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const filename = formData.get('filename') as string | null;
    const timeout = parseInt(formData.get('timeout') as string) || 10;
    const parallel = parseInt(formData.get('parallel') as string) || 10;
    const retry = parseInt(formData.get('retry') as string) || 2;

    let channelData: any;
    let sourceFilename: string;

    if (file) {
      // Parse uploaded file
      const fileContent = await file.text();
      channelData = JSON.parse(fileContent);
      sourceFilename = file.name;
    } else if (filename) {
      // Read existing file from output directory
      const { readFile } = await import('fs/promises');
      const outputPath = join(process.cwd(), 'public', 'iptv-output', filename);
      const fileContent = await readFile(outputPath, 'utf-8');
      channelData = JSON.parse(fileContent);
      sourceFilename = filename;
    } else {
      return new Response('No file provided', { status: 400 });
    }

    if (!channelData.channels || !Array.isArray(channelData.channels)) {
      return new Response('Invalid channel file format', { status: 400 });
    }

    const totalChannels = channelData.channels.length;

    // Create a ReadableStream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          const startTime = Date.now();

          // Configure iptv-checker
          const checker = new Checker({
            timeout: timeout * 1000,
            parallel,
            retry,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          });

          // Prepare channels for validation - iptv-checker expects array of URL strings
          const channelUrls = channelData.channels
            .map((ch: any) => ch.streamURL || ch.url || ch.stream)
            .filter((url: any) => url && typeof url === 'string' && url.trim().length > 0);

          // Send initial status
          send({
            type: 'start',
            totalChannels: channelUrls.length,
            settings: { timeout, parallel, retry },
            estimatedTime: Math.ceil((channelUrls.length * timeout) / parallel),
          });

          // Validate all channels
          const validChannels: any[] = [];
          const invalidChannels: any[] = [];
          let processedCount = 0;
          const batchSize = 50;

          for await (const result of checker.checkPlaylist(channelUrls)) {
            processedCount++;

            const originalChannel = channelData.channels.find(
              (ch: any) => (ch.streamURL || ch.url || ch.stream) === result.url
            );

            if (result.status.ok && originalChannel) {
              validChannels.push(originalChannel);
            } else if (originalChannel) {
              invalidChannels.push({
                ...originalChannel,
                error: result.status.reason || 'Failed validation'
              });
            }

            // Send progress update every batch or every 5%
            if (processedCount % batchSize === 0 || processedCount % Math.ceil(channelUrls.length / 20) === 0) {
              const progress = (processedCount / channelUrls.length) * 100;
              const elapsed = (Date.now() - startTime) / 1000;
              const rate = processedCount / elapsed;
              const remaining = rate > 0 ? Math.ceil((channelUrls.length - processedCount) / rate) : 0;

              send({
                type: 'progress',
                processed: processedCount,
                total: channelUrls.length,
                valid: validChannels.length,
                invalid: invalidChannels.length,
                progress: Math.round(progress * 10) / 10,
                elapsed: Math.round(elapsed),
                remaining,
                rate: Math.round(rate * 10) / 10,
              });
            }
          }

          const duration = Math.floor((Date.now() - startTime) / 1000);

          // Renumber valid channels
          validChannels.forEach((ch, idx) => {
            ch.number = idx + 1;
          });

          // Prepare output
          const outputData = {
            metadata: {
              source: 'validation-workflow',
              generated_at: new Date().toISOString(),
              original_file: sourceFilename,
              total_channels: validChannels.length,
              validation: {
                total: channelUrls.length,
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

          // Send completion
          send({
            type: 'complete',
            filename,
            totalChannels: validChannels.length,
            valid: validChannels.length,
            invalid: invalidChannels.length,
            duration,
            metadata: outputData.metadata,
            invalidSamples: invalidChannels.slice(0, 10), // First 10 invalid channels
          });

          controller.close();
        } catch (error) {
          send({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[IPTV Validate Stream] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Validation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
