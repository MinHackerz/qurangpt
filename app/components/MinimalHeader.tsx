'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import ShareModal from './ShareModal';
import TextSizeToggle from './TextSizeToggle';

interface MinimalHeaderProps {
  isVisible: boolean;
  // New props for the moved buttons
  userQuestion?: string;
  textSize?: 'small' | 'medium' | 'large';
  onTextSizeChange?: (size: 'small' | 'medium' | 'large') => void;
  // Share functionality props
  onShareContent?: () => void;
  shareUrl?: string;
  isSharing?: boolean;
  showShareSuccess?: boolean;
  // Copy functionality props
  onCopyContent?: () => void;
  copied?: boolean;
  content?: string;
}

export default function MinimalHeader({ 
  isVisible, 
  userQuestion, 
  textSize = 'medium', 
  onTextSizeChange,
  onShareContent,
  shareUrl,
  isSharing,
  showShareSuccess,
  onCopyContent,
  copied,
  content
}: MinimalHeaderProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [pendingShareModal, setPendingShareModal] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  // Open share modal when share URL is generated
  useEffect(() => {
    if (pendingShareModal && shareUrl && !isSharing) {
      setShowShareModal(true);
      setPendingShareModal(false);
    }
  }, [shareUrl, isSharing, pendingShareModal]);

  if (!isVisible) return null;

  const handleBackToHome = () => {
    window.location.reload();
  };

  // Handle share button click - open modal instead of direct copy
  const handleShareClick = () => {
    // Track share button click in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share_button_click', {
        event_category: 'engagement',
        event_label: 'share_button',
        custom_parameter_1: userQuestion ? userQuestion.substring(0, 100) : 'unknown_question',
        custom_parameter_2: 'minimal_header'
      });
    }

    // If we have a share URL, open modal directly
    if (shareUrl) {
      setShowShareModal(true);
    } else {
      // If no share URL, trigger the share creation first
      if (onShareContent) {
        setPendingShareModal(true);
        onShareContent();
      }
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-40 sm:p-6"
    >
      {/* Mobile: Minimalist horizontal header layout */}
      <div className="flex sm:hidden items-center justify-between w-full px-4 py-3 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        {/* Left side: Back button + Title */}
        <div className="flex items-center gap-3">
          {/* Back Button - Minimalist */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToHome}
            className="flex items-center justify-center w-9 h-9 rounded-md border transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-600"
            title="Back to home"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M4 12L10 6M4 12L10 18"/>
            </svg>
          </motion.button>

          {/* QuranGPT Title */}
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-mono text-gray-600 dark:text-gray-400 tracking-wider uppercase">
              QuranGPT
            </h1>
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Text Size Toggle Button - Only show when there's content */}
          {userQuestion && onTextSizeChange && (
            <TextSizeToggle
              onSizeChange={onTextSizeChange}
              currentSize={textSize}
              className="w-9 h-9"
            />
          )}


          {/* Theme Toggle Button - Minimalist */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-9 h-9 rounded-md border transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 group border-gray-200 dark:border-gray-600"
            title={`Switch to ${mounted && theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <motion.div
              initial={false}
              animate={{ rotate: mounted && theme === 'dark' ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative w-4 h-4"
            >
              {!mounted ? (
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              ) : theme === 'light' ? (
                <SunIcon className="w-4 h-4 text-gray-600 group-hover:text-gray-700 transition-colors duration-200" />
              ) : (
                <div className="relative w-4 h-4">
                  <MoonIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors duration-200 transform rotate-90" />
                </div>
              )}
            </motion.div>
          </motion.button>

          {/* Share Button - Only show when there's content */}
          {userQuestion && onShareContent && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleShareClick}
              disabled={isSharing}
              className={`flex items-center justify-center w-9 h-9 rounded-md border transition-all duration-200 ${
                showShareSuccess 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700' 
                  : isSharing
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-200 dark:border-gray-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-600'
              }`}
              title={showShareSuccess ? "Share link copied!" : "Share this content"}
            >
              <AnimatePresence mode="wait">
                {showShareSuccess ? (
                  <motion.svg
                    key="tick"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : isSharing ? (
                  <motion.div
                    key="loading"
                    className="w-4 h-4"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </motion.div>
                ) : (
                  <motion.svg
                    key="share"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
      </div>

      {/* Desktop: Vertical layout */}
      <div className="hidden sm:flex flex-col items-start gap-2">
        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackToHome}
          className="flex items-center justify-center w-10 h-10 rounded-md border transition-all duration-200 backdrop-blur-sm bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
          title="Back to home"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M4 12L10 6M4 12L10 18"/>
          </svg>
        </motion.button>

        {/* Theme Toggle Button - Always visible */}
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-10 h-10 rounded-md border transition-all duration-200 backdrop-blur-sm bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 group"
          title={`Switch to ${mounted && theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <motion.div
            initial={false}
            animate={{ rotate: mounted && theme === 'dark' ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative w-5 h-5"
          >
            {!mounted ? (
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
            ) : theme === 'light' ? (
              <SunIcon className="w-5 h-5 text-gray-600 group-hover:text-gray-700 transition-colors duration-200" />
            ) : (
              <div className="relative w-5 h-5">
                <MoonIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors duration-200 transform rotate-90" />
              </div>
            )}
          </motion.div>
        </motion.button>

        {/* Text Size Toggle Button - Only show when there's content AND output is generated */}
        {userQuestion && onTextSizeChange && (
          <TextSizeToggle
            onSizeChange={onTextSizeChange}
            currentSize={textSize}
            className="w-10 h-10"
          />
        )}


        {/* Share Button - Only show when there's content AND output is generated */}
        {userQuestion && onShareContent && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShareClick}
            disabled={isSharing}
            className={`flex items-center justify-center w-10 h-10 rounded-md border transition-all duration-200 backdrop-blur-sm ${
              showShareSuccess 
                ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300' 
                : isSharing
                ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
            }`}
            title={showShareSuccess ? "Share link copied!" : "Share this content"}
          >
            <AnimatePresence mode="wait">
              {showShareSuccess ? (
                <motion.svg
                  key="tick"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </motion.svg>
              ) : isSharing ? (
                <motion.div
                  key="loading"
                  className="w-5 h-5"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </motion.div>
              ) : (
                <motion.svg
                  key="share"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
        )}

      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl || (typeof window !== 'undefined' ? window.location.href : '')}
        title={userQuestion ? `QuranGPT: ${userQuestion}` : 'QuranGPT Answer'}
        question={userQuestion || 'QuranGPT Question'}
        isCreatingShare={isSharing}
        onCopyContent={onCopyContent}
        copied={copied}
        content={content}
      />
    </motion.header>
  );
}
