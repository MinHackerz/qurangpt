'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TafsirData {
  surahName: string;
  surahNo: number;
  ayahNo: number;
  tafsirs: Array<{
    author: string;
    groupVerse?: string;
    content: string;
  }>;
}

interface TafsirDropdownProps {
  surahNumber: number;
  ayahNumber: number;
}

export default function TafsirDropdown({ surahNumber, ayahNumber }: TafsirDropdownProps) {
  const [tafsirData, setTafsirData] = useState<TafsirData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTafsir, setExpandedTafsir] = useState<string | null>(null);

  // Fetch tafsir data
  const fetchTafsir = async () => {
    if (tafsirData) return; // Already loaded
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://quranapi.pages.dev/api/tafsir/${surahNumber}_${ayahNumber}.json`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Tafsir not available for this verse');
          return;
        }
        throw new Error(`Failed to fetch tafsir: ${response.status}`);
      }
      
      const data = await response.json();
      setTafsirData(data);
    } catch (err) {
      // Error fetching tafsir - silent fail for security
      setError('Unable to load tafsir at this time');
    } finally {
      setIsLoading(false);
    }
  };

  // Format tafsir content for better display
  const formatTafsirContent = (content: string) => {
    return content
      .replace(/\n/g, '<br>')
      .replace(/##\s*(.*?)$/gm, '<h4 class="font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-2">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-200">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>');
  };

  const toggleTafsir = (author: string) => {
    if (!tafsirData) {
      fetchTafsir();
    }
    setExpandedTafsir(expandedTafsir === author ? null : author);
  };

  return (
    <div className="mt-3">
      {/* Tafsir Buttons */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-3">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Loading tafsir...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        ) : !tafsirData ? (
          <button
            onClick={() => fetchTafsir()}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Read Tafsir
              </span>
            </div>
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          tafsirData.tafsirs.map((tafsir, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleTafsir(tafsir.author)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Read Tafsir - {tafsir.author}
                    </div>
                    {tafsir.groupVerse && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {tafsir.groupVerse}
                      </div>
                    )}
                  </div>
                </div>
                <motion.svg
                  animate={{ rotate: expandedTafsir === tafsir.author ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-4 h-4 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
              
              <AnimatePresence>
                {expandedTafsir === tafsir.author && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <div 
                          className="text-gray-700 dark:text-gray-300 leading-relaxed"
                          dangerouslySetInnerHTML={{ 
                            __html: formatTafsirContent(tafsir.content) 
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
