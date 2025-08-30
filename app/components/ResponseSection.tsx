'use client';

import { motion, AnimatePresence } from 'framer-motion';

import { useEffect, useRef, useState, useCallback } from 'react';
import { preloadAudioMetadata, getCachedAudioMetadata, setCachedAudioMetadata, formatTime } from '../utils/audioUtils';

interface ResponseSectionProps {
  showSummary: boolean;
  summary: string;
  copied: boolean;
  onAudioPlay: (ayahId: string, globalAyahNumber: string) => void;
  onAudioPause: (ayahId: string) => void;
  onAudioEnd: (ayahId: string) => void;
  isAudioPlaying: (ayahId: string) => boolean;
  isAudioActive: (ayahId: string) => boolean;
  getAudioProgress: () => { currentTime: number; duration: number; progress: number };
  seekToTime: (timeInSeconds: number) => boolean;
  displayedContent?: string; // Content to display (could be translated)
  onCopyAIContent?: () => void; // New prop for copying AI content
  userQuestion?: string; // New prop for the user's question
  onQuestionEdit?: (newQuestion: string) => void; // New prop for editing the user's question
}

export default function ResponseSection({ 
  showSummary, 
  summary, 
  copied,
  onAudioPlay,
  onAudioPause,
  onAudioEnd,
  isAudioPlaying,
  isAudioActive,
  getAudioProgress,
  seekToTime,
  displayedContent,
  onCopyAIContent,
  userQuestion,
  onQuestionEdit
}: ResponseSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Show copy success message
  useEffect(() => {
    if (copied && onCopyAIContent) {
      setShowCopySuccess(true);
      const timer = setTimeout(() => setShowCopySuccess(false), 1500); // Show tick for 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [copied, onCopyAIContent]);

  // New state for question editing
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState('');
  const [isHoveringQuestion, setIsHoveringQuestion] = useState(false);

  // Function to handle question editing
  const handleEditQuestion = () => {
    setIsEditingQuestion(true);
    setEditedQuestion(userQuestion || '');
  };

  // Function to handle question save
  const handleSaveQuestion = () => {
    if (editedQuestion.trim() && editedQuestion !== userQuestion && onQuestionEdit) {
      // Call parent function to get new response for edited question
      onQuestionEdit(editedQuestion);
    }
    setIsEditingQuestion(false);
    setEditedQuestion('');
  };

  // Function to handle question cancel
  const handleCancelEdit = () => {
    setIsEditingQuestion(false);
    setEditedQuestion('');
  };

  // Function to copy question to clipboard
  const handleCopyQuestion = async () => {
    try {
      await navigator.clipboard.writeText(userQuestion || '');
      // Show brief success feedback for question copy
      setShowQuestionCopySuccess(true);
      setTimeout(() => setShowQuestionCopySuccess(false), 1500);
    } catch (error) {
      // Failed to copy question - silent fail for security
    }
  };

  // State for question copy success feedback
  const [showQuestionCopySuccess, setShowQuestionCopySuccess] = useState(false);

  // Function to process content and convert markdown links to HTML links
  const processContentLinks = (content: string): string => {
    if (!content) return '';
    
    // Convert markdown links to HTML links
    // Pattern: [Surah Name: Ayah Number](URL)
    return content.replace(
      /\[([^\]]+)\]\s*\(([^)]+)\)/g,
      (match, linkText, url) => {
        // Extract surah name and ayah number from the link text
        const surahMatch = linkText.match(/^([^:]+):\s*(\d+(?:-\d+)?)$/);
        if (surahMatch) {
          const surahName = surahMatch[1].trim();
          const ayahNumbers = surahMatch[2].trim();
          
          // Create a clickable link with proper styling
          return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-200 font-medium text-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
            ${surahName}: ${ayahNumbers}
          </a>`;
        }
        
        // Fallback for other link formats
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline">${linkText}</a>`;
      }
    );
  };

  // Use displayedContent if provided, otherwise use summary
  const contentToShow = displayedContent || summary;

  // Function to update duration display
  const updateDurationDisplay = useCallback((player: Element, duration: number) => {
    const totalDurationEl = player.querySelector('.total-duration') as HTMLElement;
    if (totalDurationEl) {
      totalDurationEl.textContent = formatTime(duration);
    }
  }, []);

  // Function to preload audio metadata for all ayah players
  const preloadAllAudioMetadata = useCallback(async () => {
    if (!containerRef.current) return;
    
    const audioPlayers = containerRef.current.querySelectorAll('.enhanced-audio-player');
    
    audioPlayers.forEach(async (player) => {
      const globalAyahNumber = player.getAttribute('data-global-ayah');
      if (!globalAyahNumber) return;
      
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
      
      // Check cache first
      const cachedDuration = getCachedAudioMetadata(audioUrl);
      if (cachedDuration) {
        updateDurationDisplay(player, cachedDuration);
        return;
      }
      
      try {
        const { duration, success } = await preloadAudioMetadata(audioUrl);
        if (success && duration > 0) {
          setCachedAudioMetadata(audioUrl, duration);
          updateDurationDisplay(player, duration);
        }
      } catch (error) {
        // Failed to preload metadata for ayah - silent fail
      }
    });
  }, [updateDurationDisplay]);

  // Additional effect specifically for translation changes
  useEffect(() => {
    if (!contentToShow || !containerRef.current) return;

    // This effect runs specifically when displayedContent changes (translation)
    const timer = setTimeout(() => {
      // Force re-initialization of all audio players
      const audioPlayers = containerRef.current?.querySelectorAll('.enhanced-audio-player');
      
      if (!audioPlayers) return;
      
      audioPlayers.forEach((player) => {
        const playBtn = player.querySelector('.play-pause-btn') as HTMLButtonElement;
        const ayahId = playBtn?.getAttribute('data-ayah-id');
        const globalAyahNumber = player.getAttribute('data-global-ayah');
        
        if (!playBtn || !ayahId || !globalAyahNumber) return;
        
        // Create completely new button with fresh event listeners
        const newPlayBtn = document.createElement('button');
        newPlayBtn.className = playBtn.className;
        newPlayBtn.setAttribute('data-ayah-id', ayahId);
        newPlayBtn.innerHTML = playBtn.innerHTML;
        
        // Replace the old button
        playBtn.parentNode?.replaceChild(newPlayBtn, playBtn);
        
        // Add fresh event listener
        newPlayBtn.addEventListener('click', async () => {
          try {
            if (isAudioPlaying(ayahId)) {
              onAudioPause(ayahId);
            } else {
              await onAudioPlay(ayahId, globalAyahNumber);
            }
          } catch (error) {
            // Audio player error after translation - silent fail
          }
        });
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [displayedContent, onAudioPlay, onAudioPause, isAudioPlaying, contentToShow]);

  // Comprehensive audio setup function
  const setupAudioPlayers = useCallback(() => {
    if (!containerRef.current) return;
    
    const audioPlayers = containerRef.current.querySelectorAll('.enhanced-audio-player');
    
    audioPlayers.forEach((player, index) => {
      const playBtn = player.querySelector('.play-pause-btn') as HTMLButtonElement;
      const playIcon = player.querySelector('.play-icon') as HTMLElement;
      const pauseIcon = player.querySelector('.pause-icon') as HTMLElement;
      const statusText = player.querySelector('.status-text') as HTMLElement;
      const statusIndicator = player.querySelector('.status-indicator') as HTMLElement;
      
      if (!playBtn || !playIcon || !pauseIcon || !statusText || !statusIndicator) {
        return;
      }
      
      const ayahId = playBtn.getAttribute('data-ayah-id');
      const globalAyahNumber = player.getAttribute('data-global-ayah');
      
      if (!ayahId || !globalAyahNumber) {
        return;
      }
      
      // Remove existing event listeners by cloning the button
      const newPlayBtn = playBtn.cloneNode(true) as HTMLButtonElement;
      newPlayBtn.className = playBtn.className;
      newPlayBtn.setAttribute('data-ayah-id', ayahId);
      playBtn.parentNode?.replaceChild(newPlayBtn, playBtn);
      
      // Add click event listener for play/pause
      newPlayBtn.addEventListener('click', async () => {
        try {
          if (isAudioPlaying(ayahId)) {
            // Pause audio
            onAudioPause(ayahId);
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            statusText.textContent = 'Click to play';
            statusIndicator.classList.add('hidden');

          } else {
            // Play audio
            await onAudioPlay(ayahId, globalAyahNumber);
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            statusText.textContent = 'Playing';
            statusIndicator.classList.remove('hidden');

          }
        } catch (error) {
          // Audio player error - silent fail
          statusText.textContent = 'Error';
        }
      });
    });
  }, [onAudioPlay, onAudioPause, isAudioPlaying]);

  // Use the comprehensive setup function
  useEffect(() => {
    if (!contentToShow || !containerRef.current) return;

    // Preload audio metadata first
    preloadAllAudioMetadata();

    // Setup audio players with multiple attempts to ensure they work
    const setupTimer = setTimeout(() => {
      setupAudioPlayers();
    }, 100);
    
    const backupTimer = setTimeout(() => {
      setupAudioPlayers();
    }, 500);
    
    const finalTimer = setTimeout(() => {
      setupAudioPlayers();
    }, 1000);
    
    return () => {
      clearTimeout(setupTimer);
      clearTimeout(backupTimer);
      clearTimeout(finalTimer);
    };
  }, [contentToShow, setupAudioPlayers, preloadAllAudioMetadata]);

  // MutationObserver to detect DOM changes and reinitialize audio
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new MutationObserver((mutations) => {
      // Check if any audio players were added or modified
      const hasAudioChanges = mutations.some(mutation => {
        if (mutation.type === 'childList') {
          return Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              return element.querySelector('.enhanced-audio-player') || 
                     element.classList.contains('enhanced-audio-player');
            }
            return false;
          });
        }
        return false;
      });

      if (hasAudioChanges) {
        // Small delay to ensure DOM is stable
        setTimeout(() => {
          setupAudioPlayers();
        }, 100);
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    return () => observer.disconnect();
  }, [setupAudioPlayers]);

  // Add seek functionality to progress sliders
  useEffect(() => {
    if (!contentToShow || !containerRef.current) return;

    const setupSeekFunctionality = () => {
      if (!containerRef.current) return;
      
      const progressSliders = containerRef.current.querySelectorAll('.progress-slider');
      
      progressSliders.forEach((slider) => {
        const inputElement = slider as HTMLInputElement;
        const ayahId = inputElement.getAttribute('data-ayah-id');
        
        if (!ayahId) return;
        
        // Remove existing event listeners by cloning
        const newSlider = inputElement.cloneNode(true) as HTMLInputElement;
        inputElement.parentNode?.replaceChild(newSlider, inputElement);
        
        // Add seek functionality
        newSlider.addEventListener('input', (e) => {
          const target = e.target as HTMLInputElement;
          const seekPercentage = parseFloat(target.value);
          
          // Only allow seeking if this ayah is currently active
          if (isAudioActive(ayahId)) {
            const { duration } = getAudioProgress();
            if (duration > 0) {
              const seekTime = (seekPercentage / 100) * duration;
              seekToTime(seekTime);
            }
          } else {
            // Try to get cached duration for seeking even when not active
            // Find the parent player element
            const playerElement = newSlider.closest('.enhanced-audio-player');
            if (playerElement) {
              const globalAyahNumber = playerElement.getAttribute('data-global-ayah');
              if (globalAyahNumber) {
                const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
                const cachedDuration = getCachedAudioMetadata(audioUrl);
                if (cachedDuration && cachedDuration > 0) {
                  const seekTime = (seekPercentage / 100) * cachedDuration;
                  seekToTime(seekTime);
                }
              }
            }
          }
        });
      });
    };

    // Setup seek functionality with a delay
    const timer = setTimeout(setupSeekFunctionality, 200);
    
    return () => clearTimeout(timer);
  }, [contentToShow, isAudioActive, getAudioProgress, seekToTime]);

  // Update progress bars in real-time
  useEffect(() => {
    if (!contentToShow || !containerRef.current) return;

    const updateProgressBars = () => {
      if (!containerRef.current) return;
      
      const audioPlayers = containerRef.current.querySelectorAll('.enhanced-audio-player');
      
      audioPlayers.forEach((player) => {
        const ayahId = player.getAttribute('data-ayah-id');
        if (!ayahId) return;
        
        const isCurrentlyPlaying = isAudioPlaying(ayahId);
        const isCurrentlyActive = isAudioActive(ayahId);
        
        // Get progress elements
        const progressFill = player.querySelector('.progress-fill') as HTMLElement;
        const currentTimeEl = player.querySelector('.current-time') as HTMLElement;
        const totalDurationEl = player.querySelector('.total-duration') as HTMLElement;
        const timeDisplayEl = player.querySelector('.time-display') as HTMLElement;
        const progressSlider = player.querySelector('.progress-slider') as HTMLInputElement;
        
        if (!progressFill || !currentTimeEl || !totalDurationEl || !timeDisplayEl || !progressSlider) return;
        
        if (isCurrentlyActive) {
          // Get audio progress from the audio manager
          const { currentTime, duration, progress } = getAudioProgress();
          
          // Update progress bar with null check
          if (progressFill && progressFill.style) {
            progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
          }
          
          // Update time displays with null checks
          if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);
          if (totalDurationEl) totalDurationEl.textContent = duration > 0 ? formatTime(duration) : '--:--';
          if (timeDisplayEl) timeDisplayEl.textContent = formatTime(currentTime);
          
          // Update slider value with null check
          if (progressSlider) progressSlider.value = progress.toString();
          
        } else {
          // Reset progress for inactive players but keep duration if available
          if (progressFill && progressFill.style) {
            progressFill.style.width = '0%';
          }
          if (currentTimeEl) currentTimeEl.textContent = '0:00';
          
          // Try to get cached duration for this player
          const globalAyahNumber = player.getAttribute('data-global-ayah');
          if (globalAyahNumber) {
            const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
            const cachedDuration = getCachedAudioMetadata(audioUrl);
            if (totalDurationEl) totalDurationEl.textContent = cachedDuration ? formatTime(cachedDuration) : '--:--';
          } else {
            if (totalDurationEl) totalDurationEl.textContent = '--:--';
          }
          
          if (timeDisplayEl) timeDisplayEl.textContent = '--:--';
          if (progressSlider) progressSlider.value = '0';
        }
      });
    };

    // Update progress immediately and then every 100ms while playing
    updateProgressBars();
    
    const interval = setInterval(updateProgressBars, 100);
    
    return () => clearInterval(interval);
  }, [contentToShow, isAudioPlaying, isAudioActive, getAudioProgress]);


  return (
    <AnimatePresence>
      {showSummary && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="relative max-w-4xl mx-auto px-0 -mx-1 response-section-safe-margin"
        >
          

          {/* Content without borders or headers - Clean design */}
          <div className="relative group">
            {/* Subtle background pattern */}

            {/* Content with minimal typography - Matching SuggestedQuestions text sizes */}
            <div className="relative z-10">
              {/* Asked Question Display - Professional and Minimalistic */}
              {userQuestion && (
                <div 
                  className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 relative group"
                  onMouseEnter={() => setIsHoveringQuestion(true)}
                  onMouseLeave={() => setIsHoveringQuestion(false)}
                >
                  {/* Interactive Icons - Top Right Corner */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {!isEditingQuestion ? (
                      <>
                        {/* Edit Icon */}
                        <button
                          onClick={handleEditQuestion}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                          title="Edit question"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        {/* Copy Question Icon */}
                        <button
                          onClick={handleCopyQuestion}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                          title="Copy question"
                        >
                          <AnimatePresence mode="wait">
                            {showQuestionCopySuccess ? (
                              <motion.svg
                                key="tick"
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 90 }}
                                transition={{ duration: 0.2 }}
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </motion.svg>
                            ) : (
                              <motion.svg
                                key="copy"
                                initial={{ scale: 0, rotate: 90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: -90 }}
                                transition={{ duration: 0.2 }}
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                              </motion.svg>
                            )}
                          </AnimatePresence>
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Save (Tick) Icon */}
                        <button
                          onClick={handleSaveQuestion}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                          title="Save changes"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        
                        {/* Cancel (Cross) Icon */}
                        <button
                          onClick={handleCancelEdit}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                          title="Cancel editing"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-start gap-3 pr-16">
                    {/* Question Icon */}
                    <div className="flex-shrink-0 w-5 h-5 mt-0.5 text-gray-500 dark:text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    
                    {/* Question Text or Edit Input */}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Your Question
                      </h3>
                      
                      {!isEditingQuestion ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {userQuestion}
                        </p>
                      ) : (
                        <textarea
                          value={editedQuestion}
                          onChange={(e) => setEditedQuestion(e.target.value)}
                          className="w-full p-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 resize-none"
                          rows={2}
                          placeholder="Edit your question..."
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div 
                ref={containerRef}
                className="text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed text-sm p-4 -m-4"
                dangerouslySetInnerHTML={{ __html: processContentLinks(contentToShow) }}
              />
              
              {/* Audio players are now rendered inline with each ayah */}
            </div>

            {/* Bottom Copy Button - Bottom Right Corner of Response */}
            {onCopyAIContent && userQuestion && (
              <div className="absolute -bottom-2 right-4 z-20">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCopyAIContent}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 backdrop-blur-sm ${
                    showCopySuccess 
                      ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200' 
                      : 'bg-white/95 dark:bg-gray-800/95 hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                  }`}
                  title="Copy AI response content"
                >
                  <AnimatePresence mode="wait">
                    {showCopySuccess ? (
                      <motion.svg
                        key="tick"
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        transition={{ duration: 0.2 }}
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    ) : (
                      <motion.svg
                        key="copy"
                        initial={{ scale: 0, rotate: 90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: -90 }}
                        transition={{ duration: 0.2 }}
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}