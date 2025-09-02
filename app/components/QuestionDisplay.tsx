'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface QuestionDisplayProps {
  userQuestion?: string;
  isEditingQuestion: boolean;
  editedQuestion: string;
  setEditedQuestion: (value: string) => void;
  isHoveringQuestion: boolean;
  setIsHoveringQuestion: (value: boolean) => void;
  showQuestionCopySuccess: boolean;
  handleEditQuestion: () => void;
  handleSaveQuestion: () => void;
  handleCancelEdit: () => void;
  handleCopyQuestion: () => void;
  isTextLarge?: boolean;
}

export const QuestionDisplay = ({ 
  userQuestion, 
  isEditingQuestion, 
  editedQuestion, 
  setEditedQuestion,
  isHoveringQuestion,
  setIsHoveringQuestion,
  showQuestionCopySuccess,
  handleEditQuestion,
  handleSaveQuestion,
  handleCancelEdit,
  handleCopyQuestion,
  isTextLarge 
}: QuestionDisplayProps) => {
  if (!userQuestion) return null;

  return (
    <div 
      className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 relative group"
      onMouseEnter={() => setIsHoveringQuestion(true)}
      onMouseLeave={() => setIsHoveringQuestion(false)}
    >
      {/* Interactive Icons - Top Right Corner */}
      <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!isEditingQuestion ? (
          <>
            {/* Edit Icon */}
            <button
              onClick={handleEditQuestion}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              title="Edit question"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            {/* Copy Question Icon */}
            <button
              onClick={handleCopyQuestion}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              title="Copy question"
            >
              <AnimatePresence mode="wait">
                {showQuestionCopySuccess ? (
                  <motion.svg
                    key="tick"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="copy"
                    initial={{ scale: 0, rotate: 90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </button>
          </>
        ) : (
          <>
            {/* Save (Tick) Icon */}
            <button
              onClick={handleSaveQuestion}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              title="Save changes"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            
            {/* Cancel (Cross) Icon */}
            <button
              onClick={handleCancelEdit}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
              title="Cancel editing"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="flex items-start gap-3 pr-16">
        {/* Question Icon */}
        <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-gray-500 dark:text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        {/* Question Text or Edit Input */}
        <div className="flex-1">
          <h3 className={`font-medium text-gray-700 dark:text-gray-300 mb-1 ${
            isTextLarge ? 'text-base' : 'text-sm'
          }`}>
            Your Question
          </h3>
          
          {!isEditingQuestion ? (
            <p className={`text-gray-600 dark:text-gray-400 leading-relaxed ${
              isTextLarge ? 'text-base' : 'text-sm'
            }`}>
              {userQuestion}
            </p>
          ) : (
            <textarea
              id="edit-question-textarea"
              name="edit-question"
              value={editedQuestion}
              onChange={(e) => setEditedQuestion(e.target.value)}
              className={`w-full p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 resize-none ${
                isTextLarge ? 'text-base' : 'text-sm'
              }`}
              rows={2}
              placeholder="Edit your question..."
              autoFocus
            />
          )}
        </div>
      </div>
    </div>
  );
};
