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
  textSize?: 'small' | 'medium' | 'large';
}

export default function SourcesSection({ content, textSize = 'small' }: SourcesSectionProps) {
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
    <div className="w-full max-w-4xl mx-auto px-6 sm:px-6 relative py-6 mb-12">
      <div className="flex justify-end items-center space-x-2 sm:space-x-3 bg-transparent px-0 py-3 min-h-[48px]">
        <span className={`text-gray-600 dark:text-gray-400 font-medium ${
          textSize === 'large' ? 'text-base' : textSize === 'medium' ? 'text-sm' : 'text-xs'
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
                <div className={`w-10 h-10 sm:w-8 sm:h-8 bg-gray-100/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-200/80 dark:hover:bg-gray-700/80 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200 cursor-pointer touch-manipulation backdrop-blur-sm active:scale-95 ${
                  textSize === 'large' ? 'text-base sm:text-sm' : textSize === 'medium' ? 'text-sm sm:text-xs' : 'text-xs sm:text-xs'
                }`}>
                  {source.type === 'ayah' ? 'Q' : 'H'}
                </div>
                {/* Tooltip - hidden on mobile, shown on hover for desktop */}
                <div className={`hidden sm:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 ${
                  textSize === 'large' ? 'text-sm' : textSize === 'medium' ? 'text-xs' : 'text-xs'
                }`}>
                  {source.title}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <span className={`text-gray-400 dark:text-gray-500 italic ${
            textSize === 'large' ? 'text-base' : textSize === 'medium' ? 'text-sm' : 'text-xs'
          }`}>
            No sources available
          </span>
        )}
      </div>
    </div>
  );
}