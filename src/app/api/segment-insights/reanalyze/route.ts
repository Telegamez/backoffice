import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { segmentInsights } from '@/db/db-schema';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      slug: string;
      segment: {
        id: string;
        title: string;
        startDate: string;
        endDate: string;
        issues: number;
        prs: number;
        categories: string[];
        customerFacing: number;
        platformWork: number;
        impact: string;
        deliverables: Array<{ title: string; type: string; impact: string }>;
        keyWork: string[];
      };
      previous?: string;
    };
    if (!body.slug || !body.segment) {
      return NextResponse.json({ error: 'slug and segment required' }, { status: 400 });
    }

    const modelName = process.env.OPENAI_MODEL ?? 'gpt-5';
    const result = await streamText({
      model: openai(modelName),
      temperature: 0.2,
      system:
        'You are a concise product analytics assistant. If previous insights are provided, refine and augment them; otherwise produce fresh insights. Respond with high-signal bullet points under headings: Velocity, Distribution, Risks. Keep it compact.',
      prompt: `Segment: ${JSON.stringify(body.segment)}\nPrevious: ${body.previous ?? ''}`,
    });

    // Convert to full text via textStream
    let full = '';
    for await (const chunk of result.textStream) {
      full += chunk;
    }

    if (db) {
      await db.insert(segmentInsights).values({
        slug: body.slug,
        content: full,
        model: modelName,
      });
    }

    return NextResponse.json({ content: full });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};


