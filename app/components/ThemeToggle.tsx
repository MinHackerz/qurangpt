'use client';

import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="relative top-6 right-6 z-50 w-10 h-10 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center">
        <div className="w-5 h-5 bg-gray-300 rounded-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative top-6 right-6 z-50 w-10 h-10 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center transition-all duration-300  group"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative w-6 h-6"
      >
        {theme === 'light' ? (
          <SunIcon className="w-5 h-5 text-gray-600 group-hover:text-gray-700 transition-colors duration-200" />
        ) : (
          <div className="relative w-5 h-5">
            <MoonIcon className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors duration-200 transform rotate-90" />
          </div>
        )}
      </motion.div>
      
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Ring effect on hover */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-gray-300 dark:group-hover:border-gray-400 transition-all duration-300 scale-0 group-hover:scale-100"></div>
    </motion.button>
  );
}
