'use client';

import { useEffect, useRef } from 'react';
import MinimalAudioPlayer from './MinimalAudioPlayer';

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
  const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;

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
