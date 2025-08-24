'use client';

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import {
  HeroSection,
  QuickQuestions,
  ChatSection,
  ThinkingProcess,
  ResponseSection,
  Footer,
  IslamicWidgets,
  LanguageTabs
} from './components';
import { useAudioManager } from './hooks/useAudioManager';
import { getSurahNumber, surahAyahCounts, calculateGlobalAyahNumber, fetchTafsir } from './utils/tafsirUtils';
import { useTranslation } from './hooks/useTranslation';

// Extend Window interface for tafsir functionality
declare global {
  interface Window {
    setupTafsirEventDelegation?: () => void;
    toggleTafsir?: (tafsirId: string) => void;
  }
}

export default function Home() {
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  
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

  const insertQuestion = (question: string) => {
    setContent(question);
    setError('');
  };

  const resetForm = () => {
    setContent('');
    setSummary('');
    setShowSummary(false);
    setIsProcessing(false);
    setError('');
    
    // Clean up audio state
    stopAudio();
  };

  const copyToClipboard = async () => {
    try {
      const cleanContent = summary
        // Remove ALL Tafsir-related content from TafsirDropdown component
        .replace(/Show Tafsir[\s\S]*?Hide Tafsir/g, '')
        .replace(/Tafsir Dropdown[\s\S]*?Select Tafsir Source/g, '')
        .replace(/Authentic Tafsir[\s\S]*?AI Explanation/g, '')
        .replace(/Read Tafsir[\s\S]*?Ibn Kathir/g, '')
        .replace(/Read Tafsir[\s\S]*?Maarif Ul Quran/g, '')
        .replace(/Read Tafsir[\s\S]*?Tazkirul Quran/g, '')
        .replace(/Loading tafsir[\s\S]*?\.\.\./g, '')
        .replace(/Tafsir not available[\s\S]*?Unable to load tafsir/g, '')
        .replace(/Tafsir by[\s\S]*?groupVerse/g, '')
        .replace(/prose prose-sm[\s\S]*?prose-emerald/g, '')
        .replace(/text-gray-700[\s\S]*?leading-relaxed/g, '')
        .replace(/Ibn Kathir[\s\S]*?Maarif Ul Quran[\s\S]*?Tazkirul Quran/g, '')
        .replace(/Tafsir by Ibn Kathir[\s\S]*?Tafsir by Maarif Ul Quran[\s\S]*?Tafsir by Tazkirul Quran/g, '')
        .replace(/Tazkirul Quran[\s\S]*?Tafsir by Tazkirul Quran[\s\S]*?groupVerse[\s\S]*?prose prose-sm[\s\S]*?prose-emerald[\s\S]*?text-gray-700[\s\S]*?leading-relaxed/g, '')
        .replace(/Maarif Ul Quran[\s\S]*?Tafsir by Maarif Ul Quran[\s\S]*?groupVerse[\s\S]*?prose prose-sm[\s\S]*?prose-emerald[\s\S]*?text-gray-700[\s\S]*?leading-relaxed/g, '')
        .replace(/Ibn Kathir[\s\S]*?Tafsir by Ibn Kathir[\s\S]*?groupVerse[\s\S]*?prose prose-sm[\s\S]*?prose-emerald[\s\S]*?text-gray-700[\s\S]*?leading-relaxed/g, '')
        .replace(/Read Tafsir[\s\S]*?Tafsir by[\s\S]*?groupVerse[\s\S]*?prose prose-sm[\s\S]*?prose-emerald[\s\S]*?text-gray-700[\s\S]*?leading-relaxed/g, '')
        // Remove other UI elements
        .replace(/Copy[\s\S]*?Copied!/g, '')
        .replace(/Language[\s\S]*?Translation/g, '')
        // Remove any remaining component-specific content
        .replace(/Surah \d+/g, '')
        .replace(/Ayah \d+/g, '')
        .replace(/Global Ayah #\d+/g, '')
        .replace(/128kbps MP3/g, '')
        .replace(/ar\.alafasy/g, '')
        .replace(/Mishary Rashid Alafasy/g, '')
        .replace(/Loading\.\.\./g, '')
        .replace(/Playing/g, '')
        .replace(/Paused/g, '')
        .replace(/Click to play/g, '')
        .replace(/Skip backward 10s/g, '')
        .replace(/Skip forward 10s/g, '')
        .replace(/Unmute/g, '')
        .replace(/Mute/g, '')
        .replace(/Volume/g, '')
        .replace(/Progress/g, '')
        .replace(/Seek/g, '')
        .replace(/Forward/g, '')
        .replace(/Backward/g, '')
        .replace(/SpeakerWaveIcon/g, '')
        .replace(/SpeakerXMarkIcon/g, '')
        .replace(/PlayIcon/g, '')
        .replace(/PauseIcon/g, '')
        .replace(/ForwardIcon/g, '')
        .replace(/BackwardIcon/g, '')
        // Clean up extra whitespace
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/^\s+|\s+$/gm, '')
        // Keep only the essential content: ayahs, explanations, and references
        .replace(/"([^"]+)"\s*\[(.*?)\:\s*(\d+)\]\(([^)]+)\)/g, (match: string, verseText: string, surahName: string, ayahNumber: string, url: string) => {
          return `"${verseText}"\nReference: ${surahName}, Verse ${ayahNumber} - ${url}`;
        })
        .trim();

      await navigator.clipboard.writeText(cleanContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to copy summary:', error.message);
      }
    }
  };

  // Function to extract AI-generated content for translation
  const extractAIContentForTranslation = (formattedResponse: string) => {
    // Create a temporary DOM element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedResponse;
    
    // Extract only the AI-generated text content, excluding API-fetched components
    const aiContent: string[] = [];
    
    // Walk through all text nodes and extract content
    const walkTextNodes = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          // Check if this text is not part of API-fetched components
          const parent = node.parentElement;
          if (parent && !parent.closest('.stylish-ayah-reference, .tafsir-content, .enhanced-audio-player')) {
            aiContent.push(text);
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        // Skip API-fetched components
        if (!element.classList.contains('stylish-ayah-reference') && 
            !element.classList.contains('tafsir-content') && 
            !element.classList.contains('enhanced-audio-player') &&
            !element.closest('.stylish-ayah-reference, .tafsir-content, .enhanced-audio-player')) {
          // Extract text from elements that are not API-fetched
          for (const child of Array.from(element.childNodes)) {
            walkTextNodes(child);
          }
        }
      }
    };
    
    walkTextNodes(tempDiv);
    
    return aiContent.join('\n\n');
  };

  // Function to merge translated AI content with preserved API content
  const mergeTranslatedContent = (originalFormattedResponse: string, translatedAIContent: string) => {
    // Create a temporary DOM element to parse the original HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalFormattedResponse;
    
    // Split the translated AI content into paragraphs
    const translatedParagraphs = translatedAIContent.split('\n\n').filter(p => p.trim().length > 0);
    let paragraphIndex = 0;
    
    // Function to replace AI-generated text while preserving API components
    const replaceAIText = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && text.length > 0) {
          const parent = node.parentElement;
          if (parent && !parent.closest('.stylish-ayah-reference, .tafsir-content, .enhanced-audio-player')) {
            // This is AI-generated text that should be replaced
            if (paragraphIndex < translatedParagraphs.length) {
              node.textContent = translatedParagraphs[paragraphIndex];
              paragraphIndex++;
            }
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        // Skip API-fetched components
        if (!element.classList.contains('stylish-ayah-reference') && 
            !element.classList.contains('tafsir-content') && 
            !element.classList.contains('enhanced-audio-player') &&
            !element.closest('.stylish-ayah-reference, .tafsir-content, .enhanced-audio-player')) {
          // Process child nodes for AI-generated content
          for (const child of Array.from(element.childNodes)) {
            replaceAIText(child);
          }
        }
      }
    };
    
    replaceAIText(tempDiv);
    
    return tempDiv.innerHTML;
  };

  // Function to reinitialize audio functionality after translation
  const reinitializeAudioAfterTranslation = useCallback(() => {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      // Re-attach audio event listeners to preserve functionality
      const audioButtons = document.querySelectorAll('.play-pause-btn');
      audioButtons.forEach(button => {
        const ayahId = button.getAttribute('data-ayah-id');
        if (ayahId) {
          // Remove existing listeners and reattach
          const newButton = button.cloneNode(true) as HTMLButtonElement;
          newButton.className = button.className;
          newButton.setAttribute('data-ayah-id', ayahId);
          button.parentNode?.replaceChild(newButton, button);
        }
      });
      
      // Re-initialize tafsir functionality
      if (window.setupTafsirEventDelegation) {
        window.setupTafsirEventDelegation();
      }

      // Force a re-render of audio players by triggering a content update
      setDisplayedContent(prev => {
        // This will trigger the useEffect in ResponseSection that sets up audio
        return prev;
      });
    }, 200); // Increased delay to ensure DOM is fully updated
  }, []);

  // Enhanced translation handler with selective translation and audio preservation
  const handleTranslationChange = useCallback(async (translatedText: string, language: string) => {
    if (language === 'en' || language === 'original') {
      // Show original content
      setDisplayedContent(summary);
      setCurrentLanguage('en');
      setIsTranslating(false);
      setTranslationProgress(0);
      return;
    }

    try {
      // Start translation progress animation
      setIsTranslating(true);
      setTranslationProgress(0);
      
      // Advanced progress simulation with realistic stages
      const progressStages = [
        { stage: 'Analyzing content', progress: 15 },
        { stage: 'Extracting AI text', progress: 35 },
        { stage: 'Translating', progress: 70 },
        { stage: 'Processing', progress: 85 },
        { stage: 'Finalizing', progress: 95 }
      ];
      
      let currentStage = 0;
      const progressInterval = setInterval(() => {
        if (currentStage < progressStages.length) {
          const { progress } = progressStages[currentStage];
          setTranslationProgress(progress);
          currentStage++;
        } else {
          // Smooth progress to completion
          setTranslationProgress(prev => {
            if (prev >= 95) return prev;
            return prev + 0.5;
          });
        }
      }, 300);

      // Extract only AI-generated content for translation (much faster)
      const aiContentToTranslate = extractAIContentForTranslation(summary);
      
      if (!aiContentToTranslate.trim()) {
        // No AI content to translate, show original
        setDisplayedContent(summary);
        setCurrentLanguage(language);
        setIsTranslating(false);
        setTranslationProgress(0);
        clearInterval(progressInterval);
        return;
      }

      // Use optimized translation for AI content only
      const translation = await translateAIContent(aiContentToTranslate, language);
      
      // Complete progress with smooth animation
      setTranslationProgress(100);
      
      // Merge translated AI content with preserved API components
      const mergedContent = mergeTranslatedContent(summary, translation);
      
      setDisplayedContent(mergedContent);
      setCurrentLanguage(language);
      
      // Reinitialize audio functionality to ensure it works after translation
      reinitializeAudioAfterTranslation();
      
      // Hide progress after a short delay
      setTimeout(() => {
        setIsTranslating(false);
        setTranslationProgress(0);
      }, 800);
      
      clearInterval(progressInterval);
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback to original content on error
      setDisplayedContent(summary);
      setCurrentLanguage('en');
      setIsTranslating(false);
      setTranslationProgress(0);
    }
  }, [summary, reinitializeAudioAfterTranslation]);

  // Optimized translation function for AI content only
  const translateAIContent = async (aiContent: string, targetLanguage: string): Promise<string> => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: aiContent,
          targetLanguage,
          sourceLanguage: 'en',
          context: 'islamic',
          preserveFormatting: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Translation failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.translatedText;
    } catch (error) {
      console.error('Translation API error:', error);
      throw error;
    }
  };

  // Audio management functions
  const handleAudioPlay = useCallback(async (ayahId: string, globalAyahNumber: string) => {
    const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
    try {
      await playAudio(ayahId, audioUrl);
    } catch (error) {
      // Silently handle audio errors
    }
  }, [playAudio]);

  const handleAudioPause = useCallback(() => {
    pauseAudio();
  }, [pauseAudio]);

  const handleAudioEnd = useCallback(() => {
    // Audio ended naturally, no action needed
  }, []);

  // Function to copy only AI-generated content (excluding API components)
  const copyAIContentOnly = async () => {
    try {
      // Extract only AI-generated content for copying
      const aiContentToCopy = extractAIContentForTranslation(displayedContent || summary);
      
      if (!aiContentToCopy.trim()) {
        // Fallback to summary if no AI content extracted
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }

      // Clean up the AI content for copying (remove HTML tags, etc.)
      const cleanAIContent = aiContentToCopy
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up extra whitespace
        .replace(/^\s+|\s+$/gm, '') // Trim lines
        .trim();

      await navigator.clipboard.writeText(cleanAIContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy AI content:', error);
      // Fallback to copying summary
      try {
        await navigator.clipboard.writeText(summary);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Failed to copy summary as fallback:', fallbackError);
      }
    }
  };

  // Helper function to format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatResponse = async (response: string) => {
    // First, find all ayah references and prepare them with tafsir data
    const ayahRegex = /"([^"]+)"\s*\[(.*?)\:\s*(\d+)\]\((https?:\/\/[^\s)]+)\)/g;
    const ayahMatches: RegExpExecArray[] = [];
    let match;
    
    // Extract all matches
    while ((match = ayahRegex.exec(response)) !== null) {
      ayahMatches.push(match);
    }
    
    // Process each ayah with tafsir data
    const ayahReplacements = await Promise.all(
      ayahMatches.map(async (match) => {
        const [, verseText, surahName, ayahNumber, url] = match;
        const surahNumber = getSurahNumber(surahName.trim());
        if (!surahNumber) {
          console.warn(`Could not find surah number for: "${surahName.trim()}". Using fallback value 1.`);
        } else {
          console.log(`Found surah number ${surahNumber} for: "${surahName.trim()}"`);
        }
        const finalSurahNumber = surahNumber || 1;
        const ayahNum = parseInt(ayahNumber);
        const globalAyahNumber = calculateGlobalAyahNumber(finalSurahNumber, ayahNum);
        const ayahId = `ayah-${finalSurahNumber}-${ayahNum}-${Date.now()}`;
        
        // Fetch tafsir data
        const tafsirData = await fetchTafsir(finalSurahNumber, ayahNum);
        
        // Generate tafsir buttons and content
        let tafsirButtonsHTML = '';
        let tafsirContentHTML = '';
        
        if (tafsirData && tafsirData.tafsirs && tafsirData.tafsirs.length > 0) {
                      tafsirButtonsHTML = `
            <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
              <svg class="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span class="text-emerald-700 dark:text-emerald-300">Tafsir</span>
            </h4>
            <div class="flex flex-wrap gap-1.5 md:gap-2 flex-1">`;
          
          tafsirData.tafsirs.forEach((tafsir, index) => {
            const tafsirId = `tafsir-${ayahId}-${index}`;
            const formattedContent = tafsir.content
              .replace(/\n/g, '<br>')
              .replace(/##\s*(.*?)$/gm, '<h5 class="font-semibold text-gray-800 dark:text-gray-200 mt-3 mb-2">$1</h5>')
              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
              .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
            
            tafsirButtonsHTML += `
              <button 
                data-tafsir-id="${tafsirId}"
                class="tafsir-toggle-btn px-2 md:px-3 py-1.5 md:py-2 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 flex items-center space-x-1.5 md:space-x-2 text-left focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500 rounded-lg flex-shrink-0 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md active:scale-95"
              >
                <div class="w-4 md:w-5 h-4 md:h-5 bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-2.5 md:w-3 h-2.5 md:h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div class="text-xs font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">${tafsir.author}</div>
              </button>`;
              
            tafsirContentHTML += `
              <div id="${tafsirId}" class="tafsir-content w-full mt-4" style="display: none;">
                <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden">
                  <div class="bg-gray-50 dark:bg-gray-700 px-3 md:px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                    <div class="flex items-center justify-between">
                      <h5 class="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                        <svg class="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span class="text-xs md:text-sm">${tafsir.author}</span>
                      </h5>
                      <button data-tafsir-id="${tafsirId}" class="tafsir-close-btn text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="p-3 md:p-4">
                    <div class="text-gray-700 dark:text-gray-300 leading-relaxed text-xs md:text-sm space-y-2 md:space-y-3">
                      ${formattedContent}
                    </div>
                  </div>
                </div>
              </div>`;
          });
          
          tafsirButtonsHTML += `
              </div>`;
        } else {
          tafsirButtonsHTML = `
            <div class="text-center text-gray-500 dark:text-gray-400 flex-1 flex flex-col justify-center">
              <svg class="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p class="text-sm font-medium">No tafsir available</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Check back later</p>
            </div>`;
        }
        
        return {
          match: match[0],
          replacement: `<div class="stylish-ayah-reference mb-8 max-w-none w-full pt-5 pb-5" data-ayah-id="${ayahId}" data-global-ayah="${globalAyahNumber}" data-surah-name="${surahName}" data-ayah-number="${ayahNumber}" data-surah-number="${surahNumber}">
            <div class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-full">
              <!-- Clean Header -->
              <div class="bg-gray-50 dark:bg-gray-750 px-4 py-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                      <svg class="w-4 h-4 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 font-[var(--font-amiri)]">${surahName}</h3>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Verse ${ayahNumber}</p>
                    </div>
                  </div>
                  <span class="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-mono rounded-lg">${finalSurahNumber}:${ayahNumber}</span>
                </div>
              </div>
              
              <!-- Verse Content -->
              <div class="p-4">
                <!-- Verse Text -->
                <div class="text-center mb-6">
                  <div class="relative">
                    <div class="text-3xl md:text-4xl text-gray-300 dark:text-gray-600 opacity-30 absolute -top-2 -left-4">"</div>
                    <div class="text-3xl md:text-4xl text-gray-300 dark:text-gray-600 opacity-30 absolute -top-2 -right-4">"</div>
                    <blockquote class="text-lg md:text-xl text-gray-800 dark:text-gray-200 font-[var(--font-amiri)] leading-relaxed font-medium tracking-wide px-6 py-2">
                      ${verseText}
                    </blockquote>
                  </div>
                </div>
                
                <!-- Audio Player and Tafsir Buttons -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <!-- Audio Player -->
                  <div class="enhanced-audio-player" data-ayah-id="${ayahId}" data-global-ayah="${globalAyahNumber}">
                    <div class="bg-gray-50 dark:bg-gray-750 rounded-xl p-3 border border-gray-200 dark:border-gray-600 min-h-[120px] md:min-h-[140px] flex flex-col justify-between">
                      <div class="flex items-center space-x-3">
                        <button class="play-pause-btn w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 hover:bg-gray-700 dark:hover:bg-gray-300 active:scale-95 transition-all duration-200" data-ayah-id="${ayahId}">
                          <svg class="play-icon w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          <svg class="pause-icon w-4 h-4 hidden" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                          </svg>
                        </button>
                        <div class="flex-1">
                          <div class="status-text text-sm font-medium text-gray-800 dark:text-gray-200">Play recitation</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">Alafasy</div>
                        </div>
                        <div class="text-right">
                          <div class="time-display text-sm font-mono text-gray-600 dark:text-gray-400">--:--</div>
                          <div class="status-indicator w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full hidden animate-pulse mt-1 ml-auto"></div>
                        </div>
                      </div>
                      
                      <!-- Progress Bar -->
                      <div class="mt-3">
                        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span class="current-time">0:00</span>
                          <span class="total-duration">--:--</span>
                        </div>
                        <div class="relative">
                          <div class="progress-bg w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div class="progress-fill h-full bg-gray-800 dark:bg-gray-200 rounded-full transition-all duration-300 ease-out" style="width: 0%"></div>
                          </div>
                          <input type="range" class="progress-slider absolute inset-0 w-full h-1.5 opacity-0 cursor-pointer" min="0" max="100" value="0" data-ayah-id="${ayahId}">
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Tafsir Buttons -->
                  <div class="bg-gray-50 dark:bg-gray-750 rounded-xl p-3 border border-gray-200 dark:border-gray-600 min-h-[120px] md:min-h-[140px] flex flex-col justify-between">
                    ${tafsirButtonsHTML}
                  </div>
                </div>
                
                <!-- Tafsir Content (Full Width Below) -->
                ${tafsirContentHTML}
              </div>
            </div>
          </div>`
        };
      })
    );
    
    // Apply all replacements
    let processedText = response;
    ayahReplacements.forEach(({ match, replacement }) => {
      processedText = processedText.replace(match, replacement);
    });
    
    // Continue with other formatting
    processedText = processedText
      // Format section headers with enhanced styling
      .replace(/^#{1,3}\s*(.+)$/gm, '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')
      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-200">$1</strong>')
      // Format section headers with enhanced styling
      .replace(/^#{1,3}\s*(.+)$/gm, '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')
      
      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-200">$1</strong>')
      
      // Format italic text
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
      
      // Format underlined text
      .replace(/\_\_([^_]+)\_\_/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500">$1</span>')
      
      // Format numbered lists with enhanced styling and spacing
      .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="mb-6 flex items-start p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200"><span class="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 text-white dark:text-gray-800 rounded-full text-sm font-bold mr-4 mt-0.5 flex-shrink-0 shadow-md">$1</span><span class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">$2</span></div>')
      
      // Format bullet points
      .replace(/^[-•]\s+(.+)$/gm, '<div class="mb-5 flex items-start p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200"><span class="w-3 h-3 bg-gradient-to-br from-gray-600 to-gray-500 dark:from-gray-400 dark:to-gray-300 rounded-full mr-4 mt-3 flex-shrink-0 shadow-sm"></span><span class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">$1</span></div>')
      
      // Format specific Islamic terms with enhanced styling
      .replace(/Allah\s*\(SWT\)/g, '<span class="inline-flex items-center px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-bold border-2 border-amber-300 dark:border-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse">🕌 Allah (SWT)</span>')
      .replace(/Allah\s*SWT/g, '<span class="inline-flex items-center px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-bold border-2 border-amber-300 dark:border-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse">🕌 Allah SWT</span>')
      .replace(/Prophet Muhammad\s*\(PBUH\)/g, '<span class="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600">📖 Prophet Muhammad (PBUH)</span>')
      .replace(/Prophet Muhammad\s*PBUH/g, '<span class="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600">📖 Prophet Muhammad PBUH</span>')
      .replace(/\(peace be upon him\)/g, '<span class="text-sm text-gray-600 dark:text-gray-400 font-medium">(peace be upon him)</span>')
      .replace(/Muhammad\s*\(PBUH\)/g, '<span class="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600">📖 Muhammad (PBUH)</span>')
      .replace(/Muhammad\s*PBUH/g, '<span class="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600">📖 Muhammad PBUH</span>')
      .replace(/Allah\s*\(Subhanahu wa Ta\'ala\)/g, '<span class="inline-flex items-center px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-bold border-2 border-amber-300 dark:border-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse">🕌 Allah (Subhanahu wa Ta\'ala)</span>')
      .replace(/Allah\s*Subhanahu wa Ta\'ala/g, '<span class="inline-flex items-center px-3 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-800 dark:text-amber-200 rounded-xl text-sm font-bold border-2 border-amber-300 dark:border-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-pulse">🕌 Allah Subhanahu wa Ta\'ala</span>')
      
      // Format Explanation headers with distinctive styling
      .replace(/^(Explanation):?\s*$/gmi, 
        '<div class="explanation-section mt-12 mb-8"><div class="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl border-l-4 border-blue-500 dark:border-blue-400 shadow-lg"><div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl flex items-center justify-center shadow-md"><svg class="w-6 h-6 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div><div><h3 class="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-200 font-[var(--font-amiri)] tracking-wide">💡 Explanation</h3><p class="text-sm text-blue-600 dark:text-blue-400 mt-1">Understanding the meaning and context</p></div></div></div>')
      
      // Format Tafsir/Tafseer headers with simple styling (matching AI Explanation design)
      .replace(/^(Tafs[ie]r):?\s*$/gmi, 
        '<div class="tafsir-section mt-12 mb-8"><h3 class="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-200 font-[var(--font-amiri)] tracking-wide border-b border-gray-300 dark:border-gray-600 pb-2">Tafsir</h3><p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Detailed scholarly interpretation</p></div>')
      
      // Format AI Explanation sections with simple styling
      .replace(/\[AI Explanation:\s*([\s\S]*?)\]/gi, 
        '<div class="ai-explanation-section mt-2 mb-4"><h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-300 dark:border-gray-600 pb-2">AI Explanation</h4><div class="text-gray-700 dark:text-gray-300 leading-relaxed text-base">$1</div></div>')
      
      // Format Authentic Tafsir sections with simple styling
      .replace(/\[Authentic Tafsir:\s*([\s\S]*?)\]/g, 
        '<br><br><div class="authentic-tafsir-section mt-6 mb-4"><h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 border-b border-gray-300 dark:border-gray-600 pb-2">Authentic Tafsir</h4><div class="text-gray-700 dark:text-gray-300 leading-relaxed text-base">$1</div></div>')
      
      // Format other common section headers with enhanced styling
      .replace(/^(Introduction|Additional Information|References|Conclusion):?\s*$/gmi, 
        '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-4 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')
      
      // Format Quranic section headers with enhanced styling
      .replace(/Allah\s*\(SWT\)\s*says\s*in\s*the\s*(Glorious\s*)?Quran:?/gi, 
        '<div class="my-8 p-6 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-2xl border-l-4 border-gray-800 dark:border-gray-200 shadow-lg"><h3 class="divine-quote-heading text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 font-[var(--font-amiri)] tracking-wide flex items-center">📖 <span class="ml-3">Allah (SWT) says in the Glorious Quran:</span></h3><div class="w-16 h-1 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 rounded-full"></div></div>')
      
      // Clean up any remaining formatting markers
      .replace(/###\s*Quran GPT's Answer:?\s*/gi, '')
      .replace(/^\s*[\r\n]+/gm, '') // Remove empty lines
      .replace(/\n{3,}/g, '\n\n'); // Limit consecutive line breaks
    
    return processedText;
  };

  const getPrompt = useCallback(() => {
    return `You are Quran GPT, an AI-powered Islamic Library with experience as a Quran Scholar/Researcher. Your task is to answer questions by providing authentic references from the Holy Quran.

IMPORTANT: You must format your response exactly as follows:

1. Start with a brief introduction to the topic
2. Include at least 2-3 relevant Quranic verses in this EXACT format:
   "Verse text here" [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})

3. After each verse, provide:
   - First: The authentic tafsir will be automatically fetched and displayed
   - Second: Your AI-generated explanation and interpretation of the verse

4. End with practical guidance or conclusion

CRITICAL FORMAT REQUIREMENTS:
- Use EXACTLY this format for ayah references: [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})
- Replace {Surah No.} and {Ayah No.} with actual numbers
- Use proper surah names like: Al-Fatiha, Al-Baqarah, Aal-Imran, An-Nisa, Al-Ma'idah, etc.
- Include the full verse text in quotes before each reference
- After each verse reference, provide your AI-generated explanation and interpretation
- The authentic tafsir from Islamic scholars will be automatically displayed

Example format:
"Indeed, Allah is with those who are patient." [Al-Baqarah: 153](https://alquran.cloud/ayah?reference=2:153)

[AI Explanation: This verse teaches us about patience and divine support. When we remain steadfast in difficult times, Allah promises to be with us, providing strength and guidance. This is a powerful reminder that patience is not just about waiting, but about maintaining faith and trust in Allah's plan.]

Question: ${content}`;
  }, [content]);

  const askQuran = async () => {
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      setError('Please enter a question');
      return;
    }

    // Clean up any existing audio before starting new question
    stopAudio();

    setIsProcessing(true);
    setSummary('');
    setShowSummary(false);
    setError('');

    const prompt = getPrompt();

    try {
      const response = await generate_response_with_gemini(prompt);
      const formattedResponse = await formatResponse(response);
      setSummary(formattedResponse);
      setDisplayedContent(formattedResponse); // Set initial displayed content
      setCurrentLanguage('en'); // Default to English
      setShowSummary(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        console.error('Error generating response:', error.message);
      } else {
        setError('An unexpected error occurred');
        console.error('Error generating response:', error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const generate_response_with_gemini = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.response;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error((error as Error).message || 'Failed to generate response');
    }
  };

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
        <link rel="icon" type="image/png" href="https://qurangpt.life/wp-content/uploads/2023/04/Quran-GPT-Favicon.png" />
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
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <HeroSection getGreetingMessage={getGreetingMessage} />

        {/* Main Content */}
        <main className="relative z-10">
          <div className="container max-w-7xl mx-auto px-6">
            
            {/* Quick Questions Section */}
            <QuickQuestions insertQuestion={insertQuestion} />

            {/* Question Input Section */}
            <ChatSection 
              content={content}
              setContent={setContent}
              askQuran={askQuran}
              resetForm={resetForm}
              isProcessing={isProcessing}
              error={error}
              showSummary={showSummary}
            />

            {/* Islamic Widgets */}
            <div className="mb-12">
              <IslamicWidgets showWidgets={!isProcessing && !showSummary} />
            </div>

            {/* Thinking Process */}
            <ThinkingProcess isProcessing={isProcessing} />

            {/* Language Translation Tabs - Above Response */}
            {showSummary && (
              <div className="mb-6 max-w-6xl mx-auto px-4">
                <LanguageTabs
                  originalText={summary}
                  onTranslationChange={handleTranslationChange}
                  context="islamic"
                  preserveFormatting={true}
                  isTranslating={isTranslating}
                  translationProgress={translationProgress}
                />
              </div>
            )}

            {/* Response Section */}
            <ResponseSection 
              showSummary={showSummary}
              summary={summary}
              copied={copied}
              onAudioPlay={handleAudioPlay}
              onAudioPause={handleAudioPause}
              onAudioEnd={handleAudioEnd}
              isAudioPlaying={isAyahPlaying}
              isAudioActive={isAyahActive}
              getAudioProgress={getAudioProgress}
              seekToTime={seekToTime}
              displayedContent={displayedContent}
              onCopyAIContent={copyAIContentOnly}
            />
            

          </div>
        </main>

        {/* Footer */}
        <Footer />
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
                      console.error('toggleTafsir function not found');
                    }
                  } else {
                    console.error('No tafsir ID found on button', tafsirBtn);
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
                  console.error('Error closing other tafsirs:', closeError);
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
                console.error('Error in toggleTafsir:', error);
              }
            };
          `
        }}
      />
    </>
  );
}