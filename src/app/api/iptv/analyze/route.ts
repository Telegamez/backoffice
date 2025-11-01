import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import OpenAI from 'openai';

export const maxDuration = 300; // 5 minutes

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { filename, prompt, conversationHistory = [] } = body;

    if (!filename || !prompt) {
      return NextResponse.json(
        { error: 'Filename and prompt are required' },
        { status: 400 }
      );
    }

    // Validate filename
    if (filename.includes('..') || filename.includes('/')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Read channel file
    const outputDir = join(process.cwd(), 'public', 'iptv-output');
    const filePath = join(outputDir, filename);
    const fileContent = await readFile(filePath, 'utf-8');
    const channelData = JSON.parse(fileContent);

    if (!channelData.channels || !Array.isArray(channelData.channels)) {
      return NextResponse.json(
        { error: 'Invalid channel file format' },
        { status: 400 }
      );
    }

    console.log(`[IPTV AI] Analyzing ${channelData.channels.length} channels with prompt: ${prompt}`);

    // Build conversation context
    const messages: any[] = [
      {
        role: 'system',
        content: `You are an AI assistant specialized in analyzing and manipulating IPTV channel lists. You have access to a channel file with ${channelData.channels.length} channels.

Each channel has these fields:
- number: Channel number
- name: Channel name
- Category: Channel category (Sports, News, Entertainment, etc.)
- Language: Channel language
- streamURL: Stream URL
- logo: Logo path
- current_program: Program information

You can perform these operations:
1. ANALYZE: Answer questions about the channels (statistics, categories, content analysis)
2. FILTER: Create a filtered subset of channels based on criteria
3. EDIT: Modify channel properties (rename, recategorize, reorder)
4. RECOMMEND: Suggest channels or improvements
5. ORGANIZE: Reorganize channels by category, language, or custom criteria

IMPORTANT: When performing FILTER or EDIT operations, respond with a JSON object containing:
{
  "operation": "filter" | "edit" | "analyze",
  "explanation": "Human-readable explanation",
  "channels": [...filtered/edited channels...],
  "summary": {
    "original_count": number,
    "result_count": number,
    "changes_made": string
  }
}

For ANALYZE operations, respond with plain text explanations.`,
      },
    ];

    // Add conversation history
    conversationHistory.forEach((msg: any) => {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    });

    // Add current prompt with channel data
    messages.push({
      role: 'user',
      content: `Channel file: ${filename}
Total channels: ${channelData.channels.length}

Sample channels (first 5):
${JSON.stringify(channelData.channels.slice(0, 5), null, 2)}

Categories present: ${[...new Set(channelData.channels.map((ch: any) => ch.Category))].join(', ')}
Languages present: ${[...new Set(channelData.channels.map((ch: any) => ch.Language))].join(', ')}

User request: ${prompt}`,
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    });

    const aiResponse = completion.choices[0]?.message?.content || '';

    // Try to parse as JSON operation
    let operationResult = null;
    try {
      // Check if response contains JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        operationResult = JSON.parse(jsonMatch[0]);

        // If it's a filter or edit operation, save the result
        if (
          operationResult.operation &&
          ['filter', 'edit'].includes(operationResult.operation) &&
          operationResult.channels
        ) {
          const newFilename = `channels-ai-${operationResult.operation}-${Date.now()}.json`;
          const newFilePath = join(outputDir, newFilename);

          const newChannelData = {
            metadata: {
              ...channelData.metadata,
              source: `ai-${operationResult.operation}`,
              generated_at: new Date().toISOString(),
              original_file: filename,
              ai_operation: {
                prompt,
                operation: operationResult.operation,
                changes: operationResult.summary,
              },
              total_channels: operationResult.channels.length,
            },
            channels: operationResult.channels,
          };

          await writeFile(newFilePath, JSON.stringify(newChannelData, null, 2));

          return NextResponse.json({
            success: true,
            response: operationResult.explanation || aiResponse,
            operation: operationResult.operation,
            filename: newFilename,
            summary: operationResult.summary,
            channelCount: operationResult.channels.length,
          });
        }
      }
    } catch (parseError) {
      // Not a JSON operation, treat as analysis
    }

    // Return analysis response
    return NextResponse.json({
      success: true,
      response: aiResponse,
      operation: 'analyze',
    });
  } catch (error) {
    console.error('[IPTV AI] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI analysis failed' },
      { status: 500 }
    );
  }
}
