import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  const currentModel = process.env.OPENAI_MODEL ?? 'gpt-5';
  const isGPT5 = currentModel.toLowerCase().includes('gpt-5');
  const isAdvanced = true;
  return NextResponse.json({ currentModel, isGPT5, isAdvanced });
};




