import { NextResponse } from 'next/server';
import { UnifiedAiManager } from '../../utils/unifiedAiManager';

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

    let apiManager: UnifiedAiManager;
    try {
      apiManager = new UnifiedAiManager();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'No AI provider configured' },
        { status: 500 }
      );
    }

    // Create a prompt for generating relevant questions
    const prompt = createSuggestedQuestionsPrompt(userQuestion, language);

    // First attempt
    let result = await apiManager.generateContent(prompt, model);

    // If first attempt fails or returns unexpected content, try with a more explicit prompt
    const firstResponseText = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const unexpectedContent = [
      'translation', 'translate', 'translating', 'translated',
      'nothing to translate', 'already in', 'preserving', 'religious accuracy',
      'islamic terms', 'bangla', 'bengali', 'arabic', 'urdu', 'hindi', 'persian',
      'turkish', 'indonesian', 'malay', 'chinese', 'japanese', 'korean', 'russian',
      'spanish', 'french', 'german', 'portuguese', 'italian', 'dutch', 'swedish',
      'danish', 'norwegian', 'finnish', 'polish', 'czech', 'slovak', 'hungarian',
      'romanian', 'bulgarian', 'croatian', 'serbian', 'bosnian', 'slovenian',
      'macedonian', 'albanian', 'greek', 'georgian', 'armenian', 'hebrew',
      'yiddish', 'kurdish', 'pashto', 'sindhi', 'uyghur', 'mongolian', 'thai',
      'vietnamese', 'khmer', 'lao', 'myanmar', 'tamil', 'telugu', 'malayalam',
      'kannada', 'gujarati', 'punjabi', 'odia', 'assamese', 'marathi', 'nepali',
      'sinhala', 'swahili', 'hausa', 'yoruba', 'igbo', 'amharic', 'somali',
      'afrikaans', 'zulu', 'xhosa', 'sotho', 'tswana', 'swati', 'venda',
      'tsonga', 'ndebele', 'kinyarwanda', 'kirundi', 'luganda', 'akan', 'twi',
      'fulah', 'wolof', 'bambara', 'dyula', 'ewe', 'ga', 'tigrinya', 'oromo',
      'quechua', 'guarani', 'nahuatl', 'aymara', 'maori', 'samoan', 'tongan',
      'fijian', 'hawaiian', 'esperanto', 'latin', 'javanese', 'sundanese',
      'cebuano', 'filipino', 'hmong', 'corsican', 'frisian', 'haitian',
      'luxembourgish', 'malagasy', 'chichewa', 'shona', 'belarusian', 'ukrainian',
      'catalan', 'galician', 'basque', 'icelandic', 'maltese', 'irish', 'welsh',
      'latvian', 'lithuanian', 'estonian'
    ];

    if (!result.success || unexpectedContent.some(term => firstResponseText.toLowerCase().includes(term))) {

      // First attempt failed, trying with fallback prompt

      const fallbackPrompt = `Generate 5 follow-up questions about Islam or the Quran based on this question: "${userQuestion}". 
      Generate questions in ${language} language. 
      IMPORTANT: Do not translate anything. Do not mention language detection. Do not comment on the text or language. Just generate new questions.`;

      result = await apiManager.generateContent(fallbackPrompt, model);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to generate suggested questions' },
        { status: 500 }
      );
    }

    const generatedText = result.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Generated text and language info

    if (!generatedText.trim()) {
      return NextResponse.json(
        { success: false, error: 'No questions generated' },
        { status: 500 }
      );
    }

    // Parse the generated text to extract questions
    const questions = parseGeneratedQuestions(generatedText);

    // Parsed questions

    if (questions.length === 0) {
      // Check if the generated text contains unexpected content for any language
      const unexpectedContent = [
        'translation', 'translate', 'translating', 'translated',
        'nothing to translate', 'already in', 'preserving', 'religious accuracy',
        'islamic terms', 'bangla', 'bengali', 'arabic', 'urdu', 'hindi', 'persian',
        'turkish', 'indonesian', 'malay', 'chinese', 'japanese', 'korean', 'russian',
        'spanish', 'french', 'german', 'portuguese', 'italian', 'dutch', 'swedish',
        'danish', 'norwegian', 'finnish', 'polish', 'czech', 'slovak', 'hungarian',
        'romanian', 'bulgarian', 'croatian', 'serbian', 'bosnian', 'slovenian',
        'macedonian', 'albanian', 'greek', 'georgian', 'armenian', 'hebrew',
        'yiddish', 'kurdish', 'pashto', 'sindhi', 'uyghur', 'mongolian', 'thai',
        'vietnamese', 'khmer', 'lao', 'myanmar', 'tamil', 'telugu', 'malayalam',
        'kannada', 'gujarati', 'punjabi', 'odia', 'assamese', 'marathi', 'nepali',
        'sinhala', 'swahili', 'hausa', 'yoruba', 'igbo', 'amharic', 'somali',
        'afrikaans', 'zulu', 'xhosa', 'sotho', 'tswana', 'swati', 'venda',
        'tsonga', 'ndebele', 'kinyarwanda', 'kirundi', 'luganda', 'akan', 'twi',
        'fulah', 'wolof', 'bambara', 'dyula', 'ewe', 'ga', 'tigrinya', 'oromo',
        'quechua', 'guarani', 'nahuatl', 'aymara', 'maori', 'samoan', 'tongan',
        'fijian', 'hawaiian', 'esperanto', 'latin', 'javanese', 'sundanese',
        'cebuano', 'filipino', 'hmong', 'corsican', 'frisian', 'haitian',
        'luxembourgish', 'malagasy', 'chichewa', 'shona', 'belarusian', 'ukrainian',
        'catalan', 'galician', 'basque', 'icelandic', 'maltese', 'irish', 'welsh',
        'latvian', 'lithuanian', 'estonian'
      ];

      const hasUnexpectedContent = unexpectedContent.some(term =>
        generatedText.toLowerCase().includes(term)
      );

      if (hasUnexpectedContent) {
        // Gemini returned language/translation-related content
        return NextResponse.json(
          { success: false, error: `AI returned unexpected content for ${language}. Please try again.` },
          { status: 500 }
        );
      }

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
10. DO NOT translate anything - just generate new questions
11. DO NOT mention translation or language detection
12. DO NOT provide any commentary about the text or language

USER'S QUESTION: "${userQuestion}"

LANGUAGE: ${language}

Generate 5 relevant follow-up questions:`;

  if (isNonEnglish) {
    prompt += `\n\nIMPORTANT: Generate all questions in ${language} language. Do not translate the user's question - just generate new related questions.`;
  }

  return prompt;
}

function parseGeneratedQuestions(text: string): string[] {
  try {
    // Clean up the text first
    let cleanedText = text.trim();

    // Remove any numbering, bullet points, or formatting artifacts
    cleanedText = cleanedText.replace(/^\d+\.\s*/gm, ''); // Remove "1. " etc.
    cleanedText = cleanedText.replace(/^[-*•]\s*/gm, ''); // Remove "- " or "* " etc.
    cleanedText = cleanedText.replace(/^[a-z]\)\s*/gm, ''); // Remove "a) " etc.

    // Split by line breaks and clean each line
    const lines = cleanedText.split(/\n+/).map(line => line.trim()).filter(line => line.length > 0);

    // Filter out incomplete or malformed questions
    const validQuestions = lines.filter(line => {
      // Check if the line looks like a complete question
      const isComplete = line.length > 10 && // Minimum length
        line.endsWith('?') && // Ends with question mark
        !line.includes('...') && // No ellipsis
        !line.includes('..') && // No double dots
        !line.match(/[a-z]\s*$/i) && // Doesn't end with single letter
        line.split(' ').length >= 3; // At least 3 words

      return isComplete;
    });

    // If we have valid questions, return them (limit to 5)
    if (validQuestions.length > 0) {
      return validQuestions.slice(0, 5);
    }

    // Fallback: try to extract meaningful content even if not perfectly formatted
    const fallbackQuestions = lines
      .filter(line => line.length > 5 && line.includes('?'))
      .map(line => {
        // Clean up any remaining artifacts
        return line.replace(/\s+/g, ' ').trim();
      })
      .slice(0, 5);

    return fallbackQuestions;

  } catch (error) {
    // Error parsing generated questions
    return [];
  }
}
