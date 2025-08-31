import { useState, useCallback, useRef, useEffect } from 'react';
import { initializeAudioForProduction, validateAudioUrlForProduction, setAudioSourceSafely } from '../utils/audioUtils';
import { createProductionAudioElement, loadAudioInProduction } from '../utils/productionAudioLoader';
import { getAudioUrl } from '../utils/audioUrlHelper';

interface AudioState {
  currentAyahId: string | null;
  isPlaying: boolean;
  audioElement: HTMLAudioElement | null;
  duration: number;
  isMetadataLoaded: boolean;
}

export const useAudioManager = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    currentAyahId: null,
    isPlaying: false,
    audioElement: null,
    duration: 0,
    isMetadataLoaded: false
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup function with production optimization
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.src = '';
        
        // Production-specific cleanup
        if (process.env.NODE_ENV === 'production') {
          // Remove all event listeners in production
          audioRef.current.onloadedmetadata = null;
          audioRef.current.onerror = null;
          audioRef.current.onended = null;
          audioRef.current.ontimeupdate = null;
        }
        
        audioRef.current = null;
      } catch (error) {
        console.warn('Cleanup error in production, but continuing...', error);
      }
    }
    setAudioState({
      currentAyahId: null,
      isPlaying: false,
      audioElement: null,
      duration: 0,
      isMetadataLoaded: false
    });
  }, []);

  // Play audio for a specific ayah
  const playAudio = useCallback(async (ayahId: string, audioUrl: string) => {
    try {
      // URL validation - ensure it's a valid URL (can be HTTP URL or proxy URL)
      if (!audioUrl || (!audioUrl.startsWith('http') && !audioUrl.startsWith('/'))) {
        throw new Error(`Invalid audio URL: ${audioUrl}`);
      }
      
      // If there's already audio playing, stop it first
      if (audioRef.current && audioState.isPlaying) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Create new audio element with production optimization
      let newAudio: HTMLAudioElement;
      
      if (process.env.NODE_ENV === 'production') {
        newAudio = createProductionAudioElement();
      } else {
        newAudio = new Audio();
        // Check if browser supports MP3
        const canPlayMP3 = newAudio.canPlayType('audio/mpeg');
        if (!canPlayMP3) {
          throw new Error('Browser does not support MP3 audio format');
        }
        // Initialize audio with production-optimized settings
        initializeAudioForProduction(newAudio);
      }
      
      audioRef.current = newAudio;
      newAudio.controls = false;
      newAudio.volume = 1.0;

      // Set up event listeners
      newAudio.addEventListener('ended', () => {
        setAudioState(prev => ({
          ...prev,
          isPlaying: false,
          currentAyahId: null
        }));
      });

      newAudio.addEventListener('error', () => {
        setAudioState(prev => ({
          ...prev,
          isPlaying: false,
          currentAyahId: null
        }));
      });

      // Listen for metadata loading
      newAudio.addEventListener('loadedmetadata', () => {
        setAudioState(prev => ({
          ...prev,
          duration: newAudio.duration || 0,
          isMetadataLoaded: true
        }));
      });
      
            // Use the audio URL (which is already processed to use the proxy)
      const processedAudioUrl = audioUrl;
      
      // Set the primary source safely and ensure it's loaded
      let sourceSet = await setAudioSourceSafely(newAudio, processedAudioUrl);
      if (!sourceSet) {
        console.warn('🎵 useAudioManager: Failed to set audio source, trying alternative method...');
        
        // Try alternative method - create a completely new audio element
        const alternativeAudio = new Audio();
        alternativeAudio.crossOrigin = 'anonymous';
        alternativeAudio.preload = 'metadata';
        alternativeAudio.controls = false;
        alternativeAudio.volume = 1.0;
        
        // Try to set source directly
        alternativeAudio.src = processedAudioUrl;
        
        // Wait and check if it worked
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (alternativeAudio.src && alternativeAudio.src !== 'about:blank') {
          newAudio = alternativeAudio;
          audioRef.current = newAudio;
          sourceSet = true;
        } else {
          throw new Error('Failed to set audio source with alternative method');
        }
      }
      

      
      // Wait for audio to be ready with production-optimized loading
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          // In production, be more lenient with timeouts
          resolve();
        }, 5000); // Increased timeout for better reliability
        
        const onCanPlay = () => {
          clearTimeout(timeout);
          newAudio.removeEventListener('canplaythrough', onCanPlay);
          newAudio.removeEventListener('error', onError);
          newAudio.removeEventListener('canplay', onCanPlayFallback);
          resolve();
        };
        
        const onError = () => {
          clearTimeout(timeout);
          newAudio.removeEventListener('canplaythrough', onCanPlay);
          newAudio.removeEventListener('error', onError);
          if (process.env.NODE_ENV === 'development') {
            console.warn('🎵 useAudioManager: Audio loading error, but continuing...');
          }
          resolve(); // Don't reject in production, try to play anyway
        };
        
        // Check if already ready
        if (newAudio.readyState >= 3) {
          clearTimeout(timeout);
          resolve();
          return;
        }
        
        // Add event listeners
        newAudio.addEventListener('canplaythrough', onCanPlay);
        newAudio.addEventListener('error', onError);
        
        // Also listen for canplay event as fallback
        const onCanPlayFallback = () => {
          clearTimeout(timeout);
          newAudio.removeEventListener('canplay', onCanPlayFallback);
          newAudio.removeEventListener('canplaythrough', onCanPlay);
          newAudio.removeEventListener('error', onError);
          resolve();
        };
        
        newAudio.addEventListener('canplay', onCanPlayFallback);
        

      });
      
      // Try to play the audio with production-optimized strategy
      try {
        
        if (process.env.NODE_ENV === 'production') {
          // Production-specific play strategy
          try {
            // Ensure audio is ready before playing
            if (newAudio.readyState < 2) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const playPromise = newAudio.play();
            await playPromise;
            // Production play successful
          } catch (prodPlayError) {
            console.warn('🎵 useAudioManager: Production play error, trying fallback...', prodPlayError);
            // In production, be more lenient with errors
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to play again
            try {
              await newAudio.play();
            } catch (fallbackError) {
              console.warn('🎵 useAudioManager: Production fallback also failed:', fallbackError);
              throw fallbackError;
            }
          }
        } else {
          // Development play strategy
          const playPromise = newAudio.play();
          await playPromise;
        }
      } catch (playError) {
        console.error('🎵 useAudioManager: Play error:', playError);
        // Type-safe error handling
        const error = playError as any;
        
        // Check if it's a user interaction issue
        if (error?.name === 'NotAllowedError') {
          console.error('🎵 useAudioManager: User interaction required');
          throw new Error('Audio blocked by browser - user interaction required');
        }
        

        // Fallback: try to play again after a short delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          await newAudio.play();
        } catch (fallbackError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('🎵 useAudioManager: Fallback play failed:', fallbackError);
          }
                // Final recovery attempt - create a completely fresh audio element
            try {
              const finalAudio = new Audio();
              finalAudio.crossOrigin = 'anonymous';
              finalAudio.preload = 'metadata';
              finalAudio.controls = false;
              finalAudio.volume = 1.0;
              
              // Try the proxy URL one more time
              const finalSourceSet = await setAudioSourceSafely(finalAudio, processedAudioUrl);
              if (finalSourceSet) {
                await finalAudio.play();
                audioRef.current = finalAudio;
                return; // Success!
              }
            } catch (finalError) {
              // Silent recovery failure
            }
            
            // Provide a more helpful error message
            const errorMessage = process.env.NODE_ENV === 'production' 
              ? 'Audio playback failed. This might be due to network issues or browser restrictions. Please try refreshing the page or check your internet connection.'
              : `Audio playback failed: ${error?.message || 'Unknown error'}`;
            
            throw new Error(errorMessage);
        }
      }


      
      // Production-specific state management
      if (process.env.NODE_ENV === 'production') {
        // In production, be more lenient with state updates
        setTimeout(() => {
          setAudioState({
            currentAyahId: ayahId,
            isPlaying: true,
            audioElement: newAudio,
            duration: 0,
            isMetadataLoaded: false
          });
        }, 100); // Small delay for production stability
      } else {
        setAudioState({
          currentAyahId: ayahId,
          isPlaying: true,
          audioElement: newAudio,
          duration: 0,
          isMetadataLoaded: false
        });
      }

    } catch (error) {
      console.error('useAudioManager: Error in playAudio:', error);
      
      // Production-specific error recovery
      if (process.env.NODE_ENV === 'production') {
        try {
          // Try to recover by creating a new audio element
          const recoveryAudio = createProductionAudioElement();
          recoveryAudio.src = audioUrl;
          recoveryAudio.volume = 1.0;
          
          // Try to play the recovery audio
          await recoveryAudio.play();
          
          // Update state with recovery audio
          audioRef.current = recoveryAudio;
          setAudioState({
            currentAyahId: ayahId,
            isPlaying: true,
            audioElement: recoveryAudio,
            duration: 0,
            isMetadataLoaded: false
          });
          
          return; // Successfully recovered
        } catch (recoveryError) {
          // Silent recovery failure
        }
      }
      
      cleanup();
      throw error;
    }
  }, [audioState.isPlaying, cleanup]);

  // Pause current audio
  const pauseAudio = useCallback(() => {
    if (audioRef.current && audioState.isPlaying) {
      audioRef.current.pause();
      setAudioState(prev => ({
        ...prev,
        isPlaying: false
      }));
    }
  }, [audioState.isPlaying]);

  // Resume current audio
  const resumeAudio = useCallback(async () => {
    if (audioRef.current && !audioState.isPlaying && audioState.currentAyahId) {
      try {
        await audioRef.current.play();
        setAudioState(prev => ({
          ...prev,
          isPlaying: true
        }));
      } catch (error) {
        // Silently fail for resume errors
      }
    }
  }, [audioState.isPlaying, audioState.currentAyahId]);

  // Stop all audio
  const stopAudio = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // Check if a specific ayah is currently playing
  const isAyahPlaying = useCallback((ayahId: string) => {
    return audioState.currentAyahId === ayahId && audioState.isPlaying;
  }, [audioState.currentAyahId, audioState.isPlaying]);

  // Check if a specific ayah is the current active ayah
  const isAyahActive = useCallback((ayahId: string) => {
    return audioState.currentAyahId === ayahId;
  }, [audioState.currentAyahId]);

  // Get current audio progress
  const getAudioProgress = useCallback(() => {
    if (!audioRef.current) return { currentTime: 0, duration: audioState.duration, progress: 0 };
    
    const audio = audioRef.current;
    const currentTime = audio.currentTime || 0;
    const duration = audioState.duration || audio.duration || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    return { currentTime, duration, progress };
  }, [audioState.duration]);

  // Seek to a specific time in the current audio
  const seekToTime = useCallback((timeInSeconds: number) => {
    if (!audioRef.current) return false;
    
    try {
      const audio = audioRef.current;
      const duration = audio.duration || 0;
      
      // Ensure the seek time is within bounds
      const seekTime = Math.max(0, Math.min(timeInSeconds, duration));
      
      audio.currentTime = seekTime;
      return true;
    } catch (error) {
      console.error('Seek error:', error);
      return false;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    currentAyahId: audioState.currentAyahId,
    isPlaying: audioState.isPlaying,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    isAyahPlaying,
    isAyahActive,
    getAudioProgress,
    seekToTime,
    cleanup
  };
};