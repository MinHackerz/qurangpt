'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

interface MinimalAudioPlayerProps {
  audioUrl: string;
  ayahId: string;
  onPlay: (ayahId: string) => void;
  onPause: (ayahId: string) => void;
  onEnd: (ayahId: string) => void;
  isPlaying: boolean;
  isActive: boolean;
}

export default function MinimalAudioPlayer({
  audioUrl,
  ayahId,
  onPlay,
  onPause,
  onEnd,
  isPlaying,
  isActive
}: MinimalAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize audio element
  const initAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      const audio = audioRef.current;
      
      // Set up event listeners
      audio.addEventListener('ended', () => {
        onEnd(ayahId);
      });

      audio.addEventListener('error', () => {
        setError('Failed to load audio');
        setIsLoading(false);
      });

      audio.addEventListener('loadstart', () => {
        setIsLoading(true);
        setError(null);
      });

      audio.addEventListener('canplay', () => {
        setIsLoading(false);
      });
    }
  }, [ayahId, onEnd]);

  // Handle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) {
      initAudio();
    }

    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        onPause(ayahId);
      } else {
        // Set the audio source if not already set
        if (audio.src !== audioUrl) {
          audio.src = audioUrl;
        }
        
        await audio.play();
        onPlay(ayahId);
      }
    } catch (err) {
      console.error('Audio playback error:', err);
      setError('Playback failed');
    }
  }, [isPlaying, ayahId, onPlay, onPause, audioUrl, initAudio]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
  }, []);

  // Cleanup when component unmounts
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cleanup);
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      {/* Left side - Play/Pause button and status */}
      <div className="flex items-center space-x-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlayPause}
          disabled={isLoading}
          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            isActive
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
          }`}
        >
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
            />
          ) : isPlaying ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5 ml-0.5" />
          )}
        </motion.button>
        
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isLoading ? 'Loading...' : isPlaying ? 'Playing' : 'Click to play'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Mishary Rashid Alafasy
          </span>
        </div>
      </div>

      {/* Right side - Error display or status indicator */}
      <div className="flex items-center">
        {error ? (
          <span className="text-xs text-red-500 dark:text-red-400 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">
            {error}
          </span>
        ) : isActive && (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 bg-blue-500 rounded-full"
          />
        )}
      </div>
    </div>
  );
}
