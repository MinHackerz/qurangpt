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
  const [isVisible, setIsVisible] = useState(false);

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
      setIsVisible(extractedSources.length > 0);
    };
    
    if (content) {
      extractSources();
    }
  }, [content]);

  if (!isVisible || sources.length === 0) {
    return null;
  }

  return (
    <div className="flex justify-end mb-4 relative" style={{ marginTop: '-30px' }}>
      <div className="flex items-center space-x-3" style={{ marginRight: '180px' }}>
        <span className={`text-gray-600 dark:text-gray-400 font-medium ${
          isTextLarge ? 'text-sm' : 'text-xs'
        }`}>
          Sources:
        </span>
        {sources.map((source, index) => (
          <a
            key={`${source.type}-${index}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative"
            title={source.title}
          >
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 cursor-pointer">
              {source.type === 'ayah' ? 'Q' : 'H'}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
              {source.title}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}