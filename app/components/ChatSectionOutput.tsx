'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface ChatSectionOutputProps {
  content: string;
  setContent: (content: string) => void;
  askQuran: () => void;
  resetForm: () => void;
  isProcessing: boolean;
  error: string;
  showSummary: boolean;
  showTranslateSection: boolean; // New prop for controlling translate section visibility
  // Language translation props
  originalText?: string;
  onTranslationChange?: (translatedText: string, language: string) => void;
  isTranslating?: boolean;
  translationProgress?: number;
  currentLanguage?: string;
  // Cache management
  translatedText?: string; // The actual translated text to cache
  onCacheTranslation?: (langCode: string, translatedText: string) => void; // Callback to cache translation
}

export default function ChatSectionOutput({ 
  content, 
  setContent, 
  askQuran, 
  resetForm, 
  isProcessing, 
  error,
  showSummary,
  showTranslateSection,
  // Language translation props
  originalText,
  onTranslationChange,
  isTranslating,
  translationProgress,
  currentLanguage,
  // Cache management
  translatedText,
  onCacheTranslation
}: ChatSectionOutputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Language management - same as LanguageTabs
  const { getSupportedLanguages, getCachedTranslation } = useTranslation({ context: 'islamic', preserveFormatting: true });
  const [supportedLanguages, setSupportedLanguages] = useState<{ [key: string]: any }>({});
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  
  // Translation cache for instant access
  const [translationCache, setTranslationCache] = useState<{ [key: string]: string }>({});
  
  // Track if we're using cached translation to prevent progress animation
  const [isUsingCachedTranslation, setIsUsingCachedTranslation] = useState(false);
  
  // Popular languages to show first (same as LanguageTabs)
  const POPULAR_LANGUAGES = [
    'en', 'ar', 'ur', 'hi', 'bn', 'id', 'ms', 'tr', 'fa', 'es', 'fr', 'de', 'ru', 'zh'
  ];
  
  // Load supported languages
  const loadSupportedLanguages = useCallback(async () => {
    try {
      setIsLoadingLanguages(true);
      const data = await getSupportedLanguages();
      setSupportedLanguages(data.supportedLanguages);
    } catch (err) {
      // Error loading languages - silent fail for security
    } finally {
      setIsLoadingLanguages(false);
    }
  }, [getSupportedLanguages]);
  
  // Load languages on mount
  useEffect(() => {
    loadSupportedLanguages();
  }, [loadSupportedLanguages]);
  
  // Update cache when translation is completed
  useEffect(() => {
    if (translationProgress === 100 && currentLanguage && currentLanguage !== 'en' && translatedText) {
      // Translation completed, cache it for future instant access
      setTranslationCache(prev => ({
        ...prev,
        [currentLanguage]: translatedText
      }));
      
      // Also notify parent component about the cached translation
      onCacheTranslation?.(currentLanguage, translatedText);
    }
  }, [translationProgress, currentLanguage, translatedText, onCacheTranslation]);
  
  // Reset cached translation flag after showing success message
  useEffect(() => {
    if (isUsingCachedTranslation) {
      const timer = setTimeout(() => {
        setIsUsingCachedTranslation(false);
      }, 2000); // Show success message for 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [isUsingCachedTranslation]);
  
  // Get language order (same as LanguageTabs)
  const getLanguageOrder = () => {
    const allLanguages = Object.keys(supportedLanguages);
    const popular = POPULAR_LANGUAGES.filter(lang => allLanguages.includes(lang));
    const others = allLanguages.filter(lang => !POPULAR_LANGUAGES.includes(lang)).sort();
    return [...popular, ...others];
  };
  
  // Get language display name (same as LanguageTabs)
  const getLanguageDisplayName = useCallback((code: string) => {
    const lang = supportedLanguages[code];
    return lang ? `${lang.nativeName}` : code;
  }, [supportedLanguages]);
  
  // Check if translation is cached for instant access
  const isTranslationCached = useCallback((langCode: string) => {
    return translationCache[langCode] !== undefined;
  }, [translationCache]);
  
  // Handle instant translation with caching
  const handleInstantTranslation = useCallback((langCode: string) => {
    // Check if we have a cached translation
    if (translationCache[langCode]) {
      // Instant cached translation - NO API CALL
      setIsUsingCachedTranslation(true);
      // Start new translation with empty string to trigger progress animation
      onTranslationChange?.(translationCache[langCode], langCode);
      return;
    }
    
    // Check if there's a cached translation from the API
    if (originalText && getCachedTranslation) {
      const apiCached = getCachedTranslation(originalText, langCode);
      if (apiCached) {
        // Cache it locally for future instant access
        setTranslationCache(prev => ({
          ...prev,
          [langCode]: apiCached.translatedText
        }));
        // Use the cached translation instantly - NO API CALL
        setIsUsingCachedTranslation(true);
        onTranslationChange?.(apiCached.translatedText, langCode);
        return;
      }
    }
    
    // Only trigger new translation if no cache exists
    // This prevents unnecessary API calls for already translated content
    if (!translationCache[langCode]) {
      setIsUsingCachedTranslation(false); // Reset flag for new translation
      // Start new translation with empty string to trigger progress animation
      onTranslationChange?.('', langCode);
    }
  }, [translationCache, originalText, onTranslationChange, getCachedTranslation]);


  // Auto-resize function with improved mobile support
  const autoResize = (target: HTMLTextAreaElement) => {
    // Reset height to auto to get accurate scrollHeight
    target.style.height = 'auto';
    
    // Get the actual content height
    const scrollHeight = target.scrollHeight;
    
    // Mobile-first height calculations
    const isMobile = window.innerWidth < 640;
    const minHeight = isMobile ? 56 : 60; // Increased mobile min height
    const maxHeight = isMobile ? 300 : 240; // Increased mobile max height for better text visibility
    
    // Calculate new height with better mobile support
    let newHeight = Math.max(scrollHeight, minHeight);
    
    // On mobile, allow more height for better text visibility
    if (isMobile && scrollHeight > minHeight) {
      // Add extra padding for mobile to ensure text is fully visible
      newHeight = Math.min(scrollHeight + 20, maxHeight);
    } else {
      newHeight = Math.min(newHeight, maxHeight);
    }
    
    // Apply the new height
    target.style.height = newHeight + 'px';
    
    // Ensure the textarea doesn't get cut off on mobile
    if (isMobile && newHeight >= maxHeight) {
      target.style.overflowY = 'auto';
    } else {
      target.style.overflowY = 'hidden';
    }
  };

  // Effect to handle initial height and external content changes
  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, [content]);

  // Handle window resize and orientation changes for mobile
  useEffect(() => {
    const handleResize = () => {
      if (textareaRef.current) {
        // Small delay to ensure orientation change is complete
        setTimeout(() => {
          autoResize(textareaRef.current!);
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return;
      } else {
        // Prevent default Enter behavior - don't submit
        e.preventDefault();
        // Only allow Shift+Enter for new lines
        return;
      }
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    setContent(target.value);
    autoResize(target);
  };

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        className="mb-0 fixed bottom-[-100px] left-0 right-0 overflow-hidden z-50"
        style={{
          // PWA safe area support
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >

      {/* Full-width background color from warning text to extreme bottom of page */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-50 dark:bg-gray-950 z-0" style={{ height: '1000vh', width: '100%', bottom: '-900vh' }}></div>
      
      {/* Spacer to prevent content from going behind fixed footer */}
      <div className="h-8 sm:h-12"></div>
      
      {/* ChatGPT-style Input Container - Fixed Footer Effect */}
      <div className="max-w-4xl mx-auto px-4 sm:px-0 pb-4 sticky bottom-0 bg-transparent pt-4 z-20">
        <div className="relative">


                    {/* Translate Section - Left side top with exact LanguageTabs styling */}
          {showTranslateSection && (
            <div className="absolute -top-12 left-0 right-0 z-10 w-full px-4 sm:px-0">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-3 w-full">
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium flex-shrink-0">Translate:</span>
                  
                  {/* Language buttons with exact LanguageTabs styling - Dynamic from API */}
                  {isLoadingLanguages ? (
                    <div className="flex items-center justify-center py-1 flex-1">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="w-3 h-3 border border-emerald-300 dark:border-emerald-600 border-t-emerald-500 dark:border-emerald-400 rounded-full"
                      />
                    </div>
                  ) : (isTranslating && !isUsingCachedTranslation) ? (
                    /* Translation Progress Animation - Extended full width */
                    <div className="flex-1 flex items-center py-1">
                      <div className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 px-4 py-1.5 rounded-lg">
                        {/* Left side - Progress info */}
                        <div className="flex items-center space-x-3">
                                                  {/* Progress indicator */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          className="w-3 h-3 border border-gray-400 dark:border-gray-500 border-t-gray-600 dark:border-t-gray-300 rounded-full"
                        />
                          
                                                  {/* Progress message */}
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {translationProgress && translationProgress <= 10 ? 'Starting...' :
                           translationProgress && translationProgress <= 30 ? 'Preparing...' :
                           translationProgress && translationProgress <= 80 ? 'Translating...' :
                           translationProgress && translationProgress <= 100 ? 'Finalizing...' : 'Complete!'}
                        </span>
                      </div>
                      
                      {/* Right side - Progress tracking */}
                      <div className="flex items-center space-x-3">
                        {/* Progress percentage */}
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800/30 px-2 py-0.5 rounded">
                          {translationProgress ? Math.round(translationProgress) : 0}%
                        </span>
                          
                                                  {/* Progress bar */}
                        <div className="w-32 bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
                          <motion.div
                            className="h-1 bg-gray-800 dark:bg-gray-200 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${translationProgress || 0}%` }}
                            transition={{ duration: 0.1, ease: "easeOut" }}
                          />
                        </div>
                        </div>
                      </div>
                    </div>
                  ) : isUsingCachedTranslation ? (
                    /* Instant Cached Translation Success - Extended full width */
                    <div className="flex-1 flex items-center py-1">
                      <div className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 px-4 py-1.5 rounded-lg">
                        {/* Left side - Instant success */}
                        <div className="flex items-center space-x-3">
                          {/* Instant success indicator */}
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2, ease: "backOut" }}
                            className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center"
                          >
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                          
                          {/* Instant success message */}
                          <span className="text-xs font-medium text-emerald-300">
                            Translation Loaded Instantly! 🚀
                          </span>
                        </div>
                        
                        {/* Right side - Success indicator */}
                        <div className="flex items-center space-x-3">
                          {/* Success badge */}
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-100 dark:bg-emerald-800/30 px-2 py-0.5 rounded">
                            Cached
                          </span>
                          
                          {/* Success icon */}
                          <div className="w-8 h-6 bg-emerald-200 dark:bg-emerald-700 rounded flex items-center justify-center">
                            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1 items-center flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide py-1 scroll-smooth w-full">
                      {getLanguageOrder().map((langCode) => {
                        const isSelected = currentLanguage === langCode;
                        
                        return (
                          <motion.button
                            key={langCode}
                            onClick={() => {
                              handleInstantTranslation(langCode);
                            }}
                            disabled={isTranslating}
                            className={`
                              relative group px-2.5 py-1 text-xs font-medium transition-all duration-300 whitespace-nowrap rounded-lg border flex-shrink-0
                              ${isSelected
                                ? 'bg-emerald-600 dark:bg-emerald-400 text-white dark:text-emerald-900 border-emerald-600 dark:border-emerald-400 shadow-sm'
                                : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-white dark:hover:bg-gray-700'
                              }
                              ${isTranslating
                                ? 'cursor-not-allowed bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400' 
                                : 'cursor-pointer'
                              }
                            `}
                            whileHover={!isTranslating ? { scale: 1.02, y: -1 } : {}}
                            whileTap={!isTranslating ? { scale: 0.98 } : {}}
                          >
                            {/* Language Name */}
                            <span className="opacity-100 transition-opacity duration-300">
                              {getLanguageDisplayName(langCode)}
                            </span>
                            
                            {/* Cached Translation Indicator */}
                            {isTranslationCached(langCode) && !isSelected && (
                              <motion.div
                                className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2 }}
                              />
                            )}
                            
                            {/* Selection Indicator */}
                            {isSelected && (
                              <motion.div
                                layoutId="selectedLanguage"
                                className="absolute inset-0 bg-emerald-600 dark:bg-emerald-400 rounded-lg"
                                style={{ zIndex: -1 }}
                                transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main Input Field - Minimalist Professional */}
          <div className="relative bg-transparent rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200">
            
            <textarea
              ref={textareaRef}
              placeholder="Ask me anything about Quran & Islam..."
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              className={`chat-input-textarea w-full p-3 sm:p-4 bg-transparent text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 placeholder:font-light placeholder:tracking-wide border-none resize-none focus:outline-none text-sm sm:text-base leading-relaxed min-h-[48px] sm:min-h-[52px] max-h-[200px] sm:max-h-[180px] transition-all duration-200 ${
                (content.trim() || showSummary) ? 'pr-24 sm:pr-28' : 'pr-14 sm:pr-16'
              }`}
              style={{ 
                height: 'auto',
                overflow: 'hidden'
              }}
            />
            
            {/* Action buttons container */}
            <div className="absolute top-1/2 right-3 sm:right-4 transform -translate-y-1/2 flex items-center gap-3">
              {/* Send Button - Minimalist Design */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={askQuran}
                disabled={isProcessing || !content.trim()}
                className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  content.trim() && !isProcessing
                    ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
                title="Send message"
              >
                {/* Icon container */}
                <div className="relative z-10 flex items-center justify-center">
                  {isProcessing ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </div>
                

              </motion.button>

              {/* Clear Button - Minimalist Design */}
              <AnimatePresence>
                {(content.trim() || showSummary) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetForm}
                  disabled={isProcessing}
                  className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    !isProcessing
                      ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  title="Clear and reset"
                >
                  {/* Icon container */}
                  <div className="relative z-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  

                </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Content Clipping Container - Minimalist */}
          <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-t from-transparent to-transparent pointer-events-none z-20"></div>
        </div>
      </div>
      
      {/* Warning Text - One liner below input section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-0 -mt-2 pb-10 relative z-30">
        <div className="text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="text-amber-600 dark:text-amber-400 font-semibold mr-1">⚠️ Warning:</span>
            AI responses may contain inaccuracies. Verify religious information with authentic sources.
          </p>
        </div>
      </div>
      

      {/* Hidden scrollbar styles for language buttons */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
}
