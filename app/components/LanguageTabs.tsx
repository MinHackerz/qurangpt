'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from '../hooks/useTranslation';

interface Language {
  name: string;
  nativeName: string;
  rtl: boolean;
  code: string;
}

interface SupportedLanguages {
  [key: string]: Language;
}

interface Translation {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  translationId: string;
}

interface TranslationCache {
  [key: string]: {
    translation: Translation;
    timestamp: number;
  };
}

interface LanguageTabsProps {
  originalText: string;
  onTranslationChange: (translatedText: string, language: string) => void;
  context?: 'islamic' | 'general' | 'quran';
  preserveFormatting?: boolean;
  className?: string;
  isTranslating?: boolean;
  translationProgress?: number;
}

export default function LanguageTabs({
  originalText,
  onTranslationChange,
  context = 'islamic',
  preserveFormatting = true,
  className = '',
  isTranslating = false,
  translationProgress = 0
}: LanguageTabsProps) {
  const { 
    translate, 
    isLoading: isTranslatingHook, 
    error: translationError, 
    getSupportedLanguages,
    getCachedTranslation 
  } = useTranslation({ context, preserveFormatting });
  
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguages>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [loadingLanguages, setLoadingLanguages] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  const [currentTranslationStage, setCurrentTranslationStage] = useState<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastProcessedLanguage = useRef<string>('en');
  const lastProcessedText = useRef<string>('');
  const isMountedRef = useRef(true);

  // Translation stages mapping
  const getTranslationStage = (progress: number): string => {
    if (progress <= 15) return 'Analyzing content...';
    if (progress <= 35) return 'Extracting AI text...';
    if (progress <= 70) return 'Translating...';
    if (progress <= 85) return 'Processing...';
    if (progress <= 95) return 'Finalizing...';
    return 'Complete';
  };

  // Update translation stage when progress changes
  useEffect(() => {
    if (isTranslating) {
      setCurrentTranslationStage(getTranslationStage(translationProgress));
    } else {
      setCurrentTranslationStage('');
    }
  }, [translationProgress, isTranslating]);

  // Add completion celebration effect
  useEffect(() => {
    if (translationProgress === 100 && isTranslating) {
      // Small delay to show completion state
      const timer = setTimeout(() => {
        setCurrentTranslationStage('Complete');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [translationProgress, isTranslating]);

  // Popular languages to show first
  const POPULAR_LANGUAGES = [
    'en', 'ar', 'ur', 'hi', 'bn', 'id', 'ms', 'tr', 'fa', 'es', 'fr', 'de', 'ru', 'zh'
  ];

  const getLanguageDisplayName = useCallback((code: string) => {
    const lang = supportedLanguages[code];
    return lang ? `${lang.nativeName}` : code;
  }, [supportedLanguages]);

  const handleTranslation = useCallback(async (targetLanguage: string) => {
    if (!originalText.trim() || targetLanguage === 'en' || targetLanguage === 'original') {
      onTranslationChange(originalText, 'en');
      return;
    }

    // Check cache first
    const cached = getCachedTranslation(originalText, targetLanguage);
    if (cached) {
      onTranslationChange(cached.translatedText, targetLanguage);
      return;
    }

    try {
      setLoadingLanguages(prev => {
        const newSet = new Set(prev);
        newSet.add(targetLanguage);
        return newSet;
      });
      
      // For selective translation, we need to pass the original text and let the parent handle it
      // This ensures API components like audio players are preserved
      onTranslationChange(originalText, targetLanguage);
      
    } catch (err) {
      console.error('Translation error:', err);
      
      // Show user-friendly error message
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      
      if (errorMessage.includes('quota') || errorMessage.includes('rate limit') || errorMessage.includes('Too many')) {
        // Show quota exceeded message with suggestion
        setError('Translation service is temporarily unavailable due to high usage. Please try again in a few minutes.');
        
        // Check if we have cached translations to suggest
        const cachedLanguages = Object.keys(supportedLanguages).filter(lang => 
          getCachedTranslation(originalText, lang)
        );
        
        if (cachedLanguages.length > 0) {
          setTimeout(() => {
            if (isMountedRef.current) {
              setError(`You can still view previously translated versions in: ${cachedLanguages.slice(0, 3).map(lang => getLanguageDisplayName(lang)).join(', ')}`);
            }
          }, 2000);
          
          // Automatically switch to a cached translation if available
          const firstCachedLang = cachedLanguages[0];
          if (firstCachedLang && firstCachedLang !== selectedLanguage) {
            setTimeout(() => {
              if (isMountedRef.current) {
                const cachedTranslation = getCachedTranslation(originalText, firstCachedLang);
                if (cachedTranslation) {
                  // Update refs to prevent infinite loop
                  lastProcessedLanguage.current = firstCachedLang;
                  lastProcessedText.current = originalText;
                  setSelectedLanguage(firstCachedLang);
                  onTranslationChange(cachedTranslation.translatedText, firstCachedLang);
                  setError('Showing cached translation. New translations will be available when the service resumes.');
                }
              }
            }, 3000);
          }
        }
      } else if (errorMessage.includes('retry')) {
        // Show retry message
        setError('Translation failed, retrying automatically...');
      } else if (errorMessage.includes('currently unavailable')) {
        // Show service unavailable message
        setError('Translation service is currently unavailable. Please try again later or use cached translations.');
      } else {
        // Show generic error message
        setError('Translation failed. Please try again.');
      }
      
      // Clear error after 5 seconds, but only if component is still mounted
      setTimeout(() => {
        if (isMountedRef.current) {
          setError('');
        }
      }, 5000);
    } finally {
      setLoadingLanguages(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetLanguage);
        return newSet;
      });
    }
  }, [originalText, onTranslationChange, getCachedTranslation, supportedLanguages, selectedLanguage, getLanguageDisplayName]);

  const loadSupportedLanguages = useCallback(async () => {
    try {
      setIsLoadingLanguages(true);
      const data = await getSupportedLanguages();
      setSupportedLanguages(data.supportedLanguages);
      // Only clear error if there is one to clear
      if (error) {
        setError('');
      }
    } catch (err) {
      console.error('Error loading languages:', err);
      setError('Failed to load languages');
    } finally {
      setIsLoadingLanguages(false);
    }
  }, [getSupportedLanguages, error]);

  // Load supported languages on mount
  useEffect(() => {
    loadSupportedLanguages();
    
    // Cleanup on unmount
    return () => {
      isMountedRef.current = false;
    };
  }, [loadSupportedLanguages]);

  // Auto-translate when language changes (with debounce to reduce API calls)
  useEffect(() => {
    if (selectedLanguage && originalText) {
      // Prevent infinite loops by checking if we've already processed this combination
      if (lastProcessedLanguage.current === selectedLanguage && lastProcessedText.current === originalText) {
        return;
      }
      
      if (selectedLanguage === 'en' || selectedLanguage === 'original') {
        // Only call onTranslationChange if the content is different
        onTranslationChange(originalText, 'en');
        lastProcessedLanguage.current = selectedLanguage;
        lastProcessedText.current = originalText;
      } else {
        // Add a small delay to prevent rapid API calls
        const timeoutId = setTimeout(() => {
          handleTranslation(selectedLanguage);
          lastProcessedLanguage.current = selectedLanguage;
          lastProcessedText.current = originalText;
        }, 300);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [selectedLanguage, originalText, onTranslationChange, handleTranslation]);

  // Update error state from hook
  useEffect(() => {
    if (translationError) {
      // Show user-friendly error messages
      if (translationError.message.includes('quota') || translationError.message.includes('rate limit')) {
        setError('Translation temporarily unavailable. Please try again later.');
      } else {
        setError(translationError.message);
      }
    } else if (error) {
      // Only clear error if there is one to clear
      setError('');
    }
  }, [translationError, error]);



  const scrollToLanguage = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getLanguageOrder = () => {
    const allLanguages = Object.keys(supportedLanguages);
    const popular = POPULAR_LANGUAGES.filter(lang => allLanguages.includes(lang));
    const others = allLanguages.filter(lang => !POPULAR_LANGUAGES.includes(lang)).sort();
    return [...popular, ...others];
  };

  const getTranslationQuality = (language: string) => {
    const cached = getCachedTranslation(originalText, language);
    return cached?.confidence || 0;
  };



  if (isLoadingLanguages) {
    return (
      <div className={`flex items-center justify-center py-3 ${className}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border border-gray-300 border-t-gray-600 rounded-full"
        />
      </div>
    );
  }

  if (Object.keys(supportedLanguages).length === 0) {
    return null;
  }

  return (
    <div className={`relative language-tabs-container ${className}`}>
      {/* Translation Progress Indicator */}
      <AnimatePresence>
        {isTranslating && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm"
          >
            <div className="space-y-3">
              {/* Header with stage and progress */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {currentTranslationStage}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {Math.round(translationProgress)}%
                </span>
              </div>
              
              {/* Enhanced Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                  {/* Background gradient for depth */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full" />
                  
                  {/* Main progress bar with gradient */}
                  <motion.div
                    className="relative h-2 bg-gradient-to-r from-gray-400 via-gray-600 to-gray-800 dark:from-gray-500 dark:via-gray-700 dark:to-gray-900 rounded-full shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${translationProgress}%` }}
                    transition={{ 
                      duration: 0.4, 
                      ease: "easeOut",
                      type: "spring",
                      stiffness: 100,
                      damping: 20
                    }}
                  >
                    {/* Progress bar shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ 
                        x: translationProgress === 100 ? 0 : [-20, 20],
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: translationProgress === 100 ? 0 : Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    
                    {/* Completion pulse effect */}
                    {translationProgress === 100 && (
                      <motion.div
                        className="absolute inset-0 bg-white/30 rounded-full"
                        initial={{ scale: 0.8, opacity: 0.8 }}
                        animate={{ scale: 1.2, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    )}
                  </motion.div>
                </div>
                
                {/* Progress markers for stages */}
                <div className="flex justify-between mt-2">
                  {[15, 35, 70, 85, 95].map((marker) => (
                    <motion.div
                      key={marker}
                      className={`w-1.5 h-1.5 rounded-full ${
                        translationProgress >= marker 
                          ? 'bg-gray-800 dark:bg-gray-200' 
                          : 'bg-gray-400 dark:bg-gray-500'
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: translationProgress >= marker ? 1 : 0.5,
                        opacity: translationProgress >= marker ? 1 : 0.3
                      }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-2 text-xs text-red-500 dark:text-red-400 text-center"
          >
            {error}
            {error.includes('quota') || error.includes('rate limit') || error.includes('Too many') ? (
              <button
                onClick={() => setError('')}
                className="ml-2 underline hover:no-underline"
              >
                Dismiss
              </button>
            ) : null}
            {error.includes('failed') && !error.includes('quota') && !error.includes('rate limit') ? (
              <button
                onClick={() => handleTranslation(selectedLanguage)}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimalistic Language Tabs */}
      <div className="relative h-16">
        <div
          ref={scrollContainerRef}
          className="flex gap-1 overflow-x-auto overflow-y-hidden scrollbar-hide py-2 scroll-smooth h-12 items-center"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {getLanguageOrder().map((langCode) => {
            const isSelected = selectedLanguage === langCode;
            const isLoading = loadingLanguages.has(langCode);
            const displayName = getLanguageDisplayName(langCode);
            const hasCachedTranslation = getCachedTranslation(originalText, langCode);
            const isCurrentlyTranslating = isTranslating && selectedLanguage === langCode;

            return (
              <motion.button
                key={langCode}
                onClick={() => {
                  setSelectedLanguage(langCode);
                }}
                disabled={isLoading || isTranslating}
                className={`
                  relative group px-3 py-1.5 text-xs font-medium transition-all duration-300 whitespace-nowrap rounded-full border
                  ${isSelected
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100'
                    : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                  ${isLoading || isCurrentlyTranslating
                    ? 'cursor-not-allowed border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400' 
                    : 'cursor-pointer hover:scale-105'
                  }
                  ${hasCachedTranslation && !isSelected ? 'border-green-400 dark:border-green-500' : ''}
                `}
                whileHover={!isLoading && !isTranslating ? { scale: 1.05 } : {}}
                whileTap={!isLoading && !isTranslating ? { scale: 0.95 } : {}}
              >
                {/* Translation Progress Indicator for Selected Language */}
                {isCurrentlyTranslating && (
                  <motion.div
                    className="absolute inset-0 bg-gray-200/30 dark:bg-gray-600/30 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Cached Translation Indicator */}
                {hasCachedTranslation && !isLoading && !isCurrentlyTranslating && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  />
                )}

                {/* Loading Effect - Subtle dots animation */}
                {isLoading && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex space-x-0.5">
                      <motion.div
                        className="w-1 h-1 bg-current rounded-full"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-1 h-1 bg-current rounded-full"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-1 h-1 bg-current rounded-full"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Language Name */}
                <span className={`${isLoading || isCurrentlyTranslating ? 'opacity-30' : 'opacity-100'} transition-opacity duration-300`}>
                  {displayName}
                </span>
                
                {/* Tooltip for translation status */}
                {hasCachedTranslation && !isLoading && !isCurrentlyTranslating && (
                  <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    Cached translation available
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="selectedLanguage"
                    className="absolute inset-0 bg-gray-900 dark:bg-gray-100 rounded-full"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Natural Vanishing Fade Effects */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-800 via-white/60 dark:via-gray-800/60 via-white/30 dark:via-gray-800/30 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 via-white/60 dark:via-gray-800/60 via-white/30 dark:via-gray-800/30 to-transparent pointer-events-none" />
      </div>

      {/* Hidden scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Prevent vertical scrolling */
        .language-tabs-container {
          overflow-y: hidden;
          max-height: 4rem;
        }
      `}</style>
    </div>
  );
}
