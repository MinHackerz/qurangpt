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
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);

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
          <div className="flex-shrink-0 w-8 h-8 bg-emerald-100/80 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mt-0.5 shadow-sm ring-1 ring-emerald-500/10 dark:ring-emerald-400/20">
            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Progress Box */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        className="w-full relative px-5"
      >
        {/* Content */}
        <div className="relative z-20 space-y-4 w-full">
          <AnimatePresence mode="popLayout">
            {steps.map((step, index) => {
              // Chain effect: Show completed steps + current active step + next step (if current is active)
              // Only reveal next step when current step becomes active
              const shouldShow = currentStepIndex >= 0
                ? index <= currentStepIndex + 1  // Show up to next step
                : index === 0; // Show first step initially when no step is active yet

              if (!shouldShow) {
                return null;
              }

              const status = getStepStatus(step.key, index);
              const isActive = status === 'active';
              const isCompleted = status === 'completed';
              const isNext = index === currentStepIndex + 1 && currentStepIndex >= 0;

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    height: 'auto',
                  }}
                  exit={{
                    opacity: 0,
                    height: 0,
                    transition: { duration: 0.2 }
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                  className="flex items-start space-x-4 w-full"
                >
                  {/* Status Indicator */}
                  <div className="flex-shrink-0 mt-1">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-5 h-5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-1 ring-emerald-500/20 dark:ring-emerald-500/30"
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
                          className="w-4 h-4 rounded-full border-[2px] border-blue-500/30 border-t-blue-600 dark:border-blue-400/30 dark:border-t-blue-400"
                        />
                      </div>
                    ) : (
                      <div className="w-5 h-5 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
                      </div>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <motion.p
                      className={`text-sm leading-relaxed transition-colors duration-300 font-sans ${isActive
                          ? 'text-gray-800 dark:text-gray-200 font-medium'
                          : isCompleted
                            ? 'text-gray-500 dark:text-gray-400'
                            : 'text-gray-400 dark:text-gray-600'
                        }`}
                    >
                      {step.label}
                    </motion.p>
                    {isActive && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "100%", opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="h-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-transparent mt-2 max-w-[100px]"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
