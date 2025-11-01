import { NextResponse } from 'next/server';
import { GeminiApiManager } from '../../utils/geminiApiManager';

export async function POST(request: Request) {
  try {
    const { question, language } = await request.json();
    
    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

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

    // Create a prompt that improves the question while preserving the language and Islamic context
    const prompt = `You are a helpful assistant that improves questions for QuranGPT, an AI assistant focused on Islamic knowledge, Quran, Hadith, and Islamic teachings. Your task is to restructure and improve the following question to make it clearer, grammatically correct, and more well-formed while:
1. Preserving the original meaning and intent
2. Maintaining the same language (detected as: ${language})
3. Ensuring proper grammar and structure
4. Ensuring the question remains relevant to Islamic context, Quran, Hadith, Islamic teachings, or related topics - if the question is not Islamic-related, reframe it to be relevant to Islamic context or politely indicate it's outside QuranGPT's scope
5. Making it more professional and clear
6. Keeping the question appropriate for an Islamic educational context
7. CRITICAL: The output must be a question directed TO QuranGPT (not asking the user anything). Do NOT output questions that ask the user like "What would you like to know?" or "Can you clarify?" or any meta-questions. Output ONLY an improved question that seeks information FROM QuranGPT.

Original question: "${question}"

Improved question (output only the improved question without any explanations or additional text. The output must be a question seeking information FROM QuranGPT, NOT asking the user anything. If the question cannot be made relevant to Islamic context, return a polite question directed to QuranGPT indicating it's outside scope):`;

    const result = await apiManager.generateContent(prompt, model, 0.3);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to improve question' },
        { status: 500 }
      );
    }

    const improvedQuestion = result.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || question;
    
    return NextResponse.json({ improvedQuestion });
  } catch (error) {
    // API error - silent fail for security
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

