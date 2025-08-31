'use client';

import { useEffect } from 'react';
import { preloadAudioForProduction } from '../utils/productionAudioLoader';

interface AudioPreloaderProps {
  audioUrls: string[];
}

export default function AudioPreloader({ audioUrls }: AudioPreloaderProps) {
  useEffect(() => {
    // Preload audio files in production for better performance
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Use production-optimized preloading
      preloadAudioForProduction(audioUrls);
    }
  }, [audioUrls]);

  // This component doesn't render anything
  return null;
}
