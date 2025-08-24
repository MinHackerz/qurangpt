'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef } from 'react';

interface ChatSectionProps {
  content: string;
  setContent: (content: string) => void;
  askQuran: () => void;
  resetForm: () => void;
  isProcessing: boolean;
  error: string;
  showSummary: boolean;
}

export default function ChatSection({ 
  content, 
  setContent, 
  askQuran, 
  resetForm, 
  isProcessing, 
  error,
  showSummary 
}: ChatSectionProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize function with improved mobile support
  const autoResize = (target: HTMLTextAreaElement) => {
    // Reset height to auto to get accurate scrollHeight
    target.style.height = 'auto';
    
    // Get the actual content height
    const scrollHeight = target.scrollHeight;
    
    // Mobile-first height calculations
    const isMobile = window.innerWidth < 640;
    const minHeight = isMobile ? 56 : 60; // Increased mobile min height
    const maxHeight = isMobile ? 300 : 240; // Increased mobile max height for better text visibility
    
    // Calculate new height with better mobile support
    let newHeight = Math.max(scrollHeight, minHeight);
    
    // On mobile, allow more height for better text visibility
    if (isMobile && scrollHeight > minHeight) {
      // Add extra padding for mobile to ensure text is fully visible
      newHeight = Math.min(scrollHeight + 20, maxHeight);
    } else {
      newHeight = Math.min(newHeight, maxHeight);
    }
    
    // Apply the new height
    target.style.height = newHeight + 'px';
    
    // Ensure the textarea doesn't get cut off on mobile
    if (isMobile && newHeight >= maxHeight) {
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
        // Submit with Enter
        e.preventDefault();
        if (content.trim() && !isProcessing) {
          askQuran();
        }
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
      className="mb-12"
    >
      {/* ChatGPT-style Input Container */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative">
          {/* Main Input Field - ChatGPT Style */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-200 interactive-border">
            <textarea
              ref={textareaRef}
              placeholder="Message Quran GPT... (Press Enter to send, Shift+Enter for new line)"
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              className={`chat-input-textarea w-full p-4 sm:p-5 bg-transparent text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none resize-none focus:outline-none text-base sm:text-lg leading-relaxed min-h-[56px] sm:min-h-[60px] max-h-[300px] sm:max-h-[240px] transition-all duration-200 ${
                (content.trim() || showSummary) ? 'pr-28 sm:pr-32' : 'pr-16 sm:pr-20'
              }`}
              style={{ 
                height: 'auto',
                overflow: 'hidden'
              }}
            />
            
            {/* Action buttons container */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-3">
              {/* Send Button - Minimalistic Professional Design */}
              <motion.button
                whileHover={{ 
                  scale: 1.02,
                  y: -1
                }}
                whileTap={{ scale: 0.98 }}
                onClick={askQuran}
                disabled={isProcessing || !content.trim()}
                className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                  content.trim() && !isProcessing
                    ? 'bg-white dark:bg-white hover:bg-gray-50 dark:hover:bg-gray-50 text-gray-900 dark:text-gray-900 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
                title="Send message"
              >
                {/* Subtle inner glow */}
                {content.trim() && !isProcessing && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                )}
                
                {/* Icon container */}
                <div className="relative z-10 flex items-center justify-center">
                  {isProcessing ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </div>
                
                {/* Professional border accent */}
                {content.trim() && !isProcessing && (
                  <div className="absolute inset-0 rounded-full border border-gray-300/40 group-hover:border-gray-400/60 transition-colors duration-200"></div>
                )}
              </motion.button>

              {/* Clear Button - Minimalistic Professional Design */}
              {(content.trim() || showSummary) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ 
                    scale: 1.02,
                    y: -1
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetForm}
                  disabled={isProcessing}
                                  className={`group relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                  !isProcessing
                    ? 'bg-white dark:bg-white hover:bg-gray-50 dark:hover:bg-gray-50 text-gray-900 dark:text-gray-900 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
                  title="Clear and reset"
                >
                  {/* Subtle inner glow */}
                  {!isProcessing && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  )}
                  
                  {/* Icon container */}
                  <div className="relative z-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  
                  {/* Professional border accent */}
                  {!isProcessing && (
                    <div className="absolute inset-0 rounded-full border border-gray-400/30 group-hover:border-gray-300/50 transition-colors duration-200"></div>
                  )}
                </motion.button>
              )}
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center border border-red-200 dark:border-red-800 text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Warning Text */}
          <div className="mt-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-3xl mx-auto px-2">
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <strong className="text-amber-500 dark:text-amber-400">Important:</strong>
              </span>
              {' '}Don't follow each response blindly. These are AI-generated responses that may contain inaccuracies. Always verify important religious information with qualified scholars and authentic sources.
            </p>
          </div>

        </div>
      </div>
    </motion.div>
  );
}