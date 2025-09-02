'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface MinimalHeaderProps {
  isVisible: boolean;
  // New props for the moved buttons
  onCopyAIContent?: () => void;
  copied?: boolean;
  userQuestion?: string;
  isTextLarge?: boolean;
  onTextSizeToggle?: () => void;
}

export default function MinimalHeader({ 
  isVisible, 
  onCopyAIContent, 
  copied, 
  userQuestion, 
  isTextLarge, 
  onTextSizeToggle 
}: MinimalHeaderProps) {
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Show copy success message
  useEffect(() => {
    if (copied && onCopyAIContent) {
      setShowCopySuccess(true);
      const timer = setTimeout(() => setShowCopySuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [copied, onCopyAIContent]);

  // Prevent hydration mismatch for theme toggle
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isVisible) return null;

  const handleBackToHome = () => {
    window.location.reload();
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
      <div className="flex sm:hidden items-center justify-between w-full px-3 py-2.5 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        {/* Left side: Back button + Title */}
        <div className="flex items-center gap-3">
          {/* Back Button - Minimalist */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBackToHome}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Back to home"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M4 12L10 6M4 12L10 18"/>
            </svg>
          </motion.button>

          {/* QuranGPT Title */}
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-gray-800 dark:text-gray-200 tracking-tight">
              QuranGPT
            </h1>
          </div>
        </div>

        {/* Right side: Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Text Size Toggle Button - Only show when there's content */}
          {userQuestion && onTextSizeToggle && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onTextSizeToggle}
              className={`flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 ${
                isTextLarge 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={isTextLarge ? "Reduce text size" : "Increase text size"}
            >
              <motion.svg
                animate={{ scale: isTextLarge ? 1.1 : 1 }}
                transition={{ duration: 0.2 }}
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </motion.svg>
            </motion.button>
          )}

          {/* Copy Button - Only show when there's content */}
          {userQuestion && onCopyAIContent && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCopyAIContent}
              className={`flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 ${
                showCopySuccess 
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title="Copy AI response content"
            >
              <AnimatePresence mode="wait">
                {showCopySuccess ? (
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
                ) : (
                  <motion.svg
                    key="copy"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          )}

          {/* Theme Toggle Button - Minimalist */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 group"
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
        </div>
      </div>

      {/* Desktop: Vertical layout */}
      <div className="hidden sm:flex flex-col items-start gap-2">
        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackToHome}
          className="flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
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
          className="flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 group"
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
        {userQuestion && onTextSizeToggle && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onTextSizeToggle}
            className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 backdrop-blur-sm ${
              isTextLarge 
                ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300' 
                : 'bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
            }`}
            title={isTextLarge ? "Reduce text size" : "Increase text size"}
          >
            <motion.svg
              animate={{ scale: isTextLarge ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </motion.svg>
          </motion.button>
        )}

        {/* Copy Button - Only show when there's content AND output is generated */}
        {userQuestion && onCopyAIContent && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCopyAIContent}
            className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 backdrop-blur-sm ${
              showCopySuccess 
                ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200' 
                : 'bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
            }`}
            title="Copy AI response content"
          >
            <AnimatePresence mode="wait">
              {showCopySuccess ? (
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
              ) : (
                <motion.svg
                  key="copy"
                  initial={{ scale: 0, rotate: 90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -90 }}
                  transition={{ duration: 0.2 }}
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}
