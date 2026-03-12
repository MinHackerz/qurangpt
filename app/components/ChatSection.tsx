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
  selectedContentTypes = { tafsir: true, hadith: false, webSearch: false, suggestedQuestions: false },
  onContentTypeChange,
  // Stop operation functionality
  onStopOperation
}: ChatSectionProps) {
  const [sidebarOffset, setSidebarOffset] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  // Mounted state to safely render random decorative elements
  const [mounted, setMounted] = useState(false);
  // Rasid.in promo panel state
  const [rasidExpanded, setRasidExpanded] = useState(true);

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

            {/* Ramadan Decorative Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Twinkling Stars */}
              {/* Twinkling Stars - Client-side only to avoid hydration mismatch */}
              {mounted && starPositions.map((star, i) => (
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
              {/* Floating Particles - Client-side only to avoid hydration mismatch */}
              {mounted && particlePositions.map((p, i) => (
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

      {/* Rasid.in Collapsible Side Panel — Fixed right, vertically centered, works on all screen sizes */}
      {isDefaultState && (
        <div
          className="fixed z-30 top-[60%] sm:top-1/2 -translate-y-1/2 flex items-center transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{ right: rasidExpanded ? (isMobile ? '8px' : '16px') : '-1px' }}
        >
          {/* Toggle tab */}
          <button
            onClick={() => setRasidExpanded(prev => !prev)}
            className="flex-shrink-0 w-7 h-14 rounded-l-xl bg-gradient-to-b from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 hover:w-8 group"
            title={rasidExpanded ? 'Hide' : 'Show Rasid.in'}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${rasidExpanded ? 'rotate-0' : 'rotate-180'}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Panel */}
          <div
            className={`overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${rasidExpanded ? 'w-[240px] sm:w-[280px] opacity-100' : 'w-0 opacity-0'}`}
          >
            <a
              href="https://rasid.in"
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="w-[240px] sm:w-[280px] rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl p-3.5 sm:p-4 shadow-xl shadow-black/5 dark:shadow-black/20 transition-all duration-300 group-hover:border-emerald-300/60 dark:group-hover:border-emerald-500/30 group-hover:shadow-emerald-500/10">
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/30 group-hover:to-teal-50/15 dark:group-hover:from-emerald-900/10 dark:group-hover:to-teal-900/5 transition-all duration-500 rounded-2xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Brand + Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm shadow-emerald-500/20">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">Rasid</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-1 font-medium">.in</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-semibold tracking-wider uppercase text-emerald-600/70 dark:text-emerald-400/60 bg-emerald-50/80 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded-full">
                      Free
                    </span>
                  </div>

                  {/* Value prop */}
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed mb-2.5">
                    AI-powered invoicing with OCR, crypto-verification & smart reminders.
                  </p>

                  {/* Feature chips */}
                  <div className="flex flex-wrap gap-1">
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/60 px-1.5 py-0.5 rounded">
                      <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
                      OCR
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/60 px-1.5 py-0.5 rounded">
                      <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                      Verified
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100/80 dark:bg-gray-800/60 px-1.5 py-0.5 rounded">
                      <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                      Reminders
                    </span>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100/80 dark:border-gray-800/50">
                    <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">By creator of QuranGPT</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:gap-1.5 transition-all duration-300">
                      Try Rasid
                      <svg className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </span>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
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
        {/* Input Container Background - Matches main page ramadan background with glassmorphism */}
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

            {/* Disclaimer */}
            <div className="text-center mt-2 pointer-events-none">
              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide">
                AI-generated content may contain errors. Please verify with Islamic scholars.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}