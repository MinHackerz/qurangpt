'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';

interface SuggestedQuestionsProps {
  userQuestion: string;
  onQuestionClick: (question: string) => void;
  isVisible: boolean;
  currentLanguage?: string;
  translatedQuestions?: string[];
}

interface AIQuestionResponse {
  success: boolean;
  questions: string[];
  error?: string;
}

export default function SuggestedQuestions({ 
  userQuestion, 
  onQuestionClick, 
  isVisible,
  currentLanguage = 'en',
  translatedQuestions
}: SuggestedQuestionsProps) {
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [generationError, setGenerationError] = useState<string>('');
  const [questionCache, setQuestionCache] = useState<Map<string, string[]>>(new Map());

  // Generate AI-powered suggested questions
  const generateAISuggestedQuestions = useCallback(async (question: string) => {
    if (!question || question.trim().length === 0) {
      // No user question provided, skipping AI generation
      return;
    }

    // Check cache first
    const cacheKey = `${question.toLowerCase().trim()}_${currentLanguage}`;
    const cachedQuestions = questionCache.get(cacheKey);
    
    if (cachedQuestions && cachedQuestions.length > 0) {
      // Using cached questions
      setAiGeneratedQuestions(cachedQuestions);
      return;
    }

    setIsGeneratingQuestions(true);
    setGenerationError('');

    try {
      // Generating AI suggested questions
      
      const response = await fetch('/api/suggested-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userQuestion: question,
          language: currentLanguage 
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate questions: ${response.status}`);
      }

      const data: AIQuestionResponse = await response.json();
      
      if (data.success && data.questions && data.questions.length > 0) {
        // AI generated questions successfully
        setAiGeneratedQuestions(data.questions);
        
        // Cache the questions
        setQuestionCache(prev => new Map(prev).set(cacheKey, data.questions));
      } else {
        throw new Error(data.error || 'Failed to generate questions');
      }
    } catch (error) {
      // Error generating AI suggested questions - silent fail for security
      setGenerationError(error instanceof Error ? error.message : 'Failed to generate questions');
      // Fallback to empty array
      setAiGeneratedQuestions([]);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [currentLanguage, questionCache]);

  // Generate questions when user question changes
  useEffect(() => {
    if (isVisible && userQuestion && userQuestion.trim().length > 0) {
      generateAISuggestedQuestions(userQuestion);
    }
  }, [isVisible, userQuestion, generateAISuggestedQuestions]);

  // Use translated questions if available and language is not English
  const relevantQuestions = (currentLanguage !== 'en' && translatedQuestions && translatedQuestions.length > 0) 
    ? translatedQuestions 
    : aiGeneratedQuestions;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto px-3 sm:px-4 lg:px-0 mb-12 sm:mb-0"
      >
        {/* Suggested Questions Container */}
        <div className="rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-0 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Suggested questions
              </h3>
              {isGeneratingQuestions && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border border-emerald-300 dark:border-emerald-600 border-t-emerald-500 dark:border-t-emerald-400 rounded-full"
                />
              )}
            </div>
          </div>
          
          {/* Questions List */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700 pb-16 sm:pb-8 lg:pb-8">
            {isGeneratingQuestions ? (
              // Loading state
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center">
                <div className="flex items-center justify-center space-x-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border border-emerald-300 dark:border-emerald-600 border-t-emerald-500 dark:border-t-emerald-400 rounded-full"
                  />
                  <span className="text-gray-600 dark:text-gray-400 text-sm">
                    Generating relevant questions...
                  </span>
                </div>
              </div>
            ) : generationError ? (
              // Error state
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center">
                <div className="text-red-500 dark:text-red-400 text-sm">
                  <p>Failed to generate questions</p>
                  <button 
                    onClick={() => generateAISuggestedQuestions(userQuestion)}
                    className="mt-2 px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-xs hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : relevantQuestions.length > 0 ? (
              // Questions list
              relevantQuestions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer group"
                  onClick={() => onQuestionClick(question)}
                >
                  <div className="flex items-start justify-between space-x-3">
                    <p className="flex-1 text-gray-700 dark:text-gray-300 text-sm leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200 pr-2 break-words">
                      {question}
                    </p>
                    <button className="flex-shrink-0 w-6 h-6 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-110 mt-0.5">
                      <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              // No questions state
              <div className="px-4 sm:px-6 py-6 sm:py-8 text-center">
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  No suggested questions available
                </span>
              </div>
            )}
            {/* Extra bottom spacing for mobile to prevent last question cutoff */}
            <div className="h-16 sm:h-8 lg:h-8"></div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
