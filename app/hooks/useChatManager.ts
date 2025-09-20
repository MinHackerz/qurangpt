import { useState, useCallback, useMemo } from 'react';
import { getSurahNumber, calculateGlobalAyahNumber, fetchTafsir } from '../utils/tafsirUtils';

export interface ChatState {
  content: string;
  submittedQuestion: string; // The actual question sent by user (separate from current input content)
  isProcessing: boolean;
  summary: string;
  showSummary: boolean;
  showTranslateSection: boolean; // Separate state for translate section visibility
  error: string;
  copied: boolean;
  displayedContent: string;
  currentLanguage: string;
  isTranslating: boolean;
  translationProgress: number;
  isChatActive: boolean;
  translatedQuestions?: string[];
}

export const useChatManager = () => {
  const [state, setState] = useState<ChatState>({
    content: '',
    submittedQuestion: '',
    isProcessing: false,
    summary: '',
    showSummary: false,
    showTranslateSection: false,
    error: '',
    copied: false,
    displayedContent: '',
    currentLanguage: 'en',
    isTranslating: false,
    translationProgress: 0,
    isChatActive: false,
    translatedQuestions: undefined,
  });

  // Audio functionality is now handled directly in ResponseSection component

  const updateState = useCallback((updates: Partial<ChatState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const insertQuestion = useCallback((question: string) => {
    updateState({
      content: question,
      submittedQuestion: question, // Also set as submitted question when inserting from quick questions
      error: '',
      isChatActive: true
    });
  }, [updateState]);

  const resetForm = useCallback(() => {
    updateState({
      content: '',
      submittedQuestion: '',
      summary: '',
      showSummary: false, // Hide summary to show hero section
      showTranslateSection: false, // Hide translate section when resetting
      isProcessing: false,
      error: '',
      copied: false,
      displayedContent: '',
      currentLanguage: 'en',
      isTranslating: false,
      translationProgress: 0,
      isChatActive: false, // Return to default homepage state
      translatedQuestions: undefined,
    });
    
    // Audio is now managed directly in ResponseSection component
  }, [updateState]);

  const setContent = useCallback((content: string) => {
    updateState({ content });
  }, [updateState]);

  const setSubmittedQuestion = useCallback((submittedQuestion: string) => {
    updateState({ submittedQuestion });
  }, [updateState]);

  const setError = useCallback((error: string) => {
    updateState({ error });
  }, [updateState]);

  const setCopied = useCallback((copied: boolean) => {
    updateState({ copied });
  }, [updateState]);

  const setIsProcessing = useCallback((isProcessing: boolean) => {
    updateState({ isProcessing });
  }, [updateState]);

  const setSummary = useCallback((summary: string) => {
    updateState({ summary });
  }, [updateState]);

  const setShowSummary = useCallback((showSummary: boolean) => {
    updateState({ showSummary });
  }, [updateState]);

  const setShowTranslateSection = useCallback((showTranslateSection: boolean) => {
    updateState({ showTranslateSection });
  }, [updateState]);

  const setDisplayedContent = useCallback((displayedContent: string) => {
    updateState({ displayedContent });
  }, [updateState]);

  const setCurrentLanguage = useCallback((currentLanguage: string) => {
    updateState({ currentLanguage });
  }, [updateState]);

  const setIsTranslating = useCallback((isTranslating: boolean) => {
    updateState({ isTranslating });
  }, [updateState]);

  const setTranslationProgress = useCallback((translationProgress: number) => {
    updateState({ translationProgress });
  }, [updateState]);

  const setTranslatedQuestions = useCallback((translatedQuestions: string[] | undefined) => {
    updateState({ translatedQuestions });
  }, [updateState]);

  const setIsChatActive = useCallback((isChatActive: boolean) => {
    updateState({ isChatActive });
  }, [updateState]);

  return useMemo(() => ({
    ...state,
    insertQuestion,
    resetForm,
    setContent,
    setSubmittedQuestion,
    setError,
    setCopied,
    setIsProcessing,
    setSummary,
    setShowSummary,
    setShowTranslateSection,
    setDisplayedContent,
    setCurrentLanguage,
    setIsTranslating,
    setTranslationProgress,
    setTranslatedQuestions,
    setIsChatActive,
  }), [
    state,
    insertQuestion,
    resetForm,
    setContent,
    setSubmittedQuestion,
    setError,
    setCopied,
    setIsProcessing,
    setSummary,
    setShowSummary,
    setShowTranslateSection,
    setDisplayedContent,
    setCurrentLanguage,
    setIsTranslating,
    setTranslationProgress,
    setTranslatedQuestions,
    setIsChatActive,
  ]);
};
