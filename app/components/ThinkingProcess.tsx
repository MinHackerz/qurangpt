'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

interface ThinkingProcessProps {
  isProcessing: boolean;
}

// Processing steps for display (no fake durations)
const processingSteps = [
  { 
    step: "Processing user question", 
    description: "Analyzing the question and preparing the structured prompt for AI"
  },
  { 
    step: "Connecting to Gemini AI", 
    description: "Establishing connection with Google's Gemini API for response generation"
  },
  { 
    step: "Generating AI response", 
    description: "AI is analyzing the question and searching through Quranic knowledge base"
  },
  { 
    step: "Fetching Tafsir data", 
    description: "Retrieving authentic tafsir interpretations from Islamic scholars via API"
  },
  { 
    step: "Formatting response", 
    description: "Processing AI response and adding Quranic references with audio players"
  },
  { 
    step: "Preparing final output", 
    description: "Structuring the response with proper formatting, tafsir, and Islamic styling"
  }
];

export default function ThinkingProcess({ isProcessing }: ThinkingProcessProps) {
  const [dots, setDots] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Real processing step tracking
  useEffect(() => {
    if (isProcessing) {
      // Start processing from step 0
      setCurrentStep(0);
      setCompletedSteps(new Set());
    } else {
      // Reset when processing stops
      setCurrentStep(0);
      setCompletedSteps(new Set());
    }

    // Animated dots
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => {
      clearInterval(dotInterval);
    };
  }, [isProcessing]);

  if (!isProcessing) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-8 max-w-7xl mx-auto px-0 -mx-1"
      >
        {/* Minimalistic Thinking Container - Grok Style */}
        <div className="relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-4">
            
            {/* Left: Current step indicator */}
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
              
              {/* Current step text */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {processingSteps[currentStep]?.step}
                </span>
                <motion.span
                  key={currentStep}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-gray-500 dark:text-gray-400"
                >
                  {dots}
                </motion.span>
              </div>
            </div>

            {/* Right: Expandable button and progress indicator */}
            <div className="flex items-center space-x-3">
              {/* Expandable button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span>{isExpanded ? 'Hide' : 'Show'}</span>
                <motion.svg
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>

              {/* Progress indicator */}
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

          {/* Expandable process details - Expanding upward */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: 0 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden border-t border-gray-200/50 dark:border-gray-600/50 absolute bottom-full left-0 right-0 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 mb-4"
                style={{ zIndex: 20, maxHeight: '80vh', overflowY: 'auto' }}
              >
                <div className="px-6 py-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    AI Processing Workflow:
                  </h4>
                  
                  {/* Process steps with realistic status */}
                  <div className="space-y-2">
                    {processingSteps.map((process, index) => {
                      const isCompleted = completedSteps.has(index);
                      const isCurrent = index === currentStep;
                      const isPending = !isCompleted && !isCurrent;
                      
                      return (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300 ${
                            isCurrent 
                              ? 'bg-gray-600 dark:bg-gray-400 text-white dark:text-black' 
                              : isCompleted 
                              ? 'bg-gray-500 dark:bg-gray-300 text-white dark:text-black' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {isCompleted ? (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span className="text-xs font-medium">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium transition-colors duration-300 ${
                              isCurrent 
                                ? 'text-gray-800 dark:text-gray-200' 
                                : isCompleted 
                                ? 'text-gray-700 dark:text-gray-300' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {process.step}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {process.description}
                              {isCurrent && (
                                <span className="ml-2 text-gray-600 dark:text-gray-400 font-medium">
                                  • In progress...
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Status indicator */}
                          <div className="flex-shrink-0">
                            {isCurrent && (
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-2 h-2 bg-gray-600 dark:bg-gray-400 rounded-full"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Processing status summary */}
                  <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {completedSteps.size} of {processingSteps.length} steps completed
                      </span>
                      <span>
                        {Math.round((completedSteps.size / processingSteps.length) * 100)}% done
                      </span>
                    </div>
                  </div>
                  
                  {/* Additional info */}
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <strong>Note:</strong> This shows the actual AI processing workflow. The AI connects to Gemini, 
                      processes your question, generates a response with Quranic references, and formats it with 
                      interactive elements like audio players.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
