'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { useHadithManager } from '../hooks/useHadithManager';
import { getGlobalAbortManager } from '../hooks/useAbortManager';

interface ChatSectionProps {
  content: string;
  setContent: (content: string) => void;
  askQuran: () => void;
  resetForm: () => void;
  isProcessing: boolean;
  error: string;
  showSummary: boolean;
  // Language translation props
  originalText?: string;
  onTranslationChange?: (translatedText: string, language: string) => void;
  isTranslating?: boolean;
  translationProgress?: number;
  currentLanguage?: string;
  // Cache management
  translatedText?: string; // The actual translated text to cache
  onCacheTranslation?: (langCode: string, translatedText: string) => void; // Callback to cache translation
  // Content type selection props
  selectedContentTypes?: {
    tafsir: boolean;
    hadith: boolean;
    suggestedQuestions: boolean;
  };
  onContentTypeChange?: (contentTypes: {
    tafsir: boolean;
    hadith: boolean;
    suggestedQuestions: boolean;
  }) => void;
  // Stop operation functionality
  onStopOperation?: () => void;
}

export default function ChatSection({ 
  content, 
  setContent, 
  askQuran, 
  resetForm, 
  isProcessing, 
  error,
  showSummary,
  // Language translation props
  originalText,
  onTranslationChange,
  isTranslating,
  translationProgress,
  currentLanguage,
  // Cache management
  translatedText,
  onCacheTranslation,
  // Content type selection props
  selectedContentTypes = { tafsir: false, hadith: false, suggestedQuestions: false },
  onContentTypeChange,
  // Stop operation functionality
  onStopOperation
}: ChatSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Language management - same as LanguageTabs
  const { getSupportedLanguages, getCachedTranslation } = useTranslation({ context: 'islamic', preserveFormatting: true });
  const [supportedLanguages, setSupportedLanguages] = useState<{ [key: string]: any }>({});
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
  
  // Hadith management
  useHadithManager();
  
  // Translation cache for instant access
  const [translationCache, setTranslationCache] = useState<{ [key: string]: string }>({});
  
  // Track if we're using cached translation to prevent progress animation
  const [isUsingCachedTranslation, setIsUsingCachedTranslation] = useState(false);
  
  // State for language reminder animation
  const [showLanguageReminder, setShowLanguageReminder] = useState(false);
  
  // State for content type dropdown
  const [showContentTypeDropdown, setShowContentTypeDropdown] = useState(false);
  
  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContentTypeDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.content-type-dropdown') && !target.closest('.plus-icon-button')) {
          setShowContentTypeDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContentTypeDropdown]);
  
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
  
  // Show language reminder when user starts typing
  useEffect(() => {
    if (content.trim().length > 0 && content.trim().length <= 20) {
      setShowLanguageReminder(true);
      // Don't auto-hide - let it persist until user sends message
    } else if (content.trim().length === 0) {
      setShowLanguageReminder(false);
    }
  }, [content]);
  
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
  
  // Handle instant translation with caching - optimized
  const handleInstantTranslation = useCallback((langCode: string) => {
    // Early return if no original text
    if (!originalText) return;
    
    // Check if we have a cached translation
    if (translationCache[langCode]) {
      // Instant cached translation - NO API CALL
      setIsUsingCachedTranslation(true);
      onTranslationChange?.(translationCache[langCode], langCode);
      return;
    }
    
    // Check if there's a cached translation from the API
    if (getCachedTranslation) {
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

  // Handle content type toggle
  const handleContentTypeToggle = useCallback((contentType: 'tafsir' | 'hadith' | 'suggestedQuestions') => {
    if (!onContentTypeChange) return;
    
    const newContentTypes = {
      ...selectedContentTypes,
      [contentType]: !selectedContentTypes[contentType]
    };
    onContentTypeChange(newContentTypes);
  }, [selectedContentTypes, onContentTypeChange]);

  // Auto-resize function with improved mobile support and scrollable behavior
  const autoResize = (target: HTMLTextAreaElement) => {
    // Reset height to auto to get accurate scrollHeight
    target.style.height = 'auto';
    
    // Get the actual content height
    const scrollHeight = target.scrollHeight;
    
  // Mobile-first height calculations
  const isMobile = window.innerWidth < 640;
  const minHeight = isMobile ? 64 : 72; // Increased min height for better usability
  const maxHeight = isMobile ? 240 : 220; // Increased max height for more content
    
    // Calculate new height with better mobile support
    let newHeight = Math.max(scrollHeight, minHeight);
    newHeight = Math.min(newHeight, maxHeight);
    
    // Apply the new height
    target.style.height = newHeight + 'px';
    
    // Enable scrolling when content exceeds max height
    if (newHeight >= maxHeight) {
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
      className="mb-0 relative"
    >
      {/* ChatGPT-style Input Container - Clean Home Page Version */}
      <div className="w-full max-w-4xl mx-auto px-6 sm:px-0 pb-4 mt-40 sm:mt-0">
        <div className="relative">


          {/* Translate Section - Left side top with exact LanguageTabs styling */}
          {showSummary && (
            <div className="absolute -top-12 left-0 right-0 z-10 w-full">
              <div className="max-w-4xl mx-auto">
                {/* Fading top border */}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent mb-3"></div>
                <div className="flex items-center space-x-3 w-full">
                <span className="text-xs text-gray-600 dark:text-gray-400 font-mono tracking-wider uppercase flex-shrink-0">Translate:</span>
                
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
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
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
          <div className="relative bg-transparent rounded-xl border-[0.5px] border-gray-600 dark:border-gray-400 transition-all duration-200">
            
            {/* Content Type Dropdown - Above input field */}
            <AnimatePresence>
              {showContentTypeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute -top-12 left-0 z-20 bg-white dark:bg-gray-800 border-[0.5px] border-gray-600 dark:border-gray-400 rounded-lg shadow-lg p-1.5 min-w-[200px] content-type-dropdown"
                >
                  <div className="space-y-1">
                    <button
                      onClick={() => handleContentTypeToggle('tafsir')}
                      className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center gap-2 ${
                        selectedContentTypes.tafsir
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedContentTypes.tafsir
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedContentTypes.tafsir && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      Tafsir
                    </button>
                    <button
                      onClick={() => handleContentTypeToggle('hadith')}
                      className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center gap-2 ${
                        selectedContentTypes.hadith
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedContentTypes.hadith
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedContentTypes.hadith && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      Hadith
                    </button>
                    <button
                      onClick={() => handleContentTypeToggle('suggestedQuestions')}
                      className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center gap-2 ${
                        selectedContentTypes.suggestedQuestions
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedContentTypes.suggestedQuestions
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedContentTypes.suggestedQuestions && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      Suggested Questions
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Placeholder Text - At the top, hidden when typing */}
            {!content.trim() && (
              <div className="absolute top-2 left-3 z-10 pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-light tracking-wide">
                  Ask me anything about Quran & Islam...
                </span>
              </div>
            )}

            {/* Plus Button - Fixed in bottom left corner */}
            <button
              onClick={() => setShowContentTypeDropdown(!showContentTypeDropdown)}
              className="absolute bottom-2 left-3 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 plus-icon-button z-10"
              title="Add content types"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>

            {/* Selected Content Types Display - At the bottom, positioned after plus button */}
            <AnimatePresence>
              {(selectedContentTypes.tafsir || selectedContentTypes.hadith || selectedContentTypes.suggestedQuestions) && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute bottom-2 left-12 right-12 z-10"
                >
                  <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
                    {selectedContentTypes.tafsir && (
                      <span 
                        onClick={() => handleContentTypeToggle('tafsir')}
                        className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-xs rounded-md cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors duration-200 flex-shrink-0"
                      >
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs sm:text-xs font-medium">Tafsir</span>
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )}
                    {selectedContentTypes.hadith && (
                      <span 
                        onClick={() => handleContentTypeToggle('hadith')}
                        className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-xs rounded-md cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors duration-200 flex-shrink-0"
                      >
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="text-xs sm:text-xs font-medium">Hadith</span>
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )}
                    {selectedContentTypes.suggestedQuestions && (
                      <span 
                        onClick={() => handleContentTypeToggle('suggestedQuestions')}
                        className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-xs rounded-md cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors duration-200 flex-shrink-0"
                      >
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs sm:text-xs font-medium">Questions</span>
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <textarea
              ref={textareaRef}
              placeholder=""
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              className={`chat-input-textarea w-full p-3 sm:p-4 bg-transparent text-black dark:text-white border-none resize-none focus:outline-none text-sm sm:text-base leading-relaxed transition-all duration-200 ${
                (content.trim() || showSummary) ? 'pr-20 sm:pr-24 pl-3' : 'pr-14 sm:pr-16 pl-3'
              } ${
                (selectedContentTypes.tafsir || selectedContentTypes.hadith || selectedContentTypes.suggestedQuestions) 
                  ? 'pt-2 pb-8 sm:pt-2 sm:pb-10' 
                  : 'pt-2 pb-8 sm:pt-2 sm:pb-10'
              }`}
              style={{ 
                height: 'auto',
                overflowY: 'auto',
                maxHeight: '200px'
              }}
            />
            
            {/* Minimal highlight when content changes */}
            {content.trim() && (
              <motion.div
                key={content}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute inset-0 rounded-xl border border-emerald-200 dark:border-emerald-700 pointer-events-none"
                style={{ zIndex: -1 }}
              />
            )}
            

            

            {/* Action buttons container */}
            <div className="absolute top-1/2 right-2 sm:right-4 transform -translate-y-1/2 flex items-center gap-2 sm:gap-3">
              {/* Send/Stop Button - Revolutionary Design */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (isProcessing) {
                    // Stop operation using global abort manager
                    const abortManager = getGlobalAbortManager();
                    abortManager.setAborted(true);
                    onStopOperation?.();
                  } else {
                    // Reset abort state and send message
                    const abortManager = getGlobalAbortManager();
                    abortManager.reset();
                    setShowLanguageReminder(false);
                    askQuran();
                  }
                }}
                disabled={!content.trim()}
                className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                  content.trim()
                    ? isProcessing
                      ? 'bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-800/40 text-red-600 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
                title={isProcessing ? "Stop operation" : "Send message"}
              >
                {/* Icon container */}
                <div className="relative z-10 flex items-center justify-center">
                  {isProcessing ? (
                    /* Revolutionary Stop Animation - Red Square Only */
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-sm"></div>
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

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center border-[0.5px] border-red-500 dark:border-red-400 text-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Clipping Container - Minimalist */}
          <div className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-t from-transparent to-transparent pointer-events-none z-20"></div>
        </div>
      </div>

      {/* Language Reminder - Below Input Field */}
      <AnimatePresence>
        {showLanguageReminder && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.2
            }}
            className="mt-3 flex justify-center pointer-events-none px-6 sm:px-0"
          >
            <div className="relative w-full max-w-4xl mx-auto">
              {/* Main reminder card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-transparent border-[0.5px] border-gray-600 dark:border-gray-400 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 w-full"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Globe icon with subtle animation */}
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400"
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                  </motion.div>
                  
                  {/* Reminder text - Responsive layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-1 min-w-0">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono tracking-wide uppercase truncate">
                      Type in your native language
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono tracking-wide uppercase hidden sm:inline">
                      • Multilingual support
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono tracking-wide uppercase sm:hidden">
                      • Multilingual
                    </span>
                  </div>
                </div>
                
                {/* Subtle pulsing border */}
                <motion.div
                  animate={{ 
                    opacity: [0.3, 0.7, 0.3],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute inset-0 rounded-xl border border-emerald-300/30 dark:border-emerald-600/30 pointer-events-none"
                />
              </motion.div>
              
              {/* Floating particles effect */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      y: [0, -20, -40],
                      x: [0, Math.random() * 20 - 10, Math.random() * 40 - 20]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: i * 0.3,
                      repeat: Infinity,
                      repeatDelay: 1
                    }}
                    className="absolute w-1 h-1 bg-emerald-400/60 dark:bg-emerald-500/60 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%'
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      

      
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