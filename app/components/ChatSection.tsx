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
        {/* Input Container Background - Solid to hide content behind */}
        <div
          className="w-full mx-auto px-2 sm:px-0 py-3 bg-gray-50 dark:bg-gray-950"
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

            {/* Language Reminder - Minimal & Professional */}
            <AnimatePresence>
              {showLanguageReminder && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="mb-3 px-1"
                >
                  <div className="flex items-center justify-center gap-2 py-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-gray-400 dark:text-gray-500 tracking-wide">
                      Multilingual support enabled
                    </span>
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