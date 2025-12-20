import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAiManager } from '../../utils/unifiedAiManager';
import { getLanguageName } from '../../utils/languageDetection';

export async function POST(request: NextRequest) {
  let aiExplanation = '';

  try {
    const body = await request.json();
    aiExplanation = body.aiExplanation || '';
    const {
      contexts,
      reference,
      type,
      userQuery,
      detectedLanguage = 'en'
    } = body;

    // Early returns if no contexts or no AI explanation
    if (!contexts || contexts.length === 0) {
      return NextResponse.json({
        success: true,
        combinedExplanation: aiExplanation
      });
    }

    if (!aiExplanation) {
      return NextResponse.json({
        success: true,
        combinedExplanation: ''
      });
    }

    let apiManager: UnifiedAiManager;
    try {
      apiManager = new UnifiedAiManager();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'No AI provider configured',
          combinedExplanation: aiExplanation // Fallback to original
        },
        { status: 500 }
      );
    }

    // Get target language name using centralized utility
    const targetLanguage = getLanguageName(detectedLanguage);

    // Format context information
    const contextInfo = contexts.map((ctx: any, idx: number) =>
      `Source ${idx + 1}: ${ctx.title}\nSnippet: ${ctx.snippet}\nURL: ${ctx.url}`
    ).join('\n\n');

    const prompt = `You are an expert Islamic scholar. Your task is to combine an AI-generated explanation with information from web search results to create a comprehensive, unified explanation.

${type === 'ayah' ? `AYAH REFERENCE: ${reference}` : `HADITH REFERENCE: ${reference}`}

AI-GENERATED EXPLANATION:
${aiExplanation || 'No AI explanation provided.'}

WEB SEARCH RESULTS:
${contextInfo}

${userQuery ? `USER'S QUESTION: "${userQuery}"` : ''}

TASK: Create a unified explanation that:
1. Preserves the core insights from the AI-generated explanation
2. Integrates relevant information from the web search results
3. Provides a seamless, coherent narrative that combines both sources
4. Maintains Islamic scholarly accuracy and authenticity
5. Directly addresses the user's question (if provided)

LANGUAGE REQUIREMENT:
- Write the combined explanation in ${targetLanguage}
- Use natural, fluent ${targetLanguage} that matches the user's language
- Maintain Islamic terminology appropriate for ${targetLanguage} speakers

FORMAT REQUIREMENTS:
- Write as a SINGLE, UNIFIED paragraph (not multiple paragraphs)
- Keep it concise (60-80 words maximum)
- Start directly with the explanation, not with phrases like "Here's a combined explanation" or "This verse" or "This hadith"
- Ensure the explanation feels natural and unified, seamlessly blending both sources into one coherent narrative
- Do NOT create separate paragraphs for AI explanation and web search results
- Create ONE flowing paragraph that naturally integrates information from both sources
- Focus on the most relevant and accurate information from both sources

IMPORTANT:
- Only use information from web search results that is accurate and relevant
- If web search results contradict Islamic teachings, prioritize the AI explanation
- Ensure the combined explanation is coherent and flows naturally
- Do not simply concatenate the two sources - create a unified narrative`;

    const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash';
    const result = await apiManager.generateContent(prompt, model, 0.3);

    if (!result.success) {
      // Fallback to original explanation if combination fails
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to combine explanation',
        combinedExplanation: aiExplanation
      });
    }

    const combinedExplanation = result.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || aiExplanation;

    return NextResponse.json({
      success: true,
      combinedExplanation
    });
  } catch (error) {
    console.error('Error combining AI explanation with contexts:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        combinedExplanation: aiExplanation // Use the stored original explanation as fallback
      },
      { status: 500 }
    );
  }
}

