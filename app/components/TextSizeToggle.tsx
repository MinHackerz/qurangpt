'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface TextSizeToggleProps {
  onSizeChange: (size: 'small' | 'medium' | 'large') => void;
  currentSize: 'small' | 'medium' | 'large';
  className?: string;
  variant?: 'header' | 'default';
}

export default function TextSizeToggle({ 
  onSizeChange, 
  currentSize,
  className = '',
  variant = 'default'
}: TextSizeToggleProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getSizeIcon = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h12M4 15h16" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h12M4 15h16" />
          </svg>
        );
      case 'large':
        return (
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h12M4 15h16" />
          </svg>
        );
    }
  };

  const cycleSize = () => {
    const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(currentSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    onSizeChange(sizes[nextIndex]);
  };

  const getSizeLabel = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small': return 'Small Text';
      case 'medium': return 'Medium Text';
      case 'large': return 'Large Text';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={cycleSize}
      className={`
        flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200
        ${variant === 'header' 
          ? 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 backdrop-blur-sm' 
          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md'
        }
        text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600
        ${className}
      `}
      title={getSizeLabel(currentSize)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSize}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          {getSizeIcon(currentSize)}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
