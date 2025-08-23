'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import AyahAudioPlayer from './AyahAudioPlayer';

interface ResponseSectionProps {
  showSummary: boolean;
  summary: string;
  copyContent: () => void;
  copied: boolean;
  onAudioPlay: (ayahId: string, globalAyahNumber: string) => void;
  onAudioPause: (ayahId: string) => void;
  onAudioEnd: (ayahId: string) => void;
  isAudioPlaying: (ayahId: string) => boolean;
  isAudioActive: (ayahId: string) => boolean;
}

export default function ResponseSection({ 
  showSummary, 
  summary, 
  copyContent, 
  copied,
  onAudioPlay,
  onAudioPause,
  onAudioEnd,
  isAudioPlaying,
  isAudioActive
}: ResponseSectionProps) {
  const [processedSummary, setProcessedSummary] = useState(summary);
  const containerRef = useRef<HTMLDivElement>(null);

  // Process summary to replace placeholders with AudioPlayer components
  useEffect(() => {
    if (!summary || !containerRef.current) return;

    // Find all audio player placeholders
    const placeholders = containerRef.current.querySelectorAll('.audio-player-placeholder');
    
    placeholders.forEach((placeholder) => {
      const ayahId = placeholder.getAttribute('data-ayah-id');
      const globalAyahNumber = placeholder.getAttribute('data-global-ayah');
      const surahName = placeholder.getAttribute('data-surah-name');
      const ayahNumber = placeholder.getAttribute('data-ayah-number');
      
      if (ayahId && globalAyahNumber && surahName && ayahNumber) {
        // Create a wrapper div for the React component
        const wrapper = document.createElement('div');
        wrapper.className = 'audio-player-wrapper';
        wrapper.setAttribute('data-ayah-id', ayahId);
        
        // Replace the placeholder with the wrapper
        placeholder.parentNode?.replaceChild(wrapper, placeholder);
      }
    });
  }, [summary]);

  return (
    <AnimatePresence>
      {showSummary && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="relative mb-20 max-w-6xl mx-auto px-4"
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 dark:bg-gray-200"></div>
            
            {/* Header with copy button */}
            <div className="relative p-6 md:p-8 pb-4 md:pb-6 bg-gray-50 dark:bg-gray-900">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyContent}
                className={`absolute top-4 md:top-6 right-4 md:right-6 z-20 overflow-hidden w-12 h-12 rounded-full text-sm font-medium transition-all duration-500 transform flex items-center justify-center ${
                  copied
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white scale-105'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500'
                }`}
              >
                {/* Animated background ripple effect */}
                <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
                  copied 
                    ? 'bg-gradient-to-r from-emerald-400 to-green-400 opacity-100 scale-110' 
                    : 'opacity-0 scale-95'
                }`} />
                
                {/* Success checkmark animation */}
                <motion.div 
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                    copied ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                  }`}
                  animate={copied ? { scale: [0.75, 1.1, 1], opacity: [0, 1, 1] } : {}}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <motion.path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2.5" 
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={copied ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </svg>
                </motion.div>
                
                {/* Default content with slide animation */}
                <motion.div 
                  className={`relative z-10 transition-all duration-400 ${
                    copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  }`}
                  animate={copied ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ClipboardIcon className="w-5 h-5 transition-colors duration-200" />
                </motion.div>
                
                {/* Subtle sparkle effect */}
                <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                  copied ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className="absolute top-1 right-2 w-1 h-1 bg-white rounded-full animate-pulse" />
                  <div className="absolute top-3 right-1 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-150" />
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full animate-pulse delay-300" />
                </div>
              </motion.button>
              
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-800 dark:bg-gray-200 flex items-center justify-center mr-3 md:mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6 text-white dark:text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 font-[var(--font-amiri)]">Quran GPT's Answer</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Divine guidance from the Holy Quran</p>
                </div>
              </div>
            </div>
            
            {/* Content with sophisticated typography */}
            <div className="px-6 md:px-8 pb-6 md:pb-8">
              <div className="prose dark:prose-invert prose-gray max-w-none">
                <div 
                  ref={containerRef}
                  className="text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed text-base md:text-lg"
                  dangerouslySetInnerHTML={{ __html: summary }}
                />
                
                {/* Audio players are now rendered inline with each ayah */}
              </div>
            </div>


          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
