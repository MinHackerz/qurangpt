import { NextResponse } from 'next/server';
import { GeminiApiManager } from '../../utils/geminiApiManager';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    
    const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash';
    
    let apiManager: GeminiApiManager;
    try {
      apiManager = new GeminiApiManager();
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'API key is not configured' },
        { status: 500 }
      );
    }

    // Using API keys for content generation
    
    const result = await apiManager.generateContent(prompt, model);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate response' },
        { status: 500 }
      );
    }

    const generatedText = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return NextResponse.json({ response: generatedText });
  } catch (error) {
    // API error - silent fail for security
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 