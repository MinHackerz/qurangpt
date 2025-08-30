'use client';

import { motion } from 'framer-motion';

interface MinimalHeaderProps {
  isVisible: boolean;
}

export default function MinimalHeader({ isVisible }: MinimalHeaderProps) {
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
      className="fixed top-0 left-0 z-40 p-2 sm:p-6"
    >
      <div className="flex items-center">
        <button
          onClick={handleBackToHome}
          className="flex items-center justify-center w-12 h-10 sm:w-auto sm:h-auto gap-0 sm:gap-2 px-0 sm:px-3 py-0 sm:py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg sm:rounded-lg transition-all duration-200 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800/50 shadow-sm sm:shadow-none"
          title="Back to home"
        >
          <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M20 12H4M4 12L10 6M4 12L10 18" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}/>
          </svg>
          <span className="hidden sm:inline">Back</span>
        </button>
      </div>
    </motion.header>
  );
}
