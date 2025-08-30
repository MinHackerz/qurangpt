import { useCallback } from 'react';
import { getSurahNumber, calculateGlobalAyahNumber, fetchTafsir } from '../utils/tafsirUtils';

export const useAIResponse = () => {
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
    return `You are an AI-powered Islamic Library with experience as a Quran Scholar/Researcher. Your task is to answer questions by providing authentic references from the Holy Quran.

IMPORTANT: You must format your response exactly as follows:

1. Start with a brief introduction to the topic
2. Include at least 2-3 relevant Quranic verses in this EXACT format:
   "Verse text here" [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})

3. After each verse, provide:
   - First: The authentic tafsir will be automatically fetched and displayed
   - Second: Your AI-generated explanation and interpretation of the verse

4. End with practical guidance or conclusion

CRITICAL FORMAT REQUIREMENTS:
- Use EXACTLY this format for ayah references: [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})
- Replace {Surah No.} and {Ayah No.} with actual numbers
- Use proper surah names like: Al-Fatiha, Al-Baqarah, Aal-Imran, An-Nisa, Al-Ma'idah, etc.
- Include the full verse text in quotes before each reference
- After each verse reference, provide your AI-generated explanation and interpretation
- The authentic tafsir from Islamic scholars will be automatically displayed

CRITICAL AI EXPLANATION REQUIREMENTS:
- Your AI explanation MUST directly connect the specific ayah to the user's question
- Explain how the verse answers or relates to what the user asked
- Provide context and interpretation that makes the connection clear
- Show the relevance of the verse to the specific question being asked
- Make sure the explanation bridges the gap between the verse and the user's inquiry

Example format:
"Indeed, Allah is with those who are patient." [Al-Baqarah: 153](https://alquran.cloud/ayah?reference=2:153)

[AI Explanation: This verse directly addresses your question about patience by teaching us that Allah's divine support is guaranteed for those who remain steadfast. When you asked about how to handle difficult situations, this verse provides the answer: maintain patience and trust that Allah will be with you. This is not just about waiting passively, but about actively maintaining faith and trust in Allah's plan while facing your challenges.]

Question: ${content}`;
  }, []);

  const formatResponse = useCallback(async (response: string) => {
    // First, find all ayah references and prepare them with tafsir data
    const ayahRegex = /"([^"]+)"\s*\[(.*?)\:\s*(\d+)\]\((https?:\/\/[^\s)]+)\)/g;
    const ayahMatches: RegExpExecArray[] = [];
    let match;
    
    // Extract all matches
    while ((match = ayahRegex.exec(response)) !== null) {
      ayahMatches.push(match);
    }
    
    // Process each ayah with tafsir data
    const ayahReplacements = await Promise.all(
      ayahMatches.map(async (match) => {
        const [, verseText, surahName, ayahNumber, url] = match;
        const surahNumber = getSurahNumber(surahName.trim());
        if (!surahNumber) {
          // Could not find surah number - using fallback value 1
        }
        const finalSurahNumber = surahNumber || 1;
        const ayahNum = parseInt(ayahNumber);
        const globalAyahNumber = calculateGlobalAyahNumber(finalSurahNumber, ayahNum);
        const ayahId = `ayah-${finalSurahNumber}-${ayahNum}-${Date.now()}`;
        
        // Fetch tafsir data
        const tafsirData = await fetchTafsir(finalSurahNumber, ayahNum);
        
        // Generate tafsir buttons and content
        let tafsirButtonsHTML = '';
        let tafsirContentHTML = '';
        
        if (tafsirData && tafsirData.tafsirs && tafsirData.tafsirs.length > 0) {
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
                <div class="bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-700  overflow-hidden">
                  <div class="bg-gray-100 dark:bg-gray-900 px-3 md:px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                      <h5 class="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span class="text-xs md:text-sm">${tafsir.author}</span>
                      </h5>
                      <button data-tafsir-id="${tafsirId}" class="tafsir-close-btn text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="p-3 md:p-4">
                    <div class="text-gray-700 dark:text-gray-300 leading-relaxed text-xs md:text-sm space-y-2 md:space-y-3">
                      ${formattedContent}
                    </div>
                  </div>
                </div>
              </div>`;
          });
          
          tafsirButtonsHTML += `
              </div>`;
        } else {
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
          match: match[0],
          replacement: `<div class="stylish-ayah-reference mb-8 max-w-none w-full pt-5 pb-5" data-ayah-id="${ayahId}" data-global-ayah="${globalAyahNumber}" data-surah-name="${surahName}" data-ayah-number="${ayahNumber}" data-surah-number="${surahNumber}">
            <div class="bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-full ">
              <!-- Clean Header -->
              <div class="bg-gray-100 dark:bg-gray-900 px-4 py-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 font-[var(--font-amiri)]">${surahName}</h3>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Verse ${ayahNumber}</p>
                    </div>
                  </div>
                  <span class="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-mono rounded-lg">${finalSurahNumber}:${ayahNumber}</span>
                </div>
              </div>
              
              <!-- Verse Content -->
              <div class="p-4">
                <!-- Verse Text -->
                <div class="text-center mb-6">
                  <div class="relative">
                    <div class="text-3xl md:text-4xl text-gray-300 dark:text-gray-600 opacity-30 absolute -top-2 -left-4">"</div>
                    <div class="text-3xl md:text-4xl text-gray-300 dark:text-gray-600 opacity-30 absolute -top-2 -right-4">"</div>
                    <blockquote class="text-lg md:text-xl text-gray-800 dark:text-gray-200 font-[var(--font-amiri)] leading-relaxed font-medium tracking-wide px-6 py-2">
                      ${verseText}
                    </blockquote>
                  </div>
                </div>
                
                <!-- Audio Player and Tafsir Buttons -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <!-- Audio Player -->
                  <div class="enhanced-audio-player" data-ayah-id="${ayahId}" data-global-ayah="${globalAyahNumber}">
                    <div class="bg-gray-100 dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700 min-h-[120px] md:min-h-[140px] flex flex-col justify-between ">
                      <div class="flex items-center space-x-3">
                        <button class="play-pause-btn w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 hover:bg-gray-700 dark:hover:bg-gray-300 active:scale-95 transition-all duration-200" data-ayah-id="${ayahId}">
                          <svg class="play-icon w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          <svg class="pause-icon w-4 h-4 hidden" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                          </svg>
                        </button>
                        <div class="flex-1">
                          <div class="status-text text-sm font-medium text-gray-800 dark:text-gray-200">Play recitation</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">Alafasy</div>
                        </div>
                        <div class="text-right">
                          <div class="time-display text-sm font-mono text-gray-600 dark:text-gray-400">--:--</div>
                          <div class="status-indicator w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full hidden animate-pulse mt-1 ml-auto"></div>
                        </div>
                      </div>
                      
                      <!-- Progress Bar -->
                      <div class="mt-3">
                        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span class="current-time">0:00</span>
                          <span class="total-duration">--:--</span>
                        </div>
                        <div class="relative">
                          <div class="progress-bg w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div class="progress-fill h-full bg-gray-800 dark:bg-gray-200 rounded-full transition-all duration-300 ease-out" style="width: 0%"></div>
                          </div>
                          <input type="range" class="progress-slider absolute inset-0 w-full h-1.5 opacity-0 cursor-pointer" min="0" max="100" value="0" data-ayah-id="${ayahId}">
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Tafsir Buttons -->
                  <div class="bg-gray-100 dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700 min-h-[120px] md:min-h-[140px] flex flex-col justify-between ">
                    ${tafsirButtonsHTML}
                  </div>
                </div>
                
                <!-- Tafsir Content (Full Width Below) -->
                ${tafsirContentHTML}
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
      
      // Format specific Islamic terms with enhanced styling
      .replace(/Allah\s*\(SWT\)/g, '<span class="inline-flex items-center px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-bold border-2 border-amber-300 dark:border-amber-500  hover: transition-all duration-300 transform hover:scale-105 animate-pulse">🕌 Allah (SWT)</span>')
      .replace(/Allah\s*SWT/g, '<span class="inline-flex items-center px-3 py-2 bg-amber-50 dark:bg-gray-900/30 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-bold border-2 border-amber-300 dark:border-amber-500  hover: transition-all duration-300 transform hover:scale-105 animate-pulse">🕌 Allah SWT</span>')
      .replace(/Prophet Muhammad\s*\(PBUH\)/g, '<span class="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600">📖 Prophet Muhammad (PBUH)</span>')
      .replace(/Prophet Muhammad\s*PBUH/g, '<span class="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600">📖 Prophet Muhammad PBUH</span>')
      .replace(/\(peace be upon him\)/g, '<span class="text-sm text-gray-600 dark:text-gray-400 font-medium">(peace be upon him)</span>')
      .replace(/Muhammad\s*\(PBUH\)/g, '<span class="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600">📖 Muhammad (PBUH)</span>')
      .replace(/Muhammad\s*PBUH/g, '<span class="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600">📖 Muhammad PBUH</span>')
      .replace(/Allah\s*\(Subhanahu wa Ta\'ala\)/g, '<span class="inline-flex items-center px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-bold border-2 border-amber-300 dark:border-amber-500  hover: transition-all duration-300 transform hover:scale-105 animate-pulse">🕌 Allah (Subhanahu wa Ta\'ala)</span>')
      .replace(/Allah\s*Subhanahu wa Ta\'ala/g, '<span class="inline-flex items-center px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-bold border-2 border-amber-300 dark:border-amber-500  hover: transition-all duration-300 transform hover:scale-105 animate-pulse">🕌 Allah Subhanahu wa Ta\'ala</span>')
      
      // Format Explanation headers with distinctive styling
      .replace(/^(Explanation):?\s*$/gmi, 
        '<div class="explanation-section mt-12 mb-8"><div class="flex items-center gap-4 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-2xl border-l-4 border-blue-500 dark:border-blue-400 "><div class="w-12 h-12 bg-blue-500 dark:bg-blue-400 rounded-xl flex items-center justify-center "><svg class="w-6 h-6 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div><div><h3 class="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-200 font-[var(--font-amiri)] tracking-wide">💡 Explanation</h3><p class="text-sm text-blue-600 dark:text-blue-400 mt-1">Understanding the meaning and context</p></div></div></div>')
      
      // Format Tafsir/Tafseer headers with simple styling (matching AI Explanation design)
      .replace(/^(Tafs[ie]r):?\s*$/gmi, 
        '<div class="tafsir-section mt-12 mb-8"><h3 class="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200 font-[var(--font-amiri)] tracking-wide border-b border-gray-300 dark:border-gray-600 pb-2">Tafsir</h3><p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Detailed scholarly interpretation</p></div>')
      
      // Format AI Explanation sections with simple styling
      .replace(/\[AI Explanation:\s*([\s\S]*?)\]/gi, 
        '<div class="ai-explanation-section mt-2 mb-4"><h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-300 dark:border-gray-600 pb-2">AI Explanation</h4><div class="text-gray-700 dark:text-gray-300 leading-relaxed text-base">$1</div></div>')
      
      // Format Authentic Tafsir sections with simple styling
      .replace(/\[Authentic Tafsir:\s*([\s\S]*?)\]/g, 
        '<br><br><div class="authentic-tafsir-section mt-6 mb-4"><h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-300 dark:border-gray-600 pb-2">Authentic Tafsir</h4><div class="text-gray-700 dark:text-gray-300 leading-relaxed text-base">$1</div></div>')
      
      // Format other common section headers with enhanced styling
      .replace(/^(Introduction|Additional Information|References|Conclusion):?\s*$/gmi, 
        '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-4 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')
      
      // Format Quranic section headers with enhanced styling
      .replace(/Allah\s*\(SWT\)\s*says\s*in\s*the\s*(Glorious\s*)?Quran:?/gi, 
        '<div class="my-8 p-6 bg-gray-100 dark:bg-gray-900 rounded-2xl border-l-4 border-gray-800 dark:border-gray-200 "><h3 class="divine-quote-heading text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 font-[var(--font-amiri)] tracking-wide flex items-center">📖 <span class="ml-3">Allah (SWT) says in the Glorious Quran:</span></h3><div class="w-16 h-1 bg-gray-800 dark:text-gray-200 rounded-full"></div></div>')
      
      // Clean up any remaining formatting markers
      .replace(/###\s*Quran GPT's Answer:?\s*/gi, '')
      .replace(/^\s*[\r\n]+/gm, '') // Remove empty lines
      .replace(/\n{3,}/g, '\n\n'); // Limit consecutive line breaks
    
    return processedText;
  }, []);

  const askQuran = useCallback(async (
    content: string,
    setIsProcessing: (processing: boolean) => void,
    setSummary: (summary: string) => void,
    setShowSummary: (show: boolean) => void,
    setError: (error: string) => void,
    setDisplayedContent: (content: string) => void,
    setCurrentLanguage: (lang: string) => void,
    stopAudio: () => void
  ) => {
    const trimmedContent = content.trim();
    
    if (trimmedContent.length === 0) {
      setError('Please enter a question');
      return;
    }

    // Clean up any existing audio before starting new question
    stopAudio();

    // Activate chat mode
    setIsProcessing(true);
    setSummary('');
    setShowSummary(false);
    setError('');

    const prompt = getPrompt(trimmedContent);

    try {
      const response = await generate_response_with_gemini(prompt);
      
      const formattedResponse = await formatResponse(response);
      
      setSummary(formattedResponse);
      setDisplayedContent(formattedResponse);
      setCurrentLanguage('en');
      setShowSummary(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
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
