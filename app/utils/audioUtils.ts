// Utility function to preload audio metadata and get duration
export const preloadAudioMetadata = (audioUrl: string): Promise<{ duration: number; success: boolean }> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    
    // Set preload to metadata only to avoid downloading the full audio
    audio.preload = 'metadata';
    
    const timeout = setTimeout(() => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
      resolve({ duration: 0, success: false });
    }, 10000); // 10 second timeout
    
    const onLoadedMetadata = () => {
      clearTimeout(timeout);
      const duration = audio.duration || 0;
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
      resolve({ duration, success: true });
    };
    
    const onError = () => {
      clearTimeout(timeout);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
      resolve({ duration: 0, success: false });
    };
    
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);
    
    // Set the source to trigger loading
    audio.src = audioUrl;
  });
};

// Format time helper function
export const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds === 0) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Cache for audio metadata to avoid re-preloading
const audioMetadataCache = new Map<string, { duration: number; timestamp: number }>();

export const getCachedAudioMetadata = (audioUrl: string): number | null => {
  const cached = audioMetadataCache.get(audioUrl);
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
    return cached.duration;
  }
  return null;
};

export const setCachedAudioMetadata = (audioUrl: string, duration: number): void => {
  audioMetadataCache.set(audioUrl, { duration, timestamp: Date.now() });
};
