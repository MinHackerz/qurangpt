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
  // Text size classes based on textSize parameter - professional hierarchy
  // Using responsive classes via TextSizeStyles
  // params: textSize is kept for API compatibility but styles are now CSS-driven

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
        <div class="hadith-context-section mt-8 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800/50 w-full">
          <h5 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
             <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
             References & Context
          </h5>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            ${contexts.map((context: any) => `
              <a 
                href="${context.url}" 
                target="_blank" 
                rel="noopener noreferrer"
                class="group flex flex-col h-24 bg-transparent rounded-xl border border-gray-200 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200 overflow-hidden relative"
              >
                <div class="flex h-full">
                  <div class="w-12 h-full bg-transparent flex items-center justify-center flex-shrink-0 border-r border-gray-100 dark:border-gray-800/50 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 transition-colors">
                    <svg class="w-5 h-5 text-gray-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div class="flex-1 p-3 min-w-0 flex flex-col justify-center">
                      <h6 class="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-1 mb-1">
                        ${context.title}
                      </h6>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-1">
                        ${context.snippet}
                      </p>
                      <div class="text-[10px] text-gray-400 dark:text-gray-500 truncate flex items-center gap-1 mt-auto">
                        <span>${getHostname(context.url)}</span>
                      </div>
                  </div>
                </div>
              </a>
            `).join('')}
          </div>
        </div>`;
  }

  return `
    <div class="stylish-hadith-reference mt-12 mb-8 max-w-none w-full bg-transparent" 
         data-hadith-id="${hadithId}" 
         data-book-slug="${hadith.bookSlug}" 
         data-hadith-number="${hadith.hadithNumber}" 
         data-book-name="${formatted.bookName}"
         data-status="${formatted.status}">
      


      <div class="bg-transparent rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden w-full relative group transition-all duration-300">
        
        <!-- Header -->
        <div class="px-5 py-4 flex items-center justify-between border-b border-gray-50 dark:border-gray-800/50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center border border-amber-100 dark:border-amber-800/30">
              <span class="font-serif text-lg text-amber-600 dark:text-amber-500 font-bold">H</span>
            </div>
            <div>
              <h3 class="responsive-text-title font-bold text-gray-900 dark:text-gray-100 tracking-wide">${formatted.bookName}</h3>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase">Hadith #${formatted.hadithNumber}</span>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${formatted.status.toLowerCase() === 'sahih'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : formatted.status.toLowerCase() === 'hasan'
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    }">
                  ${formatted.status}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Language Toggle Removed as per request -->
        </div>
        
        <!-- Content Area -->
        <div class="p-6 sm:p-8 bg-transparent">
          <div class="relative">
             <span class="absolute -top-3 -left-2 text-5xl text-gray-100 dark:text-gray-800 opacity-60 font-serif leading-none select-none">“</span>
             
             <!-- English Text (Default) -->
             <div class="hadith-text-english" data-hadith-id="${hadithId}">
               <blockquote class="text-gray-800 dark:text-gray-100 leading-relaxed responsive-text-hadith font-[var(--font-amiri)] px-4 py-1 relative z-10">
                 ${formatted.text.english}
               </blockquote>
               ${formatted.narrator ? `
                 <div class="mt-4 pl-4 border-l-2 border-amber-500/30 dark:border-amber-500/20">
                   <p class="text-sm font-bold text-gray-900 dark:text-gray-100">Narrated by:</p>
                   <p class="text-sm text-gray-500 dark:text-gray-400 italic">${formatted.narrator}</p>
                 </div>
               ` : ''}
             </div>
             
             <!-- Arabic Text (Hidden) -->
             <div class="hadith-text-arabic hidden" data-hadith-id="${hadithId}">
               <blockquote class="text-gray-800 dark:text-gray-100 leading-relaxed responsive-text-hadith font-[var(--font-amiri)] text-right px-4 py-1 relative z-10" dir="rtl">
                 ${formatted.text.arabic}
               </blockquote>
               ${formatted.narrator ? `
                 <div class="mt-4 pr-4 border-r-2 border-amber-500/30 dark:border-amber-500/20 text-right">
                    <p class="text-sm font-bold text-gray-900 dark:text-gray-100">Narrated by:</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 italic">${formatted.narrator}</p>
                 </div>
               ` : ''}
             </div>
          </div>
          
        </div>
      </div>

      <!-- Context Section (Independent) -->
      ${contextHTML}
      
      <!-- AI Summary (Explanation) (Independent) -->
      ${hadith.aiSummary ? `
        <div class="hadith-explanation-section mt-6">
           <div class="flex items-center gap-2 mb-3">
              <span class="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 p-1 rounded-md">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </span>
              <h5 class="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Explanation</h5>
           </div>
           <div class="responsive-text-body text-gray-700 dark:text-gray-300 leading-relaxed pl-2 border-l-2 border-amber-200 dark:border-amber-800/50">
             ${hadith.aiSummary}
           </div>
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
