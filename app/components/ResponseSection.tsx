'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
// Audio player is now integrated into AyahBox component

// Audio player functionality for HTML-rendered ayahs



interface ResponseSectionProps {
  showSummary: boolean;
  summary: string;
  copied: boolean;
  displayedContent?: string; // Content to display (could be translated)
  onCopyAIContent?: () => void; // New prop for copying AI content
  userQuestion?: string; // New prop for the user's question
  onQuestionEdit?: (newQuestion: string) => void; // New prop for editing the user's question
  isTextLarge?: boolean; // Text size state from parent
}

export default function ResponseSection({ 
  showSummary, 
  summary, 
  copied,
  displayedContent,
  onCopyAIContent,
  userQuestion,
  onQuestionEdit,
  isTextLarge
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

  // Audio player is now integrated into AyahBox component

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

  // Redesigned Audio Player System
  useEffect(() => {
    if (!containerRef.current || !contentToShow) return;

    // Audio state type definition
    interface AudioState {
      audio: HTMLAudioElement | null;
      isPlaying: boolean;
      currentTime: number;
      duration: number;
      isLoading: boolean;
      error: string | null;
      retryCount: number;
    }

    const audioStates = new Map<string, AudioState>();
    let currentPlayingKey: string | null = null;
    const getAudioKey = (surah: string, ayah: string): string => `${surah}-${ayah}`;

    const handleClick = (e: Event): void => {
      try {
        const target = e.target as HTMLElement;
        const button = target.closest('.ayah-audio-play-btn') as HTMLButtonElement;
        
        if (button) {
          e.preventDefault();
          e.stopPropagation();
          
          const surah = button.getAttribute('data-surah');
          const ayah = button.getAttribute('data-ayah');
          
          if (surah && ayah) {
            console.log(`Audio button clicked: Surah ${surah}, Ayah ${ayah}`);
            playPause(surah, ayah);
          } else {
            console.warn('Audio button missing data attributes:', { surah, ayah });
          }
        }
      } catch (error) {
        console.error('Error in audio click handler:', error);
      }
    };

    const pauseAllOthers = (currentKey: string): void => {
      currentPlayingKey = currentKey;
      audioStates.forEach((state, key) => {
        if (key !== currentKey && state.audio && state.isPlaying) {
          state.audio.pause();
          state.isPlaying = false;
          updateUI(key, state);
        }
      });
    };

    const updateUI = (key: string, state: AudioState): void => {
      const [surah, ayah] = key.split('-');
      const playBtn = containerRef.current?.querySelector(`[data-surah="${surah}"][data-ayah="${ayah}"].ayah-audio-play-btn`);
      const progressBar = containerRef.current?.querySelector(`[data-surah="${surah}"][data-ayah="${ayah}"].ayah-audio-progress`);

      // Update play button
      if (playBtn) {
        const svg = playBtn.querySelector('svg');
        if (svg) {
          if (state.isLoading) {
            svg.innerHTML = '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="25.133" stroke-dashoffset="25.133"><animate attributeName="stroke-dasharray" dur="1.5s" values="0 25.133;12.566 12.566;0 25.133" repeatCount="indefinite"/></circle>';
          } else if (state.error) {
            svg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0.5"/>';
          } else if (state.isPlaying) {
            svg.innerHTML = '<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />';
          } else {
            svg.innerHTML = '<path d="M8 5v14l11-7z" />';
          }
        }

        // Update button state
        const button = playBtn as HTMLButtonElement;
        if (state.error) {
          button.title = state.error;
          button.disabled = true;
          button.style.opacity = '0.5';
        } else if (currentPlayingKey && currentPlayingKey !== key && !state.isPlaying) {
          button.title = 'Another audio is playing. Pause it first.';
          button.disabled = true;
          button.style.opacity = '0.5';
        } else {
          button.title = state.isPlaying ? 'Pause audio' : 'Play audio recitation';
          button.disabled = false;
          button.style.opacity = '1';
        }
      }

      // Update progress bar
      if (progressBar) {
        const progressElement = progressBar as HTMLInputElement;
        if (state.duration > 0) {
          progressElement.max = state.duration.toString();
          progressElement.value = state.currentTime.toString();
          
          // Update progress bar styling
          const progressPercent = (state.currentTime / state.duration) * 100;
          const isDarkMode = document.documentElement.classList.contains('dark');
          const trackColor = isDarkMode ? '#374151' : '#e5e7eb';
          progressElement.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercent}%, ${trackColor} ${progressPercent}%, ${trackColor} 100%)`;
        } else {
          progressElement.max = "0";
          progressElement.value = "0";
          progressElement.style.background = '';
        }

        // Enable/disable progress bar
        if (currentPlayingKey && currentPlayingKey !== key && !state.isPlaying) {
          progressElement.disabled = true;
          progressElement.style.opacity = '0.5';
        } else {
          progressElement.disabled = false;
          progressElement.style.opacity = '1';
        }
      }


    };

    const loadAudio = async (surah: string, ayah: string): Promise<AudioState> => {
      const key = getAudioKey(surah, ayah);
      let state = audioStates.get(key);

      if (!state) {
        state = {
          audio: null,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          isLoading: false,
          error: null,
          retryCount: 0
        };
        audioStates.set(key, state);
      }

      if (state.audio && !state.error) return state;

      // Validate inputs
      const surahNum = parseInt(surah);
      const ayahNum = parseInt(ayah);
      
      if (isNaN(surahNum) || isNaN(ayahNum) || surahNum < 1 || surahNum > 114 || ayahNum < 1) {
        state.error = 'Invalid surah or ayah number.';
        state.isLoading = false;
        updateUI(key, state);
        return state;
      }

      state.isLoading = true;
      state.error = null;
      updateUI(key, state);

      try {
        console.log(`Loading audio for Surah ${surah}, Ayah ${ayah}`);
        
        const response = await fetch(`/api/audio?surah=${surah}&ayah=${ayah}`, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          // Add timeout for production reliability
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.success || !data.audioUrl) {
          throw new Error(data.error || 'No audio URL received');
        }

        console.log(`Audio URL received: ${data.audioUrl}`);

        // Create audio element
        const audio = new Audio();
        
        // Set up basic event listeners
        audio.addEventListener('loadedmetadata', () => {
          const currentState = audioStates.get(key);
          if (currentState && audio.duration) {
            currentState.duration = audio.duration;
            updateUI(key, currentState);
          }
        });

        audio.addEventListener('timeupdate', () => {
          const currentState = audioStates.get(key);
          if (currentState) {
            currentState.currentTime = audio.currentTime;
            updateUI(key, currentState);
          }
        });

        audio.addEventListener('ended', () => {
          const currentState = audioStates.get(key);
          if (currentState) {
            currentState.isPlaying = false;
            currentState.currentTime = 0;
            currentPlayingKey = null;
            updateUI(key, currentState);
          }
        });

        audio.addEventListener('error', () => {
          const currentState = audioStates.get(key);
          if (currentState) {
            currentState.error = 'Audio failed to load';
            currentState.isLoading = false;
            updateUI(key, currentState);
          }
        });

        // Set source
        audio.src = data.audioUrl;
        
        // Store the audio element
        state.audio = audio;
        state.isLoading = false;
        updateUI(key, state);

      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Failed to load audio';
        state.isLoading = false;
        updateUI(key, state);
      }

      return state;
    };

    const playPause = async (surah: string, ayah: string): Promise<void> => {
      const key = getAudioKey(surah, ayah);
      let state = audioStates.get(key);

      if (!state) {
        state = await loadAudio(surah, ayah);
      }

      if (!state.audio || state.error) {
        return;
      }

      if (state.isPlaying) {
        state.audio.pause();
        state.isPlaying = false;
        currentPlayingKey = null;
      } else {
        // Pause all other audio
        pauseAllOthers(key);
        
        try {
          await state.audio.play();
          state.isPlaying = true;
        } catch (error) {
          state.error = 'Playback failed. Please try again.';
          state.isPlaying = false;
        }
      }

      updateUI(key, state);
    };

    const seek = (surah: string, ayah: string, time: number): void => {
      const key = getAudioKey(surah, ayah);
      const state = audioStates.get(key);
      
      if (state && state.audio && state.duration > 0) {
        state.audio.currentTime = Math.max(0, Math.min(time, state.duration));
        state.currentTime = state.audio.currentTime;
        updateUI(key, state);
      }
    };

    const handleSeek = (e: Event): void => {
      const target = e.target as HTMLInputElement;
      
      if (target.classList.contains('ayah-audio-progress')) {
        const surah = target.getAttribute('data-surah');
        const ayah = target.getAttribute('data-ayah');
        
        if (surah && ayah) {
          const time = parseFloat(target.value);
          seek(surah, ayah, time);
        }
      }
    };

    // Additional setup when content changes - ensures buttons are clickable
    const setupAudioPlayersOnContentChange = () => {
      if (!containerRef.current) return;
      
      const playButtons = containerRef.current.querySelectorAll('.ayah-audio-play-btn');
      if (playButtons.length > 0) {
        console.log(`Found ${playButtons.length} audio buttons, ensuring clickability`);
        
        // Remove and re-add listeners to ensure they work
        containerRef.current.removeEventListener('click', handleClick);
        containerRef.current.addEventListener('click', handleClick, { passive: false });
      }
    };

    const setupAudioPlayers = () => {
      if (!containerRef.current) {
        // Retry if container is not ready
        setTimeout(setupAudioPlayers, 50);
        return;
      }

      const playButtons = containerRef.current?.querySelectorAll('.ayah-audio-play-btn');
      const progressBars = containerRef.current?.querySelectorAll('.ayah-audio-progress');
      
      // Remove existing listeners to prevent duplicates
      containerRef.current.removeEventListener('click', handleClick);
      containerRef.current.removeEventListener('input', handleSeek);
      
      // Add event listeners with proper error handling
      try {
        containerRef.current.addEventListener('click', handleClick, { passive: false });
        containerRef.current.addEventListener('input', handleSeek, { passive: false });
        
        // Debug log for production troubleshooting
        console.log(`Audio players setup: ${playButtons?.length || 0} buttons, ${progressBars?.length || 0} progress bars`);
      } catch (error) {
        console.error('Failed to setup audio players:', error);
      }
    };

    // Use multiple strategies to ensure setup happens
    const timer1 = setTimeout(setupAudioPlayers, 100);
    const timer2 = setTimeout(setupAudioPlayers, 500);
    const timer3 = setTimeout(setupAudioPlayers, 1000);
    
    // Setup immediately and with a delay for content changes
    setupAudioPlayersOnContentChange();
    const contentTimer = setTimeout(setupAudioPlayersOnContentChange, 200);
    
    // Capture the ref value to avoid stale closure issues
    const currentContainer = containerRef.current;
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(contentTimer);
      if (currentContainer) {
        currentContainer.removeEventListener('click', handleClick);
        currentContainer.removeEventListener('input', handleSeek);
      }
      
      audioStates.forEach((state) => {
        if (state.audio) {
          state.audio.pause();
          state.audio.src = '';
        }
      });
      audioStates.clear();
    };
  }, [contentToShow]);














  






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
                      <h3 className={`font-medium text-gray-700 dark:text-gray-300 mb-1 ${
                        isTextLarge ? 'text-base' : 'text-sm'
                      }`}>
                        Your Question
                      </h3>
                      
                      {!isEditingQuestion ? (
                        <p className={`text-gray-600 dark:text-gray-400 leading-relaxed ${
                          isTextLarge ? 'text-base' : 'text-sm'
                        }`}>
                          {userQuestion}
                        </p>
                      ) : (
                        <textarea
                          id="edit-question-textarea"
                          name="edit-question"
                          value={editedQuestion}
                          onChange={(e) => setEditedQuestion(e.target.value)}
                          className={`w-full p-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 resize-none ${
                            isTextLarge ? 'text-base' : 'text-sm'
                          }`}
                          rows={2}
                          placeholder="Edit your question..."
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Audio player is now integrated into each AyahBox component */}

              <div 
                ref={containerRef}
                className={`text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed p-4 -m-4 transition-all duration-200 ${
                  isTextLarge ? 'text-base' : 'text-sm'
                }`}
                dangerouslySetInnerHTML={{ __html: processContentLinks(contentToShow) }}
              />
              
              
              

            </div>


          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}





