import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TimelineSegment = {
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

export const POST = async (req: Request) => {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      data?: TimelineSegment[];
      selectedCategories?: string[];
    };

    const modelName = process.env.OPENAI_MODEL ?? 'gpt-5';

    const result = await streamText({
      model: openai(modelName),
      temperature: 0.2,
      system:
        'You are a concise product analytics assistant. Respond with short, high-signal bullet points grouped under headings: Velocity, Distribution, Risks. Keep output compact.',
      prompt: `Analyze the timeline data and selected categories.
Data: ${JSON.stringify(body.data ?? [])}
Selected: ${JSON.stringify(body.selectedCategories ?? [])}`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const err = error as Error;
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};


