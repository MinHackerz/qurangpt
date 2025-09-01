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
}

export default function ResponseSection({ 
  showSummary, 
  summary, 
  copied,
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

  // Audio player functionality for HTML-rendered ayahs
  useEffect(() => {
    if (!containerRef.current) return;

    // Audio state management
    const audioStates = new Map<string, {
      audio: HTMLAudioElement | null;
      isPlaying: boolean;
      currentTime: number;
      duration: number;
      isLoading: boolean;
      error: string | null;
    }>();

    const getAudioKey = (surah: string, ayah: string) => `${surah}-${ayah}`;

    // Format time helper
    const formatTime = (time: number): string => {
      if (isNaN(time)) return '0:00';
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Pause all other audio players except the specified one
    const pauseAllOtherAudio = (currentKey: string) => {
      audioStates.forEach((state, key) => {
        if (key !== currentKey && state.audio && state.isPlaying) {
          state.audio.pause();
          state.isPlaying = false;
          // Update UI for the paused audio
          const [surah, ayah] = key.split('-');
          updateAudioUI(surah, ayah, state);
        }
      });
    };

    // Update UI for a specific audio
    const updateAudioUI = (surah: string, ayah: string, state: any) => {
      const playBtn = containerRef.current?.querySelector(`[data-surah="${surah}"][data-ayah="${ayah}"].ayah-audio-play-btn`);
      const progressBar = containerRef.current?.querySelector(`[data-surah="${surah}"][data-ayah="${ayah}"].ayah-audio-progress`);
      const currentTimeEl = containerRef.current?.querySelector(`[data-surah="${surah}"][data-ayah="${ayah}"] .ayah-audio-current-time`);
      const durationEl = containerRef.current?.querySelector(`[data-surah="${surah}"][data-ayah="${ayah}"] .ayah-audio-duration`);
      
      // Check if any other audio is currently playing
      const isOtherAudioPlaying = Array.from(audioStates.values()).some(otherState => 
        otherState.isPlaying && otherState !== state
      );

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
        
        // Update button title and disabled state
        if (state.error) {
          (playBtn as HTMLButtonElement).title = state.error;
          (playBtn as HTMLButtonElement).disabled = true;
        } else if (isOtherAudioPlaying && !state.isPlaying) {
          (playBtn as HTMLButtonElement).title = 'Another audio is playing. Pause it first.';
          (playBtn as HTMLButtonElement).disabled = true;
          (playBtn as HTMLButtonElement).style.opacity = '0.5';
        } else {
          (playBtn as HTMLButtonElement).title = state.isPlaying ? 'Pause audio' : 'Play audio recitation';
          (playBtn as HTMLButtonElement).disabled = false;
          (playBtn as HTMLButtonElement).style.opacity = '1';
        }
      }

      if (progressBar) {
        const progressBarElement = progressBar as HTMLInputElement;
        
        // Set max value to duration if available, otherwise keep it at 0
        if (state.duration > 0) {
          progressBarElement.max = state.duration.toString();
          progressBarElement.value = state.currentTime.toString();
        } else {
          progressBarElement.max = "0";
          progressBarElement.value = "0";
        }
        
        // Update progress bar background color dynamically
        const progressPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
        
        if (progressBarElement) {
          // Check if dark mode is active
          const isDarkMode = document.documentElement.classList.contains('dark');
          const trackColor = isDarkMode ? '#374151' : '#e5e7eb';
          
          progressBarElement.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercent}%, ${trackColor} ${progressPercent}%, ${trackColor} 100%)`;
          
          // Disable progress bar if another audio is playing
          if (isOtherAudioPlaying && !state.isPlaying) {
            progressBarElement.disabled = true;
            progressBarElement.style.opacity = '0.5';
          } else {
            progressBarElement.disabled = false;
            progressBarElement.style.opacity = '1';
          }
        }
      }

      if (currentTimeEl) {
        if (state.isPlaying || state.currentTime > 0) {
          currentTimeEl.textContent = formatTime(state.currentTime);
        } else {
          currentTimeEl.textContent = '';
        }
      }

      if (durationEl) {
        if (state.duration > 0) {
          durationEl.textContent = formatTime(state.duration);
          console.log(`Duration updated for ${surah}:${ayah} - ${formatTime(state.duration)}`);
        } else {
          durationEl.textContent = '';
        }
      }
    };

    // Load audio for a specific ayah using our API
    const loadAudio = async (surah: string, ayah: string) => {
      const key = getAudioKey(surah, ayah);
      const state = audioStates.get(key) || {
        audio: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isLoading: false,
        error: null
      };

      if (state.audio) return state;

      // Validate surah and ayah numbers before making API call
      const surahNum = parseInt(surah);
      const ayahNum = parseInt(ayah);
      
      if (isNaN(surahNum) || isNaN(ayahNum) || surahNum < 1 || surahNum > 114 || ayahNum < 1) {
        state.error = 'Invalid surah or ayah number.';
        state.isLoading = false;
        updateAudioUI(surah, ayah, state);
        audioStates.set(key, state);
        return state;
      }

      state.isLoading = true;
      updateAudioUI(surah, ayah, state);

      try {
        console.log(`Fetching audio for surah ${surah}, ayah ${ayah}`);
        
        // Call our API endpoint
        const response = await fetch(`/api/audio?surah=${surah}&ayah=${ayah}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.audioUrl) {
            console.log(`Audio URL received: ${data.audioUrl}`);
            
            const audio = new Audio(data.audioUrl);
            
            // Preload the audio to get metadata
            audio.preload = 'metadata';
            
            // Try to load the audio immediately to get duration
            audio.load();
            
            // Set a timeout to try to get duration if metadata doesn't load quickly
            const durationTimeout = setTimeout(async () => {
              if (state.duration === 0 && audio.duration > 0 && !isNaN(audio.duration)) {
                state.duration = audio.duration;
                console.log(`Duration loaded via timeout - Duration: ${audio.duration} seconds (${formatTime(audio.duration)})`);
                updateAudioUI(surah, ayah, state);
              } else if (state.duration === 0) {
                // Try to trigger metadata loading by attempting to play briefly
                try {
                  const currentTime = audio.currentTime;
                  await audio.play();
                  audio.pause();
                  audio.currentTime = currentTime;
                  
                  if (audio.duration > 0 && !isNaN(audio.duration)) {
                    state.duration = audio.duration;
                    console.log(`Duration loaded via play attempt - Duration: ${audio.duration} seconds (${formatTime(audio.duration)})`);
                    updateAudioUI(surah, ayah, state);
                  }
                } catch (error) {
                  console.log('Could not trigger duration loading via play attempt:', error);
                }
              }
            }, 1500); // Try after 1.5 seconds
            
            audio.addEventListener('loadedmetadata', () => {
              if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                clearTimeout(durationTimeout);
                state.duration = audio.duration;
                console.log(`Audio metadata loaded - Duration: ${audio.duration} seconds (${formatTime(audio.duration)})`);
                updateAudioUI(surah, ayah, state);
              }
            });
            
            audio.addEventListener('canplaythrough', () => {
              // Ensure duration is set even if loadedmetadata didn't fire
              if (state.duration === 0 && audio.duration > 0 && !isNaN(audio.duration)) {
                clearTimeout(durationTimeout);
                state.duration = audio.duration;
                console.log(`Audio can play through - Duration: ${audio.duration} seconds (${formatTime(audio.duration)})`);
                updateAudioUI(surah, ayah, state);
              }
            });
            
            audio.addEventListener('durationchange', () => {
              if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                clearTimeout(durationTimeout);
                state.duration = audio.duration;
                console.log(`Audio duration changed - Duration: ${audio.duration} seconds (${formatTime(audio.duration)})`);
                updateAudioUI(surah, ayah, state);
              }
            });

            audio.addEventListener('timeupdate', () => {
              state.currentTime = audio.currentTime;
              updateAudioUI(surah, ayah, state);
            });

            audio.addEventListener('ended', () => {
              state.isPlaying = false;
              state.currentTime = 0;
              updateAudioUI(surah, ayah, state);
            });

            audio.addEventListener('error', (e) => {
              console.error('Audio playback error:', e);
              state.error = 'Audio not available at the moment.';
              state.isLoading = false;
              updateAudioUI(surah, ayah, state);
            });

            state.audio = audio;
            state.isLoading = false;
            updateAudioUI(surah, ayah, state);
          } else {
            console.error('API returned error:', data.error);
            state.error = data.error || 'Audio not available at the moment.';
            state.isLoading = false;
            updateAudioUI(surah, ayah, state);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('API request failed:', response.status, errorData);
          
          // Provide more specific error messages based on status code
          let errorMessage = 'Audio not available at the moment.';
          if (response.status === 404) {
            errorMessage = 'Audio not found for this ayah.';
          } else if (response.status === 400) {
            errorMessage = 'Invalid surah or ayah number.';
          } else if (response.status >= 500) {
            errorMessage = 'Audio service temporarily unavailable.';
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
          
          state.error = errorMessage;
          state.isLoading = false;
          updateAudioUI(surah, ayah, state);
        }
      } catch (error) {
        console.error('Audio loading error:', error);
        
        // Provide more specific error messages based on error type
        let errorMessage = 'Audio not available at the moment.';
        if (error instanceof TypeError && error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error instanceof Error) {
          errorMessage = `Audio loading failed: ${error.message}`;
        }
        
        state.error = errorMessage;
        state.isLoading = false;
        updateAudioUI(surah, ayah, state);
      }

      audioStates.set(key, state);
      return state;
    };

    // Handle play/pause
    const handlePlayPause = async (surah: string, ayah: string) => {
      const key = getAudioKey(surah, ayah);
      let state = audioStates.get(key);

      if (!state) {
        state = await loadAudio(surah, ayah);
      }

      // If there's an error, try to reload the audio
      if (state.error) {
        console.log('Retrying audio load due to previous error');
        state = await loadAudio(surah, ayah);
      }

      if (!state.audio || state.error) {
        console.log('Cannot play audio:', state.error);
        return;
      }

      if (state.isPlaying) {
        state.audio.pause();
        state.isPlaying = false;
      } else {
        // Pause all other audio players before starting this one
        pauseAllOtherAudio(key);
        
        try {
          await state.audio.play();
          state.isPlaying = true;
        } catch (error) {
          console.error('Audio playback failed:', error);
          state.error = 'Audio playback failed.';
          state.isPlaying = false;
        }
      }

      updateAudioUI(surah, ayah, state);
    };

    // Handle progress change
    const handleProgressChange = (surah: string, ayah: string, newTime: number) => {
      const key = getAudioKey(surah, ayah);
      const state = audioStates.get(key);
      
      if (state && state.audio) {
        state.audio.currentTime = newTime;
        state.currentTime = newTime;
        updateAudioUI(surah, ayah, state);
      }
    };

    // Event handlers
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.ayah-audio-play-btn') as HTMLButtonElement;
      
      if (button) {
        e.preventDefault();
        e.stopPropagation();
        
        const surah = button.getAttribute('data-surah');
        const ayah = button.getAttribute('data-ayah');
        
        if (surah && ayah) {
          console.log('Play button clicked for surah:', surah, 'ayah:', ayah);
          handlePlayPause(surah, ayah);
        }
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      
      if (target.classList.contains('ayah-audio-progress')) {
        const surah = target.getAttribute('data-surah');
        const ayah = target.getAttribute('data-ayah');
        
        if (surah && ayah) {
          handleProgressChange(surah, ayah, parseFloat(target.value));
        }
      }
    };

    const setupAudioPlayers = () => {
      const playButtons = containerRef.current?.querySelectorAll('.ayah-audio-play-btn');
      const progressBars = containerRef.current?.querySelectorAll('.ayah-audio-progress');
      
      console.log('Found play buttons:', playButtons?.length);
      console.log('Found progress bars:', progressBars?.length);
      
      if (!playButtons || !progressBars || playButtons.length === 0) return;

      // Add event listeners to the container
      if (containerRef.current) {
        containerRef.current.addEventListener('click', handleClick);
        containerRef.current.addEventListener('input', handleInput);
      }
    };

    // Setup audio players after a short delay to ensure DOM is ready
    console.log('Setting up audio players for content:', contentToShow?.substring(0, 100));
    const timer = setTimeout(setupAudioPlayers, 100);
    
    return () => {
      clearTimeout(timer);
      // Clean up event listeners
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleClick);
        containerRef.current.removeEventListener('input', handleInput);
      }
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
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Your Question
                      </h3>
                      
                      {!isEditingQuestion ? (
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {userQuestion}
                        </p>
                      ) : (
                        <textarea
                          id="edit-question-textarea"
                          name="edit-question"
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
              
              {/* Audio player is now integrated into each AyahBox component */}

              <div 
                ref={containerRef}
                className="text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed text-sm p-4 -m-4"
                dangerouslySetInnerHTML={{ __html: processContentLinks(contentToShow) }}
              />
              
              
              

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





