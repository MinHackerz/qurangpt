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
  TransparencySection
} from './components';

import AudioErrorBoundary from './components/AudioErrorBoundary';
import ThemeToggle from './components/ThemeToggle';
import { useAudioManager } from './hooks/useAudioManager';
import { useChatManager } from './hooks/useChatManager';
import { useAIResponse } from './hooks/useAIResponse';
import { useTranslationManager } from './hooks/useTranslationManager';
import { initializeAudioForProduction } from './utils/audioUtils';
import { getAudioUrl } from './utils/audioUrlHelper';


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
  
  // Production audio initialization
  useEffect(() => {
    // Initialize audio for production environment
    if (typeof window !== 'undefined') {
      // Create a test audio element to initialize production settings
      const testAudio = new Audio();
      initializeAudioForProduction(testAudio);
      testAudio.src = '';
      
      // Production-specific audio compatibility check
      if (process.env.NODE_ENV === 'production') {
        // Check if audio context is available
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioContext = new AudioContext();
            audioContext.close();
          }
        } catch (error) {
          // Silent fail in production
        }
        
        // Check if audio elements are supported
        try {
          const testAudio2 = new Audio();
          testAudio2.crossOrigin = 'anonymous';
        } catch (error) {
          // Silent fail in production
        }
        
        // Set production audio configuration
        if (window.AudioContext || (window as any).webkitAudioContext) {
          // Configure audio context for production
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContext.resume().then(() => {
            audioContext.close();
          }).catch((error: any) => {
            // Silent fail in production
          });
        }
      }
    }
  }, []);
  
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
  

  
  // Audio management
  const {
    currentAyahId,
    isPlaying,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    isAyahPlaying,
    isAyahActive,
    getAudioProgress,
    seekToTime,
    cleanup: cleanupAudio
  } = useAudioManager();

  // Handle asking Quran with the new hook
  const handleAskQuran = useCallback(async () => {
    console.log('handleAskQuran called with content:', chatManager.content);
    
    // Validate content before proceeding
    if (!chatManager.content || chatManager.content.trim().length === 0) {
      console.error('handleAskQuran: Content is empty or undefined');
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
        stopAudio
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
      console.log('Question processed successfully');
    } catch (error) {
      console.error('Error in handleAskQuran:', error);
      chatManager.setError('Failed to process question. Please try again.');
    }
  }, [askQuran, chatManager, stopAudio]);

  // Handle suggested question clicks
  const handleSuggestedQuestionClick = useCallback((question: string) => {
    console.log('Suggested question clicked:', question);
    
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
    
    // Clean up audio state
    stopAudio();
    
    // Set content and immediately process - use a more direct approach
    // Instead of relying on state updates, pass the question directly
    const processQuestionDirectly = async (questionText: string) => {
      console.log('Processing suggested question directly:', questionText);
      
      if (!questionText || questionText.trim().length === 0) {
        console.error('Question text is empty');
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
          stopAudio
        );
        chatManager.setIsChatActive(true);
        // Content state is already updated above, no need to update again
        console.log('Question processed successfully');
      } catch (error) {
        console.error('Error processing suggested question:', error);
        chatManager.setError('Failed to process question. Please try again.');
      }
    };
    
    // Process the question immediately without waiting for state updates
    processQuestionDirectly(question);
  }, [chatManager, stopAudio, askQuran]);
  
  // Handle when new AI questions are generated
  const handleQuestionsGenerated = useCallback((questions: string[]) => {
    console.log('handleQuestionsGenerated called with questions:', questions);
    setOriginalAIQuestions(questions);
    
    // Also store in chatManager for immediate access
    if (questions && questions.length > 0) {
      chatManager.setTranslatedQuestions(questions);
      console.log('Questions stored in chatManager:', questions.length);
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
            console.log(`Translating ${questionsToTranslate.length} questions to English`);
            const questionsToTranslateText = questionsToTranslate.join('\n\n');
            const translatedQuestionsText = await translateAIContent(questionsToTranslateText, 'en', detectedSourceLang);
            const translatedQuestionsArray = translatedQuestionsText.split('\n\n').filter(q => q.trim());
            
            console.log('Questions translation result (to English):', {
              original: questionsToTranslate.length,
              translated: translatedQuestionsArray.length,
              sample: translatedQuestionsArray[0]
            });
            
            chatManager.setTranslatedQuestions(translatedQuestionsArray);
          } else {
            // No questions to translate, clear translated questions
            chatManager.setTranslatedQuestions(undefined);
          }
        } catch (error) {
          console.error('Failed to translate suggested questions to English:', error);
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
        console.error('Translation to English error:', error);
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
      
      console.log('Translation Debug:', {
        targetLanguage: language,
        contentToExtract: contentToExtract.substring(0, 100) + '...',
        aiContentToTranslate: aiContentToTranslate.substring(0, 100) + '...',
        hasContent: !!aiContentToTranslate.trim()
      });
      
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
      
      console.log('Translation Result:', {
        originalLength: aiContentToTranslate.length,
        translatedLength: translation.length,
        translation: translation.substring(0, 100) + '...'
      });
      
            // Merge translated AI content with preserved API components
      const mergedContent = mergeTranslatedContent(contentToExtract, translation);
      
      console.log('Merged Content:', {
        originalLength: contentToExtract.length,
        mergedLength: mergedContent.length,
        merged: mergedContent.substring(0, 100) + '...'
      });
      
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
          console.log(`Translating ${questionsToTranslate.length} questions to ${language}`);
          const questionsToTranslateText = questionsToTranslate.join('\n\n');
          const translatedQuestionsText = await translateAIContent(questionsToTranslateText, language, 'en');
          const translatedQuestionsArray = translatedQuestionsText.split('\n\n').filter(q => q.trim());
          
          console.log('Questions translation result:', {
            original: questionsToTranslate.length,
            translated: translatedQuestionsArray.length,
            sample: translatedQuestionsArray[0]
          });
          
          chatManager.setTranslatedQuestions(translatedQuestionsArray);
        } else {
          // No questions to translate, clear translated questions
          chatManager.setTranslatedQuestions(undefined);
        }
      } catch (error) {
        console.error('Failed to translate suggested questions:', error);
        // Keep original questions if translation fails
        chatManager.setTranslatedQuestions(undefined);
      }
      
      // Hide progress after a short delay
      setTimeout(() => {
        chatManager.setIsTranslating(false);
        chatManager.setTranslationProgress(0);
      }, 800);
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to original content on error
      chatManager.setDisplayedContent(chatManager.summary);
      // Language will be set by askQuran based on detected language
      chatManager.setIsTranslating(false);
      chatManager.setTranslationProgress(0);
    }
  }, [chatManager, extractAIContentForTranslation, mergeTranslatedContent, translateAIContent, originalLanguageCache, detectLanguage, originalAIQuestions]);

  // Audio management functions
  const handleAudioPlay = useCallback(async (ayahId: string, globalAyahNumber: string) => {
    const audioUrl = getAudioUrl(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`);
    console.log('🎵 handleAudioPlay called:', { ayahId, globalAyahNumber, audioUrl });
    console.log('🎵 handleAudioPlay: audioUrl type:', typeof audioUrl);
    console.log('🎵 handleAudioPlay: audioUrl starts with /api:', audioUrl.startsWith('/api'));
    
    try {
      console.log('🎵 handleAudioPlay: Calling playAudio...');
      await playAudio(ayahId, audioUrl);
      console.log('🎵 handleAudioPlay: playAudio completed successfully');
    } catch (error) {
      console.error('🎵 handleAudioPlay: Error occurred:', error);
      // Silently handle audio errors
    }
  }, [playAudio]);

  const handleAudioPause = useCallback(() => {
    pauseAudio();
  }, [pauseAudio]);

  const handleAudioEnd = useCallback(() => {
    // Audio ended naturally, no action needed
  }, []);

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
      
      {/* Audio preloader for production */}
      <AudioErrorBoundary>
        <div style={{ display: 'none' }}>
          {/* Hidden audio preloader for production */}
        </div>
      </AudioErrorBoundary>
      

      

      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative overflow-hidden">

        
        {/* Theme Toggle Button - Hidden when chat is active */}
        {!chatManager.isChatActive && (
          <div className="fixed top-6 right-6 z-50">
            <ThemeToggle />
          </div>
        )}
        
        {/* Minimal Header - Only visible when chat is active */}
        <MinimalHeader isVisible={chatManager.isChatActive} />

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
                      stopAudio
                    );
                  }, 100);
                }} 
              />
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

            {/* Thinking Process - Above ChatSection when processing */}
            {/* Removed - Now shows in ChatSection above Translate section */}

            {/* Response Section */}
            <ResponseSection 
              showSummary={chatManager.showSummary}
              summary={chatManager.summary}
              copied={chatManager.copied}
              onAudioPlay={handleAudioPlay}
              onAudioPause={handleAudioPause}
              onAudioEnd={handleAudioEnd}
              isAudioPlaying={isAyahPlaying}
              isAudioActive={isAyahActive}
              getAudioProgress={getAudioProgress}
              seekToTime={seekToTime}
              displayedContent={chatManager.displayedContent}
              onCopyAIContent={handleCopyAIContent}
              userQuestion={chatManager.content}
              onQuestionEdit={handleSuggestedQuestionClick}
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