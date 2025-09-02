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
  ThinkingProcess,
  ResponseSection,
  Footer,
  IslamicWidgets,
  SuggestedQuestions,
  MinimalHeader,
  TransparencySection,
  ThemeToggle
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
  const { askQuran } = useAIResponse();
  const { copyAIContentOnly, extractAIContentForTranslation, mergeTranslatedContent, translateAIContent } = useTranslationManager();
  
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
    
    try {
      await askQuran(
        chatManager.content,
        chatManager.setIsProcessing,
        chatManager.setSummary,
        chatManager.setShowSummary,
        chatManager.setError,
        chatManager.setDisplayedContent,
        chatManager.setCurrentLanguage,
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
                      // Audio is now handled in ResponseSection
                    );
                  }, 100);
                }} 
              />
            )}

            {/* Generation Animation - Shows between QuickQuestions and ChatSection on homepage */}
            {chatManager.isProcessing && !chatManager.isChatActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-4xl mx-auto px-4 sm:px-0 mb-8"
              >
                <div className="w-full">
                  <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4">
                    <div className="flex items-center justify-center space-x-4">
                      {/* Minimalist pulse ring */}
                      <motion.div
                        className="relative w-6 h-6 flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <motion.div
                          className="absolute inset-0 border border-gray-300 dark:border-gray-600 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.div
                          className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.6, 1, 0.6]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>
                      
                      {/* Elegant text with subtle animation */}
                      <motion.span
                        className="text-sm text-gray-700 dark:text-gray-300 font-medium tracking-wide"
                        animate={{
                          opacity: [0.8, 1, 0.8]
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        Generating response
                      </motion.span>
                      
                      {/* Minimalist progress wave */}
                      <motion.div
                        className="flex items-center space-x-0.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {[...Array(4)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-0.5 bg-gray-400 dark:bg-gray-500 rounded-full"
                            animate={{
                              height: ['4px', '12px', '4px'],
                              opacity: [0.4, 0.8, 0.4]
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </motion.div>
                      
                      {/* Subtle breathing dot */}
                      <motion.div
                        className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
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
                  // Language translation props
                  originalText={chatManager.summary}
                  onTranslationChange={handleTranslationChange}
                  isTranslating={chatManager.isTranslating}
                  translationProgress={chatManager.translationProgress}
                  currentLanguage={chatManager.currentLanguage}
                />
              </div>
            )}

            {/* Generation Animation - Shows as overlay in chat mode */}
            {chatManager.isProcessing && chatManager.isChatActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="fixed top-0 left-0 right-0 h-screen flex items-center justify-center z-50"
              >
                <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
                  <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-4">
                    <div className="flex items-center justify-center space-x-4">
                      {/* Minimalist pulse ring */}
                      <motion.div
                        className="relative w-6 h-6 flex items-center justify-center"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <motion.div
                          className="absolute inset-0 border border-gray-300 dark:border-gray-600 rounded-full"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.div
                          className="w-1.5 h-1.5 bg-gray-500 dark:bg-gray-400 rounded-full"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.6, 1, 0.6]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>
                      
                      {/* Elegant text with subtle animation */}
                      <motion.span
                        className="text-sm text-gray-700 dark:text-gray-300 font-medium tracking-wide"
                        animate={{
                          opacity: [0.8, 1, 0.8]
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        Generating response
                      </motion.span>
                      
                      {/* Minimalist progress wave */}
                      <motion.div
                        className="flex items-center space-x-0.5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {[...Array(4)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-0.5 bg-gray-400 dark:bg-gray-500 rounded-full"
                            animate={{
                              height: ['4px', '12px', '4px'],
                              opacity: [0.4, 0.8, 0.4]
                            }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: "easeInOut"
                            }}
                          />
                        ))}
                      </motion.div>
                      
                      {/* Subtle breathing dot */}
                      <motion.div
                        className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}



            {/* Thinking Process - Above ChatSection when processing */}
            {/* Removed - Now shows in ChatSection above Translate section */}

            {/* Response Section */}
            <ResponseSection 
              showSummary={chatManager.showSummary}
              summary={chatManager.summary}
              copied={chatManager.copied}
              displayedContent={chatManager.displayedContent}
              onCopyAIContent={handleCopyAIContent}
              userQuestion={chatManager.content}
              onQuestionEdit={handleSuggestedQuestionClick}
              isTextLarge={isTextLarge}
            />

            {/* Suggested Questions - Below Response */}
            {chatManager.showSummary && (
              <SuggestedQuestions
                userQuestion={chatManager.content}
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

      {/* Enhanced Tafsir Toggle Script with Event Delegation */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Set up event delegation for tafsir buttons
            function setupTafsirEventDelegation() {
              // Remove any existing listeners first
              if (window.tafsirClickHandler) {
                document.body.removeEventListener('click', window.tafsirClickHandler);
              }
              
              // Create the click handler
              window.tafsirClickHandler = function(event) {
                const target = event.target;
                
                // Check if clicked element or its parent is a tafsir button
                const tafsirBtn = target.closest('.tafsir-toggle-btn, .tafsir-close-btn');
                
                if (tafsirBtn) {
                  event.preventDefault();
                  event.stopPropagation();
                  
                  const tafsirId = tafsirBtn.getAttribute('data-tafsir-id');
                  
                  if (tafsirId) {
                    if (window.toggleTafsir) {
                      window.toggleTafsir(tafsirId);
                    } else {
                      // toggleTafsir function not found - silent fail for security
                    }
                  } else {
                    // No tafsir ID found on button - silent fail for security
                  }
                }
              };
              
              // Add event listener to document body
              document.body.addEventListener('click', window.tafsirClickHandler);
            }
            
            // Set up immediately or when DOM is ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', setupTafsirEventDelegation);
            } else {
              setupTafsirEventDelegation();
            }
            
            // Also set up when content is dynamically added
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                  // Check if new tafsir content was added
                  mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                      const tafsirButtons = node.querySelectorAll && node.querySelectorAll('.tafsir-toggle-btn');
                      if (tafsirButtons && tafsirButtons.length > 0) {
                        setupTafsirEventDelegation();
                      }
                    }
                  });
                }
              });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
            
            // Keep the toggle function but make it more robust
            window.toggleTafsir = function(tafsirId) {
              try {
                const content = document.getElementById(tafsirId);
                
                if (!content) {
                  // Try again after a short delay in case DOM is still loading
                  setTimeout(() => {
                    const retryContent = document.getElementById(tafsirId);
                    if (retryContent) {
                      window.toggleTafsir(tafsirId);
                    }
                  }, 100);
                  return;
                }
                
                // Close other open tafsirs in the same ayah
                try {
                  const ayahContainer = content.closest('.stylish-ayah-reference');
                  
                  if (ayahContainer) {
                    const otherTafsirs = ayahContainer.querySelectorAll('.tafsir-content:not(#' + tafsirId + ')');
                    
                    if (otherTafsirs && otherTafsirs.length > 0) {
                      otherTafsirs.forEach((other) => {
                        if (other && other.style) {
                          other.style.display = 'none';
                        }
                      });
                    }
                  }
                } catch (closeError) {
                  // Error closing other tafsirs - silent fail for security
                }
                
                // Toggle current tafsir
                if (content) {
                  const isHidden = content.style.display === 'none';
                  
                  if (isHidden) {
                    // Show tafsir content
                    content.style.display = 'block';
                    
                    // Add a subtle animation
                    content.style.opacity = '0';
                    content.style.transform = 'translateY(-10px)';
                    setTimeout(() => {
                      content.style.transition = 'all 0.3s ease-out';
                      content.style.opacity = '1';
                      content.style.transform = 'translateY(0)';
                    }, 10);
                    
                    // Smooth scroll to make sure content is visible
                    setTimeout(() => {
                      if (content && typeof content.scrollIntoView === 'function') {
                        content.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }, 100);
                  } else {
                    // Hide tafsir content
                    content.style.display = 'none';
                  }
                }
                
              } catch (error) {
                // Error in toggleTafsir - silent fail for security
              }
            };
          `
        }}
      />
    </>
  );
}