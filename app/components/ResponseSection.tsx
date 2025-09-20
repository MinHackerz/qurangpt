'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuestionEditing } from '../hooks/useQuestionEditing';
import { useGlobalEventDelegation } from '../hooks/useGlobalEventDelegation';
import { useScrollDetection } from '../hooks/useScrollDetection';
import { processContentLinks } from '../utils/contentUtils';
import { createShareLink, getShareText } from '../utils/shareUtils';
import ShareModal from './ShareModal';
import SourcesSection from './SourcesSection';



interface ResponseSectionProps {
  showSummary: boolean;
  summary: string;
  displayedContent?: string; // Content to display (could be translated)
  userQuestion?: string; // New prop for the user's question
  onQuestionEdit?: (newQuestion: string) => void; // New prop for editing the user's question
  textSize?: 'small' | 'medium' | 'large'; // Text size state from parent
  // Share functionality props
  shareUrl?: string; // URL to share
  onShare?: () => void; // Callback when share is triggered
  // Content type selection props
  selectedContentTypes?: {
    tafsir: boolean;
    hadith: boolean;
    suggestedQuestions: boolean;
  };
}

export default function ResponseSection({ 
  showSummary, 
  summary, 
  displayedContent,
  userQuestion,
  onQuestionEdit,
  textSize = 'small',
  shareUrl,
  onShare,
  selectedContentTypes = { tafsir: false, hadith: false, suggestedQuestions: false }
}: ResponseSectionProps) {
  const isTextLarge = textSize === 'large';
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string>('');
  const [isCreatingShare, setIsCreatingShare] = useState(false);

  // Process content based on selected content types - memoized for performance
  const processContentBasedOnSelection = useCallback((content: string) => {
    if (!content) return content;
    
    // Create a temporary DOM element to parse the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Remove sections based on selection
    if (!selectedContentTypes.tafsir) {
      // Remove tafsir sections
      const tafsirSections = tempDiv.querySelectorAll('.tafsir-content, .tafsir-section');
      tafsirSections.forEach(section => section.remove());
    }
    
    // Note: Hadith content is preserved when option is unselected
    // Only new hadith content generation is controlled by the option
    // Existing hadith content remains visible regardless of option state
    
    // Note: Suggested questions content is preserved when option is unselected
    // Only new suggested questions content generation is controlled by the option
    // Existing suggested questions content remains visible regardless of option state
    
    return tempDiv.innerHTML;
  }, [selectedContentTypes.tafsir]);

  // Use displayedContent if provided, otherwise use summary, and process based on selection
  const contentToShow = processContentBasedOnSelection(displayedContent || summary);

  // Use custom hooks
  const questionEditing = useQuestionEditing(userQuestion, onQuestionEdit);
  useGlobalEventDelegation();
  
  // Scroll detection for share button
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAtBottom, isScrolled } = useScrollDetection({
    threshold: 0.8,
    enabled: showSummary && !!contentToShow,
    containerRef: containerRef
  });

  
  // Check if we should show welcome message (no content but showSummary is true)
  const shouldShowWelcome = showSummary && !contentToShow && !userQuestion;

  // Handle share functionality
  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      setShowShareModal(true);
    }
  };

  // Generate share URL if not provided
  const finalShareUrl = shareUrl || generatedShareUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // Generate share title
  const shareTitle = userQuestion ? `QuranGPT: ${userQuestion}` : 'QuranGPT Answer';

  // Generate share URL when content is available
  useEffect(() => {
    if (userQuestion && contentToShow && !generatedShareUrl && !shareUrl) {
      const generateShareUrl = async () => {
        try {
          const generatedUrl = await createShareLink({
            question: userQuestion,
            response: contentToShow,
            title: `QuranGPT: ${userQuestion}`
          });
          setGeneratedShareUrl(generatedUrl);
        } catch (error) {
          setGeneratedShareUrl(window.location.href);
        }
      };
      generateShareUrl();
    }
  }, [userQuestion, contentToShow, generatedShareUrl, shareUrl]);
  
  useEffect(() => {
    if (contentToShow && contentToShow.includes('ayah-audio-play-btn')) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        const buttons = document.querySelectorAll('.ayah-audio-play-btn, .tafsir-toggle-btn, .tafsir-close-btn');
        if (buttons.length > 0) {
          buttons.forEach((button) => {
            const btn = button as HTMLElement;
            
            // Only update if button is not already properly configured
            if (btn.style.pointerEvents !== 'auto' || btn.style.cursor !== 'pointer') {
              btn.style.pointerEvents = 'auto';
              btn.style.cursor = 'pointer';
              btn.style.position = 'relative';
              btn.style.zIndex = '10';
              if (btn instanceof HTMLButtonElement) {
                btn.disabled = false;
              }
            }
          });
        }
      });
    }
  }, [contentToShow]);

  // Additional effect to periodically ensure button clickability - optimized
  useEffect(() => {
    const ensureButtonClickability = () => {
      const buttons = document.querySelectorAll('.ayah-audio-play-btn, .tafsir-toggle-btn, .tafsir-close-btn');
      if (buttons.length === 0) return; // Early return if no buttons
      
      buttons.forEach((button) => {
        const btn = button as HTMLElement;
        // Only fix if button is not currently disabled by the audio system
        if (!btn.classList.contains('loading-state') && !btn.classList.contains('error-state')) {
          btn.style.pointerEvents = 'auto';
          btn.style.cursor = 'pointer';
          btn.style.position = 'relative';
          btn.style.zIndex = '10';
        }
      });
    };

    // Run immediately
    ensureButtonClickability();

    // Set up interval to periodically check - reduced frequency for better performance
    const interval = setInterval(ensureButtonClickability, 5000); // Increased from 2s to 5s

    return () => clearInterval(interval);
  }, [contentToShow]);



  if (!showSummary) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        className="relative max-w-4xl mx-auto px-0 -mx-1 response-section-safe-margin"
        style={{ zIndex: 1 }}
      >
        <div className="relative group" style={{ zIndex: 2 }}>
          <div className="relative" style={{ zIndex: 3 }}>

            {/* Welcome Message - Show when no content is available */}
            {shouldShowWelcome ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center py-8 px-4"
              >
                <div className="max-w-2xl mx-auto">
                  {/* Clean, Professional Title - Matching HeroSection */}
                  <div className="mb-8">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-gray-900 dark:text-white mb-4">
                      QuranGPT
                    </h1>
                    
                    {/* Minimalist Arabic Ornament - Matching HeroSection */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-12 h-px bg-gray-300 dark:bg-gray-600"></div>
                      <div className="mx-6 text-2xl text-gray-400 dark:text-gray-500 font-[var(--font-scheherazade)]">۞</div>
                      <div className="w-12 h-px bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                  </div>
                  
                  {/* Professional Subtitle - Matching HeroSection */}
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed font-light">
                    AI-powered Islamic knowledge from the Holy Quran
                  </p>
                </div>
              </motion.div>
            ) : (
              /* Content Display - Show when there's actual content */
              <div className="space-y-6">
                {/* User Question Display */}
                {userQuestion && (
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
                        <div className={`text-gray-800 dark:text-gray-200 leading-relaxed ${
                          textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'
                        }`}>
                          {userQuestion}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* AI Response Content */}
                <div 
                  ref={containerRef}
                  className={`text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed p-4 -m-4 transition-all duration-200 ${
                    textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'
                  }`}
                  style={{ 
                    zIndex: 4,
                    position: 'relative',
                    pointerEvents: 'auto'
                  }}
                  dangerouslySetInnerHTML={{ __html: processContentLinks(contentToShow) }}
                />

                {/* Desktop Share Button - Bottom Right */}
                {onShare && (
                  <div className="hidden sm:block absolute bottom-4 right-4 z-10">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onShare}
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200/70 dark:border-gray-700/70 shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      title="Share this content"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </motion.button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>


      {/* Share Modal */}
      <ShareModal
        key="share-modal"
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={finalShareUrl}
        title={shareTitle}
        question={userQuestion || 'QuranGPT Answer'}
        isCreatingShare={isCreatingShare}
      />
    </AnimatePresence>
  );
}
