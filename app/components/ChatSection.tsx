'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback, useMemo } from 'react';
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

// Generate random positions for stars (memoized outside component)
const starPositions = Array.from({ length: 20 }, (_, i) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 60}%`,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 5,
  duration: Math.random() * 3 + 2,
  opacity: Math.random() * 0.5 + 0.2,
}));

// Generate random positions for floating particles
const particlePositions = Array.from({ length: 8 }, (_, i) => ({
  left: `${Math.random() * 100}%`,
  bottom: `${Math.random() * 20}%`,
  delay: Math.random() * 10,
  duration: Math.random() * 8 + 10,
  size: Math.random() * 2 + 1.5,
}));

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
          <div className="container max-w-4xl mx-auto px-6 py-16 pt-24 sm:pt-16 pb-20 chat-hero-container relative">

            {/* Ramadan Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Twinkling Stars */}
              {starPositions.map((star, i) => (
                <div
                  key={`star-${i}`}
                  className="absolute rounded-full"
                  style={{
                    left: star.left,
                    top: star.top,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    background: `radial-gradient(circle, rgba(251, 191, 36, ${star.opacity}) 0%, transparent 70%)`,
                    animation: `twinkle ${star.duration}s ease-in-out infinite`,
                    animationDelay: `${star.delay}s`,
                  }}
                />
              ))}

              {/* Floating Particles */}
              {particlePositions.map((p, i) => (
                <div
                  key={`particle-${i}`}
                  className="ramadan-particle"
                  style={{
                    left: p.left,
                    bottom: p.bottom,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    ['--drift-duration' as any]: `${p.duration}s`,
                    ['--drift-delay' as any]: `${p.delay}s`,
                  }}
                />
              ))}

              {/* Crescent Moon - Top Right */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                className="absolute right-8 sm:right-16 top-6 sm:top-10"
                style={{ animation: 'moon-glow 4s ease-in-out infinite' }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-amber-400/70 dark:text-amber-300/60">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
                </svg>
              </motion.div>

              {/* Small Star near moon */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="absolute right-20 sm:right-32 top-4 sm:top-6 text-amber-400/50 dark:text-amber-300/40"
                style={{ animation: 'twinkle 2.5s ease-in-out infinite' }}
              >
                ✦
              </motion.div>

              {/* Decorative Lantern - Left side */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                className="absolute left-6 sm:left-12 top-4 sm:top-8 hidden sm:block"
                style={{
                  animation: 'lantern-swing 4s ease-in-out infinite',
                  transformOrigin: 'top center',
                }}
              >
                <div style={{ animation: 'lantern-glow 3s ease-in-out infinite' }}>
                  <svg width="28" height="40" viewBox="0 0 28 40" fill="none" className="text-amber-500/40 dark:text-amber-400/30">
                    {/* Lantern hook */}
                    <line x1="14" y1="0" x2="14" y2="8" stroke="currentColor" strokeWidth="1.5" />
                    {/* Lantern top cap */}
                    <path d="M8 8 L20 8 L18 12 L10 12 Z" fill="currentColor" />
                    {/* Lantern body */}
                    <path d="M9 12 C9 12 7 20 7 24 C7 28 9 32 14 32 C19 32 21 28 21 24 C21 20 19 12 19 12 Z" fill="currentColor" opacity="0.5" />
                    {/* Lantern inner glow */}
                    <ellipse cx="14" cy="22" rx="5" ry="7" fill="rgba(251, 191, 36, 0.3)" />
                    {/* Lantern bottom */}
                    <path d="M10 32 L18 32 L16 36 L12 36 Z" fill="currentColor" />
                    {/* Bottom decoration */}
                    <circle cx="14" cy="38" r="1.5" fill="currentColor" opacity="0.6" />
                  </svg>
                </div>
              </motion.div>
            </div>

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

              {/* Ramadan Greeting - Always show for Ramadan vibe */}
              {(!getGreetingMessage || !getGreetingMessage()) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-center gap-3">
                    <motion.span
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="text-3xl md:text-4xl"
                    >
                      🌙
                    </motion.span>
                    <span className="text-xl md:text-2xl font-semibold ramadan-text-shimmer">
                      Ramadan Mubarak
                    </span>
                    <motion.span
                      animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="text-2xl md:text-3xl"
                    >
                      ⭐
                    </motion.span>
                  </div>
                </motion.div>
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
          className="w-full mx-auto px-2 sm:px-0 py-3 ramadan-bg bg-gray-50 dark:bg-gray-950"
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
          </div>
        </div>
      </motion.div>
    </>
  );
}