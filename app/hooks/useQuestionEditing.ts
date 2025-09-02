import { useState, useCallback } from 'react';

export const useQuestionEditing = (userQuestion?: string, onQuestionEdit?: (newQuestion: string) => void) => {
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [isHoveringQuestion, setIsHoveringQuestion] = useState(false);
  const [showQuestionCopySuccess, setShowQuestionCopySuccess] = useState(false);

  const handleEditQuestion = useCallback(() => {
    setIsEditingQuestion(true);
    setEditedQuestion(userQuestion || '');
  }, [userQuestion]);

  const handleSaveQuestion = useCallback(() => {
    if (editedQuestion.trim() && editedQuestion !== userQuestion && onQuestionEdit) {
      onQuestionEdit(editedQuestion);
    }
    setIsEditingQuestion(false);
    setEditedQuestion('');
  }, [editedQuestion, userQuestion, onQuestionEdit]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingQuestion(false);
    setEditedQuestion('');
  }, []);

  const handleCopyQuestion = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(userQuestion || '');
      setShowQuestionCopySuccess(true);
      setTimeout(() => setShowQuestionCopySuccess(false), 1500);
    } catch (error) {
      // Silent fail for security
    }
  }, [userQuestion]);

  return {
    isEditingQuestion,
    editedQuestion,
    setEditedQuestion,
    isHoveringQuestion,
    setIsHoveringQuestion,
    showQuestionCopySuccess,
    handleEditQuestion,
    handleSaveQuestion,
    handleCancelEdit,
    handleCopyQuestion
  };
};
