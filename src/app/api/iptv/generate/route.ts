import { NextRequest, NextResponse } from 'next/server';
import { generateMasterChannels } from '@/lib/iptv/generator';
import { auth } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';

export const maxDuration = 300; // 5 minutes max

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      profile,
      countries,
      categories,
      excludeLocal,
      m3u8Only,
      skipValidation,
      timeout,
      parallel,
      retry
    } = body;

    // Generate channels
    const result = await generateMasterChannels({
      profile,
      countries,
      categories,
      excludeLocal,
      m3u8Only,
      skipValidation,
      timeout,
      parallel,
      retry
    });

    // Save to output directory
    const outputDir = path.join(process.cwd(), 'public', 'iptv-output');
    const filename = `channels-${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);

    // Ensure directory exists
    await writeFile(filepath, JSON.stringify(result, null, 2));

    return NextResponse.json({
      ...result,
      filename
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
