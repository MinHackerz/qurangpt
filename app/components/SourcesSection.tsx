'use client';

import { useState, useEffect } from 'react';

interface Source {
  type: 'ayah' | 'hadith';
  title: string;
  url: string;
  surahNumber?: string;
  ayahNumber?: string;
  bookName?: string;
  hadithNumber?: string;
}

interface SourcesSectionProps {
  content: string;
  isTextLarge?: boolean;
}

export default function SourcesSection({ content, isTextLarge = false }: SourcesSectionProps) {
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    const extractSources = () => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      
      const extractedSources: Source[] = [];
      const seenSources = new Set<string>(); // To avoid duplicates
      
      // Extract ayah sources - only from actual ayah boxes in content
      const ayahBoxes = tempDiv.querySelectorAll('.stylish-ayah-reference');
      ayahBoxes.forEach((ayahBox) => {
        const surahName = ayahBox.getAttribute('data-surah-name');
        const ayahNumber = ayahBox.getAttribute('data-ayah-number');
        const surahNumber = ayahBox.getAttribute('data-surah-number');
        
        if (surahName && ayahNumber && surahNumber) {
          const sourceKey = `ayah-${surahNumber}-${ayahNumber}`;
          if (!seenSources.has(sourceKey)) {
            seenSources.add(sourceKey);
            extractedSources.push({
              type: 'ayah',
              title: `${surahName} ${ayahNumber}`,
              url: `https://alquran.cloud/ayah?reference=${surahNumber}:${ayahNumber}`,
              surahNumber,
              ayahNumber
            });
          }
        }
      });
      
      // Extract hadith sources - only from actual hadith boxes in content
      const hadithBoxes = tempDiv.querySelectorAll('.stylish-hadith-reference');
      hadithBoxes.forEach((hadithBox) => {
        const bookName = hadithBox.getAttribute('data-book-name');
        const hadithNumber = hadithBox.getAttribute('data-hadith-number');
        const bookSlug = hadithBox.getAttribute('data-book-slug');
        
        if (bookName && hadithNumber && bookSlug) {
          const sourceKey = `hadith-${bookSlug}-${hadithNumber}`;
          
          if (!seenSources.has(sourceKey)) {
            seenSources.add(sourceKey);
            
            extractedSources.push({
              type: 'hadith',
              title: `${bookName} #${hadithNumber}`,
              url: `https://hadithapi.pages.dev/hadith/${bookSlug}/${hadithNumber}`,
              bookName,
              hadithNumber
            });
          }
        }
      });
      setSources(extractedSources);
    };
    
    if (content) {
      extractSources();
    }
  }, [content]);

  return (
    <div className="w-full px-4 sm:px-0 relative pb-[120px] sm:pb-0">
      <div className="flex justify-end items-center space-x-2 sm:space-x-3 mr-0 sm:mr-8 md:mr-16 lg:mr-32 xl:mr-40 bg-gray-50 dark:bg-gray-800/30 sm:bg-transparent dark:sm:bg-transparent rounded-lg sm:rounded-none px-2 py-1 sm:p-0 min-h-[44px] sm:min-h-0">
        <span className={`text-gray-600 dark:text-gray-400 font-medium ${
          isTextLarge ? 'text-sm' : 'text-xs'
        }`}>
          Sources:
        </span>
        {sources.length > 0 ? (
          <div className="flex items-center space-x-2 sm:space-x-2 flex-wrap gap-y-1">
            {sources.map((source, index) => (
              <a
                key={`${source.type}-${index}`}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative"
                title={source.title}
              >
                <div className="w-10 h-10 sm:w-8 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm sm:text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer touch-manipulation shadow-sm active:scale-95">
                  {source.type === 'ayah' ? 'Q' : 'H'}
                </div>
                {/* Tooltip - hidden on mobile, shown on hover for desktop */}
                <div className="hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  {source.title}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <span className={`text-gray-400 dark:text-gray-500 italic ${
            isTextLarge ? 'text-sm' : 'text-xs'
          }`}>
            No sources available
          </span>
        )}
      </div>
    </div>
  );
}