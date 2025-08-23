'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ThinkingProcessProps {
  isProcessing: boolean;
}

export default function ThinkingProcess({ isProcessing }: ThinkingProcessProps) {
  const [dots, setDots] = useState('');
  const [thinkingText, setThinkingText] = useState('');

  // Minimalistic thinking animation
  useEffect(() => {
    if (isProcessing) {
      const steps = [
        "Analyzing question",
        "Searching Quran",
        "Consulting tafseer",
        "Compiling answer"
      ];
      
      let stepIndex = 0;
      const stepInterval = setInterval(() => {
        if (stepIndex < steps.length) {
          setThinkingText(steps[stepIndex]);
          stepIndex++;
        } else {
          stepIndex = 0;
        }
      }, 1500);

      // Animated dots
      const dotInterval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);

      return () => {
        clearInterval(stepInterval);
        clearInterval(dotInterval);
      };
    }
  }, [isProcessing]);

  if (!isProcessing) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-8 max-w-6xl mx-auto px-4"
      >
        {/* Minimalistic Thinking Container - Grok Style */}
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-600/50 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            
            {/* Left: Thinking indicator with subtle animation */}
            <div className="flex items-center space-x-3">
              {/* Pulsing dot indicator */}
              <div className="flex items-center space-x-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut"
                    }}
                    className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                  />
                ))}
              </div>
              
              {/* Thinking text */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Thinking
                </span>
                <motion.span
                  key={thinkingText}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-gray-500 dark:text-gray-400"
                >
                  {thinkingText}{dots}
                </motion.span>
              </div>
            </div>

            {/* Right: Subtle progress indicator */}
            <div className="flex items-center space-x-2">
              <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  animate={{
                    x: ["-100%", "100%"]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="h-full w-1/3 bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-500 to-transparent rounded-full"
                />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                AI
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
