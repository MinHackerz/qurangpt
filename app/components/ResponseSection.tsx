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
  onCopyAIContent
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
        console.warn(`Failed to preload metadata for ayah ${globalAyahNumber}:`, error);
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
            console.error('Audio player error after translation:', error);
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
            newPlayBtn.classList.remove('hover:shadow-xl');
          } else {
            // Play audio
            await onAudioPlay(ayahId, globalAyahNumber);
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
            statusText.textContent = 'Playing';
            statusIndicator.classList.remove('hidden');
            newPlayBtn.classList.add('hover:shadow-xl');
          }
        } catch (error) {
          console.error('Audio player error:', error);
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
          className="relative mb-20 max-w-6xl mx-auto px-4"
        >
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Top accent bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-800 dark:bg-gray-200"></div>
            
            {/* Header */}
            <div className="relative p-6 md:p-8 pb-4 md:pb-6 bg-gray-50 dark:bg-gray-900">
              
              <div className="flex items-center mb-3">
                {/* Modern Icon Container */}
                <div className="relative mr-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-white rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-300">
                    <svg className="w-6 h-6 md:w-7 md:h-7 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  {/* Subtle accent line */}
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-transparent via-slate-400 dark:via-slate-500 to-transparent rounded-full"></div>
                </div>
                
                {/* Header Content */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200 tracking-tight">
                      QuranGPT
                    </h2>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 tracking-wide uppercase">
                      Divine Guidance from the Holy Quran
                    </p>
                    <div className="w-1 h-1 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
                  </div>
                </div>

                {/* Copy AI Content Button */}
                {onCopyAIContent && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCopyAIContent}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-300 ${
                      showCopySuccess 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                    } shadow-sm hover:shadow-md`}
                    title="Copy AI-generated content only"
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )}
              </div>

              {/* Remove the separate copy success notification since it's now integrated into the button */}
            </div>

            {/* Content with sophisticated typography */}
            <div className="px-6 md:px-8 pb-6 md:pb-8">
              <div className="prose dark:prose-invert prose-gray max-w-none">
                <div 
                  ref={containerRef}
                  className="text-gray-700 dark:text-gray-300 space-y-6 leading-relaxed text-base md:text-lg"
                  dangerouslySetInnerHTML={{ __html: processContentLinks(contentToShow) }}
                />
                
                {/* Audio players are now rendered inline with each ayah */}
              </div>
            </div>


          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
