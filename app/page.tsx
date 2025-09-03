'use client';

import { useCallback, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Script from 'next/script';
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
  TransparencySection,
  ThemeToggle,
  WaveAnimationContainer
} from './components';


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

export default function Home() {
  // Use custom hooks for better organization
  const chatManager = useChatManager();
  const { copyAIContentOnly, extractAIContentForTranslation, mergeTranslatedContent, translateAIContent } = useTranslationManager();
  
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
  
  // Simple language detection function
  const detectLanguage = useCallback((text: string): string => {
    // Unicode script-based detection for major languages
    const patterns = {
      ar: /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/,
      hi: /[\u0900-\u097F]/,
      bn: /[\u0980-\u09FF]/,
      ur: /[\u0600-\u06FF]/,
      fa: /[\u0600-\u06FF]/,
      tr: /[\u00C7\u00E7\u011E\u011F\u0130\u0131\u015E\u015F]/,
      es: /[áéíóúñü]/,
      fr: /[àâäéèêëïîôöùûüÿç]/,
      de: /[äöüß]/,
      ru: /[\u0400-\u04FF]/,
      zh: /[\u4e00-\u9fff]/,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/,
      ko: /[\uac00-\ud7af]/,
      th: /[\u0E00-\u0E7F]/
    };
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) {
        return lang;
      }
    }
    
    // Default to English
    return 'en';
  }, []);
  
  // Cache for original language output to restore when switching back
  const [originalLanguageCache, setOriginalLanguageCache] = useState<{
    content: string;
    questions: string[];
    language: string;
  } | null>(null);
  
  // Store the original AI-generated questions for translation
  const [originalAIQuestions, setOriginalAIQuestions] = useState<string[]>([]);
  
  // Text size toggle state
  const [isTextLarge, setIsTextLarge] = useState(false);
  
  // AI Response hook with text size state
  const { askQuran } = useAIResponse(isTextLarge);
  

  
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
  }, [askQuran, chatManager]);

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
  }, [chatManager, askQuran]);
  
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

  // Handle copying AI content
  const handleCopyAIContent = useCallback(async () => {
    await copyAIContentOnly(
      chatManager.displayedContent,
      chatManager.summary,
      chatManager.setCopied
    );
  }, [copyAIContentOnly, chatManager.displayedContent, chatManager.summary, chatManager.setCopied]);

  // Handle text size toggle
  const handleTextSizeToggle = useCallback(() => {
    setIsTextLarge(!isTextLarge);
  }, [isTextLarge]);

  // Update existing tafsir content when text size changes
  useEffect(() => {
    const updateExistingTafsirTextSize = () => {
      // Update tafsir content headers
      const tafsirHeaders = document.querySelectorAll('.tafsir-content h5');
      tafsirHeaders.forEach(header => {
        header.className = header.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        header.classList.add(isTextLarge ? 'text-base' : 'text-sm');
      });

      // Update tafsir author names
      const tafsirAuthors = document.querySelectorAll('.tafsir-content h5 span');
      tafsirAuthors.forEach(author => {
        author.className = author.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        author.classList.add(isTextLarge ? 'text-sm' : 'text-xs');
        author.classList.add('md:text-base', 'md:text-sm');
      });

      // Update tafsir content text
      const tafsirContentDivs = document.querySelectorAll('.tafsir-content .text-gray-700');
      tafsirContentDivs.forEach(contentDiv => {
        contentDiv.className = contentDiv.className.replace(/text-(xs|sm|base|lg|xl)/g, '');
        contentDiv.classList.add(isTextLarge ? 'text-sm' : 'text-xs');
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
    };

    // Run the update function
    updateExistingTafsirTextSize();
  }, [isTextLarge]);

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
        // Detect source language from current content to translate back to English
        const detectedSourceLang = detectLanguage(aiContentToTranslate);
        const translation = await translateAIContent(aiContentToTranslate, 'en', detectedSourceLang);
        
        // Complete progress with smooth animation
        chatManager.setTranslationProgress(100);
        
        // Merge translated AI content with preserved API components
        const mergedContent = mergeTranslatedContent(chatManager.displayedContent || chatManager.summary, translation);
        
        chatManager.setDisplayedContent(mergedContent);
        chatManager.setCurrentLanguage('en');
        
        // Also translate suggested questions to English
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
            // Translating questions to English
            const questionsToTranslateText = questionsToTranslate.join('\n\n');
            const translatedQuestionsText = await translateAIContent(questionsToTranslateText, 'en', detectedSourceLang);
            const translatedQuestionsArray = translatedQuestionsText.split('\n\n').filter(q => q.trim());
            
            // Questions translation completed
            
            chatManager.setTranslatedQuestions(translatedQuestionsArray);
          } else {
            // No questions to translate, clear translated questions
            chatManager.setTranslatedQuestions(undefined);
          }
        } catch (error) {
          // Failed to translate suggested questions to English
          // Keep original questions if translation fails
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
      const mergedContent = mergeTranslatedContent(contentToExtract, translation);
      
      // Merged content
      
      chatManager.setDisplayedContent(mergedContent);
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
  }, [chatManager, extractAIContentForTranslation, mergeTranslatedContent, translateAIContent, originalLanguageCache, detectLanguage, originalAIQuestions]);

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
          onCopyAIContent={handleCopyAIContent}
          copied={chatManager.copied}
          userQuestion={chatManager.content}
          isTextLarge={isTextLarge}
          onTextSizeToggle={handleTextSizeToggle}
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
              <div className="mb-8">
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

            {/* Chat Section - Fixed at bottom center when chat is active */}
            {chatManager.isChatActive && (
              <div className="fixed left-1/2 transform -translate-x-1/2 z-30 w-full max-w-6xl px-4 pb-4" style={{ bottom: '80px' }}>
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
                />
              )}
            </div>

            {/* Suggested Questions - Below Response */}
            {chatManager.showSummary && !chatManager.isProcessing && (
              <SuggestedQuestions
                userQuestion={chatManager.submittedQuestion}
                onQuestionClick={handleSuggestedQuestionClick}
                isVisible={true}
                currentLanguage={chatManager.currentLanguage}
                translatedQuestions={chatManager.translatedQuestions}
                onQuestionsGenerated={handleQuestionsGenerated}
                isTextLarge={isTextLarge}
              />
            )}
            
          </div>
        </main>

        {/* Footer - Hidden when chat is active */}
        {!chatManager.isChatActive && <Footer />}
      </div>

      {/* Tafsir functionality is now handled in ResponseSection component */}
    </>
  );
}