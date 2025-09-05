'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { ShareIcon } from '@heroicons/react/24/outline';

interface ShareButtonProps {
  onShare: () => void;
  isVisible: boolean;
  position?: 'bottom-right' | 'top-right';
  className?: string;
}

export default function ShareButton({ 
  onShare, 
  isVisible, 
  position = 'bottom-right',
  className = ''
}: ShareButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: position === 'bottom-right' ? 20 : -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: position === 'bottom-right' ? 20 : -20 }}
          transition={{ 
            duration: 0.3, 
            ease: "easeOut",
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          whileHover={{ 
            scale: 1.1,
            y: position === 'bottom-right' ? -2 : 2
          }}
          whileTap={{ scale: 0.95 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onShare}
          className={`
            fixed z-50 group
            ${position === 'bottom-right' 
              ? 'bottom-4 right-4 sm:bottom-6 sm:right-6' 
              : 'top-4 right-4 sm:top-6 sm:right-6'
            }
            ${className}
          `}
          title="Share this content"
        >
          {/* Main button */}
          <div className="relative">
            {/* Background circle with gradient */}
            <div className={`
              w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center
              bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500
              shadow-lg hover:shadow-xl transition-all duration-300
              ${isHovered ? 'shadow-emerald-500/25 dark:shadow-emerald-400/25' : ''}
            `}>
              {/* Share icon */}
              <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>

            {/* Animated ring effect */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-emerald-400 dark:border-emerald-300"
              animate={{
                scale: isHovered ? [1, 1.2, 1] : [1, 1.1, 1],
                opacity: isHovered ? [0.5, 0, 0.5] : [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Pulse effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-400 dark:bg-emerald-300"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0, 0.2],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: isHovered ? 1 : 0, 
                y: isHovered ? 0 : 10 
              }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded-lg whitespace-nowrap shadow-lg"
            >
              Share Content
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
            </motion.div>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
