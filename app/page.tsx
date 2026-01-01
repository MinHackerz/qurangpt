'use client';

import { useCallback, useState, useEffect, Suspense, useRef } from 'react';
import { motion } from 'framer-motion';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { detectLanguage } from './utils/languageDetection';
import { processContentLinks } from './utils/contentUtils';
import {
  ChatSection,
  MinimalHeader,
  SourcesSection,
  ThemeToggle,
  VerticalActionBar,
  TimeDashboard,
  ReadQuran,
  MosqueFinder,
  ZakatCalculator,
} from './components';
import ShareModal from './components/ShareModal';
import { useTheme } from './contexts/ThemeContext';
import InstallPrompt from './components/InstallPrompt';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import DynamicThemeColor from './components/DynamicThemeColor';
import ProgressIndicator from './components/ProgressIndicator';


import { useChatManager } from './hooks/useChatManager';
import { useAIResponse } from './hooks/useAIResponse';
import { useGlobalEventDelegation } from './hooks/useGlobalEventDelegation';
import { getGlobalAbortManager } from './hooks/useAbortManager';
import { useTranslationManager } from './hooks/useTranslationManager';


// Extend Window interface for tafsir functionality
declare global {
  interface Window {
    setupTafsirEventDelegation?: () => void;
    toggleTafsir?: (tafsirId: string) => void;
  }
}

function HomeContent() {
  // Use custom hooks for better organization
  const chatManager = useChatManager();
  const { setTheme } = useTheme();
  const searchParams = useSearchParams();
  const hasProcessedUrlQuestion = useRef(false);
  const { copyAIContentOnly } = useTranslationManager();

  // Initialize global event delegation for suggested questions and other interactive elements
  useGlobalEventDelegation();

  // Sidebar offset state
  const [sidebarOffset, setSidebarOffset] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [showTimeDashboard, setShowTimeDashboard] = useState<boolean>(false);

  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  // Define the component switching handler outside useEffect
  const onShowComponent = useCallback((e: any) => {
    const component = e?.detail?.component as string;
    console.log('onShowComponent called with:', component); // Debug log
    if (component) {
      // First, hide all other components and views
      setShowTimeDashboard(false);
      setActiveComponent(null);

      // Reset chat state completely to prevent chat outputs from appearing in new tabs
      chatManager.resetForm();

      // Then show only the requested component
      if (component === 'read-quran' || component === 'mosque-finder' || component === 'zakat-calculator') {
        setActiveComponent(component);
      }
      console.log('Active component set to:', component); // Debug log
    }
  }, [chatManager]);

  // Detect mobile devices and handle resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOffset(0);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const onSidebar = (e: any) => {
      if (e?.detail?.width !== undefined) {
        // Only apply sidebar offset on desktop (sm and above)
        if (!isMobile) {
          setSidebarOffset(e.detail.width);
        } else {
          setSidebarOffset(0);
        }
      }
    };
    const onToggleTime = (e: any) => {
      const shouldOpen = !!e?.detail?.open;
      setShowTimeDashboard(shouldOpen);
      // Hide all other components and views when opening dashboard
      if (shouldOpen) {
        setActiveComponent(null);
        // Reset chat state completely when opening time dashboard
        chatManager.resetForm();
      }
    };
    const onOpenChat = () => {
      // Hide all components and views first
      setShowTimeDashboard(false);
      setActiveComponent(null);

      // Toggle chat state - if chat is already active, close it; if not, open it
      if (chatManager.isChatActive) {
        // Chat is active, so close it and reset to default state
        chatManager.setIsChatActive(false);
        chatManager.setShowSummary(false);
        chatManager.setContent('');
        chatManager.setSubmittedQuestion('');
        chatManager.setSummary('');
        chatManager.setDisplayedContent('');
        chatManager.setError('');
        chatManager.setIsProcessing(false);
        // Ensure proper alignment by re-dispatching sidebar event with current offset
        setTimeout(() => {
          // Re-dispatch sidebar event to restore proper alignment
          const sidebarEvent = new CustomEvent('qgpt:sidebar', { detail: { width: sidebarOffset } });
          window.dispatchEvent(sidebarEvent);
          // Focus the input in the hero section and scroll to top
          const evt = new CustomEvent('qgpt:focus-chat-input');
          window.dispatchEvent(evt);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100); // Slightly longer delay to ensure state is fully reset
      } else {
        // Chat is not active, so open it
        chatManager.setIsChatActive(true);
        // Focus the input in the chat section
        setTimeout(() => {
          const evt = new CustomEvent('qgpt:focus-chat-input');
          window.dispatchEvent(evt);
        }, 100);
      }
    };

    const onResetToDefault = () => {
      // Hide all components and views first
      setShowTimeDashboard(false);
      setActiveComponent(null);
      // Reset chat state to default (like clicking Clear and Reset)
      chatManager.resetForm();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const onSetTheme = (e: any) => {
      const mode = e?.detail?.mode as 'system' | 'light' | 'dark' | undefined;
      if (!mode) return;
      try {
        setTheme(mode);
      } catch (error) {
        console.error('Failed to set theme:', error);
      }
    };
    const onCloseComponent = () => {
      setActiveComponent(null);
      // Reset chat state when closing components to prevent chat outputs from persisting
      chatManager.resetForm();
    };

    const onModalState = (e: any) => {
      const isOpen = e?.detail?.isOpen || false;
      setIsModalOpen(isOpen);
      if (isOpen && e.detail.selectedDate && e.detail.selectedEvents) {
        setModalData({
          selectedDate: e.detail.selectedDate,
          selectedEvents: e.detail.selectedEvents
        });
      } else if (!isOpen) {
        // Clear modal data when closing
        setModalData({ selectedDate: null, selectedEvents: [] });
      }
    };

    window.addEventListener('qgpt:sidebar', onSidebar as EventListener);
    window.addEventListener('qgpt:toggle-time-dashboard', onToggleTime as EventListener);
    window.addEventListener('qgpt:open-chat', onOpenChat as EventListener);
    window.addEventListener('qgpt:reset-to-default', onResetToDefault as EventListener);
    window.addEventListener('qgpt:set-theme', onSetTheme as EventListener);
    window.addEventListener('qgpt:show-component', onShowComponent as EventListener);
    window.addEventListener('qgpt:close-component', onCloseComponent as EventListener);
    window.addEventListener('qgpt:modal-state', onModalState as EventListener);
    return () => {
      window.removeEventListener('qgpt:sidebar', onSidebar as EventListener);
      window.removeEventListener('qgpt:toggle-time-dashboard', onToggleTime as EventListener);
      window.removeEventListener('qgpt:open-chat', onOpenChat as EventListener);
      window.removeEventListener('qgpt:reset-to-default', onResetToDefault as EventListener);
      window.removeEventListener('qgpt:set-theme', onSetTheme as EventListener);
      window.removeEventListener('qgpt:show-component', onShowComponent as EventListener);
      window.removeEventListener('qgpt:close-component', onCloseComponent as EventListener);
      window.removeEventListener('qgpt:modal-state', onModalState as EventListener);
    };
  }, [onShowComponent, chatManager, showTimeDashboard, isMobile, setTheme, sidebarOffset]);

  // Allow page to remain scrollable while chat input is fixed at the bottom
  useEffect(() => {
    // No scroll lock needed; ensure defaults are cleared
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    (document.documentElement as HTMLElement).style.overscrollBehavior = '';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      (document.documentElement as HTMLElement).style.overscrollBehavior = '';
    };
  }, [chatManager.isProcessing, chatManager.isChatActive]);

  // Track previous processing state to detect completion
  const wasProcessingRef = useRef(false);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll functionality: Follow progress during generation, scroll to top when complete
  useEffect(() => {
    // During processing: Auto-scroll to follow the progress
    if (chatManager.isProcessing) {
      wasProcessingRef.current = true;

      // Clear any existing interval
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }

      // Set up auto-scroll interval during processing
      autoScrollIntervalRef.current = setInterval(() => {
        // Scroll to the bottom of the current content to follow progress
        /* Auto-scroll disabled by user request
        const mainContent = document.querySelector('main');
        if (mainContent) {
          const scrollTarget = mainContent.scrollHeight;
          window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
          });
        }
        */
      }, 500); // Check every 500ms
    } else {
      // Processing just completed - scroll to top to show output from beginning
      if (wasProcessingRef.current && chatManager.showSummary) {
        // Clear the auto-scroll interval
        if (autoScrollIntervalRef.current) {
          clearInterval(autoScrollIntervalRef.current);
          autoScrollIntervalRef.current = null;
        }

        // Small delay to ensure content is rendered, then scroll to top
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        }, 300);

        wasProcessingRef.current = false;
      }
    }

    // Cleanup on unmount
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    };
  }, [chatManager.isProcessing, chatManager.showSummary]);

  // Audio functionality is now handled directly in ResponseSection component


  // Text size toggle state - using three-state system for consistency
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('small');
  const isTextLarge = textSize === 'large';

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Share functionality state
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pendingShareModal, setPendingShareModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    selectedDate: { gDate: Date; hDay: number } | null;
    selectedEvents: any[];
  }>({ selectedDate: null, selectedEvents: [] });


  // Content type selection state
  const [selectedContentTypes, setSelectedContentTypes] = useState({
    tafsir: true,
    hadith: false,
    webSearch: false,
    suggestedQuestions: false
  });

  // AI Response hook with text size state and content type selection
  const { askQuran } = useAIResponse(textSize, selectedContentTypes);

  // Handle question parameter from URL (from shared page)
  useEffect(() => {
    const questionParam = searchParams.get('question');
    if (questionParam && !hasProcessedUrlQuestion.current) {
      // Mark as processed to prevent duplicate processing
      hasProcessedUrlQuestion.current = true;

      // Decode the question
      const decodedQuestion = decodeURIComponent(questionParam);

      // Set the question in the input field
      chatManager.setContent(decodedQuestion);

      // Set the submitted question
      chatManager.setSubmittedQuestion(decodedQuestion);

      // Activate chat mode
      chatManager.setIsChatActive(true);

      // Clear any previous errors
      chatManager.setError('');

      // Handle content type parameters from URL
      const tafsirParam = searchParams.get('tafsir');
      const hadithParam = searchParams.get('hadith');
      const webSearchParam = searchParams.get('webSearch');
      const suggestedQuestionsParam = searchParams.get('suggestedQuestions');

      // Create content types object from URL parameters
      const urlContentTypes = {
        tafsir: tafsirParam === 'true',
        hadith: hadithParam === 'true',
        webSearch: webSearchParam === 'true',
        suggestedQuestions: suggestedQuestionsParam === 'true'
      };

      // Update content type selections based on URL parameters
      setSelectedContentTypes(urlContentTypes);

      // Process the question directly with the URL content types
      setTimeout(() => {
        askQuran(
          decodedQuestion,
          chatManager.setIsProcessing,
          chatManager.setSummary,
          chatManager.setShowSummary,
          chatManager.setError,
          chatManager.setDisplayedContent,
          () => { }, // setCurrentLanguage - no longer needed
          undefined, // setShowTranslateSection - no longer needed
          chatManager.setCurrentStep,
          urlContentTypes
        );
      }, 100);

      // Clear the URL parameter to prevent re-processing on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('question');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, askQuran, chatManager, selectedContentTypes]);

  // Handle suggested question clicks from embedded HTML
  useEffect(() => {
    const handleEmbeddedSuggestedQuestionClick = (event: CustomEvent) => {
      const question = event.detail.question;
      if (question) {
        // Set the question in the input field
        chatManager.setContent(question);

        // Set the submitted question
        chatManager.setSubmittedQuestion(question);

        // Reset the form and start fresh with the new question
        chatManager.setSummary('');
        chatManager.setShowSummary(false);
        chatManager.setError('');
        chatManager.setCopied(false);
        chatManager.setDisplayedContent('');

        // Process the question directly
        askQuran(
          question,
          chatManager.setIsProcessing,
          chatManager.setSummary,
          chatManager.setShowSummary,
          chatManager.setError,
          chatManager.setDisplayedContent,
          () => { }, // setCurrentLanguage - no longer needed
          undefined, // setShowTranslateSection - no longer needed
          chatManager.setCurrentStep,
          selectedContentTypes,
        );

        chatManager.setIsChatActive(true);
      }
    };

    window.addEventListener('suggestedQuestionClick', handleEmbeddedSuggestedQuestionClick as EventListener);

    return () => {
      window.removeEventListener('suggestedQuestionClick', handleEmbeddedSuggestedQuestionClick as EventListener);
    };
  }, [chatManager, askQuran, selectedContentTypes]);

  // Audio management
  // Audio functionality is now handled directly in ResponseSection component

  // Open share modal when share URL is generated (same as mobile functionality)
  useEffect(() => {
    if (pendingShareModal && shareUrl && !isSharing) {
      setShowShareModal(true);
      setPendingShareModal(false);
    }
  }, [shareUrl, isSharing, pendingShareModal]);

  // AbortController for stopping operations
  const abortControllerRef = useRef<AbortController | null>(null);
  const isAbortingRef = useRef<boolean>(false);

  // Cleanup effect to abort any pending operations on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (error) {
          // Ignore abort errors during cleanup
        }
      }
    };
  }, []);

  // Handle asking Quran with the new hook
  const handleAskQuran = useCallback(async () => {
    // Handle ask Quran request

    // Validate content before proceeding
    if (!chatManager.content || chatManager.content.trim().length === 0) {
      // Content is empty
      chatManager.setError('Question content is missing. Please try again.');
      return;
    }

    // Reset global abort state for new operation
    const abortManager = getGlobalAbortManager();
    abortManager.reset();
    console.log('handleAskQuran - Reset global abort state');

    // Abort any existing operation before starting a new one
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (error) {
        // Ignore abort errors
      }
    }

    // Create new AbortController for this operation
    abortControllerRef.current = new AbortController();

    // Set the submitted question when user actually sends the message
    const questionText = chatManager.content.trim();
    chatManager.setSubmittedQuestion(questionText);

    try {
      await askQuran(
        questionText, // Use the same question text to ensure consistency
        chatManager.setIsProcessing,
        chatManager.setSummary,
        chatManager.setShowSummary,
        chatManager.setError,
        chatManager.setDisplayedContent,
        () => { }, // setCurrentLanguage - no longer needed
        undefined, // setShowTranslateSection - no longer needed
        chatManager.setCurrentStep,
        selectedContentTypes, // Pass content type selection
        abortControllerRef.current, // Pass AbortController
        () => abortManager.isAborted() // Pass abort check function
      );

      // Only proceed if operation wasn't aborted
      if (!isAbortingRef.current) {
        // Translation feature removed - no caching needed

        chatManager.setIsChatActive(true);
        // Question processed successfully
      }
    } catch (error) {
      // Don't show error if operation was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      // Error in handleAskQuran
      chatManager.setError('Failed to process question. Please try again.');
    } finally {
      // Clear the abort controller reference
      abortControllerRef.current = null;
    }
  }, [askQuran, chatManager, selectedContentTypes]);

  // Handle stopping operations
  const handleStopOperation = useCallback(() => {
    console.log('handleStopOperation called');

    // Use global abort manager
    const abortManager = getGlobalAbortManager();
    abortManager.setAborted(true);

    // Reset processing state immediately
    chatManager.setIsProcessing(false);
    chatManager.setError('');

    // Return to home page (hero section) when operation is aborted
    chatManager.setIsChatActive(false);

    // Clear the controller reference immediately to prevent further operations
    abortControllerRef.current = null;
    console.log('handleStopOperation - Cleared abortControllerRef.current and returned to home page');
  }, [chatManager]);

  // Handle suggested question clicks
  const handleSuggestedQuestionClick = useCallback((question: string) => {
    // Suggested question clicked

    // IMMEDIATELY update the input field content so user can see their question
    chatManager.setContent(question);

    // Set the submitted question so it shows in the response section
    chatManager.setSubmittedQuestion(question);

    // Reset the form and start fresh with the new question
    chatManager.setSummary('');
    chatManager.setShowSummary(false);
    chatManager.setError('');
    chatManager.setCopied(false);
    chatManager.setDisplayedContent('');
    // Language will be set by askQuran based on detected language

    // Audio is now handled in ResponseSection component

    // Set content and immediately process - use a more direct approach
    // Instead of relying on state updates, pass the question directly
    const processQuestionDirectly = async (questionText: string) => {
      // Processing suggested question directly

      if (!questionText || questionText.trim().length === 0) {
        // Question text is empty
        chatManager.setError('Invalid question. Please try again.');
        return;
      }

      // Reset aborting flag
      isAbortingRef.current = false;

      // Abort any existing operation before starting a new one
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (error) {
          // Ignore abort errors
        }
      }

      // Create new AbortController for this operation
      abortControllerRef.current = new AbortController();

      // Get global abort manager
      const abortManager = getGlobalAbortManager();

      try {
        // Call askQuran directly with the question text
        await askQuran(
          questionText,
          chatManager.setIsProcessing,
          chatManager.setSummary,
          chatManager.setShowSummary,
          chatManager.setError,
          chatManager.setDisplayedContent,
          () => { }, // setCurrentLanguage - no longer needed
          undefined, // setShowTranslateSection - no longer needed
          chatManager.setCurrentStep,
          selectedContentTypes, // Pass content type selection
          abortControllerRef.current, // Pass AbortController
          () => abortManager.isAborted() // Pass abort check function
        );

        // Only proceed if operation wasn't aborted
        if (!isAbortingRef.current) {
          chatManager.setIsChatActive(true);
          // Content state is already updated above, no need to update again
          // Question processed successfully
        }
      } catch (error) {
        // Don't show error if operation was aborted
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        // Error processing suggested question
        chatManager.setError('Failed to process question. Please try again.');
      } finally {
        // Clear the abort controller reference
        abortControllerRef.current = null;
      }
    };

    // Process the question immediately without waiting for state updates
    processQuestionDirectly(question);
  }, [chatManager, askQuran, selectedContentTypes]);

  // Handle when new AI questions are generated
  const handleQuestionsGenerated = useCallback((questions: string[]) => {
    // Handle questions generated - No longer needed since translate section is removed

  }, []); // No dependencies needed since function does nothing

  // Handle copying AI content using the standardized copyAIContentOnly function
  const handleCopyAIContent = useCallback(async () => {
    await copyAIContentOnly(
      chatManager.displayedContent || chatManager.summary,
      chatManager.summary,
      chatManager.setCopied
    );

    // Track copy event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'content_copied', {
        event_category: 'engagement',
        event_label: 'copy_ai_content',
        custom_parameter_1: chatManager.submittedQuestion ? chatManager.submittedQuestion.substring(0, 100) : 'unknown_question'
      });
    }
  }, [chatManager, copyAIContentOnly]);

  // Reset share URL when question or content changes
  useEffect(() => {
    setShareUrl('');
    setShowShareModal(false);
    setPendingShareModal(false);
  }, [chatManager.submittedQuestion, chatManager.displayedContent, chatManager.summary]);


  // Handle sharing AI content
  const handleShareContent = useCallback(async () => {
    if (!chatManager.submittedQuestion || (!chatManager.displayedContent && !chatManager.summary)) {
      return;
    }

    setIsSharing(true);
    setShowShareSuccess(false);

    try {
      // Prepare the content for sharing - remove suggested questions
      let responseContent = chatManager.displayedContent || chatManager.summary;

      // Create a temporary DOM element to parse and clean the content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = responseContent;

      // Remove suggested questions sections from shared content
      const suggestedQuestionsElements = tempDiv.querySelectorAll('.suggested-questions-section, .related-questions-section, [class*="suggested-question"], [data-suggested-question]');
      suggestedQuestionsElements.forEach(element => element.remove());

      // Get the cleaned content
      responseContent = tempDiv.innerHTML;

      const title = chatManager.submittedQuestion.length > 50
        ? chatManager.submittedQuestion.substring(0, 50) + '...'
        : chatManager.submittedQuestion;

      // Call the share API (no-cache to avoid any stale intermediaries)
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: chatManager.submittedQuestion,
          response: responseContent,
          title: title
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);

      // Track share creation in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'content_shared', {
          event_category: 'engagement',
          event_label: 'share_created',
          custom_parameter_1: chatManager.submittedQuestion.substring(0, 100), // First 100 chars of question
          custom_parameter_2: 'main_page'
        });
      }

      // Copy the share URL to clipboard
      await navigator.clipboard.writeText(data.shareUrl);

      // Show success feedback
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 3000);

    } catch (error) {
      // You could add a toast notification here for error feedback
    } finally {
      setIsSharing(false);
    }
  }, [chatManager.submittedQuestion, chatManager.displayedContent, chatManager.summary]);

  // Handle text size toggle - cycle through three states
  const handleTextSizeToggle = useCallback(() => {
    const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(textSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setTextSize(sizes[nextIndex]);
  }, [textSize]);

  // Handle content type change
  const handleContentTypeChange = useCallback((contentTypes: {
    tafsir: boolean;
    hadith: boolean;
    webSearch: boolean;
    suggestedQuestions: boolean;
  }) => {
    setSelectedContentTypes(contentTypes);
  }, []);

  // Handle theme toggle
  const handleThemeToggle = useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode]);

  // Update existing tafsir content when text size changes
  useEffect(() => {
    const updateExistingTafsirTextSize = () => {
      // Update tafsir content headers
      const tafsirHeaders = document.querySelectorAll('.tafsir-content h5');
      tafsirHeaders.forEach(header => {
        header.className = header.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        header.classList.add(textSize === 'large' ? 'text-lg' : textSize === 'medium' ? 'text-base' : 'text-sm');
      });

      // Update tafsir author names
      const tafsirAuthors = document.querySelectorAll('.tafsir-content h5 span');
      tafsirAuthors.forEach(author => {
        author.className = author.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        author.classList.add(textSize === 'large' ? 'text-base' : textSize === 'medium' ? 'text-sm' : 'text-xs');
        author.classList.add('md:text-base', 'md:text-sm');
      });

      // Update tafsir content text
      const tafsirContentDivs = document.querySelectorAll('.tafsir-content .text-gray-700');
      tafsirContentDivs.forEach(contentDiv => {
        contentDiv.className = contentDiv.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        contentDiv.classList.add(textSize === 'large' ? 'text-base' : textSize === 'medium' ? 'text-sm' : 'text-xs');
        contentDiv.classList.add('md:text-base', 'md:text-sm');
      });

      // Update AI Explanation sections
      const aiExplanationHeaders = document.querySelectorAll('.ai-explanation-section h4');
      aiExplanationHeaders.forEach(header => {
        header.className = header.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        header.classList.add(textSize === 'large' ? 'text-2xl' : textSize === 'medium' ? 'text-xl' : 'text-lg');
      });

      const aiExplanationContent = document.querySelectorAll('.ai-explanation-section .text-gray-700');
      aiExplanationContent.forEach(content => {
        content.className = content.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        content.classList.add(textSize === 'large' ? 'text-lg' : textSize === 'medium' ? 'text-base' : 'text-sm');
      });

      // Update Authentic Tafsir sections
      const authenticTafsirHeaders = document.querySelectorAll('.authentic-tafsir-section h4');
      authenticTafsirHeaders.forEach(header => {
        header.className = header.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        header.classList.add(textSize === 'large' ? 'text-2xl' : textSize === 'medium' ? 'text-xl' : 'text-lg');
      });

      const authenticTafsirContent = document.querySelectorAll('.authentic-tafsir-section .text-gray-700');
      authenticTafsirContent.forEach(content => {
        content.className = content.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        content.classList.add(textSize === 'large' ? 'text-lg' : textSize === 'medium' ? 'text-base' : 'text-sm');
      });

      // Update main Tafsir section headers
      const mainTafsirHeaders = document.querySelectorAll('.tafsir-section h3');
      mainTafsirHeaders.forEach(header => {
        header.className = header.className.replace(/text-(xs|sm|base|lg|xl|2xl|3xl)/g, '');
        header.classList.add(textSize === 'large' ? 'text-3xl' : textSize === 'medium' ? 'text-2xl' : 'text-xl');
        header.classList.add('md:text-4xl', 'md:text-3xl', 'md:text-2xl');
      });

      const mainTafsirDescriptions = document.querySelectorAll('.tafsir-section p');
      mainTafsirDescriptions.forEach(desc => {
        desc.className = desc.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        desc.classList.add(textSize === 'large' ? 'text-lg' : textSize === 'medium' ? 'text-base' : 'text-sm');
      });

      // Update ayah content text sizes
      const ayahBoxes = document.querySelectorAll('.stylish-ayah-reference');
      ayahBoxes.forEach(ayahBox => {
        // Update ayah text content
        const ayahText = ayahBox.querySelector('blockquote');
        if (ayahText) {
          ayahText.className = ayahText.className.replace(/text-(xs|sm|base|lg|xl|2xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl|md:text-2xl)/g, '');
          if (textSize === 'large') {
            ayahText.classList.add('text-xl', 'md:text-2xl');
          } else if (textSize === 'medium') {
            ayahText.classList.add('text-lg', 'md:text-xl');
          } else {
            ayahText.classList.add('text-base', 'md:text-lg');
          }
        }

        // Update ayah headers
        const ayahHeader = ayahBox.querySelector('h3');
        if (ayahHeader) {
          ayahHeader.className = ayahHeader.className.replace(/text-(xs|sm|base|lg|xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl)/g, '');
          if (textSize === 'large') {
            ayahHeader.classList.add('text-base', 'md:text-lg');
          } else if (textSize === 'medium') {
            ayahHeader.classList.add('text-sm', 'md:text-base');
          } else {
            ayahHeader.classList.add('text-xs', 'md:text-sm');
          }
        }

        // Update ayah verse number
        const ayahVerse = ayahBox.querySelector('p');
        if (ayahVerse) {
          ayahVerse.className = ayahVerse.className.replace(/text-(xs|sm|base|lg|xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl)/g, '');
          if (textSize === 'large') {
            ayahVerse.classList.add('text-sm', 'md:text-base');
          } else if (textSize === 'medium') {
            ayahVerse.classList.add('text-xs', 'md:text-sm');
          } else {
            ayahVerse.classList.add('text-xs');
          }
        }
      });

      // Update hadith text sizes
      const hadithBoxes = document.querySelectorAll('.stylish-hadith-reference');
      hadithBoxes.forEach(hadithBox => {
        // Update book name and hadith number - match ayah header sizing
        const bookName = hadithBox.querySelector('span.font-medium');
        if (bookName) {
          bookName.className = bookName.className.replace(/text-(xs|sm|base|lg|xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl)/g, '');
          if (textSize === 'large') {
            bookName.classList.add('text-base', 'md:text-lg');
          } else if (textSize === 'medium') {
            bookName.classList.add('text-sm', 'md:text-base');
          } else {
            bookName.classList.add('text-xs', 'md:text-sm');
          }
        }

        // Update hadith number - match ayah header sizing
        const hadithNumber = hadithBox.querySelector('span.text-xs');
        if (hadithNumber) {
          hadithNumber.className = hadithNumber.className.replace(/text-(xs|sm|base|lg|xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl)/g, '');
          if (textSize === 'large') {
            hadithNumber.classList.add('text-base', 'md:text-lg');
          } else if (textSize === 'medium') {
            hadithNumber.classList.add('text-sm', 'md:text-base');
          } else {
            hadithNumber.classList.add('text-xs', 'md:text-sm');
          }
        }

        // Update status badge - use a more reliable selector
        const statusBadge = hadithBox.querySelector('span[class*="px-2"][class*="py-0"]');
        if (statusBadge) {
          statusBadge.className = statusBadge.className.replace(/text-(xs|sm|base|lg|xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl)/g, '');
          if (textSize === 'large') {
            statusBadge.classList.add('text-base', 'md:text-lg');
          } else if (textSize === 'medium') {
            statusBadge.classList.add('text-sm', 'md:text-base');
          } else {
            statusBadge.classList.add('text-xs', 'md:text-sm');
          }
        }

        // Update hadith text - professional sizing
        const hadithText = hadithBox.querySelector('.hadith-text-english, .hadith-text-arabic');
        if (hadithText) {
          hadithText.className = hadithText.className.replace(/text-(xs|sm|base|lg|xl|2xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl|md:text-2xl)/g, '');
          if (textSize === 'large') {
            hadithText.classList.add('text-lg', 'md:text-xl');
          } else if (textSize === 'medium') {
            hadithText.classList.add('text-base', 'md:text-lg');
          } else {
            hadithText.classList.add('text-sm', 'md:text-base');
          }
        }

        // Update narrator text - match ayah header sizing
        const narrator = hadithBox.querySelector('.hadith-narrator');
        if (narrator) {
          narrator.className = narrator.className.replace(/text-(xs|sm|base|lg|xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl)/g, '');
          if (textSize === 'large') {
            narrator.classList.add('text-base', 'md:text-lg');
          } else if (textSize === 'medium') {
            narrator.classList.add('text-sm', 'md:text-base');
          } else {
            narrator.classList.add('text-xs', 'md:text-sm');
          }
        }

        // Update AI summary - match AI content sizing exactly
        const aiSummary = hadithBox.querySelector('.hadith-ai-summary');
        if (aiSummary) {
          // Check if the element already has the correct text size class
          const expectedClass = textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base';
          if (!aiSummary.classList.contains(expectedClass)) {
            // Remove all text size classes more thoroughly
            aiSummary.className = aiSummary.className.replace(/\btext-(xs|sm|base|lg|xl|2xl)\b/g, '');
            aiSummary.className = aiSummary.className.replace(/\bmd:text-(xs|sm|base|lg|xl|2xl)\b/g, '');
            // Clean up extra spaces
            aiSummary.className = aiSummary.className.replace(/\s+/g, ' ').trim();
            // Add the new class and ensure consistent color
            aiSummary.classList.add(expectedClass);
            // Ensure consistent color with main content
            aiSummary.classList.add('text-gray-700', 'dark:text-gray-300');
          }
        }
      });

      // STRICTLY update combined explanations for ayahs - uniform text size everywhere
      // Force update ALL combined explanations to ensure absolute consistency
      const combinedExplanations = document.querySelectorAll('.combined-explanation');
      const expectedClass = textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base';
      combinedExplanations.forEach(explanation => {
        // Always remove ALL text size classes first (even if it has the expected class, to ensure no conflicts)
        explanation.className = explanation.className.replace(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl)\b/g, '');
        explanation.className = explanation.className.replace(/\bmd:text-(xs|sm|base|lg|xl|2xl|3xl|4xl)\b/g, '');
        // Clean up extra spaces
        explanation.className = explanation.className.replace(/\s+/g, ' ').trim();
        // Add the new class - STRICTLY uniform
        explanation.classList.add(expectedClass);
        // Ensure consistent color and styling
        explanation.classList.add('text-gray-700', 'dark:text-gray-300', 'leading-relaxed');
        // Force the font size to match the class by clearing any inline styles that might override
        (explanation as HTMLElement).style.fontSize = '';
      });

      // STRICTLY update hadith AI summaries - uniform text size everywhere
      const hadithSummaries = document.querySelectorAll('.hadith-ai-summary');
      hadithSummaries.forEach(summary => {
        // Always remove ALL text size classes first
        summary.className = summary.className.replace(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl)\b/g, '');
        summary.className = summary.className.replace(/\bmd:text-(xs|sm|base|lg|xl|2xl|3xl|4xl)\b/g, '');
        // Clean up extra spaces
        summary.className = summary.className.replace(/\s+/g, ' ').trim();
        // Add the new class - STRICTLY uniform (same as combined explanations)
        summary.classList.add(expectedClass);
        // Ensure consistent color and styling
        summary.classList.add('text-gray-700', 'dark:text-gray-300', 'leading-relaxed');
        // Force the font size to match the class
        (summary as HTMLElement).style.fontSize = '';
      });

      // Update suggested questions text sizes
      const suggestedQuestionItems = document.querySelectorAll('.suggested-question-item p');
      suggestedQuestionItems.forEach(questionItem => {
        const expectedClass = textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base';
        if (!questionItem.classList.contains(expectedClass)) {
          questionItem.className = questionItem.className.replace(/text-(xs|sm|base|lg|xl|2xl)/g, '');
          questionItem.classList.add(expectedClass);
        }
      });
    };

    // Run the update function immediately and with a single delay to handle re-renders
    updateExistingTafsirTextSize();

    // Single delay to handle any async re-renders
    setTimeout(() => updateExistingTafsirTextSize(), 100);
  }, [textSize]);


  // Audio management functions are now handled directly in ResponseSection component

  // Helper function to format time
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Islamic Data State
  const [islamicData, setIslamicData] = useState<any>(null);

  // Fetch Islamic Data
  useEffect(() => {
    const fetchIslamicData = async (lat?: number, lng?: number) => {
      try {
        // Try cache first (but only if no new location provided)
        if (!lat && !lng) {
          const cachedData = localStorage.getItem('quran-gpt-islamic-data');
          const cacheTime = localStorage.getItem('quran-gpt-islamic-data-time');
          if (cachedData && cacheTime) {
            const cacheAge = Date.now() - parseInt(cacheTime);
            if (cacheAge < 15 * 60 * 1000) { // 15 mins cache
              setIslamicData(JSON.parse(cachedData));
              return;
            }
          }
        }

        // Build URL with optional location params
        let url = '/api/islamic-data';
        if (lat !== undefined && lng !== undefined) {
          url += `?lat=${lat}&lng=${lng}&useLocation=true`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setIslamicData(data);
          localStorage.setItem('quran-gpt-islamic-data', JSON.stringify(data));
          localStorage.setItem('quran-gpt-islamic-data-time', Date.now().toString());
        }
      } catch (e) {
        console.error("Failed to fetch Islamic data", e);
      }
    };

    // Try browser geolocation first for accurate location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Success - use browser coordinates
          fetchIslamicData(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Denied or error - fall back to IP-based detection
          fetchIslamicData();
        },
        { timeout: 5000 } // 5 second timeout
      );
    } else {
      // Geolocation not supported - fall back to IP-based detection
      fetchIslamicData();
    }
  }, []);

  // Get greeting message
  const getGreetingMessage = useCallback(() => {
    if (!islamicData?.hijri) return '';

    const hijriMonth = parseInt(islamicData.hijri.month.number);
    const hijriDay = parseInt(islamicData.hijri.day);

    // Ramadan (Month 9)
    if (hijriMonth === 9) {
      return (
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl md:text-5xl">🌙</span>
          <span className="text-xl md:text-2xl font-semibold text-black dark:text-white">
            Ramadan Mubarak
          </span>
          <span className="text-4xl md:text-5xl">⭐</span>
        </div>
      );
    }

    // Eid ul Fitr (Month 10, Day 1-3)
    else if (hijriMonth === 10 && hijriDay >= 1 && hijriDay <= 3) {
      return (
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl md:text-4xl">🎉</span>
          <span className="text-xl md:text-2xl font-semibold text-black dark:text-white">
            Eid Mubarak
          </span>
          <span className="text-4xl md:text-4xl">🎊</span>
        </div>
      );
    }

    // Eid al Adha (Month 12, Day 10-13)
    else if (hijriMonth === 12 && hijriDay >= 10 && hijriDay <= 13) {
      return (
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl md:text-4xl">🎉</span>
          <span className="text-xl md:text-2xl font-semibold text-black dark:text-white">
            Eid Mubarak
          </span>
          <span className="text-4xl md:text-4xl">🎊</span>
        </div>
      );
    }

    return '';
  }, [islamicData]);

  // Update document metadata dynamically
  useEffect(() => {
    document.title = 'Quran GPT - AI-Powered Islamic Knowledge Base';

    // Update or create meta tags
    const updateMetaTag = (attribute: string, value: string, content: string) => {
      const selector = attribute === 'name' ? `meta[${attribute}="${value}"]` : `meta[property="${value}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        if (attribute === 'name') {
          meta.setAttribute('name', value);
        } else {
          meta.setAttribute('property', value);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMetaTag('property', 'og:title', 'Quran GPT');
    updateMetaTag('property', 'og:type', 'website');
    updateMetaTag('property', 'og:url', 'https://quran-gpt.netlify.app/');
    updateMetaTag('property', 'og:image', 'https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png');
    updateMetaTag('property', 'og:site_name', 'Quran GPT - Get the Guidance from the Holy Quran');
    updateMetaTag('property', 'og:description', 'Quran GPT is an AI-powered Islamic knowledge base that provides answers to your questions based on the Holy Quran. It utilizes advanced language models to offer insightful and accurate responses, supported by relevant verses and interpretations from the Quran.');
    updateMetaTag('name', 'description', 'Quran GPT is an AI-powered Islamic knowledge base that provides answers to your questions based on the Holy Quran. Get insightful and accurate responses supported by relevant verses and interpretations from the Quran.');
    updateMetaTag('name', 'google-site-verification', 'NGBfty7J9MyQwQ5DT-wvArocgpJC72IXOrH4M1IIJAs');
    updateMetaTag('name', 'msvalidate.01', '5CC4429FDE08444C1CB98ECB946F1E2C');
    updateMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMetaTag('name', 'googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  }, []);

  return (
    <>
      {/* Microsoft Clarity */}
      <Script id="clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "mhnlj5neqn");
        `}
      </Script>

      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-NMNGXPDXNK"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-NMNGXPDXNK');
        `}
      </Script>

      {/* Audio functionality is now handled directly in ResponseSection component */}





      <div
        className={`min-h-screen bg-gray-50 dark:bg-gray-950 relative overflow-hidden transition-all duration-300 ${isModalOpen ? 'blur-sm pointer-events-none' : ''}`}
        style={{
          paddingLeft: isMobile ? '0px' : `${sidebarOffset}px`
        }}
      >

        {/* Vertical Action Bar - visible on desktop (both default page and when chat is active), hidden on mobile */}
        {!isMobile && (
          <div className="hidden sm:block">
            <VerticalActionBar />
          </div>
        )}

        {/* Minimal Header - Always visible on mobile, hidden on desktop when chat is active */}
        <MinimalHeader
          isVisible={isMobile}
          userQuestion={chatManager.submittedQuestion}
          textSize={textSize}
          onTextSizeChange={setTextSize}
          onShareContent={chatManager.showSummary && (chatManager.displayedContent || chatManager.summary) ? handleShareContent : undefined}
          shareUrl={shareUrl}
          isSharing={isSharing}
          showShareSuccess={showShareSuccess}
        />


        {/* Comprehensive Chat Section - Handles all states: hero, processing, and output */}
        {!showTimeDashboard && !activeComponent && (
          <ChatSection
            getGreetingMessage={getGreetingMessage}
            content={chatManager.content}
            setContent={chatManager.setContent}
            askQuran={handleAskQuran}
            resetForm={chatManager.resetForm}
            isProcessing={chatManager.isProcessing}
            error={chatManager.error}
            showSummary={chatManager.showSummary}
            selectedContentTypes={selectedContentTypes}
            onContentTypeChange={handleContentTypeChange}
            onStopOperation={handleStopOperation}
          />
        )}


        {/* Component Display - Show when activeComponent is set (for non-native components) */}
        {activeComponent && !showTimeDashboard && (
          <div className="relative z-10 mt-16 sm:mt-0 pb-8">
            {activeComponent === 'read-quran' && <ReadQuran key="read-quran" />}
            {activeComponent === 'mosque-finder' && <MosqueFinder key="mosque-finder" />}
            {activeComponent === 'zakat-calculator' && <ZakatCalculator key="zakat-calculator" />}
          </div>
        )}

        {/* Main Content or Native Components */}
        {showTimeDashboard ? (
          <div className="relative z-10 mt-16 sm:mt-0 pb-8">
            <TimeDashboard initialData={islamicData} />
          </div>
        ) : (
          <main className="relative z-10 pb-56 mt-16 sm:mt-0">


            <div className="w-full max-w-4xl mx-auto px-6 sm:px-0">









              {/* Floating Wavy Animation - Show when processing */}
              {chatManager.isProcessing && (
                <div className="flex items-center justify-center min-h-[400px] py-20">
                  <ProgressIndicator
                    currentStep={chatManager.currentStep}
                    selectedContentTypes={selectedContentTypes}
                    question={chatManager.submittedQuestion || chatManager.content}
                    textSize={textSize}
                  />
                </div>
              )}

              {/* Chat Output - Show when there's content to display */}
              {!chatManager.isProcessing && chatManager.showSummary && (
                <div className="relative">
                  {/* Mobile Action Bar - Inline Layout for Mobile, Vertical for Desktop */}
                  <div
                    className="fixed z-20 sm:flex sm:flex-col sm:items-center sm:space-y-3"
                    style={{
                      right: '16px', // Fixed position from right edge on all devices
                      top: `calc(50% - 30px)`, // Center position for mobile
                      bottom: 'auto'
                    }}
                  >
                    {/* Mobile: Vertical layout - Share button on top, text size toggle below */}
                    <div className="flex sm:hidden flex-col items-center space-y-3">
                      {/* Share Button - On Top */}
                      <button
                        onClick={() => {
                          // Track share button click in Google Analytics
                          if (typeof window !== 'undefined' && (window as any).gtag) {
                            (window as any).gtag('event', 'share_button_click', {
                              event_category: 'engagement',
                              event_label: 'share_button',
                              custom_parameter_1: chatManager.submittedQuestion ? chatManager.submittedQuestion.substring(0, 100) : 'unknown_question',
                              custom_parameter_2: 'mobile_vertical_action_bar'
                            });
                          }

                          // If we have a share URL, open modal directly
                          if (shareUrl) {
                            setShowShareModal(true);
                          } else {
                            // If no share URL, trigger the share creation first
                            setPendingShareModal(true);
                            handleShareContent();
                          }
                        }}
                        disabled={isSharing}
                        className={`p-2 rounded-lg transition-all duration-200 bg-green-50/90 dark:bg-green-900/30 backdrop-blur-sm border border-green-300/70 dark:border-green-600/70 hover:animate-none ${showShareSuccess
                          ? 'text-green-700 dark:text-green-300'
                          : isSharing
                            ? 'text-green-400 dark:text-green-600 cursor-not-allowed'
                            : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100/90 dark:hover:bg-green-800/40'
                          }`}
                        style={{ animation: 'bounce 4s infinite' }}
                        title={showShareSuccess ? "Share link copied!" : "Share this content"}
                      >
                        {isSharing ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                        )}
                      </button>

                      {/* Text Size Toggle - Below Share Button */}
                      <button
                        onClick={() => {
                          const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
                          const currentIndex = sizes.indexOf(textSize);
                          const nextIndex = (currentIndex + 1) % sizes.length;
                          setTextSize(sizes[nextIndex]);
                        }}
                        className="p-2 rounded-lg transition-all duration-200 bg-green-50/90 dark:bg-green-900/30 backdrop-blur-sm border border-green-300/70 dark:border-green-600/70 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100/90 dark:hover:bg-green-800/40"
                        title={`Text size: ${textSize} (click to change)`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </button>

                    </div>

                    {/* Desktop: Vertical layout (hidden on mobile) */}
                    <div
                      className="hidden sm:flex sm:flex-col sm:items-center sm:space-y-3"
                      style={{
                        position: 'fixed',
                        right: '16px',
                        top: 'calc(50% - 80px)', // Centered position for desktop
                        zIndex: 20
                      }}
                    >
                      {/* Share Button - On Top with Heartbeat Animation */}
                      <button
                        onClick={() => {
                          // Track share button click in Google Analytics
                          if (typeof window !== 'undefined' && (window as any).gtag) {
                            (window as any).gtag('event', 'share_button_click', {
                              event_category: 'engagement',
                              event_label: 'share_button',
                              custom_parameter_1: chatManager.submittedQuestion ? chatManager.submittedQuestion.substring(0, 100) : 'unknown_question',
                              custom_parameter_2: 'desktop_vertical_action_bar'
                            });
                          }

                          // If we have a share URL, open modal directly
                          if (shareUrl) {
                            setShowShareModal(true);
                          } else {
                            // If no share URL, trigger the share creation first
                            setPendingShareModal(true);
                            handleShareContent();
                          }
                        }}
                        disabled={isSharing}
                        className={`p-2 rounded-lg transition-all duration-200 bg-green-50/90 dark:bg-green-900/30 backdrop-blur-sm border border-green-300/70 dark:border-green-600/70 hover:animate-none ${showShareSuccess
                          ? 'text-green-700 dark:text-green-300'
                          : isSharing
                            ? 'text-green-400 dark:text-green-600 cursor-not-allowed'
                            : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100/90 dark:hover:bg-green-800/40'
                          }`}
                        style={{ animation: 'bounce 4s infinite' }}
                        title={showShareSuccess ? "Share link copied!" : "Share this content"}
                      >
                        {isSharing ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                        )}
                      </button>

                      {/* Text Size Toggle */}
                      <button
                        onClick={() => {
                          const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
                          const currentIndex = sizes.indexOf(textSize);
                          const nextIndex = (currentIndex + 1) % sizes.length;
                          setTextSize(sizes[nextIndex]);
                        }}
                        className="p-2 rounded-lg transition-all duration-200 bg-green-50/90 dark:bg-green-900/30 backdrop-blur-sm border border-green-300/70 dark:border-green-600/70 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-100/90 dark:hover:bg-green-800/40"
                        title={`Text size: ${textSize} (click to change)`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </button>

                    </div>
                  </div>

                  {/* Original Content Container - Width Unchanged */}
                  <div className="space-y-6 py-6">
                    {/* User Question Display */}
                    {chatManager.submittedQuestion && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="bg-transparent dark:bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mt-0.5">
                            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono uppercase tracking-wide mb-1">
                              Question
                            </div>
                            <div className={`text-gray-800 dark:text-gray-200 leading-relaxed ${textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'
                              }`}>
                              {chatManager.submittedQuestion}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* AI Response Content - Original Width */}
                    <div
                      className={`text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed transition-all duration-200 ${textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'
                        }`}
                      style={{
                        zIndex: 4,
                        position: 'relative',
                        pointerEvents: 'auto'
                      }}
                      dangerouslySetInnerHTML={{ __html: processContentLinks(chatManager.displayedContent || chatManager.summary) }}
                    />
                  </div>
                </div>
              )}






              {/* Sources Section - Always visible when there's content */}
              {chatManager.showSummary && !chatManager.isProcessing && chatManager.displayedContent && (
                <SourcesSection
                  content={chatManager.displayedContent}
                  textSize={textSize}
                />
              )}

              {/* Suggested Questions - Handled via content filtering in ResponseSection */}

            </div>
          </main>
        )}



        {/* PWA Install Prompt */}
        <InstallPrompt />

        {/* Service Worker Registration */}
        <ServiceWorkerRegistration />

        {/* Dynamic Theme Color */}
        <DynamicThemeColor />
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        title={chatManager.submittedQuestion?.length ? (chatManager.submittedQuestion.length > 50 ? chatManager.submittedQuestion.substring(0, 50) + '...' : chatManager.submittedQuestion) : 'QuranGPT Response'}
        question={chatManager.submittedQuestion || ''}
        isCreatingShare={isSharing}
      />

      {/* Event Details Modal - Outside of blurred container */}
      {isModalOpen && modalData.selectedDate && modalData.selectedEvents.length > 0 && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4" onClick={() => {
          const event = new CustomEvent('qgpt:modal-state', { detail: { isOpen: false, clearSelectedDate: true } });
          window.dispatchEvent(event);
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] sm:max-h-[75vh] overflow-hidden border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Gradient */}
            <div className="relative bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-mono tracking-wide text-white">
                    {modalData.selectedDate && new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
                      timeZone: 'UTC',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }).format(modalData.selectedDate.gDate)}
                  </h3>
                  <p className="text-emerald-100 text-sm mt-1 font-mono tracking-wide">Islamic Calendar Event</p>
                </div>
                <button
                  onClick={() => {
                    const event = new CustomEvent('qgpt:modal-state', { detail: { isOpen: false, clearSelectedDate: true } });
                    window.dispatchEvent(event);
                  }}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200 touch-manipulation"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[65vh] sm:max-h-[55vh]">
              {modalData.selectedEvents.length > 0 ? (
                <div className="space-y-6">
                  {modalData.selectedEvents.map((event, index) => (
                    <div key={index} className="relative">
                      {/* Event Type Badge */}
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide ${event.type === 'major'
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
                          : event.type === 'religious'
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                            : event.type === 'historical'
                              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                              : 'bg-gray-500 text-white shadow-lg shadow-gray-500/25'
                          }`}>
                          {event.type}
                        </span>
                      </div>

                      {/* Event Title */}
                      <h4 className="text-xl sm:text-2xl font-mono tracking-wide text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                        {event.name}
                      </h4>

                      {/* Description */}
                      <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base font-mono tracking-wide">
                          {event.description}
                        </p>
                      </div>

                      {/* Significance Card */}
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 sm:p-5 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <h5 className="text-sm font-mono tracking-wide font-semibold text-gray-900 dark:text-gray-100 mb-2">Significance</h5>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-mono tracking-wide">
                              {event.significance}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-mono tracking-wide font-semibold text-gray-900 dark:text-gray-100 mb-2">No Events</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono tracking-wide">No notable events found for this date.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Tafsir functionality is now handled in ResponseSection component */}
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}