import { useEffect } from 'react';

// Global type declaration for the click handler
declare global {
  interface Window {
    globalTafsirClickHandler?: (e: Event) => void;
  }
}

export const useGlobalEventDelegation = () => {
  useEffect(() => {
    console.log('useGlobalEventDelegation hook is running');
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
    const getProgressColor = (progress: number) => {
      // Create a smooth color gradient from blue to green to indicate progress
      if (progress < 25) {
        return '#3b82f6'; // Blue - start
      } else if (progress < 50) {
        return '#8b5cf6'; // Purple
      } else if (progress < 75) {
        return '#10b981'; // Emerald
      } else {
        return '#059669'; // Green - complete
      }
    };

    // Function to update waveform progress with dynamic colors
    const updateWaveformProgress = (surah: string, ayah: string, progress: number) => {
      console.log('🎵 updateWaveformProgress called:', { surah, ayah, progress });
      
      // Validate progress value
      if (isNaN(progress) || progress < 0) {
        console.log('❌ Invalid progress value:', progress);
        return;
      }
      
      // Clamp progress to 0-100 range
      progress = Math.max(0, Math.min(100, progress));
      
      // Find the waveform container
      const waveformContainer = document.querySelector(`[data-surah="${surah}"][data-ayah="${ayah}"]`);
      
      if (!waveformContainer) {
        console.log('❌ No waveform container found for:', { surah, ayah });
        // Try to find any waveform container for debugging
        const allContainers = document.querySelectorAll('[data-surah][data-ayah]');
        console.log('Available containers:', Array.from(allContainers).map(c => ({
          surah: c.getAttribute('data-surah'),
          ayah: c.getAttribute('data-ayah')
        })));
        return;
      }
      
      const bars = waveformContainer.querySelectorAll('.wave-bar');
      if (bars.length === 0) {
        console.log('❌ No wave bars found in container');
        return;
      }
      
      const totalBars = bars.length;
      const activeBars = Math.floor((progress / 100) * totalBars);
      const partialProgress = (progress / 100) * totalBars - activeBars;
      
      // Get the current progress color
      const progressColor = getProgressColor(progress);
      const progressColorRgb = hexToRgb(progressColor);
      
      console.log('🎯 Updating bars with color:', { totalBars, activeBars, progress, partialProgress, progressColor });
      
      bars.forEach((bar, index) => {
        const barElement = bar as HTMLElement;
        
        // Remove all progress classes first
        barElement.classList.remove('progress-active', 'progress-partial', 'progress-current');
        
        if (index < activeBars) {
          // Active bars - fully completed with dynamic color
          barElement.classList.add('progress-active');
          barElement.style.setProperty('--progress-color', progressColor);
          barElement.style.setProperty('--progress-color-rgb', progressColorRgb);
          console.log(`✅ Bar ${index} set to active with color:`, progressColor);
        } else if (index === activeBars && progress > 0) {
          // Current bar - partial progress with dynamic color
          barElement.classList.add('progress-current');
          barElement.style.setProperty('--progress-opacity', partialProgress.toString());
          barElement.style.setProperty('--progress-color', progressColor);
          barElement.style.setProperty('--progress-color-rgb', progressColorRgb);
          console.log(`🔄 Bar ${index} set to partial progress:`, partialProgress, 'color:', progressColor);
        } else {
          // Inactive bars - reset to default
          barElement.style.removeProperty('--progress-opacity');
          barElement.style.removeProperty('--progress-color');
          barElement.style.removeProperty('--progress-color-rgb');
          console.log(`⚪ Bar ${index} set to inactive (default)`);
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

    const handleAudioPlayback = async (audioButton: HTMLButtonElement, surah: string, ayah: string) => {
      console.log('handleAudioPlayback called with:', { surah, ayah, audioButton });
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
          // Clear progress interval
          if (state.progressInterval) {
            clearInterval(state.progressInterval);
            state.progressInterval = undefined;
          }
          resetButtonToPlayState(audioButton);
          console.log('Audio paused');
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
              // Update other button icons
              const otherButton = document.querySelector(`[data-surah="${otherKey.split('-')[0]}"][data-ayah="${otherKey.split('-')[1]}"].ayah-audio-play-btn`) as HTMLButtonElement;
              if (otherButton) {
                resetButtonToPlayState(otherButton);
              }
            }
          });

          // Load and play new audio
          if (!state.audio) {
            console.log('Fetching audio for:', { surah, ayah });
            const response = await fetch(`/api/audio?surah=${surah}&ayah=${ayah}`, {
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
              },
              signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
              console.error('Audio API error:', response.status, response.statusText);
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Audio API response:', data);
            
            if (!data.success || !data.audioUrl) {
              console.error('No audio URL received:', data);
              throw new Error(data.error || 'No audio URL received');
            }

            const audio = new Audio();
            audio.src = data.audioUrl;
            
            // Progress tracking - smooth updates
            const updateProgress = () => {
              if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                const progress = (audio.currentTime / audio.duration) * 100;
                console.log('🎵 Audio progress update:', {
                  currentTime: audio.currentTime,
                  duration: audio.duration,
                  progress: progress.toFixed(2) + '%',
                  surah,
                  ayah
                });
                // Update progress immediately
                updateWaveformProgress(surah, ayah, progress);
              } else {
                console.log('⏳ Audio duration not available yet:', {
                  duration: audio.duration,
                  readyState: audio.readyState,
                  surah,
                  ayah
                });
              }
            };
            
            // Wait for metadata to be loaded before tracking progress
            audio.addEventListener('loadedmetadata', () => {
              console.log('📊 Audio metadata loaded:', {
                duration: audio.duration,
                surah,
                ayah
              });
              // Initial progress update after metadata is loaded
              if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                const initialProgress = (audio.currentTime / audio.duration) * 100;
                updateWaveformProgress(surah, ayah, initialProgress);
              }
            });
            
            // Use timeupdate event for progress tracking (fires every 250ms by default)
            audio.addEventListener('timeupdate', updateProgress);
            
            // Add a higher frequency interval for smoother progress updates (every 100ms)
            const progressInterval = setInterval(() => {
              if (state && state.isPlaying && state.audio && state.audio.duration && !isNaN(state.audio.duration) && state.audio.duration > 0) {
                const progress = (state.audio.currentTime / state.audio.duration) * 100;
                updateWaveformProgress(surah, ayah, progress);
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
              resetButtonToPlayState(audioButton);
              console.log('Audio ended');
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
              if (svg) {
                svg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" opacity="0.5"/>';
                // Remove all state classes and add error state class
                audioButton.classList.remove('play-state', 'pause-state', 'loading-state');
                audioButton.classList.add('error-state');
                audioButton.style.cursor = 'not-allowed';
              }
              console.log('Audio error occurred');
            });

            state.audio = audio;
          }

          // Play audio
          console.log('Attempting to play audio:', state.audio.src);
          await state.audio.play();
          state.isPlaying = true;
          currentPlayingKey = key;
          console.log('Audio playing successfully');
          
          setButtonToPauseState(audioButton);
        }
      } catch (error) {
        console.error('Audio playback error:', error);
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
      console.log('Setting up global event delegation');
      // Remove any existing global listeners
      if (window.globalTafsirClickHandler) {
        document.removeEventListener('click', window.globalTafsirClickHandler, true);
        document.removeEventListener('click', window.globalTafsirClickHandler, false);
      }

      // Create global click handler
      window.globalTafsirClickHandler = (e: Event) => {
        const target = e.target as HTMLElement;
        console.log('Global click handler triggered:', target, target.tagName, target.className);
        
        // Handle clicks for any button with our classes, regardless of container
        const isAudioButton = target.closest('.ayah-audio-play-btn');
        
        // Debug logging for audio button clicks
        if (isAudioButton) {
          console.log('Audio button clicked:', isAudioButton);
          console.log('Button attributes:', {
            surah: isAudioButton.getAttribute('data-surah'),
            ayah: isAudioButton.getAttribute('data-ayah'),
            classes: isAudioButton.className
          });
        }
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
      console.log('Global event listeners added');
      
      // Add a simple test listener to verify clicks are being captured
      document.addEventListener('click', (e) => {
        console.log('Simple click test:', e.target);
      }, true);
    };

    // Setup immediately
    setupGlobalEventDelegation();
    

    
    // Add global test function for debugging
    (window as any).testWaveformProgress = (surah: string, ayah: string, progress: number) => {
      console.log('🧪 Manual test called:', { surah, ayah, progress });
      updateWaveformProgress(surah, ayah, progress);
    };
    
    // Add function to test progress animation
    (window as any).testProgressAnimation = (surah: string, ayah: string) => {
      console.log('🎬 Testing progress animation for:', { surah, ayah });
      let progress = 0;
      const interval = setInterval(() => {
        updateWaveformProgress(surah, ayah, progress);
        progress += 2;
        if (progress > 100) {
          clearInterval(interval);
          console.log('🎬 Animation test complete');
        }
      }, 100);
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
            console.log('Theme change detected, updating progress colors');
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
    
    // Add function to test all waveform elements
    (window as any).testAllWaveforms = () => {
      console.log('🔍 Testing all waveform elements...');
      const allContainers = document.querySelectorAll('[data-surah][data-ayah]');
      const allWaveBars = document.querySelectorAll('.wave-bar');
      console.log('Found containers:', allContainers.length);
      console.log('Found wave bars:', allWaveBars.length);
      
      allContainers.forEach((container, index) => {
        const surah = container.getAttribute('data-surah');
        const ayah = container.getAttribute('data-ayah');
        const bars = container.querySelectorAll('.wave-bar');
        console.log(`Container ${index}:`, { surah, ayah, bars: bars.length });
        
        // Test if we can find this specific container
        const testContainer = document.querySelector(`[data-surah="${surah}"][data-ayah="${ayah}"]`);
        console.log(`Test selector for ${surah}-${ayah}:`, testContainer ? '✅ Found' : '❌ Not found');
      });
    };

    // Add function to test color changes
    (window as any).testColorChanges = (surah: string, ayah: string) => {
      console.log('🌈 Testing color changes for:', { surah, ayah });
      
      // Test different progress levels to show color changes
      const progressLevels = [0, 20, 40, 60, 80, 100];
      let currentIndex = 0;
      
      const testInterval = setInterval(() => {
        if (currentIndex < progressLevels.length) {
          const progress = progressLevels[currentIndex];
          updateWaveformProgress(surah, ayah, progress);
          console.log(`🎨 Progress: ${progress}% - Color: ${getProgressColor(progress)}`);
          currentIndex++;
        } else {
          clearInterval(testInterval);
          console.log('🎬 Color test complete!');
          
          // Reset after 2 seconds
          setTimeout(() => {
            updateWaveformProgress(surah, ayah, 0);
            console.log('🔄 Reset to default');
          }, 2000);
        }
      }, 800);
    };

    // Add function to debug current audio state
    (window as any).debugAudioState = () => {
      console.log('🔍 Debugging audio states:');
      audioStates.forEach((state, key) => {
        console.log(`Key: ${key}`, {
          hasAudio: !!state.audio,
          isPlaying: state.isPlaying,
          duration: state.audio?.duration,
          currentTime: state.audio?.currentTime,
          readyState: state.audio?.readyState,
          hasProgressInterval: !!state.progressInterval
        });
      });
    };

    // Add function to force progress update for testing
    (window as any).forceProgressUpdate = (surah: string, ayah: string, progress: number) => {
      console.log('🔧 Force updating progress:', { surah, ayah, progress });
      updateWaveformProgress(surah, ayah, progress);
    };



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
      console.log('Found buttons to observe:', buttons.length, buttons);
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

    // Periodic check to ensure all buttons remain clickable and in correct state
    const ensureButtonsClickable = () => {
      const buttons = document.querySelectorAll('.ayah-audio-play-btn, .tafsir-toggle-btn, .tafsir-close-btn');
      if (buttons.length > 0) {
        console.log('Found buttons in periodic check:', buttons.length, buttons);
        buttons.forEach(button => {
          const btn = button as HTMLButtonElement;
          console.log('Button details:', {
            tagName: btn.tagName,
            className: btn.className,
            dataSurah: btn.getAttribute('data-surah'),
            dataAyah: btn.getAttribute('data-ayah')
          });
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
