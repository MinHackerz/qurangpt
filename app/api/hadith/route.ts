import { NextRequest, NextResponse } from 'next/server';
import { GeminiApiManager } from '../../utils/geminiApiManager';
import { detectLanguage } from '../../utils/languageDetection';

// Hadith API configuration - New API without key requirement
const HADITH_API_BASE_URL = 'https://hadithapi.pages.dev/api';

// Translate non-English queries to English using Gemini
async function translateQueryToEnglish(query: string): Promise<string> {
  try {
    const apiManager = new GeminiApiManager();
    
    const prompt = `You are a professional translator specializing in Islamic terminology. Translate the following query to English while preserving the Islamic context and meaning.

QUERY TO TRANSLATE: "${query}"

TRANSLATION REQUIREMENTS:
1. Translate to clear, natural English
2. Preserve Islamic terminology and concepts
3. Maintain the original intent and meaning
4. Use proper Islamic terms (e.g., "prayer" for "salah", "charity" for "zakat")
5. Keep the question structure intact
6. If already in English, return as-is

RESPONSE FORMAT:
Return only the translated query in English, nothing else.`;

    const result = await apiManager.generateContent(prompt, 'gemini-2.0-flash', 0.3);
    
    if (result.success && result.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const translatedQuery = result.data.candidates[0].content.parts[0].text.trim();
      return translatedQuery;
    } else {
      return query;
    }
  } catch (error) {
    return query;
  }
}

// Generate comprehensive hadith summary using Gemini
async function generateHadithSummary(hadith: any, userQuery: string, originalQuery: string, detectedLanguage: string): Promise<string> {
  try {
    const apiManager = new GeminiApiManager();
    
    // Determine the target language for the summary
    const targetLanguage = detectedLanguage === 'en' ? 'English' : 
                          detectedLanguage === 'ar' ? 'Arabic' :
                          detectedLanguage === 'bn' ? 'Bengali' :
                          detectedLanguage === 'ur' ? 'Urdu' :
                          detectedLanguage === 'hi' ? 'Hindi' :
                          detectedLanguage === 'tr' ? 'Turkish' :
                          detectedLanguage === 'fr' ? 'French' :
                          detectedLanguage === 'es' ? 'Spanish' :
                          detectedLanguage === 'de' ? 'German' :
                          detectedLanguage === 'it' ? 'Italian' :
                          detectedLanguage === 'pt' ? 'Portuguese' :
                          detectedLanguage === 'ru' ? 'Russian' :
                          detectedLanguage === 'zh' ? 'Chinese' :
                          detectedLanguage === 'ja' ? 'Japanese' :
                          detectedLanguage === 'ko' ? 'Korean' :
                          'English'; // Default fallback
    
    const prompt = `You are an expert Islamic scholar tasked with creating a comprehensive summary of a hadith that explains its relevance to a user's question.

HADITH DETAILS:
- Book: ${hadith.book?.bookName || 'Unknown'}
- Hadith Number: ${hadith.hadithNumber}
- Text: ${hadith.hadithEnglish}
- Narrator: ${hadith.englishNarrator}
- Volume: ${hadith.volume}
- Chapter: ${hadith.chapterNumber}

USER'S ORIGINAL QUESTION: "${originalQuery}"
USER'S QUESTION (for context): "${userQuery}"

LANGUAGE REQUIREMENT:
- Write the summary in ${targetLanguage}
- Use natural, fluent ${targetLanguage} that matches the user's original question language
- Maintain Islamic terminology appropriate for ${targetLanguage} speakers
- Ensure the summary feels native and natural in ${targetLanguage}

TASK: Create a detailed summary that:
1. Explains what this hadith teaches
2. Shows how it directly relates to the user's question
3. Provides practical insights and applications
4. Explains the significance and context
5. Offers guidance on how to apply this teaching

SUMMARY FORMAT:
Write a concise summary (40-50 words maximum) that:
- Explains the core teaching of the hadith
- Shows its direct relevance to the user's question
- Provides practical guidance

IMPORTANT: 
- Use plain text only (no markdown, no bold, no formatting)
- Keep it under 50 words
- Be direct and practical
- Focus on the main teaching and its relevance
- Start directly with the teaching, not with phrases like "Here's a summary" or "This hadith"
- Write as natural, flowing text in ${targetLanguage}
- Use appropriate Islamic terminology for ${targetLanguage} speakers

Make it educational, practical, and directly relevant to the user's query. Use clear, accessible language in ${targetLanguage}. Keep it brief and focused.`;

    const result = await apiManager.generateContent(prompt, 'gemini-2.0-flash', 0.3);
    
    if (result.success && result.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      let summary = result.data.candidates[0].content.parts[0].text.trim();
      
      // Remove any markdown formatting
      summary = summary.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold
      summary = summary.replace(/\*(.*?)\*/g, '$1'); // Remove italic
      summary = summary.replace(/#{1,6}\s*/g, ''); // Remove headers
      summary = summary.replace(/\n+/g, ' '); // Replace newlines with spaces
      summary = summary.replace(/\s+/g, ' ').trim(); // Clean up whitespace
      
      // Remove common introductory phrases
      summary = summary.replace(/^(Here's a summary[:\s]*|This hadith[:\s]*|The hadith[:\s]*|Summary[:\s]*|In this hadith[:\s]*)/i, '');
      summary = summary.trim();
      
      // Check word count and truncate if necessary
      const words = summary.split(' ');
      if (words.length > 50) {
        summary = words.slice(0, 50).join(' ') + '...';
      }
      
      return summary;
    } else {
      // Fallback to basic summary in target language
      const fallbackMessage = detectedLanguage === 'bn' ? 
        `এই হাদিস ${userQuery.toLowerCase()} সম্পর্কে শিক্ষা দেয়, মুসলমানদের জন্য ব্যবহারিক নির্দেশনা প্রদান করে।` :
        detectedLanguage === 'ar' ?
        `هذا الحديث يعلم عن ${userQuery.toLowerCase()}، ويقدم إرشادات عملية للمسلمين.` :
        detectedLanguage === 'ur' ?
        `یہ حدیث ${userQuery.toLowerCase()} کے بارے میں سکھاتی ہے، مسلمانوں کے لیے عملی رہنمائی فراہم کرتی ہے۔` :
        `This hadith teaches about ${userQuery.toLowerCase()}, providing practical guidance for Muslims.`;
      return fallbackMessage;
    }
  } catch (error) {
    // Fallback to basic summary in target language
    const fallbackMessage = detectedLanguage === 'bn' ? 
      `এই হাদিস ${userQuery.toLowerCase()} সম্পর্কে শিক্ষা দেয়, মুসলমানদের জন্য ব্যবহারিক নির্দেশনা প্রদান করে।` :
      detectedLanguage === 'ar' ?
      `هذا الحديث يعلم عن ${userQuery.toLowerCase()}، ويقدم إرشادات عملية للمسلمين.` :
      detectedLanguage === 'ur' ?
      `یہ حدیث ${userQuery.toLowerCase()} کے بارے میں سکھاتی ہے، مسلمانوں کے لیے عملی رہنمائی فراہم کرتی ہے۔` :
      `This hadith teaches about ${userQuery.toLowerCase()}, providing practical guidance for Muslims.`;
    return fallbackMessage;
  }
}

// Use Gemini to find the most relevant hadith numbers for a user's question
async function findRelevantHadithWithGemini(query: string): Promise<Array<{
  bookSlug: string;
  hadithNumber: string;
  confidence: number;
  reasoning: string;
}> | null> {
  try {
    const apiManager = new GeminiApiManager();
    
    const prompt = `You are an expert Islamic scholar with comprehensive knowledge of Hadith literature and the six main collections. Your task is to deeply analyze the user's question and suggest the most relevant Sahih hadiths that directly address their specific query.

USER'S QUESTION: "${query}"

DEEP ANALYSIS FRAMEWORK:

1. QUERY UNDERSTANDING - Analyze the user's question to identify:
   - Primary Islamic concept or topic (e.g., prayer, charity, patience, family, business, etc.)
   - Specific aspect they're asking about (practical, theological, ethical, legal)
   - Context and depth needed (beginner, intermediate, advanced)
   - Implied scenarios or situations mentioned
   - Language and cultural context (if apparent)
   - Emotional or spiritual needs behind the question

2. CONCEPTUAL MAPPING - Map the question to Islamic concepts:
   - Core Islamic principles (Aqeedah, Ibadah, Muamalat, Akhlaq)
   - Specific topics (Salah, Zakat, Hajj, Fasting, Family, Business, etc.)
   - Life situations (marriage, parenting, work, health, death, etc.)
   - Spiritual states (patience, gratitude, forgiveness, etc.)

3. HADITH SELECTION CRITERIA - Choose hadiths that:
   - Directly answer the specific question asked
   - Provide foundational understanding of the topic
   - Offer practical guidance and examples
   - Cover different dimensions if the question is broad
   - Are well-known, frequently cited, and highly authentic
   - Complement each other to give comprehensive coverage

4. PRIORITY RANKING - Prioritize hadiths by:
   - Direct relevance to the specific question (highest priority)
   - Authenticity and reliability (Sahih Bukhari > Sahih Muslim > others)
   - Practical applicability and clarity
   - Educational value for the user's level
   - Coverage of different aspects of the topic

RESPONSE FORMAT:
Respond in this exact JSON format:
{
  "suggestions": [
    {
      "bookSlug": "bukhari",
      "hadithNumber": "1",
      "confidence": 0.95,
      "reasoning": "This hadith directly addresses [specific aspect] mentioned in the user's question about [topic]. It provides the foundational understanding of [concept] and offers practical guidance on [specific application]."
    },
    {
      "bookSlug": "muslim", 
      "hadithNumber": "1",
      "confidence": 0.90,
      "reasoning": "This hadith complements the first by providing [additional aspect] that is relevant to the user's question about [topic]. It offers [specific guidance/example] that directly relates to their query."
    }
  ]
}

AVAILABLE COLLECTIONS (ONLY USE THESE 5):
- "bukhari" (Sahih Bukhari) - Most authentic, comprehensive coverage of all Islamic topics
- "muslim" (Sahih Muslim) - Second most authentic, excellent for practical guidance
- "abudawud" (Sunan Abu Dawood) - Practical applications and daily life guidance
- "ibnmajah" (Sunan Ibn Majah) - Additional practical guidance and daily life applications
- "tirmidhi" (Jami' at-Tirmidhi) - Detailed explanations and clarifications

HADITH NUMBER RANGES (choose from these reliable ranges):
- Sahih Bukhari: 1-7563 (most reliable and comprehensive)
- Sahih Muslim: 1-3032 (highly reliable, practical focus)
- Abu Dawood: 1-3998 (practical applications)
- Ibn Majah: 1-4342 (additional practical guidance)
- Al-Tirmidhi: 1-3956 (detailed explanations)

IMPORTANT GUIDELINES:
- Choose hadith numbers that are well-known and commonly cited
- Ensure the hadiths DIRECTLY and SPECIFICALLY relate to the user's exact question
- Only suggest hadiths with confidence >= 0.9 (very high relevance)
- If no hadiths are highly relevant to the specific question, return empty suggestions array
- Provide clear reasoning for each selection showing direct relevance
- Aim for 3-5 hadiths that together provide comprehensive coverage
- Consider the user's likely level of understanding
- Focus on hadiths that offer practical, actionable guidance
- DO NOT suggest hadiths that are only tangentially related
- DO NOT suggest hadiths just to fill a quota - quality over quantity

CONSISTENCY REQUIREMENTS:
- For the same question, always suggest the SAME hadiths in the SAME order
- Prioritize the most foundational and well-known hadiths first
- Use a consistent ranking system: Bukhari #1, Muslim #1, then other foundational hadiths
- For questions about core Islamic concepts, always include the most basic hadiths first
- Maintain the same confidence scores for the same hadiths across similar questions

Be precise, accurate, and only respond with valid JSON.`;

    const result = await apiManager.generateContent(prompt, 'gemini-2.0-flash', 0.3);
    
    if (!result.success || !result.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return null;
    }

    const responseText = result.data.candidates[0].content.parts[0].text.trim();

    // Clean the response text by removing markdown code blocks
    let cleanedResponse = responseText;
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate the response structure
      if (parsed.suggestions && Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
        return parsed.suggestions;
      } else {
        return null;
      }
    } catch (parseError) {
      return null;
    }
  } catch (error) {
    return null;
  }
}


interface HadithResult {
  id: number;
  hadithNumber: number;
  englishNarrator: string;
  hadithEnglish: string;
  hadithUrdu: string;
  hadithArabic: string;
  headingArabic: string;
  headingUrdu: string;
  headingEnglish: string;
  chapterNumber: number;
  bookSlug: string;
  status: string;
  volume: number;
  collectionPriority?: number;
  collectionName?: string;
  book: {
    id: number;
    bookName: string;
    writerName: string;
    aboutWriter: string;
    writerDeath: string;
    bookSlug: string;
  };
}

interface HadithApiResponse {
  hadiths: HadithResult[];
  totalHadiths: number;
  totalPages: number;
  currentPage: number;
  nextPage: number | null;
  previousPage: number | null;
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawQuery = searchParams.get('query');
    const hadithNumber = searchParams.get('hadithNumber');
    const bookSlug = searchParams.get('bookSlug');
    const limit = searchParams.get('limit') || '5';

    // If specific hadith number is requested, fetch it directly
    if (hadithNumber && bookSlug) {
      return await fetchSpecificHadith(hadithNumber, bookSlug);
    }

    // STRICT QUERY VALIDATION AND PROCESSING
    if (!rawQuery || rawQuery.trim().length === 0) {
      return NextResponse.json({ 
        error: 'A meaningful query is required. Please provide a clear question about Islamic topics.',
        suggestion: 'Try asking about topics like prayer, charity, patience, family, or other Islamic concepts.'
      }, { status: 400 });
    }

    // Clean and validate the raw query
    const cleanedQuery = rawQuery.trim().replace(/\s+/g, ' ');
    
    // Check for meaningless queries (fragmented, nonsensical text)
    const words = cleanedQuery.toLowerCase().split(' ');
    
    // Check if query is too short or fragmented
    if (words.length < 3) {
      return NextResponse.json({ 
        error: 'Please provide a more specific question about Islamic topics.',
        suggestion: 'Try asking about specific topics like "How to perform prayer?", "What is charity in Islam?", or "Teachings about patience".'
      }, { status: 400 });
    }
    
    // Check for fragmented queries (like "the prophet an in and")
    const commonWords = ['the', 'in', 'are', 'good', 'or', 'and', 'is', 'a', 'an', 'to', 'of', 'for', 'with', 'by', 'at', 'on', 'up', 'out', 'if', 'as', 'be', 'so', 'my', 'one', 'all', 'would', 'there', 'their', 'this', 'that', 'these', 'those', 'it', 'he', 'she', 'we', 'they', 'you', 'me', 'him', 'her', 'us', 'them'];
    const meaningfulWords = words.filter(word => word.length > 2 && !commonWords.includes(word));
    
    // Check if query is mostly common words (fragmented)
    const meaningfulRatio = meaningfulWords.length / words.length;
    if (meaningfulRatio < 0.3) { // Less than 30% meaningful words
      return NextResponse.json({ 
        error: 'Please provide a more specific question about Islamic topics.',
        suggestion: 'Try asking about specific topics like "How to perform prayer?", "What is charity in Islam?", or "Teachings about patience".'
      }, { status: 400 });
    }

    // Detect language and translate if needed
    const detectedLanguage = detectLanguage(cleanedQuery);
    
    let finalQuery = cleanedQuery;
    if (detectedLanguage !== 'en') {
      finalQuery = await translateQueryToEnglish(cleanedQuery);
    }


    // Use Gemini to find the most relevant specific hadiths
    const geminiSuggestions = await findRelevantHadithWithGemini(finalQuery);
    
    if (geminiSuggestions && geminiSuggestions.length > 0) {
      
      // Filter for high-confidence suggestions only (0.9+)
      const highConfidenceSuggestions = geminiSuggestions.filter(suggestion => suggestion.confidence >= 0.9);
      
      if (highConfidenceSuggestions.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No highly relevant hadiths found for your question',
          suggestion: 'Please try rephrasing your question or asking about a different Islamic topic.',
          query: finalQuery,
           method: 'gemini-suggested-specific'
        }, { status: 404 });
      }
      
      
      // Fetch all suggested hadiths directly using bookSlug + hadithNumber
      const fetchedHadiths: any[] = [];
      const failedFetches: string[] = [];
      
      // Use Promise.allSettled for better error handling and parallel processing
      const fetchPromises = highConfidenceSuggestions
        .map(async (suggestion) => {
          try {
            const specificHadith = await fetchSpecificHadith(suggestion.hadithNumber, suggestion.bookSlug);
            
            if (specificHadith.status === 200) {
              const hadithData = await specificHadith.json();
              if (hadithData.success && hadithData.hadith) {
                // Add Gemini's reasoning to the response
                const enhancedHadith = {
                  ...hadithData.hadith,
                  geminiReasoning: suggestion.reasoning,
                  geminiConfidence: suggestion.confidence
                };
                return { success: true, hadith: enhancedHadith };
              } else {
                const error = hadithData.error || 'Unknown error';
                return { success: false, error: `${suggestion.bookSlug} #${suggestion.hadithNumber}: ${error}` };
              }
            } else {
              return { success: false, error: `${suggestion.bookSlug} #${suggestion.hadithNumber}: HTTP ${specificHadith.status}` };
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return { success: false, error: `${suggestion.bookSlug} #${suggestion.hadithNumber}: ${errorMessage}` };
          }
        });

      // Wait for all fetches to complete
      const results = await Promise.allSettled(fetchPromises);
      
      // Process results
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            fetchedHadiths.push(result.value.hadith);
          } else {
            failedFetches.push(result.value.error || 'Unknown error');
          }
        } else {
          failedFetches.push(`Promise rejected: ${result.reason || 'Unknown error'}`);
        }
      });
      
      if (failedFetches.length > 0) {
      }
      
      if (fetchedHadiths.length > 0) {
        
        // Generate comprehensive summaries for each hadith
        const hadithsWithSummaries = await Promise.all(fetchedHadiths.map(async (hadith) => {
          const summary = await generateHadithSummary(hadith, finalQuery, rawQuery, detectedLanguage);
          return {
            ...hadith,
            aiSummary: summary
          };
        }));
        
        return NextResponse.json({
          success: true,
          hadiths: hadithsWithSummaries,
          total: hadithsWithSummaries.length,
          query: finalQuery,
          originalQuery: rawQuery,
          detectedLanguage: detectedLanguage,
          method: 'gemini-suggested-specific',
          suggestions: geminiSuggestions
        });
      } else {
      }
    }
    
    // If no hadiths were found through Gemini suggestions, return appropriate response
    return NextResponse.json({
      success: false,
      error: 'No relevant hadiths found for your question',
      suggestion: 'Please try rephrasing your question or asking about a different Islamic topic.',
      query: finalQuery,
      originalQuery: rawQuery,
      detectedLanguage: detectedLanguage,
      method: 'gemini-suggested-specific'
    }, { status: 404 });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function fetchSpecificHadith(hadithNumber: string, bookSlug: string) {
  try {
    // Validate hadith number
    const hadithNum = parseInt(hadithNumber);
    if (isNaN(hadithNum) || hadithNum < 1) {
      return NextResponse.json({
        success: false,
        error: 'Invalid hadith number'
      }, { status: 400 });
    }

    // Define valid ranges for each collection
    const validRanges: { [key: string]: { min: number; max: number } } = {
      'bukhari': { min: 1, max: 7563 },
      'muslim': { min: 1, max: 3032 },
      'abudawud': { min: 1, max: 3998 },
      'ibnmajah': { min: 1, max: 4342 },
      'tirmidhi': { min: 1, max: 3956 }
    };

    // Map book slugs to the new API format
    const bookSlugMap: { [key: string]: string } = {
      'sahih-bukhari': 'bukhari',
      'sahih-muslim': 'muslim',
      'abu-dawood': 'abudawud',
      'ibn-majah': 'ibnmajah',
      'al-tirmidhi': 'tirmidhi'
    };
    
    const apiBookSlug = bookSlugMap[bookSlug] || bookSlug;
    
    // Check if hadith number is within valid range
    const range = validRanges[apiBookSlug];
    if (range && (hadithNum < range.min || hadithNum > range.max)) {
      return NextResponse.json({
        success: false,
        error: `Hadith number must be between ${range.min} and ${range.max} for ${apiBookSlug}`
      }, { status: 400 });
    }
    const url = `${HADITH_API_BASE_URL}/${apiBookSlug}/${hadithNumber}`;
    
    // Add timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for better performance
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'QuranGPT/1.0',
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      
      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({
            success: false,
            error: 'Hadith not found'
          }, { status: 404 });
        }
        
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      
      if (data && data.hadith_english) {
        
        // Map the new API response to our expected format
        const mappedHadith = {
          id: data.id,
          hadithNumber: parseInt(hadithNumber),
          englishNarrator: data.header?.trim() || '',
          hadithEnglish: data.hadith_english?.trim() || '',
          hadithUrdu: '',
          hadithArabic: '',
          headingArabic: '',
          headingUrdu: '',
          headingEnglish: data.bookName?.trim() || '',
          chapterNumber: 1,
          bookSlug: bookSlug,
          status: 'Sahih',
          volume: 1,
          book: {
            id: 1,
            bookName: data.book || 'Unknown',
            writerName: 'Imam Bukhari',
            aboutWriter: 'Muhammad ibn Isma\'il al-Bukhari',
            writerDeath: '870 CE',
            bookSlug: bookSlug
          }
        };
        
        return NextResponse.json({
          success: true,
          hadith: mappedHadith,
          total: 1
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Hadith not found'
        }, { status: 404 });
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw fetchError;
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch specific hadith',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


// Helper function to extract hadith references from text (internal use only)
function extractHadithReferences(text: string): Array<{
  bookName: string;
  hadithNumber: string;
  originalMatch: string;
}> {
  const hadithPatterns = [
    // Pattern for "Sahih Bukhari 1234" or "Bukhari 1234"
    /(?:Sahih\s+)?(Bukhari|Muslim|Abu\s+Dawood|Ibn\s+Majah|Tirmidhi)\s+(\d+)/gi,
    // Pattern for "Sahih Bukhari, Book 1, Hadith 1234"
    /(?:Sahih\s+)?(Bukhari|Muslim|Abu\s+Dawood|Ibn\s+Majah|Tirmidhi),\s*(?:Book\s+\d+,\s*)?Hadith\s+(\d+)/gi,
    // Pattern for "Sahih Bukhari: 1234"
    /(?:Sahih\s+)?(Bukhari|Muslim|Abu\s+Dawood|Ibn\s+Majah|Tirmidhi):\s*(\d+)/gi
  ];

  const references: Array<{
    bookName: string;
    hadithNumber: string;
    originalMatch: string;
  }> = [];

  hadithPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const bookName = match[1].toLowerCase();
      const hadithNumber = match[2];
      const originalMatch = match[0];

      // Map book names to API slugs
      const bookSlugMap: { [key: string]: string } = {
        'bukhari': 'sahih-bukhari',
        'muslim': 'sahih-muslim',
        'abu dawood': 'abu-dawood',
        'ibn majah': 'ibn-majah',
        'tirmidhi': 'al-tirmidhi'
      };

      const bookSlug = bookSlugMap[bookName];
      if (bookSlug) {
        references.push({
          bookName: bookName.charAt(0).toUpperCase() + bookName.slice(1),
          hadithNumber,
          originalMatch
        });
      }
    }
  });

  return references;
}