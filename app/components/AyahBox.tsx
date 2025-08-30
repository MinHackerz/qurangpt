'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface AyahBoxProps {
  surahName: string;
  ayahNumber: number;
  surahNumber: number;
  verseText?: string;
}

export default function AyahBox({ 
  surahName, 
  ayahNumber, 
  surahNumber, 
  verseText 
}: AyahBoxProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State for audio editions
  const [audioEditions, setAudioEditions] = useState<Array<{identifier: string, name: string, englishName: string}>>([]);
  const [selectedEdition, setSelectedEdition] = useState<string>('ar.alafasy');
  const [isLoadingEditions, setIsLoadingEditions] = useState(false);

  // Fetch available audio editions on component mount
  useEffect(() => {
    const fetchAudioEditions = async () => {
      setIsLoadingEditions(true);
      try {
        const response = await fetch('https://api.alquran.cloud/v1/edition?format=audio&language=ar');
        const data = await response.json();
        if (data.data) {
          setAudioEditions(data.data);
          // Set default to alafasy if available
          const alafasy = data.data.find((edition: any) => edition.identifier === 'ar.alafasy');
          if (alafasy) {
            setSelectedEdition('ar.alafasy');
          } else if (data.data.length > 0) {
            setSelectedEdition(data.data[0].identifier);
          }
        }
      } catch (error) {
        // Error fetching audio editions - silent fail for security
        // Fallback to default
        setSelectedEdition('ar.alafasy');
      } finally {
        setIsLoadingEditions(false);
      }
    };

    fetchAudioEditions();
  }, []);

  // Calculate the global ayah number for audio
  const getGlobalAyahNumber = (surah: number, ayah: number): number => {
    // This is the correct calculation for global ayah numbers
    const surahAyahCounts: { [key: number]: number } = {
      1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
      11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
      21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
      31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
      41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
      51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
      61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
      71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
      81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
      91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
      101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
      111: 5, 112: 4, 113: 5, 114: 6
    };

    let globalNumber = 0;
    for (let i = 1; i < surah; i++) {
      globalNumber += surahAyahCounts[i] || 0;
    }
    return globalNumber + ayah;
  };

  const globalAyahNumber = getGlobalAyahNumber(surahNumber, ayahNumber);
  const audioUrl = `https://cdn.islamic.network/quran/audio/128/${selectedEdition}/${globalAyahNumber}.mp3`;
  const imageUrl = `https://cdn.islamic.network/quran/images/${surahNumber}_${ayahNumber}.png`;

  const handlePlayPause = async () => {
    if (!audioRef.current) {
      setIsLoading(true);
      audioRef.current = new Audio(audioUrl);
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      
      audioRef.current.addEventListener('error', () => {
        setIsLoading(false);
        // Error loading audio - silent fail for security
      });
      
      audioRef.current.addEventListener('canplay', () => {
        setIsLoading(false);
        audioRef.current?.play();
        setIsPlaying(true);
      });
    } else {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden "
    >
      {/* Top accent bar */}
      <div className="w-full h-1 bg-gray-800 dark:bg-gray-200"></div>
      
      {/* Main content container */}
      <div className="p-6">
        {/* Elegant header with enhanced styling */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            {/* Surah number badge with gradient */}
            <div className="relative">
              <div className="w-14 h-14 bg-gray-800 dark:bg-gray-200 rounded-2xl flex items-center justify-center ">
                <span className="text-white dark:text-gray-800 text-sm font-bold font-mono">
                  {surahNumber}:{ayahNumber}
                </span>
              </div>
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gray-800 dark:bg-gray-200 rounded-2xl opacity-20 blur-sm"></div>
            </div>
            
            {/* Surah information */}
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200 font-[var(--font-amiri)] text-xl tracking-wide">{surahName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Verse {ayahNumber}</p>
            </div>
          </div>
          
          {/* Enhanced audio control button */}
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="relative w-14 h-14 bg-gradient-to-br from-gray-800 to-gray-700 dark:from-gray-200 dark:to-gray-300 rounded-2xl flex items-center justify-center hover:from-gray-700 hover:to-gray-600 dark:hover:from-gray-300 dark:hover:to-gray-400 transition-all duration-300 disabled:opacity-50 transform hover:scale-105 group"
          >
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-700 dark:from-gray-200 dark:to-gray-300 rounded-2xl opacity-20 blur-sm group-hover:opacity-30 transition-opacity duration-300"></div>
            
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white dark:text-gray-800 border-t-transparent rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <PauseIcon className="w-7 h-7 text-white dark:text-gray-800" />
            ) : (
              <PlayIcon className="w-7 h-7 text-white dark:text-gray-800 ml-0.5" />
            )}
          </button>
        </div>

        {/* Verse text with sophisticated styling */}
        {verseText && (
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-700 relative overflow-hidden ">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)]" style={{ backgroundSize: '20px 20px' }}></div>
            </div>
            
            <div className="relative z-10 text-center">
              <p className="text-xl md:text-2xl text-gray-800 dark:text-gray-100 leading-relaxed font-[var(--font-amiri)] italic tracking-wide">
                "{verseText}"
              </p>
            </div>
          </div>
        )}

        {/* Enhanced audio player section */}
        <div className="mb-6 p-5 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-700 ">
          {/* Audio header with status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-500 dark:from-gray-400 dark:to-gray-300 rounded-lg flex items-center justify-center">
                <SpeakerWaveIcon className="w-4 h-4 text-white dark:text-gray-800" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Audio Recitation</span>
            </div>
            
            {/* Enhanced status indicator */}
            {isPlaying && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 dark:bg-green-900/40 rounded-full border border-green-200 dark:border-green-800/40">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-700 dark:text-green-400 font-medium">Playing</span>
              </div>
            )}
          </div>
          
          {/* Reciter selector with enhanced styling */}
          {audioEditions.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wide">Select Reciter</label>
              <select
                value={selectedEdition}
                onChange={(e) => setSelectedEdition(e.target.value)}
                className="w-full text-sm bg-gray-50 dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-800 dark:focus:ring-gray-200 focus:border-gray-800 dark:focus:border-gray-200 transition-all duration-200"
              >
                {audioEditions.map((edition) => (
                  <option key={edition.identifier} value={edition.identifier}>
                    {edition.englishName || edition.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Enhanced progress indicator */}
          {isPlaying && (
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 h-2 rounded-full animate-pulse transition-all duration-300" style={{ width: '30%' }}></div>
            </div>
          )}
        </div>

        {/* Sophisticated footer with enhanced information */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Global Ayah #{globalAyahNumber}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              128kbps MP3
            </span>
          </div>
          
          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            {selectedEdition}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
