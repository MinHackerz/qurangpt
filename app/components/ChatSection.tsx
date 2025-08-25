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
      className="mb-12"
    >
      {/* ChatGPT-style Input Container */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative">
          {/* Main Input Field - ChatGPT Style */}
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all duration-200">
            
            <textarea
              ref={textareaRef}
              placeholder="Message Quran GPT... (Shift+Enter for new line)"
              value={content}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              className={`chat-input-textarea w-full p-4 sm:p-5 bg-transparent text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border-none resize-none focus:outline-none text-sm sm:text-base leading-relaxed min-h-[56px] sm:min-h-[60px] max-h-[300px] sm:max-h-[240px] transition-all duration-200 ${
                (content.trim() || showSummary) ? 'pr-28 sm:pr-32' : 'pr-16 sm:pr-20'
              }`}
              style={{ 
                height: 'auto',
                overflow: 'hidden'
              }}
            />
            
            {/* Action buttons container */}
            <div className="absolute top-1/2 right-3 sm:right-4 transform -translate-y-1/2 flex items-center gap-3">
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
                    ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
                title="Send message"
              >
                {/* Subtle inner glow */}
                {content.trim() && !isProcessing && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200/30 to-transparent dark:from-gray-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                )}
                
                {/* Icon container */}
                <div className="relative z-10 flex items-center justify-center">
                  {isProcessing ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </div>
                
                {/* Professional border accent */}
                {content.trim() && !isProcessing && (
                  <div className="absolute inset-0 rounded-full border border-gray-300/40 dark:border-gray-500/40 group-hover:border-gray-400/60 dark:group-hover:border-gray-400/60 transition-colors duration-200"></div>
                )}
              </motion.button>

              {/* Clear Button - Minimalistic Professional Design */}
              <AnimatePresence>
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
                      ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  title="Clear and reset"
                >
                                    {/* Subtle inner glow */}
                  {!isProcessing && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200/30 to-transparent dark:from-gray-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  )}
                  
                  {/* Icon container */}
                  <div className="relative z-10 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  
                  {/* Professional border accent */}
                  {!isProcessing && (
                    <div className="absolute inset-0 rounded-full border border-gray-400/30 dark:border-gray-500/40 group-hover:border-gray-300/50 dark:group-hover:border-gray-400/60 transition-colors duration-200"></div>
                  )}
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
                className="mt-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg flex items-center border border-red-200 dark:border-red-800 text-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>



        </div>
      </div>
    </motion.div>
  );
}