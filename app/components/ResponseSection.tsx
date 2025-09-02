'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useQuestionEditing } from '../hooks/useQuestionEditing';
import { useGlobalEventDelegation } from '../hooks/useGlobalEventDelegation';
import { processContentLinks } from '../utils/contentUtils';
import { QuestionDisplay } from './QuestionDisplay';



interface ResponseSectionProps {
  showSummary: boolean;
  summary: string;
  copied: boolean;
  displayedContent?: string; // Content to display (could be translated)
  onCopyAIContent?: () => void; // New prop for copying AI content
  userQuestion?: string; // New prop for the user's question
  onQuestionEdit?: (newQuestion: string) => void; // New prop for editing the user's question
  isTextLarge?: boolean; // Text size state from parent
}

export default function ResponseSection({ 
  showSummary, 
  summary, 
  copied,
  displayedContent,
  onCopyAIContent,
  userQuestion,
  onQuestionEdit,
  isTextLarge
}: ResponseSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Use custom hooks
  const questionEditing = useQuestionEditing(userQuestion, onQuestionEdit);
  useGlobalEventDelegation();

  // Show copy success message
  useEffect(() => {
    if (copied && onCopyAIContent) {
      setShowCopySuccess(true);
      const timer = setTimeout(() => setShowCopySuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [copied, onCopyAIContent]);



  // Use displayedContent if provided, otherwise use summary
  const contentToShow = displayedContent || summary;
  
  // Debug: Check if content contains audio buttons
  useEffect(() => {
    if (contentToShow && contentToShow.includes('ayah-audio-play-btn')) {
      console.log('Content contains audio buttons:', contentToShow.includes('ayah-audio-play-btn'));
      console.log('Content preview:', contentToShow.substring(0, 500));
      
      // Check for buttons after a short delay to allow DOM to update
      setTimeout(() => {
        const buttons = document.querySelectorAll('.ayah-audio-play-btn');
        console.log('Audio buttons found in DOM after render:', buttons.length);
        if (buttons.length > 0) {
          buttons.forEach((button, index) => {
            console.log(`Button ${index}:`, {
              tagName: button.tagName,
              className: button.className,
              dataSurah: button.getAttribute('data-surah'),
              dataAyah: button.getAttribute('data-ayah')
            });
          });
        }
      }, 100);
    }
  }, [contentToShow]);



  if (!showSummary) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="relative max-w-4xl mx-auto px-0 -mx-1 response-section-safe-margin"
      >
        <div className="relative group">
          <div className="relative z-10">
            {/* Question Display */}
            <QuestionDisplay
              userQuestion={userQuestion}
              isEditingQuestion={questionEditing.isEditingQuestion}
              editedQuestion={questionEditing.editedQuestion}
              setEditedQuestion={questionEditing.setEditedQuestion}
              isHoveringQuestion={questionEditing.isHoveringQuestion}
              setIsHoveringQuestion={questionEditing.setIsHoveringQuestion}
              showQuestionCopySuccess={questionEditing.showQuestionCopySuccess}
              handleEditQuestion={questionEditing.handleEditQuestion}
              handleSaveQuestion={questionEditing.handleSaveQuestion}
              handleCancelEdit={questionEditing.handleCancelEdit}
              handleCopyQuestion={questionEditing.handleCopyQuestion}
              isTextLarge={isTextLarge}
            />

            {/* Content Display */}
            <div 
              ref={containerRef}
              className={`text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed p-4 -m-4 transition-all duration-200 ${
                isTextLarge ? 'text-base' : 'text-sm'
              }`}
              dangerouslySetInnerHTML={{ __html: processContentLinks(contentToShow) }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
