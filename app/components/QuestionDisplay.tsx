'use client';

interface QuestionDisplayProps {
  userQuestion?: string;
  isEditingQuestion?: boolean;
  editedQuestion?: string;
  setEditedQuestion?: (value: string) => void;
  isHoveringQuestion?: boolean;
  setIsHoveringQuestion?: (value: boolean) => void;
  showQuestionCopySuccess?: boolean;
  handleEditQuestion?: () => void;
  handleSaveQuestion?: () => void;
  handleCancelEdit?: () => void;
  handleCopyQuestion?: () => void;
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
      onMouseEnter={() => setIsHoveringQuestion?.(true)}
      onMouseLeave={() => setIsHoveringQuestion?.(false)}
    >
      <div className="flex items-start gap-3">
        {/* Question Icon */}
        <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-gray-500 dark:text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        {/* Question Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-medium text-gray-700 dark:text-gray-300 ${
              isTextLarge ? 'text-base' : 'text-sm'
            }`}>
              Your Question
            </h3>
            
            {/* Action Buttons - Hidden on mobile, show on desktop hover */}
            <div className="hidden sm:block">
              {isHoveringQuestion && !isEditingQuestion && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={handleEditQuestion}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Edit question"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleCopyQuestion}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Copy question"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Question Text or Edit Input */}
          {isEditingQuestion ? (
            <div className="hidden sm:block space-y-3">
              <textarea
                value={editedQuestion || userQuestion}
                onChange={(e) => setEditedQuestion?.(e.target.value)}
                className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isTextLarge ? 'text-base' : 'text-sm'
                }`}
                rows={3}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveQuestion}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          
          {/* Always show question text on mobile, or when not editing on desktop */}
          <p className={`text-gray-600 dark:text-gray-400 leading-relaxed ${
            isTextLarge ? 'text-base' : 'text-sm'
          }`}>
            {userQuestion}
          </p>
          
          {/* Copy Success Message - Hidden on mobile */}
          {showQuestionCopySuccess && (
            <div className="hidden sm:block mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Question copied to clipboard
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
