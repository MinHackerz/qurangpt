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

// Generate hadith box HTML similar to ayah boxes
export function generateHadithBoxHTML(hadith: HadithData, index: number = 0, textSize: 'small' | 'medium' | 'large' = 'small'): string {
  const formatted = formatHadithForDisplay(hadith);
  const hadithId = `hadith-${hadith.bookSlug}-${hadith.hadithNumber}-${index}`;
  
  // Text size classes based on textSize parameter - professional hierarchy
  const textSizeClass = textSize === 'large' ? 'text-lg md:text-xl' : textSize === 'medium' ? 'text-base md:text-lg' : 'text-sm md:text-base'; // Professional hadith text sizing
  const headerTextSizeClass = textSize === 'large' ? 'text-xs md:text-sm' : textSize === 'medium' ? 'text-xs md:text-sm' : 'text-xs md:text-sm'; // Match ayah header sizing
  const summaryTextSizeClass = textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'; // Match AI content sizing exactly
  
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
      
      <!-- AI Summary - Simple text below the box -->
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
