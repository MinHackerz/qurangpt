'use client';

import { useCallback, useState, useEffect, Suspense, useRef } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import { detectLanguage } from './utils/languageDetection';
import {
  HeroSection,
  QuickQuestions,
  ChatSection,
  ChatSectionOutput,
  ResponseSection,
  Footer,
  IslamicWidgets,
  SuggestedQuestions,
  MinimalHeader,
  ShareButton,
  TransparencySection,
  SourcesSection,
  ThemeToggle,
  WaveAnimationContainer
} from './components';
import InstallPrompt from './components/InstallPrompt';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import DynamicThemeColor from './components/DynamicThemeColor';


import { useChatManager } from './hooks/useChatManager';
import { useAIResponse } from './hooks/useAIResponse';
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
  const { copyAIContentOnly, extractAIContentForTranslation, extractAyahInfoForCopy, extractHadithInfoForCopy, mergeTranslatedContent, translateAIContent, translateHadithSummaries } = useTranslationManager();
  const searchParams = useSearchParams();
  const hasProcessedUrlQuestion = useRef(false);
  

  // Prevent scrolling during wave animation
  useEffect(() => {
    if (chatManager.isProcessing && chatManager.isChatActive) {
      // Prevent scrolling
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // Restore scrolling
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [chatManager.isProcessing, chatManager.isChatActive]);
  
  // Audio functionality is now handled directly in ResponseSection component
  
  // Cache for original language output to restore when switching back
  const [originalLanguageCache, setOriginalLanguageCache] = useState<{
    content: string;
    questions: string[];
    language: string;
  } | null>(null);
  
  // Store the original AI-generated questions for translation
  const [originalAIQuestions, setOriginalAIQuestions] = useState<string[]>([]);
  
  // Text size toggle state - using three-state system for consistency
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('medium');
  const isTextLarge = textSize === 'large';
  
  // Share functionality state
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  
  // Content type selection state
  const [selectedContentTypes, setSelectedContentTypes] = useState({
    tafsir: true,
    hadith: false,
    suggestedQuestions: false
  });
  
  // AI Response hook with text size state and content type selection
  const { askQuran } = useAIResponse(isTextLarge, selectedContentTypes);
  
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
      const suggestedQuestionsParam = searchParams.get('suggestedQuestions');
      
      // Create content types object from URL parameters
      const urlContentTypes = {
        tafsir: tafsirParam === 'true',
        hadith: hadithParam === 'true',
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
          chatManager.setCurrentLanguage,
          chatManager.setShowTranslateSection,
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
        chatManager.setIsTranslating(false);
        chatManager.setTranslationProgress(0);
        
        // Process the question directly
        askQuran(
          question,
          chatManager.setIsProcessing,
          chatManager.setSummary,
          chatManager.setShowSummary,
          chatManager.setError,
          chatManager.setDisplayedContent,
          chatManager.setCurrentLanguage,
          chatManager.setShowTranslateSection,
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

  // Handle asking Quran with the new hook
  const handleAskQuran = useCallback(async () => {
    // Handle ask Quran request
    
    // Validate content before proceeding
    if (!chatManager.content || chatManager.content.trim().length === 0) {
      // Content is empty
      chatManager.setError('Question content is missing. Please try again.');
      return;
    }
    
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
        chatManager.setCurrentLanguage,
        chatManager.setShowTranslateSection, // Pass the new setter function
        selectedContentTypes, // Pass content type selection
        // Audio is now handled in ResponseSection
      );
      
      // Cache the original output for future restoration
      const detectedLanguage = chatManager.currentLanguage;
      if (detectedLanguage && detectedLanguage !== 'en') {
        // Cache non-English output for restoration
        setOriginalLanguageCache({
          content: chatManager.summary,
          questions: chatManager.translatedQuestions || [],
          language: detectedLanguage
        });
      }
      
      chatManager.setIsChatActive(true);
      // Question processed successfully
    } catch (error) {
      // Error in handleAskQuran
      chatManager.setError('Failed to process question. Please try again.');
    }
  }, [askQuran, chatManager, selectedContentTypes]);

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
    chatManager.setIsTranslating(false);
    chatManager.setTranslationProgress(0);
    
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
      
      try {
        // Call askQuran directly with the question text
        await askQuran(
          questionText,
          chatManager.setIsProcessing,
          chatManager.setSummary,
          chatManager.setShowSummary,
          chatManager.setError,
          chatManager.setDisplayedContent,
          chatManager.setCurrentLanguage,
          chatManager.setShowTranslateSection,
          selectedContentTypes, // Pass content type selection
          // Audio is now handled in ResponseSection
        );
        chatManager.setIsChatActive(true);
        // Content state is already updated above, no need to update again
        // Question processed successfully
      } catch (error) {
        // Error processing suggested question
        chatManager.setError('Failed to process question. Please try again.');
      }
    };
    
    // Process the question immediately without waiting for state updates
    processQuestionDirectly(question);
  }, [chatManager, askQuran, selectedContentTypes]);
  
  // Handle when new AI questions are generated
  const handleQuestionsGenerated = useCallback((questions: string[]) => {
    // Handle questions generated
    setOriginalAIQuestions(questions);
    
    // Also store in chatManager for immediate access
    if (questions && questions.length > 0) {
      chatManager.setTranslatedQuestions(questions);
      // Questions stored in chatManager
    }
  }, [chatManager]);

  // Handle copying AI content (both question and response) with proper structure
  const handleCopyAIContent = useCallback(async () => {
    try {
      // Extract ayah and hadith info before processing
      const ayahInfo = extractAyahInfoForCopy(chatManager.displayedContent || chatManager.summary);
      const hadithInfo = extractHadithInfoForCopy(chatManager.displayedContent || chatManager.summary);
      
      
      // Create a structured copy that places ayah boxes directly above their AI explanations
      let structuredContent = `Question: ${chatManager.submittedQuestion}\n\nAnswer:\n\n`;
      
      try {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = chatManager.displayedContent || chatManager.summary;
        
        // Remove suggested questions section
        const suggestedQuestionsSection = tempDiv.querySelector('.suggested-questions-section, .related-questions-section');
        if (suggestedQuestionsSection) {
          suggestedQuestionsSection.remove();
        }
        
        // Remove hadith sections from the main content to avoid duplication
        const hadithSections = tempDiv.querySelectorAll('.stylish-hadith-reference, .related-hadiths-section');
        hadithSections.forEach(section => section.remove());
        
        // Use DOM parsing to extract ayah boxes and their corresponding AI explanations
        const ayahBoxes = tempDiv.querySelectorAll('.stylish-ayah-reference');
        let previousPosition = 0;
        
        // Process the content sequentially, extracting text between ayah boxes
        ayahBoxes.forEach((ayahBox, index) => {
          // Find the position of this ayah box in the original content
          const ayahBoxHTML = ayahBox.outerHTML;
          const currentPosition = tempDiv.innerHTML.indexOf(ayahBoxHTML, previousPosition);
          
          if (currentPosition > previousPosition) {
            // Extract the text content before this ayah box (AI explanation)
            const beforeAyahDiv = document.createElement('div');
            beforeAyahDiv.innerHTML = tempDiv.innerHTML.substring(previousPosition, currentPosition);
            
            const textContent = beforeAyahDiv.textContent?.trim() || '';
            if (textContent) {
              structuredContent += textContent.replace(/\s+/g, ' ').trim() + '\n\n';
            }
          }
          
          // Extract only the essential ayah information (no tafsirs, audio, etc.)
          const surahName = ayahBox.getAttribute('data-surah-name') || 'Unknown';
          const ayahNumber = ayahBox.getAttribute('data-ayah-number') || 'Unknown';
          const surahNumber = ayahBox.getAttribute('data-surah-number') || 'Unknown';
          
          // Extract only the pure ayah text from the blockquote
          const blockquote = ayahBox.querySelector('blockquote');
          let ayahText = '';
          if (blockquote) {
            // Get all text content from the blockquote, including nested elements
            ayahText = blockquote.textContent?.trim() || '';
            
            // Clean up any extra whitespace and normalize
            ayahText = ayahText.replace(/\s+/g, ' ').trim();
          }
          
          if (ayahText) {
            structuredContent += `"${ayahText}"\n\n---Surah ${surahNumber}: ${surahName}, Ayah ${ayahNumber}\n\n`;
          }
          
          // Update position for next iteration
          previousPosition = currentPosition + ayahBoxHTML.length;
        });
        
        // Add any remaining content after the last ayah box (excluding hadith sections)
        if (previousPosition < tempDiv.innerHTML.length) {
          const remainingDiv = document.createElement('div');
          remainingDiv.innerHTML = tempDiv.innerHTML.substring(previousPosition);
          
          // Remove any remaining hadith content from the remaining text
          const remainingHadithSections = remainingDiv.querySelectorAll('.stylish-hadith-reference, .related-hadiths-section');
          remainingHadithSections.forEach(section => section.remove());
          
          const remainingText = remainingDiv.textContent?.trim() || '';
          if (remainingText) {
            structuredContent += remainingText.replace(/\s+/g, ' ').trim() + '\n\n';
          }
        }
        
        // Add hadith references if available (with reduced spacing)
        if (hadithInfo.length > 0) {
          structuredContent += '---Related Hadiths\n\n';
          
          hadithInfo.forEach((hadith, index) => {
            if (hadith.text) {
              structuredContent += `"${hadith.text}"\n\n`;
            }
            
            if (hadith.aiSummary) {
              structuredContent += `${hadith.aiSummary}\n\n`;
            }
            
            structuredContent += `---${hadith.bookName}, Hadith #${hadith.hadithNumber}`;
            if (hadith.status && hadith.status !== 'Unknown') {
              structuredContent += ` (${hadith.status})`;
            }
            structuredContent += '\n\n';
          });
        }
        
      } catch (error) {
        // Fallback to simple text extraction
        const fallbackContent = (chatManager.displayedContent || chatManager.summary)
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up extra whitespace
          .replace(/^\s+|\s+$/gm, '') // Trim lines
          .trim();
        
        structuredContent += fallbackContent;
      }
      
      await navigator.clipboard.writeText(structuredContent);
      chatManager.setCopied(true);
      setTimeout(() => chatManager.setCopied(false), 2000);
    } catch (error) {
      // Fallback to copying just the AI content
      await copyAIContentOnly(
        chatManager.displayedContent,
        chatManager.summary,
        chatManager.setCopied
      );
    }
  }, [copyAIContentOnly, extractAyahInfoForCopy, extractHadithInfoForCopy, chatManager]);

  // Handle sharing AI content
  const handleShareContent = useCallback(async () => {
    if (!chatManager.submittedQuestion || (!chatManager.displayedContent && !chatManager.summary)) {
      return;
    }

    setIsSharing(true);
    setShowShareSuccess(false);

    try {
      // Prepare the content for sharing
      const responseContent = chatManager.displayedContent || chatManager.summary;
      const title = chatManager.submittedQuestion.length > 50 
        ? chatManager.submittedQuestion.substring(0, 50) + '...' 
        : chatManager.submittedQuestion;

      // Call the share API
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: chatManager.submittedQuestion,
          response: responseContent,
          title: title
        })
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
    suggestedQuestions: boolean;
  }) => {
    setSelectedContentTypes(contentTypes);
  }, []);

  // Update existing tafsir content when text size changes
  useEffect(() => {
    const updateExistingTafsirTextSize = () => {
      // Update tafsir content headers
      const tafsirHeaders = document.querySelectorAll('.tafsir-content h5');
      tafsirHeaders.forEach(header => {
        header.className = header.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        header.classList.add(textSize === 'large' ? 'text-base' : textSize === 'medium' ? 'text-sm' : 'text-xs');
      });

      // Update tafsir author names
      const tafsirAuthors = document.querySelectorAll('.tafsir-content h5 span');
      tafsirAuthors.forEach(author => {
        author.className = author.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        author.classList.add(textSize === 'large' ? 'text-sm' : textSize === 'medium' ? 'text-xs' : 'text-xs');
        author.classList.add('md:text-base', 'md:text-sm');
      });

      // Update tafsir content text
      const tafsirContentDivs = document.querySelectorAll('.tafsir-content .text-gray-700');
      tafsirContentDivs.forEach(contentDiv => {
        contentDiv.className = contentDiv.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        contentDiv.classList.add(textSize === 'large' ? 'text-sm' : textSize === 'medium' ? 'text-xs' : 'text-xs');
        contentDiv.classList.add('md:text-base', 'md:text-sm');
      });

      // Update AI Explanation sections
      const aiExplanationHeaders = document.querySelectorAll('.ai-explanation-section h4');
      aiExplanationHeaders.forEach(header => {
        header.className = header.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        header.classList.add(isTextLarge ? 'text-xl' : 'text-lg');
      });

      const aiExplanationContent = document.querySelectorAll('.ai-explanation-section .text-gray-700');
      aiExplanationContent.forEach(content => {
        content.className = content.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        content.classList.add(isTextLarge ? 'text-base' : 'text-sm');
      });

      // Update Authentic Tafsir sections
      const authenticTafsirHeaders = document.querySelectorAll('.authentic-tafsir-section h4');
      authenticTafsirHeaders.forEach(header => {
        header.className = header.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        header.classList.add(isTextLarge ? 'text-xl' : 'text-lg');
      });

      const authenticTafsirContent = document.querySelectorAll('.authentic-tafsir-section .text-gray-700');
      authenticTafsirContent.forEach(content => {
        content.className = content.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        content.classList.add(isTextLarge ? 'text-base' : 'text-sm');
      });

      // Update main Tafsir section headers
      const mainTafsirHeaders = document.querySelectorAll('.tafsir-section h3');
      mainTafsirHeaders.forEach(header => {
        header.className = header.className.replace(/text-(xs|sm|base|lg|xl|2xl|3xl)/g, '');
        header.classList.add(isTextLarge ? 'text-2xl' : 'text-xl');
        header.classList.add('md:text-3xl', 'md:text-2xl');
      });

      const mainTafsirDescriptions = document.querySelectorAll('.tafsir-section p');
      mainTafsirDescriptions.forEach(desc => {
        desc.className = desc.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        desc.classList.add(isTextLarge ? 'text-base' : 'text-sm');
      });

      // Update hadith text sizes
      const hadithBoxes = document.querySelectorAll('.stylish-hadith-reference');
      hadithBoxes.forEach(hadithBox => {
        // Update book name and hadith number - match ayah header sizing
        const bookName = hadithBox.querySelector('span.font-medium');
        if (bookName) {
          bookName.className = bookName.className.replace(/text-(xs|sm|base|lg|xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl)/g, '');
          if (isTextLarge) {
            bookName.classList.add('text-sm', 'md:text-base');
          } else {
            bookName.classList.add('text-xs', 'md:text-sm');
          }
        }

        // Update hadith number - match ayah header sizing
        const hadithNumber = hadithBox.querySelector('span.text-xs');
        if (hadithNumber) {
          hadithNumber.className = hadithNumber.className.replace(/text-(xs|sm|base|lg|xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl)/g, '');
          if (isTextLarge) {
            hadithNumber.classList.add('text-sm', 'md:text-base');
          } else {
            hadithNumber.classList.add('text-xs', 'md:text-sm');
          }
        }

        // Update status badge - use a more reliable selector
        const statusBadge = hadithBox.querySelector('span[class*="px-2"][class*="py-0"]');
        if (statusBadge) {
          statusBadge.className = statusBadge.className.replace(/text-(xs|sm|base|lg|xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl)/g, '');
          if (isTextLarge) {
            statusBadge.classList.add('text-sm', 'md:text-base');
          } else {
            statusBadge.classList.add('text-xs', 'md:text-sm');
          }
        }

        // Update hadith text - professional sizing
        const hadithText = hadithBox.querySelector('.hadith-text-english, .hadith-text-arabic');
        if (hadithText) {
          hadithText.className = hadithText.className.replace(/text-(xs|sm|base|lg|xl|2xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl|md:text-2xl)/g, '');
          if (isTextLarge) {
            hadithText.classList.add('text-base', 'md:text-lg');
          } else {
            hadithText.classList.add('text-sm', 'md:text-base');
          }
        }

        // Update narrator text - match ayah header sizing
        const narrator = hadithBox.querySelector('.hadith-narrator');
        if (narrator) {
          narrator.className = narrator.className.replace(/text-(xs|sm|base|lg|xl|md:text-xs|md:text-sm|md:text-base|md:text-lg|md:text-xl)/g, '');
          if (isTextLarge) {
            narrator.classList.add('text-sm', 'md:text-base');
          } else {
            narrator.classList.add('text-xs', 'md:text-sm');
          }
        }

        // Update AI summary - match AI content sizing exactly
        const aiSummary = hadithBox.querySelector('.hadith-ai-summary');
        if (aiSummary) {
          // Remove all text size classes more thoroughly
          aiSummary.className = aiSummary.className.replace(/\btext-(xs|sm|base|lg|xl|2xl)\b/g, '');
          aiSummary.className = aiSummary.className.replace(/\bmd:text-(xs|sm|base|lg|xl|2xl)\b/g, '');
          // Clean up extra spaces
          aiSummary.className = aiSummary.className.replace(/\s+/g, ' ').trim();
          // Add the new class
          aiSummary.classList.add(isTextLarge ? 'text-base' : 'text-sm');
        }
      });
    };

    // Run the update function immediately and with a delay to handle re-renders
    updateExistingTafsirTextSize();
    
    // Also run with delays to handle any async re-renders
    setTimeout(() => updateExistingTafsirTextSize(), 100);
    setTimeout(() => updateExistingTafsirTextSize(), 500);
    setTimeout(() => updateExistingTafsirTextSize(), 1000);
  }, [textSize, isTextLarge]);

  // Handle translation changes
  const handleTranslationChange = useCallback(async (translatedText: string, language: string) => {
    // Check if we're switching back to the original language (restore from cache)
    if (originalLanguageCache && language === originalLanguageCache.language) {
      // Restore original content and questions from cache (no API call needed)
      chatManager.setDisplayedContent(originalLanguageCache.content);
      chatManager.setCurrentLanguage(originalLanguageCache.language);
      chatManager.setTranslatedQuestions(originalLanguageCache.questions);
      chatManager.setIsTranslating(false);
      chatManager.setTranslationProgress(0);
      return;
    }

    if (language === 'en' || language === 'original') {
      // Only translate to English if current content is NOT already in English
      if (chatManager.currentLanguage === 'en') {
        // Content is already in English, no need to translate
        chatManager.setCurrentLanguage('en');
        chatManager.setIsTranslating(false);
        chatManager.setTranslationProgress(0);
        return;
      }
      
      // When English is selected, we need to translate the current content TO English
      // The current content might be in Hindi/Bengali/etc., so we need to translate it
      try {
        // Start translation progress animation
        chatManager.setIsTranslating(true);
        chatManager.setTranslationProgress(0);
        
        // Advanced progress simulation with realistic stages
        const progressStages = [
          { stage: 'Analyzing content', progress: 15 },
          { stage: 'Extracting AI text', progress: 35 },
          { stage: 'Translating to English', progress: 70 },
          { stage: 'Processing', progress: 85 },
          { stage: 'Finalizing', progress: 95 }
        ];
        
        let currentStage = 0;
        const progressInterval = setInterval(() => {
          if (currentStage < progressStages.length) {
            const { progress } = progressStages[currentStage];
            chatManager.setTranslationProgress(progress);
            currentStage++;
          } else {
            // Smooth progress to completion
            const currentProgress = chatManager.translationProgress;
            if (currentProgress < 95) {
              chatManager.setTranslationProgress(currentProgress + 0.5);
            }
          }
        }, 300);

        // Extract only AI-generated content for translation (much faster)
        // Use the current displayed content (which might be in Hindi/Bengali/etc.)
        const aiContentToTranslate = extractAIContentForTranslation(chatManager.displayedContent || chatManager.summary);
        
        if (!aiContentToTranslate.trim()) {
          // No AI content to translate, show original
          chatManager.setDisplayedContent(chatManager.summary);
          chatManager.setCurrentLanguage('en');
          chatManager.setIsTranslating(false);
          chatManager.setTranslationProgress(0);
          clearInterval(progressInterval);
          return;
        }

        // Use optimized translation for AI content only - translate TO English
        // Use the current language as source (since we know what language the content is currently in)
        const sourceLanguage = chatManager.currentLanguage || detectLanguage(aiContentToTranslate);
        
        // If source language is English, no need to translate
        if (sourceLanguage === 'en') {
          chatManager.setCurrentLanguage('en');
          chatManager.setIsTranslating(false);
          chatManager.setTranslationProgress(0);
          clearInterval(progressInterval);
          return;
        }
        
        const translation = await translateAIContent(aiContentToTranslate, 'en', sourceLanguage);
        
        // Complete progress with smooth animation
        chatManager.setTranslationProgress(100);
        
        // Merge translated AI content with preserved API components
        const mergedContent = await mergeTranslatedContent(chatManager.displayedContent || chatManager.summary, translation, 'en');
        
        // Also translate hadith summaries to English
        const contentWithTranslatedHadithSummaries = await translateHadithSummaries(mergedContent, 'en', sourceLanguage);
        
        chatManager.setDisplayedContent(contentWithTranslatedHadithSummaries);
        chatManager.setCurrentLanguage('en');
        
        // When going back to English, we need to restore the original English questions
        // If we have original AI questions, use them; otherwise clear translated questions
        if (originalAIQuestions && originalAIQuestions.length > 0) {
          // Restore original English questions
          chatManager.setTranslatedQuestions(originalAIQuestions);
        } else {
          // Clear translated questions to show original English questions
          chatManager.setTranslatedQuestions(undefined);
        }
        
        // Hide progress after a short delay
        setTimeout(() => {
          chatManager.setIsTranslating(false);
          chatManager.setTranslationProgress(0);
        }, 800);
        
        clearInterval(progressInterval);
        return;
      } catch (error) {
        // Translation to English error
        // Fallback to original content on error
        chatManager.setDisplayedContent(chatManager.summary);
        chatManager.setCurrentLanguage('en');
        chatManager.setIsTranslating(false);
        chatManager.setTranslationProgress(0);
        chatManager.setTranslatedQuestions(undefined);
        return;
      }
    }

    // For other languages (not English), translate to that language
    try {
      // Start translation progress
      chatManager.setIsTranslating(true);
      chatManager.setTranslationProgress(10); // Start at 10%
      
      // Extract only AI-generated content for translation (much faster)
      // Use current displayed content if available, otherwise fall back to summary
      const contentToExtract = chatManager.displayedContent || chatManager.summary;
      const aiContentToTranslate = extractAIContentForTranslation(contentToExtract);
      
      // Translation processing
      
      if (!aiContentToTranslate.trim()) {
        // No AI content to translate, show original
        chatManager.setDisplayedContent(chatManager.summary);
        chatManager.setCurrentLanguage(language);
        chatManager.setIsTranslating(false);
        chatManager.setTranslationProgress(0);
        return;
      }
      
      // Update progress to show we're starting translation
      chatManager.setTranslationProgress(30);
      
      // Use optimized translation for AI content only
      // Source language is English (original content)
      const translation = await translateAIContent(aiContentToTranslate, language, 'en');
      
      // Update progress to show translation is complete
      chatManager.setTranslationProgress(80);
      
      // Translation result
      
            // Merge translated AI content with preserved API components
      const mergedContent = await mergeTranslatedContent(contentToExtract, translation, language);
      
      // Also translate hadith summaries to target language
      const contentWithTranslatedHadithSummaries = await translateHadithSummaries(mergedContent, language, 'en');
      
      chatManager.setDisplayedContent(contentWithTranslatedHadithSummaries);
      chatManager.setCurrentLanguage(language);
      
      // Also translate suggested questions for the new language
      try {
        // First try to translate questions from the current displayed questions
        let questionsToTranslate: string[] = [];
        
        // Check if we have questions from the SuggestedQuestions API
        if (chatManager.translatedQuestions && chatManager.translatedQuestions.length > 0) {
          questionsToTranslate = chatManager.translatedQuestions;
        } else if (originalAIQuestions && originalAIQuestions.length > 0) {
          // Fallback to original AI questions if no API questions
          questionsToTranslate = originalAIQuestions;
        }
        
        if (questionsToTranslate.length > 0) {
          // Translating questions to target language
          const questionsToTranslateText = questionsToTranslate.join('\n\n');
          const translatedQuestionsText = await translateAIContent(questionsToTranslateText, language, 'en');
          const translatedQuestionsArray = translatedQuestionsText.split('\n\n').filter(q => q.trim());
          
          // Questions translation result
          
          chatManager.setTranslatedQuestions(translatedQuestionsArray);
        } else {
          // No questions to translate, clear translated questions
          chatManager.setTranslatedQuestions(undefined);
        }
      } catch (error) {
        // Failed to translate suggested questions
        // Keep original questions if translation fails
        chatManager.setTranslatedQuestions(undefined);
      }
      
      // Hide progress after a short delay
      setTimeout(() => {
        chatManager.setIsTranslating(false);
        chatManager.setTranslationProgress(0);
      }, 800);
    } catch (error) {
      // Translation error
      // Fallback to original content on error
      chatManager.setDisplayedContent(chatManager.summary);
      // Language will be set by askQuran based on detected language
      chatManager.setIsTranslating(false);
      chatManager.setTranslationProgress(0);
    }
  }, [chatManager, extractAIContentForTranslation, mergeTranslatedContent, translateAIContent, translateHadithSummaries, originalLanguageCache, originalAIQuestions]);

  // Audio management functions are now handled directly in ResponseSection component

  // Helper function to format time
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Get greeting message
  const getGreetingMessage = useCallback(() => {
    const today = new Date();
    const ramadanEnd = new Date(today.getFullYear(), 2, 31); // March 31st
    const eidDate = new Date(today.getFullYear(), 2, 31); // March 31st

    if (today <= ramadanEnd) {
      return (
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl md:text-5xl">🌙</span>
          <span className="text-xl md:text-2xl font-semibold text-black dark:text-white">
            Ramadan Mubarak
          </span>
          <span className="text-4xl md:text-5xl">⭐</span>
        </div>
      );
    } else if (today.toDateString() === eidDate.toDateString()) {
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
  }, []);

  return (
    <>
      <Head>
        <title>Quran GPT - AI-Powered Islamic Knowledge Base</title>
        <meta property="og:title" content="Quran GPT" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://quran-gpt.netlify.app/" />
        <meta property="og:image" content="https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png" />
        <meta property="og:site_name" content="Quran GPT - Get the Guidance from the Holy Quran" />
        <meta property="og:description" content="Quran GPT is an AI-powered Islamic knowledge base that provides answers to your questions based on the Holy Quran. It utilizes advanced language models to offer insightful and accurate responses, supported by relevant verses and interpretations from the Quran." />
        <meta name="description" content="Quran GPT is an AI-powered Islamic knowledge base that provides answers to your questions based on the Holy Quran. Get insightful and accurate responses supported by relevant verses and interpretations from the Quran." />
        <meta name="google-site-verification" content="NGBfty7J9MyQwQ5DT-wvArocgpJC72IXOrH4M1IIJAs" />
        <meta name="msvalidate.01" content="5CC4429FDE08444C1CB98ECB946F1E2C" />

        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
          integrity="sha512-iBBXm8fW90+nuLcSKlbmrPcLa0OT92xO1BIsZ+ywDWZCvqsWgccV3gFoRBv0z+8dLJgyAHIhR35VZc2oM/gI1w=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />

        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "mhnlj5neqn");
            `
          }}
        />
      </Head>

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
      

      

      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative overflow-hidden">

        {/* Theme Toggle Button - Only visible when not in chat mode */}
        {!chatManager.isChatActive && (
          <div className="fixed top-0 right-0 z-50 p-4">
            <ThemeToggle />
          </div>
        )}
        
        {/* Minimal Header - Only visible when chat is active */}
        <MinimalHeader 
          isVisible={chatManager.isChatActive}
          userQuestion={chatManager.submittedQuestion}
          textSize={textSize}
          onTextSizeChange={setTextSize}
          onShareContent={handleShareContent}
          shareUrl={shareUrl}
          isSharing={isSharing}
          showShareSuccess={showShareSuccess}
          onCopyContent={handleCopyAIContent}
          copied={chatManager.copied}
          content={chatManager.displayedContent || chatManager.summary}
        />


        {/* Hero Section - Hidden when chat is active */}
        {!chatManager.isChatActive && (
          <HeroSection getGreetingMessage={getGreetingMessage} />
        )}

        {/* Main Content */}
        <main className={`relative z-10 ${chatManager.isChatActive ? 'pt-20 pb-60 sm:pb-64 chat-active-content-spacing' : 'pb-8'}`}>

          
          <div className="container max-w-7xl mx-auto px-6">
            
            {/* Quick Questions Section - Hidden when chat is active */}
            {!chatManager.isChatActive && (
              <QuickQuestions 
                insertQuestion={(question) => {
                  // Set the question content first
                  chatManager.setContent(question);
                  // Set the submitted question for SuggestedQuestions generation
                  chatManager.setSubmittedQuestion(question);
                  // Activate chat mode
                  chatManager.setIsChatActive(true);
                  // Clear any previous errors
                  chatManager.setError('');
                  // Process the question directly with the question text
                  setTimeout(() => {
                    // Use the question parameter directly instead of relying on state
                    askQuran(
                      question, // Pass the question directly
                      chatManager.setIsProcessing,
                      chatManager.setSummary,
                      chatManager.setShowSummary,
                      chatManager.setError,
                      chatManager.setDisplayedContent,
                      chatManager.setCurrentLanguage,
                      chatManager.setShowTranslateSection, // Add the missing setShowTranslateSection parameter
                      // Audio is now handled in ResponseSection
                    );
                  }, 100);
                }} 
              />
            )}

            {/* Wave Animation Container - Only takes space when animation is active */}
            {chatManager.isProcessing && !chatManager.isChatActive && (
              <div className="max-w-4xl mx-auto px-0 -mx-1 mb-4">
                <div className="h-24 flex items-center justify-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="flex items-center justify-center space-x-2 w-full"
                  >
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-gray-400 dark:bg-gray-600"
                        animate={{
                          height: ['20px', '60px', '20px'],
                          opacity: [0.4, 0.8, 0.4]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </motion.div>
                </div>
              </div>
            )}

            {/* Chat Section - Positioned above IslamicWidgets when not in chat mode */}
            {!chatManager.isChatActive && (
              <div className="mb-8 -mx-6 sm:mx-0">
                <ChatSection 
                  content={chatManager.content}
                  setContent={chatManager.setContent}
                  askQuran={handleAskQuran}
                  resetForm={chatManager.resetForm}
                  isProcessing={chatManager.isProcessing}
                  error={chatManager.error}
                  showSummary={chatManager.showSummary}
                  // Language translation props
                  originalText={chatManager.summary}
                  onTranslationChange={handleTranslationChange}
                  isTranslating={chatManager.isTranslating}
                  translationProgress={chatManager.translationProgress}
                  currentLanguage={chatManager.currentLanguage}
                  // Content type selection props
                  selectedContentTypes={selectedContentTypes}
                  onContentTypeChange={handleContentTypeChange}
                />
              </div>
            )}

            {/* Islamic Widgets - Hidden when chat is active */}
            {!chatManager.isChatActive && (
              <div className="mb-12">
                <IslamicWidgets showWidgets={true} />
              </div>
            )}

            {/* Transparency Section - How It Works - Hidden when chat is active */}
            {!chatManager.isChatActive && <TransparencySection />}

            {/* Chat Section - Fixed at bottom when chat is active */}
            {chatManager.isChatActive && (
              <div className="fixed left-0 right-0 z-30 w-full" style={{ bottom: '0px' }}>
                <ChatSectionOutput 
                  content={chatManager.content}
                  setContent={chatManager.setContent}
                  askQuran={handleAskQuran}
                  resetForm={chatManager.resetForm}
                  isProcessing={chatManager.isProcessing}
                  error={chatManager.error}
                  showSummary={chatManager.showSummary}
                  showTranslateSection={chatManager.showTranslateSection}
                  // Language translation props
                  originalText={chatManager.summary}
                  onTranslationChange={handleTranslationChange}
                  isTranslating={chatManager.isTranslating}
                  translationProgress={chatManager.translationProgress}
                  currentLanguage={chatManager.currentLanguage}
                  // Content type selection props
                  selectedContentTypes={selectedContentTypes}
                  onContentTypeChange={handleContentTypeChange}
                />
              </div>
            )}





            {/* Thinking Process - Above ChatSection when processing */}
            {/* Removed - Now shows in ChatSection above Translate section */}

            {/* Response Section */}
            <div className="relative">
              {/* Wave Animation Container - Shows in center when processing */}
              {chatManager.isProcessing && chatManager.isChatActive && (
                <div className="flex items-center justify-center min-h-[400px] py-20">
                  <WaveAnimationContainer 
                    isVisible={true} 
                    className="bg-transparent"
                  />
                </div>
              )}
              
              {/* Response Content - Hidden during processing to show animation */}
              {!chatManager.isProcessing && (
                <ResponseSection
                  showSummary={chatManager.showSummary}
                  summary={chatManager.summary}
                  copied={chatManager.copied}
                  displayedContent={chatManager.displayedContent}
                  onCopyAIContent={handleCopyAIContent}
                  userQuestion={chatManager.submittedQuestion}
                  onQuestionEdit={handleSuggestedQuestionClick}
                  isTextLarge={isTextLarge}
                  shareUrl={shareUrl}
                  onShare={handleShareContent}
                  selectedContentTypes={selectedContentTypes}
                />
              )}
            </div>

            {/* Sources Section - Always visible when there's content */}
            {chatManager.showSummary && !chatManager.isProcessing && chatManager.displayedContent && (
              <SourcesSection 
                content={chatManager.displayedContent} 
                isTextLarge={isTextLarge}
              />
            )}

            {/* Suggested Questions - Handled via content filtering in ResponseSection */}
            
          </div>
        </main>

        {/* Footer - Hidden when chat is active */}
        {!chatManager.isChatActive && <Footer />}
        
        {/* PWA Install Prompt */}
        <InstallPrompt />
        
        {/* Service Worker Registration */}
        <ServiceWorkerRegistration />
        
        {/* Dynamic Theme Color */}
        <DynamicThemeColor />
      </div>

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