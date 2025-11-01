'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import AskQuranGPTInput from '../components/AskQuranGPTInput';

export default function AskBar() {
  const [showInput, setShowInput] = useState(false);

  const handleSend = (
    question: string,
    options: { tafsir: boolean; hadith: boolean; webSearch: boolean; suggestedQuestions: boolean; textSize: 'small' | 'medium' | 'large' }
  ) => {
    const params = new URLSearchParams();
    params.set('question', question);
    params.set('tafsir', String(!!options.tafsir));
    params.set('hadith', String(!!options.hadith));
    params.set('webSearch', String(!!options.webSearch));
    params.set('suggestedQuestions', String(!!options.suggestedQuestions));
    window.location.href = `/${params.toString() ? `?${params.toString()}` : ''}`;
  };

  const handleReset = () => {
    setShowInput(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-5 z-40">
      <div className="max-w-4xl mx-auto">
        {!showInput ? (
          <div className="flex items-center gap-3 justify-center">
            <button 
              onClick={() => setShowInput(true)}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-full transition-all duration-200 text-base font-medium shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Ask QuranGPT
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <AskQuranGPTInput onSend={handleSend} onReset={handleReset} />
          </motion.div>
        )}
      </div>
    </div>
  );
}



