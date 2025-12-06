import { useCallback } from 'react';
import { getSurahNumber, calculateGlobalAyahNumber, fetchTafsir, fetchTafsirRange } from '../utils/tafsirUtils';
import { detectLanguage } from '../utils/languageDetection';
import { detectAyahReferences, AyahMatch } from '../utils/simpleAyahDetection';
import { fetchArabicAyahText, fetchArabicAyahRangeText } from '../utils/ayahTextFetcher';
import { extractHadithReferences, searchHadiths, generateHadithBoxHTML, HadithData } from '../utils/hadithUtils';
import { getGlobalAbortManager } from './useAbortManager';
import { ProgressStep } from '../components/ProgressIndicator';



// Function to extract key terms for hadith search
const extractKeyTermsForHadithSearch = (text: string): string[] => {
  // Remove HTML tags and clean text
  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  // Islamic and religious keywords that are good for hadith search
  const islamicKeywords = [
    'prayer', 'salah', 'namaz', 'fasting', 'ramadan', 'charity', 'zakat', 'hajj', 'pilgrimage',
    'patience', 'sabr', 'gratitude', 'shukr', 'forgiveness', 'mercy', 'compassion',
    'knowledge', 'ilm', 'wisdom', 'hikmah', 'guidance', 'hidayah',
    'faith', 'iman', 'belief', 'trust', 'tawakkul', 'reliance',
    'good deeds', 'amal', 'righteousness', 'taqwa', 'piety',
    'family', 'parents', 'children', 'marriage', 'husband', 'wife',
    'neighbors', 'community', 'ummah', 'brotherhood', 'sisterhood',
    'honesty', 'truth', 'lying', 'backbiting', 'gossip',
    'anger', 'patience', 'forgiveness', 'reconciliation',
    'wealth', 'money', 'poverty', 'rich', 'poor',
    'health', 'sickness', 'medicine', 'healing',
    'death', 'funeral', 'burial', 'afterlife',
    'paradise', 'hell', 'judgment', 'accountability',
    'prophet', 'messenger', 'companion', 'sahabah',
    'quran', 'recitation', 'memorization', 'study',
    'mosque', 'masjid', 'congregation', 'jamaah',
    'friday', 'jummah', 'eid', 'celebration',
    'food', 'eating', 'drinking', 'halal', 'haram',
    'clothing', 'dress', 'modesty', 'hijab',
    'business', 'trade', 'commerce', 'work',
    'education', 'learning', 'teaching', 'student'
  ];

  // Extract words that match Islamic keywords
  const words = cleanText.toLowerCase().split(/\s+/);
  const matchedKeywords = words.filter(word =>
    islamicKeywords.some(keyword =>
      word.includes(keyword) || keyword.includes(word)
    )
  );

  // Remove duplicates and return top 5 most relevant terms
  const uniqueKeywords = Array.from(new Set(matchedKeywords));
  return uniqueKeywords.slice(0, 5);
};

// Function to validate and clean AI responses
const validateAndCleanResponse = (response: string): string => {
  if (!response || typeof response !== 'string') {
    return '';
  }

  let cleanedResponse = response.trim();

  // Remove any incomplete sentences at the end
  const sentences = cleanedResponse.split(/[.!?]+/);
  const lastSentence = sentences[sentences.length - 1].trim();

  // If the last sentence is incomplete (less than 3 words or doesn't end with punctuation), remove it
  if (lastSentence.split(' ').length < 3 || !/[.!?]$/.test(cleanedResponse)) {
    // Find the last complete sentence
    const lastCompleteIndex = cleanedResponse.lastIndexOf('.');
    if (lastCompleteIndex > 0) {
      cleanedResponse = cleanedResponse.substring(0, lastCompleteIndex + 1);
    }
  }

  // Remove any fragmented text patterns
  cleanedResponse = cleanedResponse.replace(/\s*\.{2,}\s*/g, '.'); // Remove multiple dots
  cleanedResponse = cleanedResponse.replace(/\s*[a-z]\s*$/gi, ''); // Remove single letters at end
  cleanedResponse = cleanedResponse.replace(/\s+$/g, ''); // Remove trailing whitespace

  return cleanedResponse;
};

// Helper function to combine AI explanation with Tavily contexts (calls server-side API)
const combineAIExplanationWithContexts = async (
  aiExplanation: string,
  contexts: any[],
  reference: string,
  type: 'ayah' | 'hadith',
  userQuery?: string,
  detectedLanguage: string = 'en',
  abortController?: AbortController
): Promise<string> => {
  if (!contexts || contexts.length === 0) {
    return aiExplanation; // Return original if no contexts
  }

  if (!aiExplanation) {
    return ''; // Return empty if no AI explanation
  }

  try {
    const response = await fetch('/api/combine-explanation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aiExplanation,
        contexts,
        reference,
        type,
        userQuery,
        detectedLanguage,
      }),
      signal: abortController?.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error combining explanation:', errorData.error || 'Unknown error');
      return aiExplanation; // Fallback to original
    }

    const data = await response.json();

    if (data.success && data.combinedExplanation) {
      return data.combinedExplanation;
    }

    // Fallback to original explanation if combination failed
    return data.combinedExplanation || aiExplanation;
  } catch (error) {
    // Check if it's an abort error
    if (error instanceof Error && error.name === 'AbortError') {
      throw error; // Re-throw abort errors
    }
    console.error('Error combining AI explanation with contexts:', error);
    return aiExplanation; // Return original on error
  }
};

// Helper function to extract AI explanation text between ayah references
const extractAIExplanationForAyah = (
  response: string,
  ayahMatch: AyahMatch,
  nextAyahMatch?: AyahMatch
): string => {
  const matchIndex = response.indexOf(ayahMatch.originalMatch);
  if (matchIndex === -1) return '';

  const startIndex = matchIndex + ayahMatch.originalMatch.length;
  const endIndex = nextAyahMatch
    ? response.indexOf(nextAyahMatch.originalMatch, startIndex)
    : response.length;

  if (endIndex === -1 || endIndex <= startIndex) return '';

  let explanation = response.substring(startIndex, endIndex).trim();

  // Clean up the explanation
  explanation = explanation
    .replace(/^\s*[.\-•]\s*/gm, '') // Remove leading bullets/dashes
    .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
    .trim();

  // Remove any markdown links or formatting
  explanation = explanation.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // Only return if substantial (at least 20 characters)
  return explanation.length >= 20 ? explanation : '';
};

export const useAIResponse = (textSize: 'small' | 'medium' | 'large' = 'small', selectedContentTypes?: {
  tafsir: boolean;
  hadith: boolean;
  webSearch: boolean;
  suggestedQuestions: boolean;
}) => {
  const isTextLarge = textSize === 'large';
  const generate_response_with_gemini = useCallback(async (prompt: string, abortController?: AbortController): Promise<string> => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt }),
        signal: abortController?.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.response;
    } catch (error) {
      // Check if it's an abort error
      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // Re-throw abort errors
      }
      // Error calling Gemini API - silent fail for security
      throw new Error((error as Error).message || 'Failed to generate response');
    }
  }, []);

  const getPrompt = useCallback((content: string) => {
    // PRODUCTION-GRADE LANGUAGE DETECTION AND VALIDATION
    let detectedLanguage = detectLanguage(content);

    // CRITICAL: Force English for any content that could be English
    const isDefinitelyEnglish = (text: string): boolean => {
      // Check for English structure
      const englishPattern = /^[a-zA-Z0-9\s\.,!?'"()\-:;@#$%&*+=<>[\]{}|\\\/~`]+$/;
      if (!englishPattern.test(text)) return false;

      // Check for English words (including Islamic terms)
      const englishWords = /(what|who|when|where|why|how|is|are|was|were|the|and|or|but|in|on|at|to|for|of|with|by|islam|quran|allah|prophet|muhammad|purpose|life|according|says|about|question|answer|explain|tell|me|please|thank|thanks)/i;
      return englishWords.test(text);
    };

    // FORCE ENGLISH for any content that looks like English
    if (isDefinitelyEnglish(content)) {
      detectedLanguage = 'en';
    }

    // PRODUCTION-GRADE LANGUAGE INSTRUCTIONS
    let languageInstructions = '';
    if (detectedLanguage === 'en') {
      languageInstructions = `\n\n🚨🚨🚨 CRITICAL PRODUCTION REQUIREMENT - ZERO TOLERANCE FOR LANGUAGE INCONSISTENCY 🚨🚨🚨

YOU ARE RESPONDING TO AN ENGLISH QUESTION. YOU MUST FOLLOW THESE RULES EXACTLY:

1. RESPOND ONLY IN ENGLISH - NO OTHER LANGUAGE ALLOWED
2. ALL content must be in English: introduction, explanations, conclusions, suggested questions
3. ONLY Quranic verse references and technical formatting remain in English
4. DO NOT use Arabic, Urdu, or any other language in your response
5. MAINTAIN English consistency throughout the entire response
6. THIS IS A PRODUCTION APPLICATION - ZERO TOLERANCE FOR LANGUAGE MIXING
7. IF YOU MIX LANGUAGES, YOUR RESPONSE WILL BE REJECTED
8. USERS DEPEND ON THIS FOR CRITICAL ISLAMIC RESEARCH - NO MISTAKES ALLOWED

VIOLATION OF THESE RULES WILL RESULT IN RESPONSE REJECTION.`;
    } else {
      languageInstructions = `\n\n🚨🚨🚨 CRITICAL PRODUCTION REQUIREMENT - ZERO TOLERANCE FOR LANGUAGE INCONSISTENCY 🚨🚨🚨

YOU ARE RESPONDING TO A ${detectedLanguage.toUpperCase()} QUESTION. YOU MUST FOLLOW THESE RULES EXACTLY:

1. RESPOND ONLY IN ${detectedLanguage.toUpperCase()} - NO OTHER LANGUAGE ALLOWED
2. ALL content must be in ${detectedLanguage}: introduction, explanations, conclusions, suggested questions
3. ONLY Quranic verse references and technical formatting remain in English
4. DO NOT mix languages - maintain ${detectedLanguage} consistency throughout
5. THIS IS A PRODUCTION APPLICATION - ZERO TOLERANCE FOR LANGUAGE MIXING
6. IF YOU MIX LANGUAGES, YOUR RESPONSE WILL BE REJECTED
7. USERS DEPEND ON THIS FOR CRITICAL ISLAMIC RESEARCH - NO MISTAKES ALLOWED

VIOLATION OF THESE RULES WILL RESULT IN RESPONSE REJECTION.`;
    }

    return `You are an AI-powered Islamic Library with experience as a Quran Scholar/Researcher. Your task is to answer questions by providing authentic references from the Holy Quran.

🚨 CRITICAL: You must format your response exactly as follows AND follow the language requirement above:

Begin with a brief introduction to the topic in a flowing, narrative style. Keep your introduction concise but complete - avoid using bullet points, numbered lists, or any point-based formatting.

Include at least 2-3 relevant Quranic verses in this EXACT format:
[Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})

After each verse reference, provide your AI-generated explanation and interpretation in a natural, flowing paragraph format. Make sure each explanation is complete and properly ends before moving to the next verse. The authentic tafsir will be automatically fetched and displayed.

End with practical guidance or conclusion in a narrative style.

CRITICAL FORMAT REQUIREMENTS:
- Use EXACTLY this format for ayah references: [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})
- Replace {Surah No.} and {Ayah No.} with actual numbers
- Use proper surah names like: Al-Fatiha, Al-Baqarah, Aal-Imran, An-Nisa, Al-Ma'idah, etc.
- DO NOT include the verse text in quotes - only provide the reference format above
- After each verse reference, provide your AI-generated explanation and interpretation in paragraph form
- The authentic tafsir from Islamic scholars will be automatically displayed
- Write in a natural, flowing narrative style without bullet points or numbered lists
- Ensure ALL text is complete and properly formatted - no incomplete sentences or fragmented thoughts

CRITICAL AI EXPLANATION REQUIREMENTS:
- Keep explanations SHORT and CONCISE (3-5 sentences maximum per verse)
- Directly connect the ayah to the user's question in a brief, focused manner
- Be to the point - avoid lengthy elaborations
- Write in flowing prose, not bullet points
- Ensure each explanation is complete but succinct

CRITICAL RESPONSE QUALITY REQUIREMENTS:
- Provide complete, coherent responses
- Avoid fragmented or incomplete sentences
- Ensure all explanations are properly finished
- Do not cut off responses mid-sentence
- Maintain proper grammar and flow throughout
- Write in complete, well-formed sentences
- Avoid any text that appears to be cut off or incomplete

${languageInstructions}

Example format:
[Al-Baqarah: 153](https://alquran.cloud/ayah?reference=2:153)

This verse directly addresses your question about patience by teaching us that Allah's divine support is guaranteed for those who remain steadfast. When you asked about how to handle difficult situations, this verse provides the answer: maintain patience and trust that Allah will be with you. This is not just about waiting passively, but about actively maintaining faith and trust in Allah's plan while facing your challenges.

Question: ${content}`;
  }, []);

  const formatResponse = useCallback(async (response: string, userQuery?: string, currentTextSize?: 'small' | 'medium' | 'large', contentTypes?: {
    tafsir: boolean;
    hadith: boolean;
    webSearch: boolean;
    suggestedQuestions: boolean;
  }, abortController?: AbortController, isAborted?: () => boolean, setCurrentStep?: (step: ProgressStep) => void) => {
    // Get global abort manager
    const abortManager = getGlobalAbortManager();

    // Check if operation was aborted at the very beginning - IMMEDIATE RETURN
    if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
      console.log('formatResponse - Operation aborted at start, returning early');
      return response;
    }

    // First, validate that the response is complete and properly formatted
    const validatedResponse = validateAndCleanResponse(response);

    // Check if web search is enabled
    const isWebSearchEnabled = contentTypes?.webSearch === true || selectedContentTypes?.webSearch === true;

    // Find all ayah references using universal detection system
    const ayahMatches = detectAyahReferences(validatedResponse);

    // Check if operation was aborted before processing ayahs
    if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
      console.log('formatResponse - Operation aborted before processing ayahs');
      return response;
    }

    // Extract AI explanations for each ayah BEFORE processing (since replacement removes the text)
    // ALWAYS extract explanations so they can be displayed below ayah boxes
    const ayahAIExplanations = new Map<string, string>();
    let responseWithExplanationsRemoved = validatedResponse;

    // Always extract AI explanations for each ayah
    ayahMatches.forEach((ayahMatch, index) => {
      const nextAyahMatch = index < ayahMatches.length - 1 ? ayahMatches[index + 1] : undefined;
      const aiExplanation = extractAIExplanationForAyah(validatedResponse, ayahMatch, nextAyahMatch);
      if (aiExplanation) {
        // Store by surah:ayah reference
        const surahNumber = getSurahNumber(ayahMatch.surahName.trim());
        if (surahNumber) {
          const reference = `${surahNumber}:${ayahMatch.ayahNumber}`;
          ayahAIExplanations.set(reference, aiExplanation);

          // Remove the original AI explanation from response text to prevent duplicate display
          // Only remove when web search is enabled (to show combined version) OR always remove (to show in dedicated section)
          const matchIndex = validatedResponse.indexOf(ayahMatch.originalMatch);
          if (matchIndex !== -1) {
            const startIndex = matchIndex + ayahMatch.originalMatch.length;
            const endIndex = nextAyahMatch
              ? validatedResponse.indexOf(nextAyahMatch.originalMatch, startIndex)
              : validatedResponse.length;

            if (endIndex > startIndex) {
              // Extract the text between ayah references
              const textBetween = validatedResponse.substring(startIndex, endIndex);
              // Remove the AI explanation part (keep any other content if needed)
              const cleanedText = textBetween.replace(aiExplanation.trim(), '').trim();
              // Update the response
              responseWithExplanationsRemoved = responseWithExplanationsRemoved.replace(
                textBetween,
                cleanedText
              );
            }
          }
        }
      }
    });

    // Always use response with explanations removed (they'll be added back in the dedicated section)
    const responseForProcessing = responseWithExplanationsRemoved;

    setCurrentStep?.('fetching_ayahs');

    // Collect all ayah references for batch context fetching
    const ayahContextRequests: Array<{
      type: 'ayah';
      reference: string;
      surahName: string;
      ayahNumber: string;
      surahNumber: string;
      match: AyahMatch;
      index: number;
    }> = [];

    // Process each ayah with tafsir data (without contexts first)
    const ayahReplacements = await Promise.all(
      ayahMatches.map(async (match: AyahMatch, index: number) => {
        // Check if operation was aborted before processing each ayah
        if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
          console.log('formatResponse - Ayah processing aborted, skipping ayah:', match.surahName);
          return {
            match: match.originalMatch,
            replacement: match.originalMatch
          };
        }
        const { verseText, surahName, ayahNumber, url } = match;

        const surahNumber = getSurahNumber(surahName.trim());
        if (!surahNumber) {
        }
        const finalSurahNumber = surahNumber || 1;

        // Handle verse ranges (e.g., "1-11" -> fetch ayahs 1 through 11)
        const ayahNumberStr = ayahNumber.toString();
        const isRange = ayahNumberStr.includes('-');

        let finalVerseText;
        let audioRange = '';
        let ayahNum: number;
        let globalAyahNumber: number;
        let ayahId: string;

        if (isRange) {
          // Handle range: e.g., "1-11" -> fetch ayahs 1 through 11
          const [startAyah, endAyah] = ayahNumberStr.split('-').map(num => parseInt(num.trim()));
          ayahNum = startAyah; // Use start ayah for tafsir
          globalAyahNumber = calculateGlobalAyahNumber(finalSurahNumber, ayahNum);
          ayahId = `ayah-${finalSurahNumber}-${startAyah}-${endAyah}-${Date.now()}`;

          // Set audio range for the player
          audioRange = `${startAyah}-${endAyah}`;


          // Fetch range text from API
          if (verseText) {
            // Legacy support: if AI somehow still provides text, use it
            finalVerseText = verseText;
          } else {
            // Normal mode: fetch range from API
            try {
              // Check if operation was aborted before API call
              if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
                console.log('formatResponse - Ayah range API call aborted, using fallback');
                finalVerseText = `[${surahName} ${ayahNumberStr}]`;
              } else {
                console.log('formatResponse - Making ayah range API call:', `/api/ayah-range?surah=${finalSurahNumber}&startAyah=${startAyah}&endAyah=${endAyah}`);
                const response = await fetch(`/api/ayah-range?surah=${finalSurahNumber}&startAyah=${startAyah}&endAyah=${endAyah}`, {
                  signal: abortController?.signal
                });
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.text) {
                    finalVerseText = data.text;
                  } else {
                    finalVerseText = `[${surahName} ${ayahNumberStr}]`;
                  }
                } else {
                  finalVerseText = `[${surahName} ${ayahNumberStr}]`;
                }
              }
            } catch (error) {
              console.log('formatResponse - Ayah range API call failed:', error);
              finalVerseText = `[${surahName} ${ayahNumberStr}]`;
            }
          }
        } else {
          // Handle single ayah
          ayahNum = parseInt(ayahNumberStr);
          globalAyahNumber = calculateGlobalAyahNumber(finalSurahNumber, ayahNum);
          ayahId = `ayah-${finalSurahNumber}-${ayahNum}-${Date.now()}`;

          // Fetch single ayah text from API
          if (verseText) {
            // Legacy support: if AI somehow still provides text, use it
            finalVerseText = verseText;
          } else {
            // Normal mode: fetch from API
            try {
              // Check if operation was aborted before API call
              if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
                console.log('formatResponse - Ayah text API call aborted, using fallback');
                finalVerseText = `[${surahName} ${ayahNumberStr}]`;
              } else {
                console.log('formatResponse - Making ayah text API call:', `/api/ayah-text?globalAyah=${globalAyahNumber}`);
                const response = await fetch(`/api/ayah-text?globalAyah=${globalAyahNumber}`, {
                  signal: abortController?.signal
                });
                if (response.ok) {
                  const data = await response.json();
                  if (data.success && data.text) {
                    finalVerseText = data.text;
                  } else {
                    finalVerseText = `[${surahName} ${ayahNumberStr}]`;
                  }
                } else {
                  finalVerseText = `[${surahName} ${ayahNumberStr}]`;
                }
              }
            } catch (error) {
              console.log('formatResponse - Ayah text API call failed:', error);
              finalVerseText = `[${surahName} ${ayahNumberStr}]`;
            }
          }
        }

        // Fetch tafsir data only if tafsir is selected
        let tafsirData;
        if (contentTypes?.tafsir !== false && !abortManager.isAborted() && !isAborted?.() && !abortController?.signal.aborted) {
          setCurrentStep?.('fetching_tafsir');
          if (isRange) {
            // Fetch combined tafsir for range
            const [startAyah, endAyah] = ayahNumberStr.split('-').map(num => parseInt(num.trim()));
            tafsirData = await fetchTafsirRange(finalSurahNumber, startAyah, endAyah);
          } else {
            // Fetch single ayah tafsir
            tafsirData = await fetchTafsir(finalSurahNumber, ayahNum);
          }
        }

        // Create reference for this ayah
        const ayahReference = `${finalSurahNumber}:${ayahNumberStr}`;

        // Store context request for batch fetching
        ayahContextRequests.push({
          type: 'ayah',
          reference: ayahReference,
          surahName: surahName,
          ayahNumber: ayahNumberStr,
          surahNumber: finalSurahNumber.toString(),
          match,
          index,
        });

        // Return replacement without context for now
        let contextHTML = '';

        // Generate tafsir buttons and content
        let tafsirButtonsHTML = '';
        let tafsirContentHTML = '';

        if (tafsirData && tafsirData.tafsirs && tafsirData.tafsirs.length > 0) {
          tafsirButtonsHTML = `
            <div class="flex items-center gap-3 w-full">
               <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex-shrink-0">Tafsir Sources:</span>
               <div class="flex flex-wrap gap-2 flex-1">`;

          tafsirData.tafsirs.forEach((tafsir, index) => {
            const tafsirId = `tafsir-${ayahId}-${index}`;
            const formattedContent = tafsir.content
              .replace(/\n/g, '<br>')
              .replace(/##\s*(.*?)$/gm, '<h5 class="text-gray-800 dark:text-gray-200 mt-3 mb-2 font-bold">$1</h5>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-gray-100">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>');

            // Simplified button: Minimalist Pill with orange active state
            tafsirButtonsHTML += `
              <button 
                data-tafsir-id="${tafsirId}"
                data-ayah-container="${ayahId}"
                class="tafsir-toggle-btn px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-400 hover:border-orange-400 hover:text-orange-500 dark:hover:border-orange-500 dark:hover:text-orange-400 transition-all duration-200 focus:outline-none data-[active=true]:bg-orange-500 data-[active=true]:text-white data-[active=true]:border-orange-500"
              >
                ${tafsir.author}
              </button>`;

            // Minimal professional design - clean and simple
            tafsirContentHTML += `
              <div id="${tafsirId}" class="tafsir-content w-full hidden">
                <div class="relative bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 md:p-6">
                   <div class="flex items-center justify-between mb-4">
                     <h5 class="text-sm font-semibold text-gray-900 dark:text-gray-100">${tafsir.author}</h5>
                     <button data-tafsir-id="${tafsirId}" class="tafsir-close-btn text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1">
                       <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                   </div>
                   <div class="text-gray-600 dark:text-gray-400 leading-relaxed ${textSize === 'large' ? 'text-base' : textSize === 'medium' ? 'text-sm' : 'text-sm'}">
                      ${formattedContent}
                   </div>
                </div>
              </div>`;
          });

          tafsirButtonsHTML += `
               </div>
            </div>`;
        } else {
          tafsirButtonsHTML = ``; // Hide section if no tafsir
        }

        return {
          match: match.originalMatch,
          replacement: `<div class="stylish-ayah-reference my-12 max-w-none w-full bg-transparent" data-ayah-id="${ayahId}" data-global-ayah="${globalAyahNumber}" data-surah-name="${surahName}" data-ayah-number="${ayahNumber}" data-surah-number="${finalSurahNumber}" data-is-range="${isRange}" data-audio-range="${audioRange}">
            <div class="bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden w-full relative group transition-all duration-300">
              <!-- Header: Minimalist -->
              <div class="px-5 py-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800/50">
                <!-- Left: Surah Info -->
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center border border-gray-100 dark:border-gray-800">
                    <span class="font-[var(--font-amiri)] text-lg text-emerald-600 dark:text-emerald-500 pt-1">۞</span>
                  </div>
                  <div>
                    <h3 class="${(currentTextSize ?? textSize) === 'large' ? 'text-lg' : (currentTextSize ?? textSize) === 'medium' ? 'text-base' : 'text-sm'} font-bold text-gray-900 dark:text-gray-100 font-[var(--font-amiri)] tracking-wide">${surahName}</h3>
                    <p class="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase">Verse ${ayahNumberStr}</p>
                  </div>
                </div>

                <!-- Right: Actions -->
                <div class="flex items-center gap-2">
                   <!-- Language Toggle -->
                   <button class="ayah-language-toggle-btn w-8 h-8 rounded-full hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors flex items-center justify-center" 
                          data-ayah-id="${ayahId}" 
                          data-is-range="${isRange}" 
                          data-surah="${finalSurahNumber}" 
                          data-ayah="${isRange ? audioRange : ayahNumberStr}" 
                          data-global-ayah="${globalAyahNumber}"
                          type="button"
                          title="Toggle Arabic/Translation">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Ayah Text -->
              <div class="p-6 sm:p-8 bg-gradient-to-b from-white to-gray-50/30 dark:from-gray-950 dark:to-gray-900/20">
                <div class="relative text-center">
                  <span class="absolute -top-4 -left-2 text-6xl text-gray-100 dark:text-gray-800 opacity-50 font-serif leading-none select-none">"</span>
                  <blockquote class="${(currentTextSize ?? textSize) === 'large' ? 'text-3xl lg:text-4xl' : (currentTextSize ?? textSize) === 'medium' ? 'text-2xl lg:text-3xl' : 'text-xl lg:text-2xl'} text-gray-800 dark:text-gray-100 font-[var(--font-amiri)] leading-[2] lg:leading-[2.2] px-4 py-2 relative z-10" dir="rtl">
                    ${finalVerseText}
                  </blockquote>
                  <span class="absolute -bottom-8 -right-2 text-6xl text-gray-100 dark:text-gray-800 opacity-50 font-serif leading-none select-none transform rotate-180">"</span>
                </div>
              </div>
              
              <!-- Footer: Audio Only -->
              <div class="px-5 py-4 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-50 dark:border-gray-800/50">
                <!-- Audio Player (Compact) -->
                <div class="flex items-center gap-4">
                   <button class="ayah-audio-play-btn play-state w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200" data-surah="${finalSurahNumber}" data-ayah="${isRange ? audioRange : ayahNumberStr}" data-range="${isRange ? 'true' : 'false'}" type="button">
                      <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                   </button>
                   
                   <!-- Waveform -->
                   <div class="flex-1 h-8 flex items-end gap-[2px] opacity-40 hover:opacity-100 transition-opacity cursor-pointer group/wave" data-surah="${finalSurahNumber}" data-ayah="${isRange ? audioRange : ayahNumberStr}" data-range="${isRange ? 'true' : 'false'}">
                      ${Array.from({ length: 40 }).map((_, i) => `<div class="wave-bar flex-1 bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-300" style="height: ${Math.max(20, Math.random() * 100)}%" data-bar="${i}"></div>`).join('')}
                   </div>
                </div>
              </div>
            </div>
          </div>
          
          ${tafsirButtonsHTML ? `
          <!-- Tafsir Section (Completely Outside Ayah Box) -->
          <div class="tafsir-section mt-4 mb-8" data-tafsir-for="${ayahId}">
            <div class="bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <div class="flex items-center gap-3 flex-wrap">
                <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tafsir:</span>
                <div class="flex flex-wrap gap-2">
                  ${tafsirButtonsHTML.replace(/<div class="flex items-center gap-3 w-full">[\s\S]*?<div class="flex flex-wrap gap-2 flex-1">/, '').replace(/<\/div>\s*<\/div>$/, '')}
                </div>
              </div>
            </div>
            
            <!-- Tafsir Content Container -->
            <div class="tafsir-content-container mt-3">
              ${tafsirContentHTML ? tafsirContentHTML : ''}
            </div>
          </div>
          ` : ''}
          __CONTEXT_PLACEHOLDER__`,
          reference: ayahReference, // Store reference for matching contexts
        };
      })
    );

    // Fetch all ayah contexts in a single batch request (only if webSearch is enabled)
    const ayahContextMap = new Map<string, any[]>();
    const isAyahWebSearchEnabled = contentTypes?.webSearch === true || selectedContentTypes?.webSearch === true;
    if (ayahContextRequests.length > 0 && isAyahWebSearchEnabled) {
      setCurrentStep?.('web_search_ayahs');
      try {
        const batchResponse = await fetch('/api/context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batch: ayahContextRequests.map(req => ({
              type: req.type,
              reference: req.reference,
              surahName: req.surahName,
              ayahNumber: req.ayahNumber,
              surahNumber: req.surahNumber,
            })),
          }),
        });

        if (batchResponse.ok) {
          const batchData = await batchResponse.json();
          if (batchData.success && batchData.results) {
            batchData.results.forEach((result: any) => {
              if (result.contexts && result.contexts.length > 0) {
                ayahContextMap.set(result.reference, result.contexts);
              }
            });
          }
        }
      } catch (error) {
        console.log('Batch context fetch failed for ayahs:', error);
      }
    }

    // Helper function to generate context HTML
    const generateContextHTML = (contexts: any[]) => {
      if (!contexts || contexts.length === 0) return '';

      const getHostname = (url: string) => {
        try {
          return new URL(url).hostname.replace('www.', '');
        } catch {
          return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace('www.', '');
        }
      };

      return `
            <div class="ayah-context-section mt-6 mb-8 w-full">
              <h5 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 ml-1">References</h5>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                ${contexts.map((context: any) => `
                  <a 
                    href="${context.url}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    class="group flex flex-col h-24 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 overflow-hidden relative"
                  >
                    <div class="flex h-full">
                      <div class="w-12 h-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 border-r border-gray-100 dark:border-gray-800/50 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                        <svg class="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div class="flex-1 p-3 min-w-0 flex flex-col justify-center">
                          <h6 class="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1">
                            ${context.title}
                          </h6>
                          <p class="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-1">
                            ${context.snippet}
                          </p>
                          <div class="text-[10px] text-gray-400 dark:text-gray-500 truncate flex items-center gap-1 mt-auto">
                            <span>${getHostname(context.url)}</span>
                            <span class="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                            <span class="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 dark:text-emerald-500 font-medium">Visit &rarr;</span>
                          </div>
                      </div>
                    </div>
                  </a>
                `).join('')}
              </div>
            </div>`;
    };

    // Update ayah replacements with contexts from batch
    // Match by reference instead of index to ensure correct mapping
    const detectedLanguage = userQuery ? detectLanguage(userQuery) : 'en';

    if (ayahReplacements.length > 0) {
      setCurrentStep?.('writing_explanation');
    }

    const updatedAyahReplacements = await Promise.all(
      ayahReplacements.map(async (replacement) => {
        // Find the matching context request by reference stored in replacement
        const reference = (replacement as any).reference;
        if (reference) {
          const contexts = ayahContextMap.get(reference);

          // Get the AI explanation from the pre-extracted map
          const aiExplanation = ayahAIExplanations.get(reference);

          // Determine what explanation to show
          let finalExplanation = '';

          if (isWebSearchEnabled && contexts && contexts.length > 0 && aiExplanation) {
            // Web search enabled with contexts: combine AI explanation with contexts
            finalExplanation = await combineAIExplanationWithContexts(
              aiExplanation,
              contexts,
              reference,
              'ayah',
              userQuery,
              detectedLanguage,
              abortController
            );
          } else if (aiExplanation) {
            // No web search or no contexts: just use the original AI explanation
            finalExplanation = aiExplanation;
          }

          // Always generate context HTML if contexts exist
          const contextHTML = contexts && contexts.length > 0
            ? generateContextHTML(contexts)
            : '';

          // Create explanation HTML if available
          // STRICTLY match the text size with general content text size (same as ResponseSection)
          const textSizeClass = (currentTextSize ?? textSize) === 'large' ? 'text-xl' : (currentTextSize ?? textSize) === 'medium' ? 'text-lg' : 'text-base';
          const explanationHTML = finalExplanation
            ? `<div class="mt-6 ayah-explanation ${textSizeClass} text-gray-700 dark:text-gray-300 leading-relaxed">
                ${finalExplanation}
              </div>`
            : '';

          // Replace placeholder with: context links first, then explanation
          // Order: ayah box → context links → explanation
          let updatedReplacement = replacement.replacement.replace(
            '__CONTEXT_PLACEHOLDER__',
            contextHTML + explanationHTML
          );


          return {
            match: replacement.match,
            replacement: updatedReplacement,
          };
        }
        // Remove placeholder if no context or no reference
        const updatedReplacement = replacement.replacement.replace('__CONTEXT_PLACEHOLDER__', '');
        return {
          match: replacement.match,
          replacement: updatedReplacement,
        };
      })
    );

    // Apply all ayah replacements using the cleaned response
    let processedText = responseForProcessing;
    updatedAyahReplacements.forEach(({ match, replacement }) => {
      processedText = processedText.replace(match, replacement);
    });

    // Check if operation was aborted before processing hadiths
    if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
      console.log('formatResponse - Operation aborted before processing hadiths');
      return processedText;
    }

    // Process hadith references only if hadith is selected
    let hadithReferences: any[] = [];
    let intelligentHadiths: HadithData[] = [];

    if (contentTypes?.hadith !== false && !abortManager.isAborted() && !isAborted?.() && !abortController?.signal.aborted) {
      setCurrentStep?.('fetching_hadith');
      hadithReferences = extractHadithReferences(processedText);

      // Intelligent hadith search based on user query
      try {
        if (userQuery && userQuery.trim()) {
          console.log('formatResponse - Making hadith search API call for:', userQuery.trim());
          intelligentHadiths = await searchHadiths(userQuery.trim(), 3);
        }
      } catch (error) {
        console.log('formatResponse - Hadith search API call failed:', error);
      }
    }

    // Collect all hadith references for batch context fetching
    const hadithContextRequests: Array<{
      type: 'hadith';
      reference: string;
      bookName: string;
      hadithNumber: string;
      bookSlug: string;
    }> = [];

    // Process each hadith reference (collect contexts first)
    const hadithDataMap = new Map<number, HadithData>();
    const hadithReplacements = await Promise.all(
      hadithReferences.map(async (ref, index) => {
        // Check if operation was aborted before processing each hadith
        if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
          return {
            match: ref.originalMatch,
            replacement: ref.originalMatch
          };
        }

        try {
          // Try to fetch specific hadith first
          const bookSlug = ref.bookName.toLowerCase().replace(/\s+/g, '-');
          const hadith = await searchHadiths(`${ref.bookName} ${ref.hadithNumber}`, 1);

          if (hadith && hadith.length > 0) {
            const hadithData = hadith[0];
            hadithDataMap.set(index, hadithData);

            // Store context request
            const formatted = hadithData.hadithNumber?.toString() || ref.hadithNumber;
            // Get book name from formatted hadith or ref
            const bookNameForContext = (hadithData as any).bookName || ref.bookName || 'Hadith';
            hadithContextRequests.push({
              type: 'hadith',
              reference: `${hadithData.bookSlug}-${hadithData.hadithNumber}`,
              bookName: bookNameForContext,
              hadithNumber: formatted,
              bookSlug: hadithData.bookSlug,
            });

            // Return replacement without context for now
            return {
              match: ref.originalMatch,
              replacement: '__HADITH_PLACEHOLDER__', // Placeholder to replace later
            };
          } else {
            // Fallback: create a simple reference link
            return {
              match: ref.originalMatch,
              replacement: `<span class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors duration-200 font-medium text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2L2 7L12 12L22 7L12 2Z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 17L12 22L22 17"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12L12 17L22 12"/>
                </svg>
                ${ref.bookName} ${ref.hadithNumber}
              </span>`
            };
          }
        } catch (error) {
          return {
            match: ref.originalMatch,
            replacement: `<span class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors duration-200 font-medium text-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2L2 7L12 12L22 7L12 2Z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 17L12 22L22 17"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12L12 17L22 12"/>
              </svg>
              ${ref.bookName} ${ref.hadithNumber}
            </span>`
          };
        }
      })
    );

    // Add intelligent hadiths context requests
    intelligentHadiths.forEach((hadith, index) => {
      const formatted = hadith.hadithNumber?.toString() || '';
      hadithContextRequests.push({
        type: 'hadith',
        reference: `${hadith.bookSlug}-${hadith.hadithNumber}`,
        bookName: hadith.book?.bookName || hadith.collectionName || 'Hadith',
        hadithNumber: formatted,
        bookSlug: hadith.bookSlug,
      });
    });

    // Batch fetch all hadith contexts (only if webSearch is enabled)
    const hadithContextMap = new Map<string, any[]>();
    const isHadithWebSearchEnabled = contentTypes?.webSearch === true || selectedContentTypes?.webSearch === true;
    if (hadithContextRequests.length > 0 && isHadithWebSearchEnabled) {
      setCurrentStep?.('web_search_hadith');
      try {
        const batchResponse = await fetch('/api/context', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            batch: hadithContextRequests,
          }),
        });

        if (batchResponse.ok) {
          const batchData = await batchResponse.json();
          if (batchData.success && batchData.results) {
            batchData.results.forEach((result: any) => {
              if (result.contexts && result.contexts.length > 0) {
                hadithContextMap.set(result.reference, result.contexts);
              }
            });
          }
        }
      } catch (error) {
        console.log('Batch context fetch failed for hadiths:', error);
      }
    }

    // Update hadith replacements with contexts
    if (hadithContextRequests.length > 0) {
      setCurrentStep?.('writing_hadith_explanation');
    }
    const updatedHadithReplacements = await Promise.all(
      hadithReplacements.map(async (replacement, index) => {
        if (replacement.replacement === '__HADITH_PLACEHOLDER__') {
          const hadithData = hadithDataMap.get(index);
          if (hadithData) {
            const reference = `${hadithData.bookSlug}-${hadithData.hadithNumber}`;
            const contexts = hadithContextMap.get(reference) || [];

            // Combine AI summary with contexts if web search is enabled
            let combinedSummary = hadithData.aiSummary || '';
            if (isWebSearchEnabled && contexts && contexts.length > 0 && hadithData.aiSummary) {
              combinedSummary = await combineAIExplanationWithContexts(
                hadithData.aiSummary,
                contexts,
                reference,
                'hadith',
                userQuery,
                detectedLanguage,
                abortController
              );
            }

            // Create a copy of hadith data with combined summary
            const hadithDataWithCombinedSummary = {
              ...hadithData,
              aiSummary: combinedSummary
            };

            // Always show contexts (even when combined with summary)
            const hadithBoxHTML = generateHadithBoxHTML(
              hadithDataWithCombinedSummary,
              index,
              currentTextSize ?? textSize,
              contexts
            );
            return {
              match: replacement.match,
              replacement: hadithBoxHTML,
            };
          }
        }
        return replacement;
      })
    );

    // Apply hadith replacements
    updatedHadithReplacements.forEach(({ match, replacement }) => {
      processedText = processedText.replace(match, replacement);
    });

    // Add intelligent hadiths at the end of the response only if hadith is selected
    if (contentTypes?.hadith !== false && intelligentHadiths.length > 0) {
      const intelligentHadithsHTML = await Promise.all(
        intelligentHadiths.map(async (hadith, index) => {
          const reference = `${hadith.bookSlug}-${hadith.hadithNumber}`;
          const contexts = hadithContextMap.get(reference) || [];

          // Combine AI summary with contexts if web search is enabled
          let combinedSummary = hadith.aiSummary || '';
          if (isWebSearchEnabled && contexts && contexts.length > 0 && hadith.aiSummary) {
            combinedSummary = await combineAIExplanationWithContexts(
              hadith.aiSummary,
              contexts,
              reference,
              'hadith',
              userQuery,
              detectedLanguage,
              abortController
            );
          }

          // Create a copy of hadith data with combined summary
          const hadithDataWithCombinedSummary = {
            ...hadith,
            aiSummary: combinedSummary
          };

          // Always show contexts (even when combined with summary)
          return generateHadithBoxHTML(
            hadithDataWithCombinedSummary,
            index + 1000,
            currentTextSize ?? textSize,
            contexts
          ); // Use high index to avoid conflicts
        })
      );

      const intelligentHadithsHTMLString = intelligentHadithsHTML.join('');

      processedText += `
         <div class="mt-12 mb-6">
           <!-- Universal Related Hadiths Title -->
           <h3 class="section-heading text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 font-[var(--font-amiri)] tracking-wide flex items-center gap-3">
              <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 19.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                 </svg>
              </span>
              Related Hadiths
           </h3>
           <div class="space-y-8">
             ${intelligentHadithsHTMLString}
           </div>
         </div>
      `;
    } else {
    }

    // FALLBACK: Convert any remaining ayah references to simple inline links
    // This ensures ALL ayah references are displayed as clickable links
    const fallbackAyahPattern = /"([^"]+)"\s*\[([^:]+)\:\s*(\d+(?:-\d+)?)\]\((https?:\/\/[^\s)]+)\)/g;
    processedText = processedText.replace(fallbackAyahPattern, (match, verseText, surahName, ayahNumber, url) => {
      // Convert to simple inline format: "verse text" [Surah Name: Ayah Number](link)
      return `"${verseText}" <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline decoration-green-500 hover:decoration-green-600 transition-colors duration-200 font-medium">[${surahName}: ${ayahNumber}]</a>`;
    });

    // Also handle unquoted ayah references as fallback
    const fallbackUnquotedPattern = /\[([^:]+)\:\s*(\d+(?:-\d+)?)\]\((https?:\/\/[^\s)]+)\)/g;
    processedText = processedText.replace(fallbackUnquotedPattern, (match, surahName, ayahNumber, url) => {
      // Convert to simple inline format: [Surah Name: Ayah Number](link)
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 underline decoration-green-500 hover:decoration-green-600 transition-colors duration-200 font-medium">[${surahName}: ${ayahNumber}]</a>`;
    });

    // Continue with other formatting
    processedText = processedText
      // Format section headers with enhanced styling
      .replace(/^#{1,3}\s*(.+)$/gm, '<h3 class="section-heading text-2xl font-bold text-gray-900 dark:text-gray-100 mt-10 mb-5 pb-3 font-[var(--font-amiri)] tracking-wide relative after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-16 after:h-0.5 after:bg-emerald-500 dark:after:bg-emerald-400">$1</h3>')
      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
      // Format italic text
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700 dark:text-gray-300 font-serif">$1</em>')
      // Format underlined text
      .replace(/\_\_([^_]+)\_\_/g, '<span class="border-b-2 border-emerald-200 dark:border-emerald-800 pb-0.5">$1</span>')

      // Format numbered lists with enhanced styling and spacing
      .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="mb-4 flex items-start pl-2"><span class="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold mr-3 mt-1 flex-shrink-0">$1</span><span class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed flex-1">$2</span></div>')

      // Format bullet points
      .replace(/^[-•]\s+(.+)$/gm, '<div class="mb-3 flex items-start pl-2"><span class="w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full mr-4 mt-2.5 flex-shrink-0"></span><span class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed flex-1">$1</span></div>')

      // Format specific Islamic terms with minimalistic underlines
      .replace(/Allah\s*\(SWT\)/g, '<span class="font-medium text-emerald-700 dark:text-emerald-400">Allah (SWT)</span>')
      .replace(/Allah\s*SWT/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Allah SWT</span>')
      .replace(/Prophet Muhammad\s*\(PBUH\)/g, '<span class="font-medium text-emerald-700 dark:text-emerald-400">Prophet Muhammad (PBUH)</span>')
      .replace(/Prophet Muhammad\s*PBUH/g, '<span class="underline decoration-emerald-400 dark:decoration-emerald-500 underline-offset-2">Prophet Muhammad PBUH</span>')
      .replace(/\(peace be upon him\)/g, '<span class="text-sm text-gray-600 dark:text-gray-400 font-medium">(peace be upon him)</span>')
      .replace(/Muhammad\s*\(PBUH\)/g, '<span class="underline decoration-emerald-400 dark:decoration-emerald-500 underline-offset-2">Muhammad (PBUH)</span>')
      .replace(/Muhammad\s*PBUH/g, '<span class="underline decoration-emerald-400 dark:decoration-emerald-500 underline-offset-2">Muhammad PBUH</span>')
      .replace(/Allah\s*\(Subhanahu wa Ta\'ala\)/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Allah (Subhanahu wa Ta\'ala)</span>')
      .replace(/Allah\s*Subhanahu wa Ta\'ala/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Allah Subhanahu wa Ta\'ala</span>')

      // Format Explanation headers with distinctive styling
      .replace(/^(Explanation):?\s*$/gmi,
        '<div class="explanation-section mt-10 mb-6"><h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 font-[var(--font-amiri)] mb-2 flex items-center gap-2"><span class="text-emerald-500 text-xl">💡</span> Explanation</h3></div>')

      // Format Tafsir/Tafseer headers with simple styling (matching AI Explanation design)
      .replace(/^(Tafs[ie]r):?\s*$/gmi,
        `<div class="tafsir-section mt-10 mb-6"><h3 class="${textSize === 'large' ? 'text-2xl' : textSize === 'medium' ? 'text-xl' : 'text-lg'} font-bold text-gray-900 dark:text-gray-100 font-[var(--font-amiri)]">Scholarly Tafsir</h3></div>`)

      // Format AI Explanation sections with simple styling (cleaner)
      .replace(/\[AI Explanation:\s*([\s\S]*?)\]/gi,
        `<div class="mt-4 mb-8 pl-5 border-l-2 border-emerald-500/30 dark:border-emerald-500/20"><div class="text-gray-700 dark:text-gray-300 leading-relaxed ${textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'}">$1</div></div>`)

      // Format Authentic Tafsir sections with simple styling
      .replace(/\[Authentic Tafsir:\s*([\s\S]*?)\]/g,
        `<div class="authentic-tafsir-section mt-6 mb-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800"><h4 class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Authentic Tafsir</h4><div class="text-gray-700 dark:text-gray-300 leading-relaxed ${textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'}">$1</div></div>`)

      // Clean up any remaining formatting markers
      .replace(/###\s*Quran GPT's Answer:?\s*/gi, '')
      // Format other common section headers with enhanced styling
      .replace(/^(Introduction|Additional Information|References|Conclusion):?\s*$/gmi,
        '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-4 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')

      // Format Quranic section headers with simple styling
      .replace(/Allah\s*\(SWT\)\s*says\s*in\s*the\s*(Glorious\s*)?Quran:?/gi,
        '<div class="my-8 p-4 border-l-4 border-gray-300 dark:border-gray-600 pl-4"><h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Allah (SWT) says in the Glorious Quran:</h3></div>')

      // Clean up any remaining formatting markers
      .replace(/###\s*Quran GPT's Answer:?\s*/gi, '')
      .replace(/^\s*[\r\n]+/gm, '') // Remove empty lines
      .replace(/\n{3,}/g, '\n\n'); // Limit consecutive line breaks

    // Generate suggested questions if the option is enabled
    if ((contentTypes?.suggestedQuestions || selectedContentTypes?.suggestedQuestions) && !abortManager.isAborted() && !isAborted?.() && !abortController?.signal.aborted) {
      setCurrentStep?.('generating_questions');
      try {
        // Detect language from user query
        const detectedLanguage = userQuery ? detectLanguage(userQuery) : 'en';

        console.log('formatResponse - Making suggested questions API call');
        const suggestedQuestionsResponse = await fetch('/api/suggested-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userQuestion: userQuery || '',
            language: detectedLanguage
          }),
          signal: abortController?.signal
        });

        if (suggestedQuestionsResponse.ok) {
          const suggestedData = await suggestedQuestionsResponse.json();
          if (suggestedData.success && suggestedData.questions && suggestedData.questions.length > 0) {

            // Add suggested questions to the response
            const suggestedQuestionsHTML = suggestedData.questions.map((question: string, index: number) =>
              `<div class="suggested-question-item group relative p-5 bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 cursor-pointer overflow-hidden" data-suggested-question="true">
                <div class="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <div class="flex items-start gap-4">
                  <div class="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                    <span class="text-emerald-600 dark:text-emerald-400 font-bold text-sm">${index + 1}</span>
                  </div>
                  <p class="text-gray-700 dark:text-gray-300 font-medium leading-relaxed pr-6 ${textSize === 'large' ? 'text-lg' : textSize === 'medium' ? 'text-base' : 'text-sm'}">${question}</p>
                </div>
              </div>`
            ).join('');

            processedText += `
              <div class="suggested-questions-section mt-12 mb-8">
                <h3 class="section-heading text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 font-[var(--font-amiri)] tracking-wide flex items-center gap-3">
                   <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                   </span>
                   Suggested Questions
                </h3>
                <div class="grid grid-cols-1 gap-4">
                  ${suggestedQuestionsHTML}
                </div>
              </div>
            `;
          }
        }
      } catch (error) {
        console.log('formatResponse - Suggested questions API call failed:', error);
        // Don't fail the main response if suggested questions fail
      }
    }

    return processedText;
  }, [textSize, selectedContentTypes]);

  const askQuran = useCallback(async (
    content: string,
    setIsProcessing: (processing: boolean) => void,
    setSummary: (summary: string) => void,
    setShowSummary: (show: boolean) => void,
    setError: (error: string) => void,
    setDisplayedContent: (content: string) => void,
    setCurrentLanguage: (lang: string) => void,
    setShowTranslateSection?: (show: boolean) => void,
    setCurrentStep?: (step: ProgressStep | null) => void,
    contentTypes?: {
      tafsir: boolean;
      hadith: boolean;
      webSearch: boolean;
      suggestedQuestions: boolean;
    },
    abortController?: AbortController,
    isAborted?: () => boolean
  ) => {
    // Get global abort manager
    const abortManager = getGlobalAbortManager();
    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      setError('Please enter a question');
      return;
    }

    // PRODUCTION: Force English detection for any content that could be English
    const detectedLanguage = detectLanguage(trimmedContent);

    // Audio cleanup is now handled in ResponseSection component

    // Activate chat mode
    setIsProcessing(true);
    setSummary('');
    setDisplayedContent('');
    setCurrentLanguage('');
    setShowTranslateSection?.(false);
    // Don't set showSummary(false) to avoid hiding SuggestedQuestions during processing
    setError('');

    setCurrentStep?.('understanding');

    const prompt = getPrompt(trimmedContent);

    try {
      // Check if operation was aborted before starting
      if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
        console.log('askQuran - Operation aborted before starting');
        return;
      }

      const response = await generate_response_with_gemini(prompt, abortController);

      // Check if operation was aborted after API call
      if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
        console.log('askQuran - Operation aborted after API call');
        return;
      }

      // Check if operation was aborted before formatting - if so, skip formatting entirely
      if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
        console.log('askQuran - Operation aborted before formatting, skipping all API calls');
        return;
      }

      // Only format response if not aborted - this prevents ALL API calls
      let formattedResponse = response;
      if (!abortManager.isAborted() && !isAborted?.() && !abortController?.signal.aborted) {
        console.log('askQuran - Proceeding with formatting...');
        try {
          const finalContentTypes = contentTypes || {
            tafsir: selectedContentTypes?.tafsir ?? false,
            hadith: selectedContentTypes?.hadith ?? false,
            webSearch: selectedContentTypes?.webSearch ?? false,
            suggestedQuestions: selectedContentTypes?.suggestedQuestions ?? false,
          };
          formattedResponse = await formatResponse(response, trimmedContent, textSize, finalContentTypes, abortController, isAborted, setCurrentStep ? (step) => setCurrentStep(step) : undefined);
        } catch (error) {
          console.log('askQuran - Formatting failed, using original response:', error);
          formattedResponse = response;
        }
      } else {
        console.log('askQuran - Skipping formatting due to abort');
      }

      // Check if operation was aborted after formatting
      if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
        console.log('askQuran - Operation aborted after formatting');
        return;
      }

      setSummary(formattedResponse);
      setDisplayedContent(formattedResponse);
      setCurrentLanguage(detectedLanguage);
      setShowSummary(true);
      setShowTranslateSection?.(true);


    } catch (error) {
      // Don't show error if operation was aborted
      if (abortManager.isAborted() || isAborted?.() || abortController?.signal.aborted) {
        console.log('askQuran - Operation aborted, not showing error');
        return;
      }

      if (error instanceof Error) {
        setError(`Failed to generate response: ${error.message}. Please try again.`);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      // Only set processing to false if not aborted
      if (!abortManager.isAborted() && !isAborted?.() && !abortController?.signal.aborted) {
        setIsProcessing(false);
        setCurrentStep?.(null);
      }
    }
  }, [getPrompt, generate_response_with_gemini, formatResponse, textSize, selectedContentTypes]);

  return {
    askQuran,
    generate_response_with_gemini,
    formatResponse,
    getPrompt,
  };
};

