'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Source {
  type: 'ayah' | 'hadith' | 'web';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const extractSources = () => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      const extractedSources: Source[] = [];
      const seenSources = new Set<string>(); // To avoid duplicates

      // Extract ayah sources
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

      // Extract hadith sources
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

      // Extract web context sources (Ayah & Hadith contexts)
      const contextLinks = tempDiv.querySelectorAll('.ayah-context-section a, .hadith-context-section a');
      contextLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href) {
          // Try to find title in h6, otherwise use text content
          const titleEl = link.querySelector('h6');
          const title = titleEl ? titleEl.textContent?.trim() : link.textContent?.trim().substring(0, 50);

          if (title && !seenSources.has(href)) {
            seenSources.add(href);
            extractedSources.push({
              type: 'web',
              title: title,
              url: href
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

  // Prevent scrolling when sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen]);

  if (sources.length === 0) return null;

  const Sidebar = (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-[9998]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl shadow-2xl z-[9999] flex flex-col border-l border-gray-100 dark:border-gray-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100/50 dark:border-gray-800/50">
              <div className="flex flex-col gap-1">
                <span className="text-xl font-medium text-gray-900 dark:text-white font-[var(--font-inter)] tracking-tight">
                  Citations
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">
                  {sources.length} Sources Found
                </span>
              </div>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 group"
              >
                <div className="p-1 border border-gray-200 dark:border-gray-700 rounded-full group-hover:border-gray-400 dark:group-hover:border-gray-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar">
              {sources.map((source, index) => (
                <motion.a
                  key={`${source.type}-${index}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group block p-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="relative z-10 flex gap-4 items-start">
                    {/* Icon Box */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${source.type === 'ayah'
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30'
                      : source.type === 'hadith'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30'
                        : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30'
                      }`}>
                      {source.type === 'ayah'
                        ? <span className="font-serif font-bold text-lg">Q</span>
                        : source.type === 'hadith'
                          ? <span className="font-serif font-bold text-lg">H</span>
                          : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                      }
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${source.type === 'ayah'
                          ? 'bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : source.type === 'hadith'
                            ? 'bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-indigo-100/50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                          }`}>
                          {source.type === 'ayah' ? 'Quran' : source.type === 'hadith' ? 'Hadith' : 'Web Context'}
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-amber-500 dark:text-gray-600 dark:group-hover:text-amber-400 transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed group-hover:text-black dark:group-hover:text-white transition-colors line-clamp-2">
                        {source.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 truncate flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Click to view reference</span>
                        <span>&rarr;</span>
                      </p>
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="w-full py-3 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.99] transition-all duration-200"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-6 sm:px-0 relative mt-6 flex justify-end">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="group flex items-center gap-2 pl-3 pr-4 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
        >
          <div className="flex -space-x-2 mr-1">
            {[...Array(Math.min(3, sources.length))].map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full border border-white dark:border-gray-900 flex items-center justify-center text-[8px] font-bold z-${30 - i * 10} ${sources[i]?.type === 'ayah'
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400'
                  : sources[i]?.type === 'hadith'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'
                  }`}
              >
                {sources[i]?.type === 'ayah' ? 'Q' : sources[i]?.type === 'hadith' ? 'H' : 'W'}
              </div>
            ))}
          </div>

          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
            {sources.length} citations
          </span>
          <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {mounted && createPortal(Sidebar, document.body)}
    </>
  );
}