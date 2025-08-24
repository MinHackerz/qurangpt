'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState, useCallback } from 'react';
import { preloadAudioMetadata, getCachedAudioMetadata, setCachedAudioMetadata, formatTime } from '../utils/audioUtils';

interface ResponseSectionProps {
  showSummary: boolean;
  summary: string;
  copyContent: () => void;
  copied: boolean;
  onAudioPlay: (ayahId: string, globalAyahNumber: string) => void;
  onAudioPause: (ayahId: string) => void;
  onAudioEnd: (ayahId: string) => void;
  isAudioPlaying: (ayahId: string) => boolean;
  isAudioActive: (ayahId: string) => boolean;
  getAudioProgress: () => { currentTime: number; duration: number; progress: number };
  seekToTime: (timeInSeconds: number) => boolean;
  displayedContent?: string; // Content to display (could be translated)
}

export default function ResponseSection({ 
  showSummary, 
  summary, 
  copyContent, 
  copied,
  onAudioPlay,
  onAudioPause,
  onAudioEnd,
  isAudioPlaying,
  isAudioActive,
  getAudioProgress,
  seekToTime,
  displayedContent
}: ResponseSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Process content to set up audio player functionality
  useEffect(() => {
    if (!contentToShow || !containerRef.current) return;

    // Preload audio metadata first
    preloadAllAudioMetadata();

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      // Find all enhanced audio players
      const audioPlayers = containerRef.current?.querySelectorAll('.enhanced-audio-player');
      
      if (!audioPlayers) return;
      
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
    }, 100);
    
    return () => clearTimeout(timer);
  }, [contentToShow, onAudioPlay, onAudioPause, isAudioPlaying, preloadAllAudioMetadata]);

  // Update UI when audio state changes
  useEffect(() => {
    if (!contentToShow || !containerRef.current) return;

    const updateAudioPlayerUI = () => {
      if (!containerRef.current) return;
      const audioPlayers = containerRef.current.querySelectorAll('.enhanced-audio-player');
      
      audioPlayers.forEach((player) => {
        const playBtn = player.querySelector('.play-pause-btn') as HTMLButtonElement;
        const playIcon = player.querySelector('.play-icon') as HTMLElement;
        const pauseIcon = player.querySelector('.pause-icon') as HTMLElement;
        const statusText = player.querySelector('.status-text') as HTMLElement;
        const statusIndicator = player.querySelector('.status-indicator') as HTMLElement;
        
        if (!playBtn || !playIcon || !pauseIcon || !statusText || !statusIndicator) return;
        
        const ayahId = playBtn.getAttribute('data-ayah-id');
        if (!ayahId) return;
        
        const isPlaying = isAudioPlaying(ayahId);
        const isActive = isAudioActive(ayahId);
        
        if (isPlaying) {
          playIcon.classList.add('hidden');
          pauseIcon.classList.remove('hidden');
          statusText.textContent = 'Playing';
          statusIndicator.classList.remove('hidden');
          playBtn.classList.add('hover:shadow-xl');
        } else {
          playIcon.classList.remove('hidden');
          pauseIcon.classList.add('hidden');
          statusText.textContent = 'Click to play';
          statusIndicator.classList.add('hidden');
          playBtn.classList.remove('hover:shadow-xl');
        }
      });
    };

    // Update UI immediately and then on audio state changes
    updateAudioPlayerUI();
    
    const timer = setInterval(updateAudioPlayerUI, 100);
    
    return () => clearInterval(timer);
  }, [contentToShow, isAudioPlaying, isAudioActive]);

  // Re-setup audio players when content changes
  useEffect(() => {
    if (!contentToShow || !containerRef.current) return;

    // Add a longer delay to ensure DOM is fully updated
    const timer = setTimeout(() => {
      // Find all enhanced audio players
      const audioPlayers = containerRef.current?.querySelectorAll('.enhanced-audio-player');
      
      if (!audioPlayers) return;
      
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
    }, 500);
    
    return () => clearTimeout(timer);
  }, [contentToShow, onAudioPlay, onAudioPause, isAudioPlaying]);

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
          
          // Update progress bar
          progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
          
          // Update time displays
          currentTimeEl.textContent = formatTime(currentTime);
          totalDurationEl.textContent = duration > 0 ? formatTime(duration) : '--:--';
          timeDisplayEl.textContent = formatTime(currentTime);
          
          // Update slider value
          progressSlider.value = progress.toString();
          
        } else {
          // Reset progress for inactive players but keep duration if available
          progressFill.style.width = '0%';
          currentTimeEl.textContent = '0:00';
          
          // Try to get cached duration for this player
          const globalAyahNumber = player.getAttribute('data-global-ayah');
          if (globalAyahNumber) {
            const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
            const cachedDuration = getCachedAudioMetadata(audioUrl);
            totalDurationEl.textContent = cachedDuration ? formatTime(cachedDuration) : '--:--';
          } else {
            totalDurationEl.textContent = '--:--';
          }
          
          timeDisplayEl.textContent = '--:--';
          progressSlider.value = '0';
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
            
            {/* Header with copy button */}
            <div className="relative p-6 md:p-8 pb-4 md:pb-6 bg-gray-50 dark:bg-gray-900">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyContent}
                className={`absolute top-4 md:top-6 right-4 md:right-6 z-20 overflow-hidden w-12 h-12 rounded-full text-sm font-medium transition-all duration-500 transform flex items-center justify-center ${
                  copied
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white scale-105'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500'
                }`}
              >
                {/* Animated background ripple effect */}
                <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
                  copied 
                    ? 'bg-gradient-to-r from-emerald-400 to-green-400 opacity-100 scale-110' 
                    : 'opacity-0 scale-95'
                }`} />
                
                {/* Success checkmark animation */}
                <motion.div 
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                    copied ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                  }`}
                  animate={copied ? { scale: [0.75, 1.1, 1], opacity: [0, 1, 1] } : {}}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <motion.path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2.5" 
                      d="M5 13l4 4L19 7"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={copied ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </svg>
                </motion.div>
                
                {/* Default content with slide animation */}
                <motion.div 
                  className={`relative z-10 transition-all duration-400 ${
                    copied ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  }`}
                  animate={copied ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ClipboardIcon className="w-5 h-5 transition-colors duration-200" />
                </motion.div>
                
                {/* Subtle sparkle effect */}
                <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
                  copied ? 'opacity-100' : 'opacity-0'
                }`}>
                  <div className="absolute top-1 right-2 w-1 h-1 bg-white rounded-full animate-pulse" />
                  <div className="absolute top-3 right-1 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-150" />
                  <div className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full animate-pulse delay-300" />
                </div>
              </motion.button>
              
              <div className="flex items-center mb-6">
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
              </div>
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
