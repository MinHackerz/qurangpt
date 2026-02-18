'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import ReadQuran from '../components/ReadQuran';
import AskQuranGPTInput from '../components/AskQuranGPTInput';

// Loading fallback for ReadQuran
function ReadQuranLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
    </div>
  );
}

export default function QuranPage() {
  // State for Ask QuranGPT functionality
  const [showNewQuestionInput, setShowNewQuestionInput] = useState(false);

  // Handle Ask QuranGPT button click - convert to input field
  const handleAskQuranClick = () => {
    setShowNewQuestionInput(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-transparent"
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>
      </div>

      <Suspense fallback={<ReadQuranLoading />}>
        <ReadQuran />
      </Suspense>

      {/* Bottom spacing for floating button */}
      <div className="h-24"></div>

      {/* Floating Button/Input Section */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4 sm:px-6">
        <div className="w-full">
          {!showNewQuestionInput ? (
            /* Ask QuranGPT Button */
            <div className="flex items-center justify-center">
              <button
                onClick={handleAskQuranClick}
                className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-full transition-all duration-200 text-sm sm:text-base font-medium shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Ask QuranGPT
              </button>
            </div>
          ) : (
            /* Converted Input Field */
            <AskQuranGPTInput
              onSend={(question, options) => {
                // Create URL with query parameters
                const params = new URLSearchParams({
                  question: question,
                  tafsir: options.tafsir.toString(),
                  hadith: options.hadith.toString(),
                  webSearch: options.webSearch.toString(),
                  suggestedQuestions: options.suggestedQuestions.toString(),
                  textSize: options.textSize
                });

                // Redirect to homepage with parameters
                window.location.href = `/?${params.toString()}`;
              }}
              onReset={() => {
                setShowNewQuestionInput(false);
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
