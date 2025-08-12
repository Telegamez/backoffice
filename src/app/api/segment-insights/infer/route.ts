import { NextResponse } from 'next/server';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      segment: unknown;
      prompt: string;
    };
    if (!body.segment || !body.prompt) {
      return NextResponse.json({ error: 'segment and prompt required' }, { status: 400 });
    }

    const modelName = process.env.OPENAI_MODEL ?? 'gpt-5';
    const result = await streamText({
      model: openai(modelName),
      temperature: 0.2,
      system:
        'You are a helpful assistant for on-demand, ephemeral analysis of a single development segment. Use only the provided data. Keep responses concise. Do not store or cite PII. Return plain text suitable for a small popover.',
      prompt: `User prompt: ${body.prompt}\nSegment data: ${JSON.stringify(body.segment)}`,
    });

    let full = '';
    for await (const chunk of result.textStream) full += chunk;
    return NextResponse.json({ content: full });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};


