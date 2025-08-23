import { useState, useCallback, useRef, useEffect } from 'react';

interface AudioState {
  currentAyahId: string | null;
  isPlaying: boolean;
  audioElement: HTMLAudioElement | null;
}

export const useAudioManager = () => {
  const [audioState, setAudioState] = useState<AudioState>({
    currentAyahId: null,
    isPlaying: false,
    audioElement: null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setAudioState({
      currentAyahId: null,
      isPlaying: false,
      audioElement: null
    });
  }, []);

  // Play audio for a specific ayah
  const playAudio = useCallback(async (ayahId: string, audioUrl: string) => {
    try {
      // Validate URL
      if (!audioUrl || !audioUrl.startsWith('http')) {
        throw new Error(`Invalid audio URL: ${audioUrl}`);
      }
      
      // If there's already audio playing, stop it first
      if (audioRef.current && audioState.isPlaying) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Create new audio element
      const newAudio = new Audio();
      audioRef.current = newAudio;
      
      // Check if browser supports MP3
      const canPlayMP3 = newAudio.canPlayType('audio/mpeg');
      if (!canPlayMP3) {
        throw new Error('Browser does not support MP3 audio format');
      }
      
      // Set audio properties
      newAudio.preload = 'metadata';
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
      
      // Multiple quality options as fallback
      const audioUrls = [
        audioUrl, // Original 128kbps
        audioUrl.replace('/128/', '/64/'), // 64kbps fallback
        audioUrl.replace('/128/', '/192/') // 192kbps fallback
      ];
      
      // Set the primary source
      newAudio.src = audioUrl;

      // Wait for audio to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(); // Don't reject, just try to play
        }, 5000);
        
        const onCanPlay = () => {
          clearTimeout(timeout);
          newAudio.removeEventListener('canplaythrough', onCanPlay);
          newAudio.removeEventListener('error', onError);
          resolve();
        };
        
        const onError = () => {
          clearTimeout(timeout);
          newAudio.removeEventListener('canplaythrough', onCanPlay);
          newAudio.removeEventListener('error', onError);
          reject(new Error('Audio failed to load'));
        };
        
        // Check if already ready
        if (newAudio.readyState >= 3) {
          clearTimeout(timeout);
          resolve();
          return;
        }
        
        newAudio.addEventListener('canplaythrough', onCanPlay);
        newAudio.addEventListener('error', onError);
      });
      
      // Try to play the audio
      try {
        const playPromise = newAudio.play();
        await playPromise;
      } catch (playError) {
        // Type-safe error handling
        const error = playError as any;
        
        // Check if it's a user interaction issue
        if (error?.name === 'NotAllowedError') {
          throw new Error('Audio blocked by browser - user interaction required');
        }
        
        // Fallback: try to play again after a short delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          await newAudio.play();
        } catch (fallbackError) {
          // Try different quality sources
          for (let i = 1; i < audioUrls.length; i++) {
            try {
              newAudio.src = audioUrls[i];
              await new Promise(resolve => setTimeout(resolve, 500));
              await newAudio.play();
              break;
            } catch (altError) {
              if (i === audioUrls.length - 1) {
                throw new Error(`Audio playback failed with all sources: ${error?.message || 'Unknown error'}`);
              }
            }
          }
        }
      }

      setAudioState({
        currentAyahId: ayahId,
        isPlaying: true,
        audioElement: newAudio
      });

    } catch (error) {
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
    if (!audioRef.current) return { currentTime: 0, duration: 0, progress: 0 };
    
    const audio = audioRef.current;
    const currentTime = audio.currentTime || 0;
    const duration = audio.duration || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    
    return { currentTime, duration, progress };
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
    cleanup
  };
};