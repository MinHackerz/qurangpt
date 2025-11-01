'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useHadithManager } from '../hooks/useHadithManager';
import { getGlobalAbortManager } from '../hooks/useAbortManager';
import { detectLanguage } from '../utils/languageDetection';

interface ChatSectionProps {
  content: string;
  setContent: (content: string) => void;
  askQuran: () => void;
  resetForm: () => void;
  isProcessing: boolean;
  error: string;
  showSummary: boolean;
  // Hero section props
  getGreetingMessage?: () => React.ReactNode;
  // Content type selection props
  selectedContentTypes?: {
    tafsir: boolean;
    hadith: boolean;
    webSearch: boolean;
    suggestedQuestions: boolean;
  };
  onContentTypeChange?: (contentTypes: {
    tafsir: boolean;
    hadith: boolean;
    webSearch: boolean;
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
  // Hero section props
  getGreetingMessage,
  // Content type selection props
  selectedContentTypes = { tafsir: false, hadith: false, webSearch: false, suggestedQuestions: false },
  onContentTypeChange,
  // Stop operation functionality
  onStopOperation
}: ChatSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [sidebarOffset, setSidebarOffset] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Hadith management
  useHadithManager();
  
  // State for language reminder animation
  const [showLanguageReminder, setShowLanguageReminder] = useState(false);
  
  // State for content type dropdown
  const [showContentTypeDropdown, setShowContentTypeDropdown] = useState(false);
  
  // State for improve question
  const [isImproving, setIsImproving] = useState(false);
  const [hasBeenImproved, setHasBeenImproved] = useState(false);
  const isImprovingRef = useRef(false);

  // Determine current state - this is the key logic for the component behavior
  const isDefaultState = !showSummary && !isProcessing; // Show hero section
  const isProcessingState = isProcessing && !showSummary; // Show wave animation
  const isOutputState = showSummary && !isProcessing; // Show output
  
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
  

  // Detect mobile and track sidebar offset for consistent desktop alignment with VerticalActionBar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOffset(0);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const onSidebar = (e: any) => {
      if (e?.detail?.width !== undefined) {
        if (!isMobile) {
          setSidebarOffset(e.detail.width);
        } else {
          setSidebarOffset(0);
        }
      }
    };
    window.addEventListener('qgpt:sidebar', onSidebar as EventListener);
    
    // Request initial sidebar width on mount
    const requestInitialWidth = () => {
      const event = new CustomEvent('qgpt:request-sidebar-width');
      window.dispatchEvent(event);
    };
    
    // Request initial width after a short delay to ensure VerticalActionBar is mounted
    const timeoutId = setTimeout(requestInitialWidth, 100);
    
    return () => {
      window.removeEventListener('qgpt:sidebar', onSidebar as EventListener);
      clearTimeout(timeoutId);
    };
  }, [isMobile]);
  
  
  // Reset hasBeenImproved when content changes (user is typing new text)
  // Skip reset if we just improved the question
  useEffect(() => {
    if (!isImprovingRef.current) {
      setHasBeenImproved(false);
    }
    isImprovingRef.current = false;
  }, [content]);

  // Show language reminder when user starts typing
  useEffect(() => {
    if (content.trim().length > 0 && content.trim().length <= 20) {
      setShowLanguageReminder(true);
      // Don't auto-hide - let it persist until user sends message
    } else if (content.trim().length === 0) {
      setShowLanguageReminder(false);
    }
  }, [content]);
  

  // Handle content type toggle
  const handleContentTypeToggle = useCallback((contentType: 'tafsir' | 'hadith' | 'webSearch' | 'suggestedQuestions') => {
    if (!onContentTypeChange) return;
    
    const newContentTypes = {
      ...selectedContentTypes,
      [contentType]: !selectedContentTypes[contentType]
    };
    onContentTypeChange(newContentTypes);
  }, [selectedContentTypes, onContentTypeChange]);

  // Check if content has minimum words for improvement
  const hasMinimumWords = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length >= 3;
  };

  // Handle improve question
  const handleImproveQuestion = async () => {
    if (!content.trim() || isImproving || isProcessing || hasBeenImproved || !hasMinimumWords(content)) return;

    setIsImproving(true);
    try {
      const language = detectLanguage(content);
      const response = await fetch('/api/improve-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: content.trim(),
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to improve question');
      }

      const data = await response.json();
      if (data.improvedQuestion) {
        isImprovingRef.current = true; // Mark that we're setting improved value
        setContent(data.improvedQuestion);
        setHasBeenImproved(true);
      }
    } catch (error) {
      console.error('Error improving question:', error);
    } finally {
      setIsImproving(false);
    }
  };

  // Auto-resize function with improved mobile support and scrollable behavior
  const autoResize = (target: HTMLTextAreaElement | null) => {
    if (!target) return;
    // Reset height to auto to get accurate scrollHeight
    target.style.height = 'auto';
    
    // Get the actual content height
    const scrollHeight = target.scrollHeight;
    
  // Mobile-first height calculations
  const isMobile = window.innerWidth < 640;
  const minHeight = isMobile ? 80 : 96; // Increased min height for better usability
  const maxHeight = isMobile ? 280 : 260; // Increased max height for more content
    
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
      // Small delay to ensure orientation change is complete
      setTimeout(() => {
        const el = textareaRef.current;
        if (el) {
          autoResize(el);
        }
      }, 100);
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
        // Prevent default Enter behavior and submit form if content exists
        e.preventDefault();
        if (content.trim() && !isProcessing) {
          // Reset abort state and send message
          const abortManager = getGlobalAbortManager();
          abortManager.reset();
          setShowLanguageReminder(false);
          askQuran();
        }
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

  // Advanced mobile input optimization effect
  useEffect(() => {
    if (isMobile && textareaRef.current) {
      const textarea = textareaRef.current;
      
      // Ensure proper mobile input behavior
      const optimizeForMobile = () => {
        // Force hardware acceleration
        textarea.style.transform = 'translateZ(0)';
        textarea.style.backfaceVisibility = 'hidden';
        
        // Prevent iOS zoom
        textarea.style.fontSize = '16px';
        
        // Ensure proper touch handling
        textarea.style.touchAction = 'manipulation';
        textarea.style.pointerEvents = 'auto';
        
        // Prevent selection issues
        (textarea.style as any).WebkitUserSelect = 'text';
        textarea.style.userSelect = 'text';
      };

      optimizeForMobile();
      
      // Re-optimize on orientation change
      const handleOrientationChange = () => {
        setTimeout(optimizeForMobile, 100);
      };

      window.addEventListener('orientationchange', handleOrientationChange);
      
      return () => {
        window.removeEventListener('orientationchange', handleOrientationChange);
      };
    }
  }, [isMobile]);
  return (
    <>
      {/* Hero Section - Show only in default state */}
      {isDefaultState && (
        <header className="relative z-10">
          <div className="container max-w-4xl mx-auto px-6 py-16 pt-24 sm:pt-16 pb-20 chat-hero-container">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center"
            >
              {/* Clean, Professional Title */}
              <div className="mb-8">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-gray-900 dark:text-white mb-4">
                  QuranGPT
                </h1>
                
                {/* Minimalist Arabic Ornament */}
                <div className="flex items-center justify-center mb-6">
                  <div className="w-12 h-px bg-gray-300 dark:bg-gray-600"></div>
                  <div className="mx-6 text-2xl text-gray-400 dark:text-gray-500 font-[var(--font-scheherazade)]">۞</div>
                  <div className="w-12 h-px bg-gray-300 dark:bg-gray-600"></div>
                </div>
              </div>

              {/* Greeting Message */}
              {getGreetingMessage && getGreetingMessage() && (
                <div className="mb-6">
                  {getGreetingMessage()}
                </div>
              )}

              {/* Professional Subtitle */}
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed font-light">
                AI-powered Islamic knowledge from the Holy Quran
              </p>
            </motion.div>
          </div>
        </header>
      )}


      {/* Input Section - Always visible, always positioned at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-0 fixed bottom-0 left-0 right-0 z-30"
        style={{ 
          paddingLeft: !isMobile ? sidebarOffset : 0,
          // Advanced mobile touch fixes
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'manipulation',
          // Ensure proper stacking context
          isolation: 'isolate',
          // Prevent iOS zoom on focus
          fontSize: isMobile ? '16px' : 'inherit'
        }}
      >
        {/* ChatGPT-style Input Container - Always styled like output state */}
        <div 
          className="w-full max-w-4xl mx-auto px-6 sm:px-0 py-6 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-sm"
          style={{
            // Advanced mobile container fixes
            position: 'relative',
            zIndex: 1,
            // Prevent touch event bubbling issues
            touchAction: 'manipulation',
            // Ensure proper rendering on mobile
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)',
            // Hardware acceleration for smooth interactions
            willChange: 'transform'
          }}
        >
        <div 
          className="relative"
          style={{
            // Simple, clean mobile-friendly container
            minHeight: isMobile ? '80px' : '96px',
            padding: '8px 0'
          }}
        >


          {/* Language Reminder - Above Input Field */}
          <AnimatePresence>
            {showLanguageReminder && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.25, 0.46, 0.45, 0.94],
                  delay: 0.1
                }}
                className="mb-3"
              >
                <div className="relative w-full max-w-4xl mx-auto px-0 sm:px-0">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ 
                      duration: 0.4, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: 0.1
                    }}
                    className="bg-transparent border-[0.5px] border-gray-200 dark:border-gray-600 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 w-full"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 dark:text-emerald-400"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                      </motion.div>
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
                    <motion.div
                      animate={{ 
                        opacity: [0.4, 0.8, 0.4], 
                        scale: [1, 1.01, 1],
                        borderColor: [
                          "rgba(16, 185, 129, 0.2)", 
                          "rgba(16, 185, 129, 0.4)", 
                          "rgba(16, 185, 129, 0.2)"
                        ]
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut",
                        times: [0, 0.5, 1]
                      }}
                      className="absolute inset-0 rounded-xl border border-emerald-400/20 dark:border-emerald-500/30 pointer-events-none"
                    />
                  </motion.div>

                  {/* Floating particles effect (restored) */}
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
                        style={{ left: '50%', top: '50%' }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Input Field - Minimalist Professional */}
          <div className="relative bg-transparent rounded-xl border-[0.5px] border-gray-400 dark:border-gray-400 shadow-md dark:shadow-[0_8px_24px_rgba(255,255,255,0.18)] dark:ring-1 dark:ring-white/10 transition-all duration-200 px-3 sm:px-4">
            
            {/* Content Type Dropdown - Above input field */}
            {/* Mobile: Content Type Dropdown */}
            <AnimatePresence>
              {showContentTypeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="sm:hidden absolute -top-12 left-0 z-[9999] bg-white dark:bg-gray-800 border-[0.5px] border-gray-600 dark:border-gray-400 rounded-lg shadow-lg p-1.5 min-w-[200px] content-type-dropdown"
                >
                  <div className="space-y-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleContentTypeToggle('tafsir');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center gap-2 ${
                        selectedContentTypes.tafsir
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      type="button"
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleContentTypeToggle('hadith');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center gap-2 ${
                        selectedContentTypes.hadith
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      type="button"
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleContentTypeToggle('webSearch');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center gap-2 ${
                        selectedContentTypes.webSearch
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      type="button"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedContentTypes.webSearch
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedContentTypes.webSearch && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      Web Search
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleContentTypeToggle('suggestedQuestions');
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center gap-2 ${
                        selectedContentTypes.suggestedQuestions
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      type="button"
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
              <div className="absolute top-2 left-2 z-10 pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400 text-sm font-light tracking-wide">
                  Ask me anything about Quran & Islam...
                </span>
              </div>
            )}

            {/* Mobile: Inline Content Type Toggles - Icon only, no text */}
            <div className="sm:hidden flex absolute bottom-2 left-2 right-20 z-20 items-center gap-1.5" style={{ pointerEvents: 'auto' }}>
              {/* Tafsir Toggle - Icon only */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContentTypeToggle('tafsir');
                }}
                className={`inline-flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                  selectedContentTypes.tafsir
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
                type="button"
                title="Tafsir"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>

              {/* Hadith Toggle - Icon only */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContentTypeToggle('hadith');
                }}
                className={`inline-flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                  selectedContentTypes.hadith
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
                type="button"
                title="Hadith"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </button>

              {/* Web Search Toggle - Icon only */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContentTypeToggle('webSearch');
                }}
                className={`inline-flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                  selectedContentTypes.webSearch
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
                type="button"
                title="Web Search"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </button>

              {/* Suggested Questions Toggle - Icon only */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContentTypeToggle('suggestedQuestions');
                }}
                className={`inline-flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                  selectedContentTypes.suggestedQuestions
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}
                type="button"
                title="Suggested Questions"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            {/* Desktop: Inline Content Type Toggles - All options visible in a row */}
            <div className="hidden sm:flex absolute bottom-2 left-2 right-20 z-20 items-center gap-2" style={{ pointerEvents: 'auto' }}>
              {/* Tafsir Toggle */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContentTypeToggle('tafsir');
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                  selectedContentTypes.tafsir
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                type="button"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">Tafsir</span>
              </button>

              {/* Hadith Toggle */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContentTypeToggle('hadith');
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                  selectedContentTypes.hadith
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                type="button"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="font-medium">Hadith</span>
              </button>

              {/* Web Search Toggle */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContentTypeToggle('webSearch');
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                  selectedContentTypes.webSearch
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                type="button"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span className="font-medium">Web Search</span>
              </button>

              {/* Suggested Questions Toggle */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleContentTypeToggle('suggestedQuestions');
                }}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                  selectedContentTypes.suggestedQuestions
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                type="button"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Questions</span>
              </button>
            </div>
            
            <textarea
              ref={textareaRef}
              placeholder=""
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onTouchStart={(e) => {
                // Prevent any interference with touch events
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                // Ensure touch events are properly handled
                e.stopPropagation();
              }}
              onFocus={(e) => {
                // Ensure focus works properly on mobile
                e.target.style.transform = 'translateZ(0)';
                // Prevent iOS zoom
                if (isMobile) {
                  e.target.style.fontSize = '16px';
                }
              }}
              onBlur={(e) => {
                // Reset transform when not focused
                e.target.style.transform = '';
              }}
              rows={1}
              className={`chat-input-textarea w-full ${isDefaultState ? 'py-3 sm:py-4' : 'py-4 sm:py-5'} bg-transparent text-black dark:text-white border-none resize-none focus:outline-none text-sm sm:text-base leading-relaxed transition-all duration-200 ${
                (content.trim() || showSummary) ? 'pr-20 sm:pr-24' : 'pr-14 sm:pr-16'
              } pt-2 pb-8 sm:pt-2 sm:pb-10`}
              style={{ 
                height: 'auto',
                overflowY: 'auto',
                maxHeight: isMobile ? '280px' : '260px',
                // Advanced mobile input fixes
                pointerEvents: 'auto',
                touchAction: 'manipulation',
                WebkitUserSelect: 'text',
                userSelect: 'text',
                // Prevent iOS zoom and ensure proper touch handling
                fontSize: isMobile ? '16px' : 'inherit',
                // Hardware acceleration for smooth interactions
                WebkitTransform: 'translateZ(0)',
                transform: 'translateZ(0)',
                // Ensure proper stacking
                position: 'relative',
                zIndex: 10,
                // Prevent touch callouts and selection issues
                WebkitTouchCallout: 'default',
                WebkitAppearance: 'none',
                // Ensure proper rendering
                backfaceVisibility: 'hidden',
                perspective: '1000px',
                // Make textarea fill the entire clickable area
                width: '100%',
                minWidth: '100%',
                // Ensure minimum touch target size
                minHeight: isMobile ? '60px' : '70px',
                // Better touch handling
                cursor: 'text',
                // Smooth scrolling
                WebkitOverflowScrolling: 'touch'
              }}
            />
            
            

            

            {/* Action buttons container */}
            <div className="absolute bottom-2 right-1 sm:right-2 flex items-center gap-1.5 sm:gap-3 z-20">
              {/* Improve Question Button */}
              {content.trim() && !isProcessing && hasMinimumWords(content) && (
                <motion.button
                  whileHover={!hasBeenImproved && !isImproving ? { scale: 1.05 } : {}}
                  whileTap={!hasBeenImproved && !isImproving ? { scale: 0.95 } : {}}
                  style={{ pointerEvents: 'auto', zIndex: 30 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!hasBeenImproved && !isImproving) {
                      handleImproveQuestion();
                    }
                  }}
                  disabled={isImproving || hasBeenImproved}
                  className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    hasBeenImproved || isImproving
                      ? 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                  title={hasBeenImproved ? "Question already improved" : "Improve question"}
                  type="button"
                >
                  <div className="relative z-10 flex items-center justify-center">
                    {isImproving ? (
                      <svg className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    )}
                  </div>
                </motion.button>
              )}
              
              {/* Send/Stop Button - Revolutionary Design */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ pointerEvents: 'auto', zIndex: 30 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
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
                type="button"
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
                {(content.trim() || showSummary || isOutputState) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Clear all local state for proper reset
                    setShowLanguageReminder(false);
                    setShowContentTypeDropdown(false);
                    
                    // Call parent reset function
                    resetForm();
                  }}
                  disabled={isProcessing}
                  className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    !isProcessing
                      ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  title="Clear and reset"
                  type="button"
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

        {/* Warning Text - Minimalist below input section (desktop only) */}
        <div className="hidden md:block max-w-4xl mx-auto px-6 sm:px-0 mt-1 pb-3 sm:pb-4 relative z-30">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500 leading-tight">
              <span className="text-amber-500 dark:text-amber-500 mr-1">⚠</span>
              AI responses are for educational purposes. Always verify with authentic Islamic scholars and trusted sources.
            </p>
          </div>
        </div>

        {/* Warning Text - Mobile version */}
        <div className="block md:hidden max-w-4xl mx-auto px-6 mt-1 pb-3 relative z-30">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-500 leading-tight">
              <span className="text-amber-500 dark:text-amber-500 mr-1">⚠</span>
              AI responses are for educational purposes. Always verify with authentic Islamic scholars and trusted sources.
            </p>
          </div>
        </div>
      </div>
      </motion.div>

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
    </>
  );
}