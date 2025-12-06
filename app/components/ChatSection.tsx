'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { useHadithManager } from '../hooks/useHadithManager';
import YouTubeLivePopup from './YouTubeLivePopup';
import AskQuranGPTInput from './AskQuranGPTInput';

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
  const [sidebarOffset, setSidebarOffset] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Hadith management
  useHadithManager();

  // State for language reminder animation
  const [showLanguageReminder, setShowLanguageReminder] = useState(false);

  // Determine current state
  const isDefaultState = !showSummary && !isProcessing; // Show hero section

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


  // Show language reminder when user starts typing
  useEffect(() => {
    if (content.trim().length > 0 && content.trim().length <= 20) {
      setShowLanguageReminder(true);
      // Don't auto-hide - let it persist until user sends message
    } else if (content.trim().length === 0) {
      setShowLanguageReminder(false);
    }
  }, [content]);

  // Handle send wrapper
  const handleSend = () => {
    setShowLanguageReminder(false);
    askQuran();
  };

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
                <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-gray-900 dark:text-white mb-2">
                  QuranGPT
                </h1>
              </div>

              {/* Greeting Message */}
              {getGreetingMessage && getGreetingMessage() && (
                <div className="mb-6">
                  {getGreetingMessage()}
                </div>
              )}

              {/* Professional Subtitle */}
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8 font-light">
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
        {/* Input Container Background */}
        <div
          className="w-full mx-auto px-6 sm:px-0 py-6 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-sm"
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
          <div className="w-full max-w-4xl mx-auto relative">
            {/* YouTube Live Popup - Above Input Field */}
            <YouTubeLivePopup />

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
                  <div className="relative w-full px-0 sm:px-0">
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

            <AskQuranGPTInput
              value={content}
              onChange={setContent}
              selectedContentTypes={selectedContentTypes}
              onContentTypeChange={onContentTypeChange}
              onSend={handleSend}
              onReset={resetForm}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}