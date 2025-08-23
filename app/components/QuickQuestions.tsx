'use client';

import { motion } from 'framer-motion';

interface QuickQuestionsProps {
  insertQuestion: (question: string) => void;
}

export default function QuickQuestions({ insertQuestion }: QuickQuestionsProps) {
  const questions = [
    { 
      question: 'What is the purpose of life according to Islam?', 
      icon: '🌱',
      description: 'Discover the Islamic perspective on life\'s meaning',
      category: 'Philosophy'
    },
    { 
      question: 'Who is Prophet Muhammad (PBUH)?', 
      icon: '☪️',
      description: 'Learn about the final messenger of Allah',
      category: 'Prophets'
    },
    { 
      question: 'What does the Quran say about Allah?', 
      icon: '✨',
      description: 'Understand the divine attributes and nature',
      category: 'Theology'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="mb-8"
    >
      {/* Questions Container - Exact match to Chat Input Width */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {questions.map((item, index) => (
            <motion.button
              key={item.question}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => insertQuestion(item.question)}
              className="group px-4 py-3 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 shadow-sm text-left interactive-border question-button"
            >
              <span className="mr-2">{item.icon}</span>
              <span className="break-words">{item.question}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
