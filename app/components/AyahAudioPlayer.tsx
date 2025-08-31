'use client';

import { useEffect, useRef } from 'react';
import MinimalAudioPlayer from './MinimalAudioPlayer';
import { useAudioManager } from '../hooks/useAudioManager';
import { getAudioUrl } from '../utils/audioUrlHelper';

interface AyahAudioPlayerProps {
  ayahId: string;
  globalAyahNumber: string;
  surahName: string;
  ayahNumber: string;
  onPlay: (ayahId: string, globalAyahNumber: string) => void;
  onPause: (ayahId: string) => void;
  onEnd: (ayahId: string) => void;
  isPlaying: boolean;
  isActive: boolean;
}

export default function AyahAudioPlayer({
  ayahId,
  globalAyahNumber,
  surahName,
  ayahNumber,
  onPlay,
  onPause,
  onEnd,
  isPlaying,
  isActive
}: AyahAudioPlayerProps) {
  const { playAudio } = useAudioManager();

  const handlePlayAudio = async () => {
    if (!globalAyahNumber) return;
    
    try {
      const audioUrl = getAudioUrl(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`);
      await playAudio(globalAyahNumber.toString(), audioUrl);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  // Get the proxy URL for the audio
  const audioUrl = getAudioUrl(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`);

  return (
    <MinimalAudioPlayer
      audioUrl={audioUrl}
      ayahId={ayahId}
      onPlay={onPlay}
      onPause={onPause}
      onEnd={onEnd}
      isPlaying={isPlaying}
      isActive={isActive}
    />
  );
}
