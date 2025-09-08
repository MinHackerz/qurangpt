import { useCallback } from 'react';
import { getSurahNumber, calculateGlobalAyahNumber, fetchTafsir, fetchTafsirRange } from '../utils/tafsirUtils';
import { detectLanguage } from '../utils/languageDetection';
import { detectAyahReferences, AyahMatch } from '../utils/simpleAyahDetection';
import { fetchAyahText, fetchAyahRangeText, fetchArabicAyahText, fetchArabicAyahRangeText } from '../utils/ayahTextFetcher';



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

export const useAIResponse = (isTextLarge: boolean = false) => {
  const generate_response_with_gemini = useCallback(async (prompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.response;
    } catch (error) {
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
      console.log('🔒 PRODUCTION: Forcing English detection for content that is definitely English');
    }
    
    // PRODUCTION LOGGING
    console.log('🔍 PRODUCTION Language Detection:', {
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      detectedLanguage,
      isQuickQuestion: content.includes('What is the purpose of life according to Islam?') || 
                     content.includes('Who is Prophet Muhammad (PBUH)?') || 
                     content.includes('What does the Quran say about Allah?'),
      timestamp: new Date().toISOString()
    });
    
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
- Your AI explanation MUST directly connect the specific ayah to the user's question
- Explain how the verse answers or relates to what the user asked
- Provide context and interpretation that makes the connection clear
- Show the relevance of the verse to the specific question being asked
- Make sure the explanation bridges the gap between the verse and the user's inquiry
- Write in flowing paragraphs, not as separate points
- Ensure each explanation is complete and properly concluded

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

  const formatResponse = useCallback(async (response: string) => {
    // First, validate that the response is complete and properly formatted
    const validatedResponse = validateAndCleanResponse(response);
    
    // Find all ayah references using universal detection system
    const ayahMatches = detectAyahReferences(validatedResponse);
    
    // Process each ayah with tafsir data
    const ayahReplacements = await Promise.all(
      ayahMatches.map(async (match: AyahMatch) => {
        const { verseText, surahName, ayahNumber, url } = match;
        
        const surahNumber = getSurahNumber(surahName.trim());
        if (!surahNumber) {
          console.log(`⚠️ Could not find surah number for: "${surahName}" - using fallback value 1`);
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
          
          console.log(`📋 Range ayah data:`, { 
            finalSurahNumber, 
            startAyah, 
            endAyah,
            ayahNumber: ayahNumberStr,
            isRange,
            surahName: surahName.trim() 
          });
          
          // Fetch range text from API
          if (verseText) {
            // Legacy support: if AI somehow still provides text, use it
            console.log(`⚠️ AI provided verse text (legacy mode) - using AI text`);
            finalVerseText = verseText;
          } else {
            // Normal mode: fetch range from API
            console.log(`🔍 Fetching ayah range text from API for ${finalSurahNumber}:${startAyah}-${endAyah}`);
            const apiRangeText = await fetchAyahRangeText(finalSurahNumber, startAyah, endAyah);
            if (apiRangeText) {
              finalVerseText = apiRangeText;
              console.log(`✅ Successfully fetched ayah range text from API`);
            } else {
              console.log(`❌ Failed to fetch ayah range text from API, will show reference only`);
              // Fallback: use a placeholder text
              finalVerseText = `[${surahName} ${ayahNumberStr}]`;
            }
          }
        } else {
          // Handle single ayah
          ayahNum = parseInt(ayahNumberStr);
          globalAyahNumber = calculateGlobalAyahNumber(finalSurahNumber, ayahNum);
          ayahId = `ayah-${finalSurahNumber}-${ayahNum}-${Date.now()}`;
          
          console.log(`📋 Single ayah data:`, { 
            finalSurahNumber, 
            ayahNum, 
            ayahNumber: ayahNumberStr,
            isRange,
            surahName: surahName.trim() 
          });
          
          // Fetch single ayah text from API
          if (verseText) {
            // Legacy support: if AI somehow still provides text, use it
            console.log(`⚠️ AI provided verse text (legacy mode) - using AI text`);
            finalVerseText = verseText;
          } else {
            // Normal mode: fetch from API
            console.log(`🔍 Fetching ayah text from API for global ayah ${globalAyahNumber}`);
            const apiVerseText = await fetchAyahText(globalAyahNumber);
            if (apiVerseText) {
              finalVerseText = apiVerseText;
              console.log(`✅ Successfully fetched ayah text from API`);
            } else {
              console.log(`❌ Failed to fetch ayah text from API, will show reference only`);
              // Fallback: use a placeholder text
              finalVerseText = `[${surahName} ${ayahNumberStr}]`;
            }
          }
        }
        
        // Fetch tafsir data
        let tafsirData;
        if (isRange) {
          // Fetch combined tafsir for range
          const [startAyah, endAyah] = ayahNumberStr.split('-').map(num => parseInt(num.trim()));
          console.log(`🔍 Fetching combined tafsir for Surah ${finalSurahNumber}, Range ${startAyah}-${endAyah}`);
          tafsirData = await fetchTafsirRange(finalSurahNumber, startAyah, endAyah);
          console.log(`📚 Combined tafsir data received:`, tafsirData);
        } else {
          // Fetch single ayah tafsir
          console.log(`🔍 Fetching tafsir for Surah ${finalSurahNumber}, Ayah ${ayahNum}`);
          tafsirData = await fetchTafsir(finalSurahNumber, ayahNum);
          console.log(`📚 Tafsir data received:`, tafsirData);
        }
        
        // Generate tafsir buttons and content
        let tafsirButtonsHTML = '';
        let tafsirContentHTML = '';
        
        if (tafsirData && tafsirData.tafsirs && tafsirData.tafsirs.length > 0) {
          console.log(`✅ Tafsir found: ${tafsirData.tafsirs.length} tafsirs available`);
          tafsirButtonsHTML = `
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
              <svg class="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 19.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span class="text-gray-700 dark:text-gray-300">Tafsir</span>
            </h4>
            <div class="flex flex-wrap gap-1.5 md:gap-2 flex-1">`;
          
          tafsirData.tafsirs.forEach((tafsir, index) => {
            const tafsirId = `tafsir-${ayahId}-${index}`;
            const formattedContent = tafsir.content
              .replace(/\n/g, '<br>')
              .replace(/##\s*(.*?)$/gm, '<h5 class="text-gray-800 dark:text-gray-200 mt-3 mb-2">$1</h5>')
              .replace(/\*\*(.*?)\*\*/g, '<span class="text-gray-700 dark:text-gray-300">$1</span>')
              .replace(/\*(.*?)\*/g, '<span class="text-gray-700 dark:text-gray-300 italic">$1</span>');
            
            tafsirButtonsHTML += `
              <button 
                data-tafsir-id="${tafsirId}"
                class="tafsir-toggle-btn px-2 md:px-3 py-1.5 md:py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center space-x-1.5 md:space-x-2 text-left focus:outline-none rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-600  hover: active:scale-95"
              >
                <div class="w-4 md:w-5 h-4 md:h-5 bg-gray-400 dark:bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-2.5 md:w-3 h-2.5 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div class="text-xs font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">${tafsir.author}</div>
              </button>`;
              
            tafsirContentHTML += `
              <div id="${tafsirId}" class="tafsir-content w-full mt-4" style="display: none;">
                <div class="bg-transparent rounded-xl border border-gray-200 dark:border-gray-700  overflow-hidden">
                  <div class="bg-gray-100 dark:bg-gray-900 px-3 md:px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                      <h5 class="${isTextLarge ? 'text-base' : 'text-sm'} font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span class="${isTextLarge ? 'text-sm md:text-base' : 'text-xs md:text-sm'}">${tafsir.author}</span>
                      </h5>
                      <button data-tafsir-id="${tafsirId}" class="tafsir-close-btn text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="p-3 md:p-4">
                    <div class="text-gray-700 dark:text-gray-300 leading-relaxed ${isTextLarge ? 'text-sm md:text-base' : 'text-xs md:text-sm'} space-y-2 md:space-y-3">
                      ${formattedContent}
                    </div>
                  </div>
                </div>
              </div>`;
          });
          
          tafsirButtonsHTML += `
              </div>`;
        } else {
          console.log(`❌ No tafsir found for Surah ${finalSurahNumber}, Ayah ${ayahNum}`);
          tafsirButtonsHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 flex-1 flex flex-col justify-center">
              <svg class="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 19.477 5.754 20 7.5 20s3.332-.523 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.523 4.5 1.253v13C19.832 19.477 18.246 20 16.5 20c-1.746 0-3.332-.523-4.5-1.253" />
              </svg>
              <p class="text-sm font-medium">No tafsir available</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Check back later</p>
            </div>`;
        }
        
        return {
          match: match.originalMatch,
          replacement: `<div class="stylish-ayah-reference mb-8 max-w-none w-full pt-5 pb-5" data-ayah-id="${ayahId}" data-global-ayah="${globalAyahNumber}" data-surah-name="${surahName}" data-ayah-number="${ayahNumber}" data-surah-number="${finalSurahNumber}" data-is-range="${isRange}" data-audio-range="${audioRange}">
            <div class="bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-full relative">
              <!-- CORRECTED HEADER: Top left = Surah name + verse number, Top right = surah:verse format + language toggle -->
              <div class="bg-gray-100 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-center justify-between">
                  <!-- Top Left: Surah name and verse number -->
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 font-[var(--font-amiri)]">${surahName}</h3>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Verse ${ayahNumberStr}</p>
                    </div>
                  </div>
                  <!-- Top Right: Language toggle + Surah:Verse format -->
                  <div class="flex items-center space-x-3">
                    <!-- Language Toggle Button -->
                    <button class="ayah-language-toggle-btn w-8 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 flex items-center justify-center" 
                            data-ayah-id="${ayahId}" 
                            data-is-range="${isRange}" 
                            data-surah="${finalSurahNumber}" 
                            data-ayah="${isRange ? audioRange : ayahNumberStr}" 
                            data-global-ayah="${globalAyahNumber}"
                            type="button"
                            title="Toggle Arabic/Translation">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
                      </svg>
                    </button>
                    <!-- Surah:Verse format -->
                    <span class="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-mono rounded-lg">${finalSurahNumber}:${ayahNumberStr}</span>
                  </div>
                </div>
              </div>
              
              <!-- AYAH TEXT: Exact ayah text below header -->
              <div class="p-4">
                <div class="text-center mb-6">
                  <div class="relative">
                    <div class="text-3xl md:text-4xl text-gray-300 dark:text-gray-600 opacity-30 absolute -top-2 -left-4">"</div>
                    <div class="text-3xl md:text-4xl text-gray-300 dark:text-gray-600 opacity-30 absolute -top-2 -right-4">"</div>
                    <blockquote class="text-lg md:text-xl text-gray-800 dark:text-gray-200 font-[var(--font-amiri)] leading-relaxed font-medium tracking-wide px-6 py-2">
                      ${finalVerseText}
                    </blockquote>
                  </div>
                </div>
                
                <!-- AUDIO AND TAFSIR BOXES: Left = Audio, Right = Tafsir -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <!-- LEFT BOX: Audio Player -->
                  <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700 min-h-[120px] md:min-h-[140px] flex flex-col justify-between shadow-sm">
                    <!-- Audio Controls -->
                    <div class="flex items-center space-x-3 mb-3">
                      <button class="ayah-audio-play-btn play-state w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer" data-surah="${finalSurahNumber}" data-ayah="${isRange ? audioRange : ayahNumberStr}" data-range="${isRange ? 'true' : 'false'}" type="button">
                        <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </button>
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-800 dark:text-gray-200">Play recitation</div>
                        <div class="text-xs text-gray-600 dark:text-gray-400">Alafasy${isRange ? ` (${ayahNumberStr})` : ''}</div>
                      </div>
                    </div>
                    
                    <!-- Audio Waveform Progress Bar -->
                    <div class="mt-3">
                      <style>
                        @keyframes waveProgress {
                          0%, 100% { opacity: 0.8; transform: scaleY(1); }
                          50% { opacity: 1; transform: scaleY(1.1); }
                        }
                        @keyframes waveGlow {
                          0%, 100% { box-shadow: 0 0 4px rgba(107, 114, 128, 0.3); }
                          50% { box-shadow: 0 0 8px rgba(107, 114, 128, 0.5); }
                        }
                        .dark @keyframes waveGlow {
                          0%, 100% { box-shadow: 0 0 4px rgba(209, 213, 219, 0.3); }
                          50% { box-shadow: 0 0 8px rgba(209, 213, 219, 0.5); }
                        }
                      </style>
                      <div class="relative w-full h-8 flex items-end justify-between space-x-0.5 cursor-pointer" data-surah="${finalSurahNumber}" data-ayah="${isRange ? audioRange : ayahNumberStr}" data-range="${isRange ? 'true' : 'false'}">
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="0"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="1"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="2"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="3"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="4"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="5"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="6"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="7"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="8"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="9"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="10"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="11"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="12"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="13"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="14"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="15"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="16"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="17"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="18"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="19"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="20"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="21"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="22"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="23"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="24"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="25"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="26"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="27"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="28"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="29"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="30"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="31"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="32"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="33"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="34"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="35"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="36"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="37"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="38"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="39"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="40"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="41"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="42"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="43"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="44"></div>
                        <div class="wave-bar flex-1 h-5 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="45"></div>
                        <div class="wave-bar flex-1 h-1 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="46"></div>
                        <div class="wave-bar flex-1 h-4 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="47"></div>
                        <div class="wave-bar flex-1 h-2 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="48"></div>
                        <div class="wave-bar flex-1 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:opacity-80 hover:scale-105" data-bar="49"></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- RIGHT BOX: Tafsir Buttons -->
                  <div class="bg-gray-100 dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700 min-h-[120px] md:min-h-[140px] flex flex-col justify-between">
                    ${tafsirButtonsHTML}
                  </div>
                </div>
                
                <!-- Tafsir Content (Full Width Below) -->
                ${tafsirContentHTML}
                
                <!-- Source Button - Bottom Right Corner -->
                <div class="absolute bottom-3 right-3">
                  <a href="https://alquran.cloud/ayah?reference=${finalSurahNumber}:${ayahNumberStr}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-md border border-gray-200 dark:border-gray-600 transition-all duration-200 text-xs font-medium">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                    Source
                  </a>
                </div>
              </div>
            </div>
          </div>`
        };
      })
    );
    
    // Apply all replacements
    let processedText = response;
    ayahReplacements.forEach(({ match, replacement }) => {
      processedText = processedText.replace(match, replacement);
    });
    
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
      .replace(/^#{1,3}\s*(.+)$/gm, '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')
      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-200">$1</strong>')
      // Format section headers with enhanced styling
      .replace(/^#{1,3}\s*(.+)$/gm, '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')
      
      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-200">$1</strong>')
      
      // Format italic text
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
      
      // Format underlined text
      .replace(/\_\_([^_]+)\_\_/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500">$1</span>')
      
      // Format numbered lists with enhanced styling and spacing
      .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="mb-6 flex items-start p-4 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600  hover: transition-all duration-200"><span class="inline-flex items-center justify-center w-8 h-8 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-full text-sm font-bold mr-4 mt-0.5 flex-shrink-0 ">$1</span><span class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">$2</span></div>')
      
      // Format bullet points
      .replace(/^[-•]\s+(.+)$/gm, '<div class="mb-5 flex items-start p-4 bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-600  hover: transition-all duration-200"><span class="w-3 h-3 bg-gray-600 dark:bg-gray-400 rounded-full mr-4 mt-3 flex-shrink-0 "></span><span class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">$1</span></div>')
      
      // Format specific Islamic terms with minimalistic underlines
      .replace(/Allah\s*\(SWT\)/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Allah (SWT)</span>')
      .replace(/Allah\s*SWT/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Allah SWT</span>')
      .replace(/Prophet Muhammad\s*\(PBUH\)/g, '<span class="underline decoration-emerald-400 dark:decoration-emerald-500 underline-offset-2">Prophet Muhammad (PBUH)</span>')
      .replace(/Prophet Muhammad\s*PBUH/g, '<span class="underline decoration-emerald-400 dark:decoration-emerald-500 underline-offset-2">Prophet Muhammad PBUH</span>')
      .replace(/\(peace be upon him\)/g, '<span class="text-sm text-gray-600 dark:text-gray-400 font-medium">(peace be upon him)</span>')
      .replace(/Muhammad\s*\(PBUH\)/g, '<span class="underline decoration-emerald-400 dark:decoration-emerald-500 underline-offset-2">Muhammad (PBUH)</span>')
      .replace(/Muhammad\s*PBUH/g, '<span class="underline decoration-emerald-400 dark:decoration-emerald-500 underline-offset-2">Muhammad PBUH</span>')
      .replace(/Allah\s*\(Subhanahu wa Ta\'ala\)/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Allah (Subhanahu wa Ta\'ala)</span>')
      .replace(/Allah\s*Subhanahu wa Ta\'ala/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500 underline-offset-2">Allah Subhanahu wa Ta\'ala</span>')
      
      // Format Explanation headers with distinctive styling
      .replace(/^(Explanation):?\s*$/gmi, 
        '<div class="explanation-section mt-12 mb-8"><div class="flex items-center gap-4 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border-l-4 border-blue-500 dark:border-blue-400 "><div class="w-12 h-12 bg-blue-500 dark:bg-blue-400 rounded-xl flex items-center justify-center "><svg class="w-6 h-6 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div><div><h3 class="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-200 font-[var(--font-amiri)] tracking-wide">💡 Explanation</h3><p class="text-sm text-blue-600 dark:text-blue-400 mt-1">Understanding the meaning and context</p></div></div></div>')
      
      // Format Tafsir/Tafseer headers with simple styling (matching AI Explanation design)
      .replace(/^(Tafs[ie]r):?\s*$/gmi, 
        `<div class="tafsir-section mt-12 mb-8"><h3 class="${isTextLarge ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'} font-bold text-gray-800 dark:text-gray-200 font-[var(--font-amiri)] tracking-wide border-b border-gray-300 dark:border-gray-600 pb-2">Tafsir</h3><p class="${isTextLarge ? 'text-base' : 'text-sm'} text-gray-600 dark:text-gray-400 mt-1">Detailed scholarly interpretation</p></div>`)
      
      // Format AI Explanation sections with simple styling
      .replace(/\[AI Explanation:\s*([\s\S]*?)\]/gi, 
        `<div class="ai-explanation-section mt-2 mb-4"><h4 class="${isTextLarge ? 'text-xl' : 'text-lg'} font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-300 dark:border-gray-600 pb-2">AI Explanation</h4><div class="text-gray-700 dark:text-gray-300 leading-relaxed ${isTextLarge ? 'text-base' : 'text-sm'}">$1</div></div>`)
      
      // Format Authentic Tafsir sections with simple styling
      .replace(/\[Authentic Tafsir:\s*([\s\S]*?)\]/g, 
        `<br><br><div class="authentic-tafsir-section mt-6 mb-4"><h4 class="${isTextLarge ? 'text-xl' : 'text-lg'} font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-300 dark:border-gray-600 pb-2">Authentic Tafsir</h4><div class="text-gray-700 dark:text-gray-300 leading-relaxed ${isTextLarge ? 'text-base' : 'text-sm'}">$1</div></div>`)
      
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
    
    return processedText;
  }, [isTextLarge]);

  const askQuran = useCallback(async (
    content: string,
    setIsProcessing: (processing: boolean) => void,
    setSummary: (summary: string) => void,
    setShowSummary: (show: boolean) => void,
    setError: (error: string) => void,
    setDisplayedContent: (content: string) => void,
    setCurrentLanguage: (lang: string) => void,
    setShowTranslateSection?: (show: boolean) => void
  ) => {
    const trimmedContent = content.trim();
    
    if (trimmedContent.length === 0) {
      setError('Please enter a question');
      return;
    }

    // PRODUCTION: Force English detection for any content that could be English
    const detectedLanguage = detectLanguage(trimmedContent);
    console.log('🔍 PRODUCTION: Final language detection result:', detectedLanguage);

    // Audio cleanup is now handled in ResponseSection component

    // Activate chat mode
    setIsProcessing(true);
    setSummary('');
    setDisplayedContent('');
    setCurrentLanguage('');
    setShowTranslateSection?.(false);
    // Don't set showSummary(false) to avoid hiding SuggestedQuestions during processing
    setError('');

    const prompt = getPrompt(trimmedContent);

    try {
      console.log(`🔄 PRODUCTION: Generating response for question: ${trimmedContent.substring(0, 50)}...`);
      
      const response = await generate_response_with_gemini(prompt);
      
      console.log(`✅ PRODUCTION: Response generated successfully`);
      
      const formattedResponse = await formatResponse(response);
      
      setSummary(formattedResponse);
      setDisplayedContent(formattedResponse);
      setCurrentLanguage(detectedLanguage);
      setShowSummary(true);
      setShowTranslateSection?.(true);
      
      console.log('✅ PRODUCTION: Response displayed successfully');
      
    } catch (error) {
      console.error('🚨 PRODUCTION: Error generating response:', error);
      if (error instanceof Error) {
        setError(`Failed to generate response: ${error.message}. Please try again.`);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [getPrompt, generate_response_with_gemini, formatResponse]);

  return {
    askQuran,
    generate_response_with_gemini,
    formatResponse,
    getPrompt,
  };
};
