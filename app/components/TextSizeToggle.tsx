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
        return <span className="text-xs font-bold font-serif leading-none">A</span>;
      case 'medium':
        return <span className="text-base font-bold font-serif leading-none">A</span>;
      case 'large':
        return <span className="text-xl font-bold font-serif leading-none">A</span>;
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
      case 'small': return 'Small';
      case 'medium': return 'Medium';
      case 'large': return 'Large';
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
        flex items-center justify-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 min-w-[140px]
        ${variant === 'header'
          ? 'bg-white/80 dark:bg-black/50 hover:bg-white dark:hover:bg-black/70 backdrop-blur-sm'
          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm hover:shadow-md'
        }
        text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600
        ${className}
      `}
      title={`Current size: ${currentSize}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSize}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 font-medium text-sm"
        >
          {getSizeIcon(currentSize)}
          <span>{getSizeLabel(currentSize)}</span>
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}
