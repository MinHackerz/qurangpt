'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { detectLanguage } from '../utils/languageDetection';

interface AskQuranGPTInputProps {
  onSend: (question: string, options: {
    tafsir: boolean;
    hadith: boolean;
    webSearch: boolean;
    suggestedQuestions: boolean;
    textSize: 'small' | 'medium' | 'large';
  }) => void;
  onReset: () => void;
}

export default function AskQuranGPTInput({ onSend, onReset }: AskQuranGPTInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showContentTypeDropdown, setShowContentTypeDropdown] = useState(false);
  const [selectedContentTypes, setSelectedContentTypes] = useState({
    tafsir: true,
    hadith: false,
    webSearch: false,
    suggestedQuestions: false
  });
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('small');
  const [isImproving, setIsImproving] = useState(false);
  const [hasBeenImproved, setHasBeenImproved] = useState(false);
  const isImprovingRef = useRef(false);

  // Reset hasBeenImproved when input value changes (user is typing new text)
  // Skip reset if we just improved the question
  useEffect(() => {
    if (!isImprovingRef.current) {
      setHasBeenImproved(false);
    }
    isImprovingRef.current = false;
  }, [inputValue]);

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

  // Handle send
  const handleSend = () => {
    console.log('Send button clicked, input value:', inputValue);
    if (!inputValue.trim()) {
      console.log('No input value, returning');
      return;
    }
    console.log('Calling onSend with:', inputValue.trim(), selectedContentTypes, textSize);
    onSend(inputValue.trim(), {
      ...selectedContentTypes,
      textSize
    });
  };
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle content type toggle
  const handleContentTypeToggle = (contentType: 'tafsir' | 'hadith' | 'webSearch' | 'suggestedQuestions') => {
    setSelectedContentTypes(prev => ({
      ...prev,
      [contentType]: !prev[contentType]
    }));
  };

  // Check if input has minimum words for improvement
  const hasMinimumWords = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length >= 3;
  };

  // Handle improve question
  const handleImproveQuestion = async () => {
    if (!inputValue.trim() || isImproving || hasBeenImproved || !hasMinimumWords(inputValue)) return;

    setIsImproving(true);
    try {
      const language = detectLanguage(inputValue);
      const response = await fetch('/api/improve-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue.trim(),
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to improve question');
      }

      const data = await response.json();
      if (data.improvedQuestion) {
        isImprovingRef.current = true; // Mark that we're setting improved value
        setInputValue(data.improvedQuestion);
        setHasBeenImproved(true);
      }
    } catch (error) {
      console.error('Error improving question:', error);
    } finally {
      setIsImproving(false);
    }
  };

  return (
    <>
      {/* Independent Content Type Dropdown - Fixed positioning */}
      <AnimatePresence>
        {showContentTypeDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed z-[99999] bg-white dark:bg-gray-800 border-[0.5px] border-gray-600 dark:border-gray-400 rounded-lg shadow-lg p-1.5 min-w-[200px] content-type-dropdown"
            style={{
              bottom: '45px', // Position closer to the input field
              left: '24px', // Shifted slightly right from the + button position
              maxWidth: 'calc(100vw - 32px)'
            }}
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl mx-auto bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-sm"
        style={{ padding: 0, margin: 0 }}
      >
        <div 
          className="relative"
          style={{
            minHeight: '80px',
            padding: 0,
            margin: 0
          }}
        >
        {/* Main Input Field - Minimalist Professional - Exact Share Page Design */}
        <div className="relative bg-transparent border-[0.5px] border-gray-400 dark:border-gray-400 transition-all duration-200 overflow-hidden rounded-2xl" style={{ padding: 0, margin: 0 }}>
          
          {/* Placeholder Text - At the top, hidden when typing */}
          {!inputValue.trim() && (
            <div className="absolute z-10 pointer-events-none" style={{ top: '12px', left: '16px' }}>
              <span className="text-gray-500 dark:text-gray-400 text-sm font-light tracking-wide">
                Ask me anything about Quran & Islam...
              </span>
            </div>
          )}


          {/* Plus Button - Fixed in bottom left corner */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowContentTypeDropdown(!showContentTypeDropdown);
            }}
            className="absolute w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 plus-icon-button z-20"
            style={{ pointerEvents: 'auto', bottom: '12px', left: '16px' }}
            title="Add content types"
            type="button"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {/* Selected Content Types Display */}
          <AnimatePresence>
            {(selectedContentTypes.tafsir || selectedContentTypes.hadith || selectedContentTypes.webSearch || selectedContentTypes.suggestedQuestions) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute z-20"
                style={{ bottom: '12px', left: '44px', right: '80px' }}
              >
                <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
                  {selectedContentTypes.tafsir && (
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleContentTypeToggle('tafsir');
                      }}
                      className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-xs rounded-md cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors duration-200 flex-shrink-0"
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 25 }}
                    >
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs sm:text-xs font-medium">Tafsir</span>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  )}
                  {selectedContentTypes.hadith && (
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleContentTypeToggle('hadith');
                      }}
                      className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-xs rounded-md cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors duration-200 flex-shrink-0"
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 25 }}
                    >
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="text-xs sm:text-xs font-medium">Hadith</span>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  )}
                  {selectedContentTypes.webSearch && (
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleContentTypeToggle('webSearch');
                      }}
                      className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-xs rounded-md cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors duration-200 flex-shrink-0"
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 25 }}
                    >
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span className="text-xs sm:text-xs font-medium">Web Search</span>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  )}
                  {selectedContentTypes.suggestedQuestions && (
                    <span 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleContentTypeToggle('suggestedQuestions');
                      }}
                      className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-xs rounded-md cursor-pointer hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors duration-200 flex-shrink-0"
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 25 }}
                    >
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs sm:text-xs font-medium">Questions</span>
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-0.5 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder=""
            rows={1}
            className="w-full bg-transparent text-black dark:text-white border-none resize-none focus:outline-none text-sm sm:text-base leading-relaxed transition-all duration-200"
            style={{ 
              height: 'auto',
              overflowY: 'auto',
              maxHeight: '280px',
              pointerEvents: 'auto',
              touchAction: 'manipulation',
              WebkitUserSelect: 'text',
              userSelect: 'text',
              fontSize: '16px',
              WebkitTransform: 'translateZ(0)',
              transform: 'translateZ(0)',
              position: 'relative',
              zIndex: 10,
              WebkitTouchCallout: 'default',
              WebkitAppearance: 'none',
              backfaceVisibility: 'hidden',
              perspective: '1000px',
              width: '100%',
              minWidth: '100%',
              minHeight: '60px',
              cursor: 'text',
              WebkitOverflowScrolling: 'touch',
              borderRadius: '16px',
              padding: '12px 16px 48px 16px',
              margin: 0,
              boxSizing: 'border-box'
            }}
          />
          

          {/* Action buttons container */}
          <div className="absolute flex items-center gap-1.5 sm:gap-3" style={{ bottom: '12px', right: '16px', zIndex: 50 }}>
            {/* Improve Question Button */}
            {inputValue.trim() && hasMinimumWords(inputValue) && (
              <motion.button
                whileHover={!hasBeenImproved && !isImproving ? { scale: 1.05 } : {}}
                whileTap={!hasBeenImproved && !isImproving ? { scale: 0.95 } : {}}
                style={{ 
                  pointerEvents: 'auto', 
                  zIndex: 60,
                  cursor: hasBeenImproved || isImproving ? 'not-allowed' : 'pointer',
                  position: 'relative'
                }}
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
            
            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ 
                pointerEvents: 'auto', 
                zIndex: 60,
                cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                position: 'relative'
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Button clicked!');
                handleSend();
              }}
              disabled={!inputValue.trim()}
              className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                inputValue.trim()
                  ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
              title="Send message"
              type="button"
            >
              <div className="relative z-10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </div>
            </motion.button>

            {/* Reset/Close Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onReset();
              }}
              className="group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
              title="Clear and reset"
              type="button"
            >
              <div className="relative z-10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Hidden scrollbar styles for content type buttons */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      </motion.div>
    </>
  );
}
