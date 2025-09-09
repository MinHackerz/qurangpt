'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useQuestionEditing } from '../hooks/useQuestionEditing';
import { useGlobalEventDelegation } from '../hooks/useGlobalEventDelegation';
import { useScrollDetection } from '../hooks/useScrollDetection';
import { processContentLinks } from '../utils/contentUtils';
import { createShareLink, getShareText } from '../utils/shareUtils';
import { QuestionDisplay } from './QuestionDisplay';
import ShareButton from './ShareButton';
import ShareModal from './ShareModal';
import SourcesSection from './SourcesSection';



interface ResponseSectionProps {
  showSummary: boolean;
  summary: string;
  copied: boolean;
  displayedContent?: string; // Content to display (could be translated)
  onCopyAIContent?: () => void; // New prop for copying AI content
  userQuestion?: string; // New prop for the user's question
  onQuestionEdit?: (newQuestion: string) => void; // New prop for editing the user's question
  isTextLarge?: boolean; // Text size state from parent
  // Share functionality props
  shareUrl?: string; // URL to share
  onShare?: () => void; // Callback when share is triggered
}

export default function ResponseSection({ 
  showSummary, 
  summary, 
  copied,
  displayedContent,
  onCopyAIContent,
  userQuestion,
  onQuestionEdit,
  isTextLarge,
  shareUrl,
  onShare
}: ResponseSectionProps) {
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [generatedShareUrl, setGeneratedShareUrl] = useState<string>('');
  const [isCreatingShare, setIsCreatingShare] = useState(false);

  // Use displayedContent if provided, otherwise use summary
  const contentToShow = displayedContent || summary;

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

  // Show copy success message
  useEffect(() => {
    if (copied && onCopyAIContent) {
      setShowCopySuccess(true);
      const timer = setTimeout(() => setShowCopySuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [copied, onCopyAIContent]);
  
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
          console.error('Failed to create share link:', error);
          setGeneratedShareUrl(window.location.href);
        }
      };
      generateShareUrl();
    }
  }, [userQuestion, contentToShow, generatedShareUrl, shareUrl]);
  
  // Debug: Check if content contains audio buttons and ensure clickability
  useEffect(() => {
    if (contentToShow && contentToShow.includes('ayah-audio-play-btn')) {
      console.log('Content contains audio buttons:', contentToShow.includes('ayah-audio-play-btn'));
      console.log('Content preview:', contentToShow.substring(0, 500));
      
      // Check for buttons after a short delay to allow DOM to update
      setTimeout(() => {
        const buttons = document.querySelectorAll('.ayah-audio-play-btn, .tafsir-toggle-btn, .tafsir-close-btn');
        console.log('Interactive buttons found in DOM after render:', buttons.length);
        if (buttons.length > 0) {
          buttons.forEach((button, index) => {
            const btn = button as HTMLElement;
            console.log(`Button ${index}:`, {
              tagName: btn.tagName,
              className: btn.className,
              dataSurah: btn.getAttribute('data-surah'),
              dataAyah: btn.getAttribute('data-ayah'),
              pointerEvents: btn.style.pointerEvents,
              zIndex: btn.style.zIndex
            });
            
            // Ensure button is clickable
            btn.style.pointerEvents = 'auto';
            btn.style.cursor = 'pointer';
            btn.style.position = 'relative';
            btn.style.zIndex = '10';
            if (btn instanceof HTMLButtonElement) {
              btn.disabled = false;
            }
          });
        }
      }, 100);
    }
  }, [contentToShow]);

  // Additional effect to periodically ensure button clickability
  useEffect(() => {
    const ensureButtonClickability = () => {
      const buttons = document.querySelectorAll('.ayah-audio-play-btn, .tafsir-toggle-btn, .tafsir-close-btn');
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

    // Set up interval to periodically check
    const interval = setInterval(ensureButtonClickability, 2000);

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
            {/* Question Display - Only show if there's a user question */}
            {userQuestion && (
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
            )}

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
                  <div className="mb-6">
                    <h1 className={`font-light tracking-tight text-gray-900 dark:text-white mb-4 ${
                      isTextLarge ? 'text-4xl md:text-5xl lg:text-6xl' : 'text-3xl md:text-4xl lg:text-5xl'
                    }`}>
                      QuranGPT
                    </h1>
                    
                    {/* Minimalist Arabic Ornament - Matching HeroSection */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
                      <div className="mx-4 text-lg text-gray-400 dark:text-gray-500 font-[var(--font-scheherazade)]">۞</div>
                      <div className="w-8 h-px bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                  </div>
                  
                  {/* Professional Subtitle - Matching HeroSection */}
                  <p className={`text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-light ${
                    isTextLarge ? 'text-base md:text-lg' : 'text-sm md:text-base'
                  }`}>
                    AI-powered Islamic knowledge from the Holy Quran
                  </p>
                </div>
              </motion.div>
            ) : (
              /* Content Display - Show when there's actual content */
              <div 
                ref={containerRef}
                className={`text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed p-4 -m-4 transition-all duration-200 ${
                  isTextLarge ? 'text-base' : 'text-sm'
                }`}
                style={{ 
                  zIndex: 4,
                  position: 'relative',
                  pointerEvents: 'auto'
                }}
                dangerouslySetInnerHTML={{ __html: processContentLinks(contentToShow) }}
              />
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
        onCopyContent={onCopyAIContent}
        copied={copied}
        content={contentToShow}
      />
    </AnimatePresence>
  );
}
