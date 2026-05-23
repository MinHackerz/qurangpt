'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';

export type ProgressStep =
  | 'understanding'
  | 'fetching_ayahs'
  | 'fetching_translations'
  | 'fetching_recitation'
  | 'fetching_tafsir'
  | 'web_search_ayahs'
  | 'writing_explanation'
  | 'fetching_hadith'
  | 'web_search_hadith'
  | 'writing_hadith_explanation'
  | 'generating_questions';

interface ProgressIndicatorProps {
  currentStep: ProgressStep | null;
  selectedContentTypes: {
    tafsir: boolean;
    hadith: boolean;
    webSearch: boolean;
    suggestedQuestions: boolean;
  };
  question: string;
  textSize?: 'small' | 'medium' | 'large';
}

const getSteps = (contentTypes: {
  tafsir: boolean;
  hadith: boolean;
  webSearch: boolean;
  suggestedQuestions: boolean;
}): Array<{ key: ProgressStep; label: string }> => {
  const steps: Array<{ key: ProgressStep; label: string }> = [
    { key: 'understanding', label: 'Understanding your question' },
    { key: 'fetching_ayahs', label: 'Fetching relevant quranic ayahs to answer your question' },
    { key: 'fetching_translations', label: 'Fetching arabic & english translations of ayahs' },
    { key: 'fetching_recitation', label: 'Fetching recitation of ayahs' },
  ];

  if (contentTypes.tafsir) {
    steps.push({
      key: 'fetching_tafsir',
      label: 'Fetching tafsirs of (Ibn Kathir, Marif ul Quran, Tazkirul Quran) fetched ayahs for better understanding'
    });
  }

  if (contentTypes.webSearch) {
    steps.push({
      key: 'web_search_ayahs',
      label: 'Searching the web to get relevant articles related to each ayah'
    });
  }

  steps.push({
    key: 'writing_explanation',
    label: contentTypes.webSearch
      ? 'Writing explanation of each of the ayahs combining article explanations'
      : 'Writing explanation of each of the ayahs'
  });

  if (contentTypes.hadith) {
    steps.push({
      key: 'fetching_hadith',
      label: 'Fetching relevant hadith to answer your question'
    });

    if (contentTypes.webSearch) {
      steps.push({
        key: 'web_search_hadith',
        label: 'Searching the web to get relevant articles related to hadiths'
      });
    }

    steps.push({
      key: 'writing_hadith_explanation',
      label: contentTypes.webSearch
        ? 'Writing explanation of each hadith as per the context of your question and fetched articles'
        : 'Writing explanation of each hadith as per the context of your question'
    });
  }

  if (contentTypes.suggestedQuestions) {
    steps.push({
      key: 'generating_questions',
      label: 'Generating relevant questions with context to your question'
    });
  }

  return steps;
};

export default function ProgressIndicator({
  currentStep,
  selectedContentTypes,
  question,
  textSize = 'small'
}: ProgressIndicatorProps) {
  // Memoize steps to prevent recreation on every render
  const steps = useMemo(() => getSteps(selectedContentTypes), [
    selectedContentTypes.tafsir,
    selectedContentTypes.hadith,
    selectedContentTypes.webSearch,
    selectedContentTypes.suggestedQuestions
  ]);

  const [completedSteps, setCompletedSteps] = useState<Set<ProgressStep>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [duaIndex, setDuaIndex] = useState(0);

  // Rotate dua every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setDuaIndex(prev => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentStep) {
      const index = steps.findIndex(s => s.key === currentStep);
      if (index !== -1) {
        setCurrentStepIndex(prevIndex => {
          // Only update if the index actually changed
          if (prevIndex !== index) {
            return index;
          }
          return prevIndex;
        });
        // Mark previous steps as completed
        setCompletedSteps(prev => {
          const newSet = new Set(prev);
          for (let i = 0; i < index; i++) {
            newSet.add(steps[i].key);
          }
          return newSet;
        });
      }
    } else {
      // Reset when currentStep is null
      setCurrentStepIndex(-1);
      setCompletedSteps(new Set());
    }
  }, [currentStep, steps]);

  const getStepStatus = (stepKey: ProgressStep, index: number) => {
    if (completedSteps.has(stepKey)) {
      return 'completed';
    }
    if (currentStepIndex === index) {
      return 'active';
    }
    if (currentStepIndex > index) {
      return 'completed';
    }
    return 'pending';
  };


  return (
    <div className="w-full max-w-full space-y-6">
      {/* Question Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full bg-white/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm backdrop-blur-sm"
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-8 h-8 bg-amber-100/80 dark:bg-amber-900/40 rounded-full flex items-center justify-center mt-0.5 shadow-sm ring-1 ring-amber-500/10 dark:ring-amber-400/20">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold mb-1.5 font-sans">
              Processing Question
            </div>
            <div className={`text-gray-800 dark:text-gray-200 leading-relaxed font-medium ${textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'
              }`}>
              {question}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quranic Verses / Quotes - Rotating supplications while processing */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="flex items-center justify-center gap-2 py-1"
      >
        <span className="text-amber-400/50 dark:text-amber-300/30 text-xs">✦</span>
        <AnimatePresence mode="wait">
          <motion.p
            key={duaIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="text-xs text-amber-600/60 dark:text-amber-400/40 italic font-light text-center"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {[
              '"And your Lord says, Call upon Me; I will respond to you." — Quran 40:60',
              '"Indeed, with hardship comes ease." — Quran 94:6',
              '"So remember Me; I will remember you." — Quran 2:152',
              '"My Lord, increase me in knowledge." — Quran 20:114',
              '"He is with you wherever you are." — Quran 57:4',
            ][duaIndex]}
          </motion.p>
        </AnimatePresence>
        <span className="text-amber-400/50 dark:text-amber-300/30 text-xs">✦</span>
      </motion.div>

      {/* Progress Box with Professional Animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className="w-full relative"
      >
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">

          {/* Main Background (Transparent) */}
          <div className="absolute inset-0 bg-transparent z-0"></div>

          {/* Golden Wave (Shimmer) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent w-[50%] h-full transform -skew-x-12 animate-shimmer" style={{ filter: 'blur(8px)' }} />
          </div>

          <div className="relative z-20 p-5 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                Thinking Progress
              </h3>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-gray-500 hover:text-amber-500 transition-colors flex items-center gap-1 focus:outline-none"
              >
                {isExpanded ? 'Show Less' : 'View Full Progress'}
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Steps container with fixed height when collapsed */}
            <div
              className={`transition-all duration-300 ease-out ${isExpanded ? '' : 'h-[32px] overflow-hidden'
                }`}
            >
              <AnimatePresence mode="popLayout">
                {steps.map((step, index) => {
                  // Determine visibility
                  // If expanded: Show all steps that have been reached (up to current + 1)
                  // If collapsed: Show ONLY the current active step (or first if starting, or last if done)

                  const isCurrentIndex = currentStepIndex === index;
                  const isLastCompleted = currentStepIndex === steps.length && index === steps.length - 1; // All steps done

                  // In collapsed mode, we want a strict "single line" feel.
                  // Show if it's the active step.
                  // If nothing is active (e.g. at start), show first.
                  // If all completed, maybe show "Completed" generic message? 
                  // But sticking to steps:

                  let shouldShow = false;

                  if (isExpanded) {
                    // Show history: everything up to current + 1
                    shouldShow = index <= (currentStepIndex + 1);
                  } else {
                    // Collapsed: Show ONLY the active step
                    // If currentStepIndex is -1 (start), show first step (index 0)
                    if (currentStepIndex === -1) {
                      shouldShow = index === 0;
                    } else {
                      shouldShow = index === currentStepIndex;
                    }
                  }

                  if (!shouldShow) return null;

                  const status = getStepStatus(step.key, index);
                  const isActive = status === 'active';
                  const isCompleted = status === 'completed';

                  return (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center space-x-3 h-[32px]"
                    >
                      {/* Status Indicator */}
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-5 h-5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center ring-1 ring-amber-500/20 dark:ring-amber-500/30"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        ) : isActive ? (
                          <div className="w-5 h-5 flex items-center justify-center">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 rounded-full border-[2px] border-amber-500/30 border-t-amber-600 dark:border-amber-400/30 dark:border-t-amber-400"
                            />
                          </div>
                        ) : (
                          <div className="w-5 h-5 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                          </div>
                        )}
                      </div>

                      {/* Step Label */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-none truncate transition-colors duration-300 font-sans ${isActive
                            ? 'text-gray-800 dark:text-gray-200 font-medium'
                            : isCompleted
                              ? 'text-gray-500 dark:text-gray-400'
                              : 'text-gray-400 dark:text-gray-600'
                            }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
