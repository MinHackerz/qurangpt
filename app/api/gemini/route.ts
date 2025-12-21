import { NextResponse } from 'next/server';
import { UnifiedAiManager } from '../../utils/unifiedAiManager';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';

    let apiManager: UnifiedAiManager;
    try {
      apiManager = new UnifiedAiManager();
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'No AI provider configured' },
        { status: 500 }
      );
    }

    // Using unified AI manager (Gemini primary, OpenAI fallback)

    const result = await apiManager.generateContent(prompt, model);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate response' },
        { status: 500 }
      );
    }

    const generatedText = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!generatedText.trim()) {
      return NextResponse.json(
        { error: 'AI generated an empty response. This might be due to safety filters.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: generatedText, provider: result.provider });
  } catch (error) {
    // API error - silent fail for security
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 