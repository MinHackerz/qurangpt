// Utility functions for hadith processing and formatting

export interface HadithData {
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
  collectionName?: string;
  collectionPriority?: number;
  aiSummary?: string;
  book: {
    id: number;
    bookName: string;
    writerName: string;
    aboutWriter: string;
    writerDeath: string;
    bookSlug: string;
  };
}

export interface HadithReference {
  bookName: string;
  hadithNumber: string;
  originalMatch: string;
}

// Extract hadith references from text using various patterns
export function extractHadithReferences(text: string): HadithReference[] {
  const hadithPatterns = [
    // Pattern for "Sahih Bukhari 1234" or "Bukhari 1234"
    /(?:Sahih\s+)?(Bukhari|Muslim|Tirmidhi|Abu\s+Dawood|Nasa'i|Nasai)\s+(\d+)/gi,
    // Pattern for "Sahih Bukhari, Book 1, Hadith 1234"
    /(?:Sahih\s+)?(Bukhari|Muslim|Tirmidhi|Abu\s+Dawood|Nasa'i|Nasai),\s*(?:Book\s+\d+,\s*)?Hadith\s+(\d+)/gi,
    // Pattern for "Sahih Bukhari: 1234"
    /(?:Sahih\s+)?(Bukhari|Muslim|Tirmidhi|Abu\s+Dawood|Nasa'i|Nasai):\s*(\d+)/gi,
    // Pattern for "Sahih Bukhari, Volume 1, Book 2, Hadith 1234"
    /(?:Sahih\s+)?(Bukhari|Muslim|Tirmidhi|Abu\s+Dawood|Nasa'i|Nasai),\s*Volume\s+\d+,\s*Book\s+\d+,\s*Hadith\s+(\d+)/gi,
    // Pattern for "Sahih Bukhari, Book 2, Hadith 1234"
    /(?:Sahih\s+)?(Bukhari|Muslim|Tirmidhi|Abu\s+Dawood|Nasa'i|Nasai),\s*Book\s+\d+,\s*Hadith\s+(\d+)/gi
  ];

  const references: HadithReference[] = [];

  hadithPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const bookName = match[1].toLowerCase();
      const hadithNumber = match[2];
      const originalMatch = match[0];

      // Map book names to display names
      const bookDisplayMap: { [key: string]: string } = {
        'bukhari': 'Sahih Bukhari',
        'muslim': 'Sahih Muslim',
        'tirmidhi': 'Jami\' at-Tirmidhi',
        'abu dawood': 'Sunan Abu Dawood',
        'nasa\'i': 'Sunan an-Nasa\'i',
        'nasai': 'Sunan an-Nasa\'i'
      };

      const displayName = bookDisplayMap[bookName];
      if (displayName) {
        references.push({
          bookName: displayName,
          hadithNumber,
          originalMatch
        });
      }
    }
  });

  return references;
}

// Map book names to API slugs
export function getBookSlug(bookName: string): string {
  const bookSlugMap: { [key: string]: string } = {
    'sahih bukhari': 'bukhari',
    'bukhari': 'bukhari',
    'sahih muslim': 'muslim',
    'muslim': 'muslim',
    'jami\' at-tirmidhi': 'tirmidhi',
    'tirmidhi': 'tirmidhi',
    'sunan abu dawood': 'abu-dawood',
    'abu dawood': 'abu-dawood',
    'sunan an-nasa\'i': 'nasai',
    'nasa\'i': 'nasai',
    'nasai': 'nasai'
  };

  return bookSlugMap[bookName.toLowerCase()] || '';
}

// Format hadith data for display
export function formatHadithForDisplay(hadith: HadithData): {
  id: string;
  bookName: string;
  hadithNumber: number;
  narrator: string;
  text: {
    english: string;
    arabic: string;
    urdu: string;
  };
  heading: {
    english: string;
    arabic: string;
    urdu: string;
  };
  status: string;
  volume: number;
  chapterNumber: number;
} {
  return {
    id: `hadith-${hadith.bookSlug}-${hadith.hadithNumber}`,
    bookName: hadith.book?.bookName || hadith.collectionName || 'Unknown Book',
    hadithNumber: hadith.hadithNumber,
    narrator: hadith.englishNarrator,
    text: {
      english: hadith.hadithEnglish,
      arabic: hadith.hadithArabic,
      urdu: hadith.hadithUrdu
    },
    heading: {
      english: hadith.headingEnglish,
      arabic: hadith.headingArabic,
      urdu: hadith.headingUrdu
    },
    status: hadith.status,
    volume: hadith.volume,
    chapterNumber: hadith.chapterNumber
  };
}

// Generate hadith box HTML - contexts are passed in (fetched in batch)
export function generateHadithBoxHTML(hadith: HadithData, index: number = 0, textSize: 'small' | 'medium' | 'large' = 'small', contexts: any[] = []): string {
  const formatted = formatHadithForDisplay(hadith);
  const hadithId = `hadith-${hadith.bookSlug}-${hadith.hadithNumber}-${index}`;
  
  // Text size classes based on textSize parameter - professional hierarchy
  const textSizeClass = textSize === 'large' ? 'text-lg md:text-xl' : textSize === 'medium' ? 'text-base md:text-lg' : 'text-sm md:text-base'; // Professional hadith text sizing
  const headerTextSizeClass = textSize === 'large' ? 'text-xs md:text-sm' : textSize === 'medium' ? 'text-xs md:text-sm' : 'text-xs md:text-sm'; // Match ayah header sizing
  // STRICTLY match general content text size - uniform everywhere
  const summaryTextSizeClass = textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base';
  
  // Generate context HTML from passed contexts
  let contextHTML = '';
  if (contexts && contexts.length > 0) {
    const getHostname = (url: string) => {
      try {
        return new URL(url).hostname.replace('www.', '');
      } catch {
        return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace('www.', '');
      }
    };
    
    contextHTML = `
      <div class="hadith-context-section mt-4 w-full">
        <div class="flex gap-2.5 w-full">
          ${contexts.map((context: any) => `
            <a 
              href="${context.url}" 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex-1 min-w-0 h-32 p-2.5 bg-transparent rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-200 group overflow-hidden"
            >
              <div class="w-full h-full flex flex-col overflow-hidden">
                <div class="flex items-start gap-1.5 mb-1.5 flex-shrink-0 overflow-hidden">
                  <svg class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <div class="flex-1 min-w-0 overflow-hidden">
                    <h5 class="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-1 line-clamp-2 leading-tight break-words overflow-hidden">
                      ${context.title}
                    </h5>
                  </div>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed flex-1 min-h-0 mb-1.5 overflow-hidden break-words">
                  ${context.snippet}
                </p>
                <div class="flex items-center justify-between mt-auto pt-1.5 border-t border-gray-200/50 dark:border-gray-700/50 flex-shrink-0 overflow-hidden">
                  <span class="text-xs text-gray-400 dark:text-gray-500 truncate flex-1 min-w-0 overflow-hidden">
                    ${getHostname(context.url)}
                  </span>
                  <svg class="w-3 h-3 text-gray-400 dark:text-gray-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex-shrink-0 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>`;
  }
  
  return `
    <div class="stylish-hadith-reference mb-4 max-w-none w-full" 
         data-hadith-id="${hadithId}" 
         data-book-slug="${hadith.bookSlug}" 
         data-hadith-number="${hadith.hadithNumber}" 
         data-book-name="${formatted.bookName}"
         data-status="${formatted.status}">
      <div class="bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-full relative">
        <!-- Minimal Header: Book name + Hadith number -->
        <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <!-- Book name and hadith number -->
            <div class="flex items-center space-x-2">
              <span class="${textSizeClass} font-medium text-gray-800 dark:text-gray-200">${formatted.bookName}</span>
              <span class="${headerTextSizeClass} text-gray-500 dark:text-gray-400">#${formatted.hadithNumber}</span>
            </div>
            <!-- Status Badge -->
            <div class="flex items-center space-x-2">
              <span class="px-2 py-0.5 ${headerTextSizeClass} font-medium rounded ${
                formatted.status.toLowerCase() === 'sahih' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                  : formatted.status.toLowerCase() === 'hasan'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
              }">
                ${formatted.status}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Content Area -->
        <div class="p-4">
          <!-- English Text (Default) -->
          <div class="hadith-text-english" data-hadith-id="${hadithId}">
            <blockquote class="text-gray-800 dark:text-gray-200 leading-relaxed ${textSizeClass} font-medium tracking-wide px-6 py-2">
              ${formatted.text.english}
            </blockquote>
            ${formatted.narrator ? `
              <div class="mt-2 hadith-narrator ${headerTextSizeClass} text-gray-500 dark:text-gray-400 italic">
                — ${formatted.narrator}
              </div>
            ` : ''}
          </div>
          
          <!-- Arabic Text (Hidden by default) -->
          <div class="hadith-text-arabic hidden" data-hadith-id="${hadithId}">
            <blockquote class="text-gray-800 dark:text-gray-200 leading-relaxed ${textSizeClass} font-[var(--font-amiri)] text-right font-medium tracking-wide px-6 py-2">
              ${formatted.text.arabic}
            </blockquote>
            ${formatted.narrator ? `
              <div class="mt-2 hadith-narrator ${headerTextSizeClass} text-gray-500 dark:text-gray-400 italic text-right">
                — ${formatted.narrator}
              </div>
            ` : ''}
          </div>
          
        </div>
      </div>
      
      ${contextHTML}
      <!-- AI Summary (Combined Explanation) - Simple text below context links -->
      ${hadith.aiSummary ? `
        <div class="mt-3 hadith-ai-summary ${summaryTextSizeClass} text-gray-700 dark:text-gray-300 leading-relaxed">
          ${hadith.aiSummary}
        </div>
      ` : ''}
    </div>
  `;
}

// Search for hadiths based on query (only Sahih hadiths)
export async function searchHadiths(query: string, limit: number = 5): Promise<HadithData[]> {
  try {
    const response = await fetch(`/api/hadith?query=${encodeURIComponent(query)}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.hadiths) {
      // Double-check that we only return Sahih hadiths
      return data.hadiths.filter((hadith: HadithData) => 
        hadith.status && hadith.status.toLowerCase() === 'sahih'
      );
    }
    
    return [];
  } catch (error) {
    return [];
  }
}

// Fetch specific hadith by book and number (only Sahih hadiths)
export async function fetchSpecificHadith(bookSlug: string, hadithNumber: string): Promise<HadithData | null> {
  try {
    const response = await fetch(`/api/hadith?hadithNumber=${hadithNumber}&bookSlug=${bookSlug}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.hadith) {
      // Ensure it's a Sahih hadith
      if (data.hadith.status && data.hadith.status.toLowerCase() === 'sahih') {
        return data.hadith;
      } else {
        return null;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}
