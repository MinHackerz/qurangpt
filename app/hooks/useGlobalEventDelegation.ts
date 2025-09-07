import { useEffect } from 'react';

// Global type declaration for the click handler
declare global {
  interface Window {
    globalTafsirClickHandler?: (e: Event) => void;
  }
}

export const useGlobalEventDelegation = () => {
  useEffect(() => {
    // Audio state management
    const audioStates = new Map<string, { audio: HTMLAudioElement | null; isPlaying: boolean; progressInterval?: NodeJS.Timeout }>();
    let currentPlayingKey: string | null = null;

    const getAudioKey = (surah: string, ayah: string): string => `${surah}-${ayah}`;

    // Function to reset button to play state
    const resetButtonToPlayState = (button: HTMLButtonElement) => {
      const svg = button.querySelector('svg');
      if (svg) {
        svg.innerHTML = '<path d="M8 5v14l11-7z" />';
        // Remove all state classes and add play state class
        button.classList.remove('pause-state', 'loading-state', 'error-state');
        button.classList.add('play-state');
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      }
    };

    // Function to set button to pause state
    const setButtonToPauseState = (button: HTMLButtonElement) => {
      const svg = button.querySelector('svg');
      if (svg) {
        svg.innerHTML = '<path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />';
        // Remove all state classes and add pause state class
        button.classList.remove('play-state', 'loading-state', 'error-state');
        button.classList.add('pause-state');
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
      }
    };

    // Function to get progress color based on audio progress
    // Professional emerald-based gradient that matches the website's theme
    const getProgressColor = (progress: number) => {
      // Create a sophisticated emerald gradient that matches the website's color scheme
      if (progress < 20) {
        return '#34d399'; // emerald-400 - Light, welcoming start
      } else if (progress < 40) {
        return '#10b981'; // emerald-500 - Primary brand color
      } else if (progress < 60) {
        return '#059669'; // emerald-600 - Deeper, more confident
      } else if (progress < 80) {
        return '#047857'; // emerald-700 - Rich, professional
      } else {
        return '#065f46'; // emerald-800 - Deep, completion state
      }
    };

    // Function to update waveform progress with dynamic colors
    const updateWaveformProgress = (surah: string, ayah: string, progress: number) => {
      // Validate progress value
      if (isNaN(progress) || progress < 0) {
        return;
      }
      
      // Clamp progress to 0-100 range
      progress = Math.max(0, Math.min(100, progress));
      
      // Find the waveform container
      const waveformContainer = document.querySelector(`div[data-surah="${surah}"][data-ayah="${ayah}"].cursor-pointer`);
      
      if (!waveformContainer) {
        return;
      }
      
      const bars = waveformContainer.querySelectorAll('.wave-bar');
      if (bars.length === 0) {
        return;
      }
      
      const totalBars = bars.length;
      const activeBars = Math.floor((progress / 100) * totalBars);
      const partialProgress = (progress / 100) * totalBars - activeBars;
      
      // Get the current progress color
      const progressColor = getProgressColor(progress);
      const progressColorRgb = hexToRgb(progressColor);
      
      bars.forEach((bar, index) => {
        const barElement = bar as HTMLElement;
        
        // Remove all progress classes first
        barElement.classList.remove('progress-active', 'progress-partial', 'progress-current');
        
        if (index < activeBars) {
          // Active bars - fully completed with dynamic color
          barElement.classList.add('progress-active');
          barElement.style.setProperty('--progress-color', progressColor);
          barElement.style.setProperty('--progress-color-rgb', progressColorRgb);
          barElement.style.backgroundColor = progressColor;
        } else if (index === activeBars && progress > 0) {
          // Current bar - partial progress with dynamic color
          barElement.classList.add('progress-current');
          barElement.style.setProperty('--progress-opacity', partialProgress.toString());
          barElement.style.setProperty('--progress-color', progressColor);
          barElement.style.setProperty('--progress-color-rgb', progressColorRgb);
          const rgbValues = progressColorRgb.split(', ').map(v => parseInt(v));
          barElement.style.backgroundColor = `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${partialProgress})`;
        } else {
          // Inactive bars - reset to default
          barElement.classList.remove('progress-active', 'progress-current');
          barElement.style.removeProperty('--progress-opacity');
          barElement.style.removeProperty('--progress-color');
          barElement.style.removeProperty('--progress-color-rgb');
          barElement.style.removeProperty('background-color');
        }
      });
    };

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '107, 114, 128'; // fallback to gray
    };

    // Function to format time in MM:SS format
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Function to update duration display
    const updateDurationDisplay = (surah: string, ayah: string, currentTime: number, duration: number) => {
      // Find the audio button first
      const audioButton = document.querySelector(`button[data-surah="${surah}"][data-ayah="${ayah}"].ayah-audio-play-btn`);
      if (!audioButton) return;

      // Find the "Play Recitation" box container (the parent container with the audio controls)
      const playRecitationBox = audioButton.closest('.bg-gray-50, .bg-gray-900') as HTMLElement;
      if (!playRecitationBox) return;

      // Ensure the container has relative positioning
      if (playRecitationBox.style.position !== 'relative') {
        playRecitationBox.style.position = 'relative';
      }

      let durationDisplay = playRecitationBox.querySelector('.duration-display');
      if (!durationDisplay) {
        // Create duration display element positioned in top right of the Play Recitation box
        durationDisplay = document.createElement('div');
        durationDisplay.className = 'duration-display absolute top-3 right-3 text-xs text-gray-500 dark:text-gray-400 font-mono bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded-md backdrop-blur-sm border border-gray-200 dark:border-gray-600';
        playRecitationBox.appendChild(durationDisplay);
      }

      const current = formatTime(currentTime);
      const total = formatTime(duration);
      durationDisplay.textContent = `${current} / ${total}`;
    };

    // Function to clear duration display
    const clearDurationDisplay = (surah: string, ayah: string) => {
      // Find the audio button first
      const audioButton = document.querySelector(`button[data-surah="${surah}"][data-ayah="${ayah}"].ayah-audio-play-btn`);
      if (!audioButton) return;

      // Find the "Play Recitation" box container
      const playRecitationBox = audioButton.closest('.bg-gray-50, .bg-gray-900');
      if (!playRecitationBox) return;

      const durationDisplay = playRecitationBox.querySelector('.duration-display');
      if (durationDisplay) {
        durationDisplay.remove();
      }
    };

    const handleAudioPlayback = async (audioButton: HTMLButtonElement, surah: string, ayah: string) => {
      const key = getAudioKey(surah, ayah);
      let state = audioStates.get(key);

      if (!state) {
        state = { audio: null, isPlaying: false };
        audioStates.set(key, state);
      }

      // Show loading state
      const svg = audioButton.querySelector('svg');
      if (svg) {
        svg.innerHTML = '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="25.133" stroke-dashoffset="25.133"><animate attributeName="stroke-dasharray" dur="1.5s" values="0 25.133;12.566 12.566;0 25.133" repeatCount="indefinite"/></circle>';
        // Remove all state classes and add loading state class
        audioButton.classList.remove('play-state', 'pause-state', 'error-state');
        audioButton.classList.add('loading-state');
        audioButton.style.cursor = 'wait';
      }

      try {
        if (state.isPlaying && state.audio) {
          // Pause current audio
          state.audio.pause();
          state.isPlaying = false;
          currentPlayingKey = null;
          updateWaveformProgress(surah, ayah, 0); // Reset progress
          clearDurationDisplay(surah, ayah); // Clear duration display
          // Clear progress interval
          if (state.progressInterval) {
            clearInterval(state.progressInterval);
            state.progressInterval = undefined;
          }
          resetButtonToPlayState(audioButton);
        } else {
          // Pause all other audio
          audioStates.forEach((otherState, otherKey) => {
            if (otherKey !== key && otherState.audio && otherState.isPlaying) {
              otherState.audio.pause();
              otherState.isPlaying = false;
              // Clear progress interval for other audio
              if (otherState.progressInterval) {
                clearInterval(otherState.progressInterval);
                otherState.progressInterval = undefined;
              }
              // Reset progress for other audio
              const [otherSurah, otherAyah] = otherKey.split('-');
              updateWaveformProgress(otherSurah, otherAyah, 0);
              clearDurationDisplay(otherSurah, otherAyah); // Clear duration display
              // Update other button icons
              const otherButton = document.querySelector(`[data-surah="${otherKey.split('-')[0]}"][data-ayah="${otherKey.split('-')[1]}"].ayah-audio-play-btn`) as HTMLButtonElement;
              if (otherButton) {
                resetButtonToPlayState(otherButton);
              }
            }
          });

          // Load and play new audio
          if (!state.audio) {
            const response = await fetch(`/api/audio?surah=${surah}&ayah=${ayah}`, {
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
              },
              signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success || !data.audioUrl) {
              throw new Error(data.error || 'No audio URL received');
            }

            const audio = new Audio();
            audio.src = data.audioUrl;
            
            // Progress tracking - smooth updates with better error handling
            const updateProgress = () => {
              try {
                if (audio && audio.duration && !isNaN(audio.duration) && audio.duration > 0 && 
                    audio.currentTime >= 0 && !isNaN(audio.currentTime)) {
                  const progress = Math.min(100, Math.max(0, (audio.currentTime / audio.duration) * 100));
                  
                  // Update progress immediately with requestAnimationFrame for smooth updates
                  requestAnimationFrame(() => {
                    updateWaveformProgress(surah, ayah, progress);
                    updateDurationDisplay(surah, ayah, audio.currentTime, audio.duration);
                  });
                }
              } catch (error) {
                // Silent error handling
              }
            };
            
            // Wait for metadata to be loaded before tracking progress
            audio.addEventListener('loadedmetadata', () => {
              // Initial progress update after metadata is loaded
              if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                const initialProgress = (audio.currentTime / audio.duration) * 100;
                updateWaveformProgress(surah, ayah, initialProgress);
                updateDurationDisplay(surah, ayah, audio.currentTime, audio.duration);
              }
            });
            
            // Use timeupdate event for progress tracking (fires every 250ms by default)
            audio.addEventListener('timeupdate', updateProgress);
            
            // Add a higher frequency interval for smoother progress updates (every 100ms)
            const progressInterval = setInterval(() => {
              try {
                if (state && state.isPlaying && state.audio && state.audio.duration && 
                    !isNaN(state.audio.duration) && state.audio.duration > 0 &&
                    state.audio.currentTime >= 0 && !isNaN(state.audio.currentTime)) {
                  const progress = Math.min(100, Math.max(0, (state.audio.currentTime / state.audio.duration) * 100));
                  requestAnimationFrame(() => {
                    updateWaveformProgress(surah, ayah, progress);
                    if (state && state.audio) {
                      updateDurationDisplay(surah, ayah, state.audio.currentTime, state.audio.duration);
                    }
                  });
                }
              } catch (error) {
                // Silent error handling
              }
            }, 100); // Update every 100ms for smooth progress
            
            // Store interval ID for cleanup
            state.progressInterval = progressInterval;
            
            audio.addEventListener('ended', () => {
              if (state) {
                state.isPlaying = false;
                // Clear progress interval
                if (state.progressInterval) {
                  clearInterval(state.progressInterval);
                  state.progressInterval = undefined;
                }
              }
              currentPlayingKey = null;
              updateWaveformProgress(surah, ayah, 0); // Reset progress
              clearDurationDisplay(surah, ayah); // Clear duration display
              resetButtonToPlayState(audioButton);
            });

            audio.addEventListener('error', () => {
              if (state) {
                state.isPlaying = false;
                // Clear progress interval
                if (state.progressInterval) {
                  clearInterval(state.progressInterval);
                  state.progressInterval = undefined;
                }
              }
              updateWaveformProgress(surah, ayah, 0); // Reset progress
              clearDurationDisplay(surah, ayah); // Clear duration display
              if (svg) {
                svg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0.5"/>';
                // Remove all state classes and add error state class
                audioButton.classList.remove('play-state', 'pause-state', 'loading-state');
                audioButton.classList.add('error-state');
                audioButton.style.cursor = 'not-allowed';
              }
            });

            state.audio = audio;
          }

          // Play audio
          await state.audio.play();
          state.isPlaying = true;
          currentPlayingKey = key;
          
          setButtonToPauseState(audioButton);
        }
      } catch (error) {
        state.isPlaying = false;
        if (svg) {
          svg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0.5"/>';
          // Remove all state classes and add error state class
          audioButton.classList.remove('play-state', 'pause-state', 'loading-state');
          audioButton.classList.add('error-state');
          audioButton.style.cursor = 'not-allowed';
        }
      }
    };

    const setupGlobalEventDelegation = () => {
      // Remove any existing global listeners
      if (window.globalTafsirClickHandler) {
        document.removeEventListener('click', window.globalTafsirClickHandler, true);
        document.removeEventListener('click', window.globalTafsirClickHandler, false);
      }

      // Create global click handler
      window.globalTafsirClickHandler = (e: Event) => {
        const target = e.target as HTMLElement;
        
        // Handle clicks for any button with our classes, regardless of container
        const isAudioButton = target.closest('.ayah-audio-play-btn');
        const isTafsirButton = target.closest('.tafsir-toggle-btn, .tafsir-close-btn');
        const isWaveBar = target.classList.contains('wave-bar');
        const waveformElement = target.closest('[data-surah][data-ayah]');
        const isWaveformContainer = waveformElement && waveformElement.classList.contains('cursor-pointer');
        
        if (!isAudioButton && !isTafsirButton && !isWaveBar && !isWaveformContainer) {
          return;
        }

        // Ensure the target element is properly configured for interaction
        if (isAudioButton || isTafsirButton) {
          const button = (isAudioButton || isTafsirButton) as HTMLElement;
          button.style.pointerEvents = 'auto';
          button.style.cursor = 'pointer';
          button.style.position = 'relative';
          button.style.zIndex = '10';
        }

        // Handle tafsir button clicks
        const tafsirButton = target.closest('.tafsir-toggle-btn, .tafsir-close-btn') as HTMLButtonElement;
        if (tafsirButton) {
          e.preventDefault();
          e.stopPropagation();
          
          // Ensure button is always clickable
          tafsirButton.disabled = false;
          tafsirButton.style.pointerEvents = 'auto';
          tafsirButton.style.cursor = 'pointer';
          
          const tafsirId = tafsirButton.getAttribute('data-tafsir-id');
          
          if (tafsirId) {
            // Simple tafsir toggle
            const content = document.getElementById(tafsirId);
            if (content) {
              const isHidden = content.style.display === 'none' || content.style.display === '';
              content.style.display = isHidden ? 'block' : 'none';
            }
          }
          return;
        }

        // Handle audio button clicks
        const audioButton = target.closest('.ayah-audio-play-btn') as HTMLButtonElement;
        if (audioButton) {
          e.preventDefault();
          e.stopPropagation();
          
          // Ensure button is always clickable
          audioButton.disabled = false;
          audioButton.style.pointerEvents = 'auto';
          audioButton.style.cursor = 'pointer';
          
          const surah = audioButton.getAttribute('data-surah');
          const ayah = audioButton.getAttribute('data-ayah');
          
          if (surah && ayah) {
            handleAudioPlayback(audioButton, surah, ayah);
          }
          return;
        }

        // Handle waveform container clicks for seeking
        if (isWaveformContainer) {
          e.preventDefault();
          e.stopPropagation();
          
          const waveformContainer = target.closest('[data-surah][data-ayah]') as HTMLElement;
          const surah = waveformContainer.getAttribute('data-surah');
          const ayah = waveformContainer.getAttribute('data-ayah');
          
          if (surah && ayah) {
            const key = getAudioKey(surah, ayah);
            const state = audioStates.get(key);
            
            if (state && state.audio && state.isPlaying) {
              const rect = waveformContainer.getBoundingClientRect();
              const clickX = (e as MouseEvent).clientX - rect.left;
              const percentage = clickX / rect.width;
              const newTime = percentage * state.audio.duration;
              
              if (!isNaN(newTime) && newTime >= 0 && newTime <= state.audio.duration) {
                state.audio.currentTime = newTime;
                console.log('Seeked to:', newTime, 'seconds');
              }
            }
          }
          return;
        }
      };

      // Add global event listeners
      document.addEventListener('click', window.globalTafsirClickHandler, true);
      document.addEventListener('click', window.globalTafsirClickHandler, false);
    };

    // Setup immediately
    setupGlobalEventDelegation();

    // Add a simple debugging function to check waveform visibility
    (window as any).debugWaveforms = () => {
      const containers = document.querySelectorAll('div[data-surah][data-ayah].cursor-pointer');
      const bars = document.querySelectorAll('.wave-bar');
      console.log('Waveform Debug:', {
        containers: containers.length,
        bars: bars.length,
        containerDetails: Array.from(containers).map(c => ({
          surah: c.getAttribute('data-surah'),
          ayah: c.getAttribute('data-ayah'),
          visible: (c as HTMLElement).offsetParent !== null,
          classes: c.className
        }))
      });
    };

    // Function to update progress colors when theme changes
    const updateProgressColorsForThemeChange = () => {
      // Find all currently playing audio and update their progress colors
      audioStates.forEach((state, key) => {
        if (state.isPlaying && state.audio) {
          const [surah, ayah] = key.split('-');
          const progress = (state.audio.currentTime / state.audio.duration) * 100;
          requestAnimationFrame(() => {
            updateWaveformProgress(surah, ayah, progress);
          });
        }
      });
    };

    // Listen for theme changes
    const themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target === document.documentElement) {
            updateProgressColorsForThemeChange();
          }
        }
      });
    });

    // Observe the html element for class changes (theme changes)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });




    // Intersection observer to ensure buttons work when they come into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const button = entry.target as HTMLElement;
          if (button.classList.contains('ayah-audio-play-btn') || 
              button.classList.contains('tafsir-toggle-btn') || 
              button.classList.contains('tafsir-close-btn')) {
            button.style.pointerEvents = 'auto';
            button.style.cursor = 'pointer';
          }
        }
      });
    }, { threshold: 0.1 });

    // Observe all buttons in the document
    const observeButtons = () => {
      const buttons = document.querySelectorAll('.ayah-audio-play-btn, .tafsir-toggle-btn, .tafsir-close-btn');
      buttons.forEach(button => observer.observe(button));
    };

    // Initial observation
    observeButtons();

    // Re-observe when new content is added and ensure button clickability
    const mutationObserver = new MutationObserver((mutations) => {
      let shouldReobserve = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if the added node contains our buttons
              if (element.querySelector && (
                element.querySelector('.ayah-audio-play-btn') ||
                element.querySelector('.tafsir-toggle-btn') ||
                element.querySelector('.tafsir-close-btn') ||
                element.classList.contains('ayah-audio-play-btn') ||
                element.classList.contains('tafsir-toggle-btn') ||
                element.classList.contains('tafsir-close-btn')
              )) {
                shouldReobserve = true;
                
                // Immediately ensure new buttons are clickable
                const buttons = element.querySelectorAll ? 
                  element.querySelectorAll('.ayah-audio-play-btn, .tafsir-toggle-btn, .tafsir-close-btn') :
                  (element.classList.contains('ayah-audio-play-btn') || 
                   element.classList.contains('tafsir-toggle-btn') || 
                   element.classList.contains('tafsir-close-btn')) ? [element] : [];
                
                buttons.forEach((button) => {
                  const btn = button as HTMLElement;
                  btn.style.pointerEvents = 'auto';
                  btn.style.cursor = 'pointer';
                  btn.style.position = 'relative';
                  btn.style.zIndex = '10';
                  if (btn instanceof HTMLButtonElement) {
                    btn.disabled = false;
                  }
                });
              }
            }
          });
        }
      });
      
      if (shouldReobserve) {
        observeButtons();
      }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Function to ensure waveform progress bars are properly initialized
    const ensureWaveformBarsInitialized = () => {
      const waveformContainers = document.querySelectorAll('div[data-surah][data-ayah].cursor-pointer');
      waveformContainers.forEach(container => {
        const bars = container.querySelectorAll('.wave-bar');
        bars.forEach(bar => {
          const barElement = bar as HTMLElement;
          // Ensure bars have proper base styling
          if (!barElement.style.backgroundColor) {
            barElement.style.backgroundColor = '';
          }
          // Ensure proper classes are applied
          if (!barElement.classList.contains('wave-bar')) {
            barElement.classList.add('wave-bar');
          }
        });
      });
    };

    // Periodic check to ensure all buttons remain clickable and in correct state
    const ensureButtonsClickable = () => {
      const buttons = document.querySelectorAll('.ayah-audio-play-btn, .tafsir-toggle-btn, .tafsir-close-btn');
      if (buttons.length > 0) {
        buttons.forEach(button => {
          const btn = button as HTMLButtonElement;
          btn.disabled = false;
          btn.style.pointerEvents = 'auto';
          btn.style.cursor = 'pointer';
          
          // Ensure audio buttons are in play state if not currently playing
          if (btn.classList.contains('ayah-audio-play-btn')) {
            const surah = btn.getAttribute('data-surah');
            const ayah = btn.getAttribute('data-ayah');
            if (surah && ayah) {
              const key = getAudioKey(surah, ayah);
              const state = audioStates.get(key);
              if (!state || !state.isPlaying) {
                resetButtonToPlayState(btn);
              }
            }
          }
        });
      }
      
      // Also ensure waveform bars are properly initialized
      ensureWaveformBarsInitialized();
    };

    // Run immediately and then periodically
    ensureButtonsClickable();
    const intervalId = setInterval(ensureButtonsClickable, 1000);

    // Cleanup on unmount
    return () => {
      if (window.globalTafsirClickHandler) {
        document.removeEventListener('click', window.globalTafsirClickHandler, true);
        document.removeEventListener('click', window.globalTafsirClickHandler, false);
        delete window.globalTafsirClickHandler;
      }
      observer.disconnect();
      mutationObserver.disconnect();
      themeObserver.disconnect();
      clearInterval(intervalId);
      
      // Cleanup audio states
      audioStates.forEach((state) => {
        if (state.audio) {
          state.audio.pause();
          state.audio.src = '';
        }
        if (state.progressInterval) {
          clearInterval(state.progressInterval);
        }
      });
      audioStates.clear();
    };
  }, []);
};
