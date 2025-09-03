'use client';

import { motion } from 'framer-motion';

interface QuickQuestionsProps {
  insertQuestion: (question: string) => void;
}

export default function QuickQuestions({ insertQuestion }: QuickQuestionsProps) {
  const questions = [
    'What is the purpose of life according to Islam?',
    'Who is Prophet Muhammad (PBUH)?',
    'What does the Quran say about Allah?'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="mb-8"
    >
      {/* Questions Container - Exact match to Chat Input Width */}
      <div className="max-w-4xl mx-auto px-0 -mx-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {questions.map((question, index) => (
            <motion.button
              key={question}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => insertQuestion(question)}
              className="group px-4 py-3 text-xs text-gray-600 dark:text-gray-400 bg-transparent rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 text-left font-mono"
            >
              <span className="break-words uppercase tracking-wide">{question}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
