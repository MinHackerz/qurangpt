'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useHadithManager } from '../hooks/useHadithManager';

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
  selectedContentTypes = { tafsir: true, hadith: false, webSearch: false, suggestedQuestions: false },
  onContentTypeChange,
  // Stop operation functionality
  onStopOperation
}: ChatSectionProps) {
  const [sidebarOffset, setSidebarOffset] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  // Mounted state to safely render random decorative elements
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Lock body scrolling when landing page is visible
  useEffect(() => {
    if (isDefaultState) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [isDefaultState]);

  return (
    <>
      {/* Hero Section - Show only in default state — Non-scrollable, top-aligned */}
      {isDefaultState && (
        <header className="relative z-10 h-[calc(100dvh-180px)] sm:h-[calc(100dvh-120px)] flex flex-col justify-start overflow-hidden pt-[88px] sm:pt-[15px]">
          <div className="container max-w-4xl mx-auto px-6 chat-hero-container relative">



            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center relative z-10"
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

              {/* Decorative Islamic ornament divider */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex items-center justify-center gap-3 mb-2"
              >
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-300/40 dark:to-amber-500/30" />
                <span className="text-amber-400/50 dark:text-amber-300/40 text-sm" style={{ animation: 'gentle-float 3s ease-in-out infinite' }}>۞</span>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-300/40 dark:to-amber-500/30" />
              </motion.div>
            </motion.div>
          </div>
        </header>
      )}




      {/* Input Section - Always visible, always positioned at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-0 fixed bottom-0 left-0 right-0 z-50"
        style={{
          paddingLeft: !isMobile ? sidebarOffset : 0,
          // Smooth transition for sidebar open/close
          transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
        {/* Input Container Background - Matches main page background with glassmorphism */}
        <div
          className="w-full mx-auto px-2 sm:px-0 pt-0 pb-6"
          style={{
            // Advanced mobile container fixes
            position: 'relative',
            zIndex: 1,
            // Allow dropdown popups to overflow above
            overflow: 'visible',
            // Prevent touch event bubbling issues
            touchAction: 'manipulation',
            // Ensure proper rendering on mobile
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)',
            // Hardware acceleration for smooth interactions
            willChange: 'transform'
          }}
        >
          {/* Background - Matches page bg for consistency */}
          <div
            className="absolute inset-0 !bg-gray-50 dark:!bg-gray-950 !opacity-100 backdrop-blur-[50px] rounded-t-3xl shadow-[0_-15px_30px_rgba(249,250,251,0.8)] dark:shadow-[0_-15px_30px_rgba(3,7,18,0.8)]"
            style={{
              pointerEvents: 'none'
            }}
          />

          <div className="w-full max-w-4xl mx-auto relative z-10" style={{ overflow: 'visible' }}>


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
                    <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
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

            {/* Disclaimer & Footer Links */}
            <div className="text-center mt-2">
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide pointer-events-none">
                AI-generated content may contain errors. Please verify with Islamic scholars.
              </p>
              <div className="flex items-center justify-center gap-3 mt-1.5 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide">
                <Link href="/transparency" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  Transparency
                </Link>
                <span className="text-gray-300 dark:text-gray-700 pointer-events-none">•</span>
                <a href="https://menajul.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  Developer
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}