import { NextResponse } from 'next/server';
import { GeminiApiManager } from '../../utils/geminiApiManager';

export async function POST(request: Request) {
  try {
    const { userQuestion, language = 'en' } = await request.json();
    
    if (!userQuestion || userQuestion.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'User question is required' },
        { status: 400 }
      );
    }

    const model = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash';
    
    let apiManager: GeminiApiManager;
    try {
      apiManager = new GeminiApiManager();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'API key is not configured' },
        { status: 500 }
      );
    }

    // Create a prompt for generating relevant questions
    const prompt = createSuggestedQuestionsPrompt(userQuestion, language);
    
    const result = await apiManager.generateContent(prompt, model);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate suggested questions' },
        { status: 500 }
      );
    }

    const generatedText = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!generatedText.trim()) {
      return NextResponse.json(
        { success: false, error: 'No questions generated' },
        { status: 500 }
      );
    }

    // Parse the generated text to extract questions
    const questions = parseGeneratedQuestions(generatedText);
    
    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse generated questions' },
        { status: 500 }
      );
    }

    // Successfully generated suggested questions
    
    return NextResponse.json({ 
      success: true, 
      questions,
      count: questions.length
    });
    
  } catch (error) {
    // API error - silent fail for security
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function createSuggestedQuestionsPrompt(userQuestion: string, language: string): string {
  const isArabic = language === 'ar';
  const isUrdu = language === 'ur';
  const isNonEnglish = language !== 'en';
  
  let prompt = `You are an AI assistant specialized in Islamic knowledge and the Quran. Your task is to generate 5 relevant and insightful follow-up questions based on a user's question about Islam or the Quran.

IMPORTANT REQUIREMENTS:
1. Generate exactly 5 questions
2. Each question should be related to the user's original question
3. Questions should explore different aspects and angles of the topic
4. Questions should be specific and thought-provoking
5. Questions should be in the same language as the user's question
6. Each question should be on a separate line
7. Do not include numbers, bullet points, or any formatting
8. Do not include explanations or additional text
9. Focus on Islamic knowledge, Quranic teachings, and practical guidance

USER'S QUESTION: "${userQuestion}"

LANGUAGE: ${language}

Generate 5 relevant follow-up questions:`;

  if (isNonEnglish) {
    prompt += `\n\nIMPORTANT: Generate all questions in ${language} language.`;
  }

  return prompt;
}

function parseGeneratedQuestions(text: string): string[] {
  try {
    // Split by lines and clean up
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .filter(line => !line.match(/^\d+\./)) // Remove numbered lines
      .filter(line => !line.match(/^[-•*]/)) // Remove bullet points
      .filter(line => line.length > 10) // Filter out very short lines
      .filter(line => line.endsWith('?')) // Only include questions
      .slice(0, 5); // Take only first 5 questions
    
    // If we don't have enough questions ending with ?, try a different approach
    if (lines.length < 3) {
      const allLines = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 20) // Longer lines are more likely to be questions
        .filter(line => !line.match(/^\d+\./))
        .filter(line => !line.match(/^[-•*]/))
        .slice(0, 5);
      
      return allLines;
    }
    
    return lines;
  } catch (error) {
    console.error('Error parsing generated questions:', error);
    return [];
  }
}
