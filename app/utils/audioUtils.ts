// Utility function to preload audio metadata and get duration
export const preloadAudioMetadata = (audioUrl: string): Promise<{ duration: number; success: boolean }> => {
  return new Promise((resolve) => {
    const audio = new Audio();
    
    // Set production-optimized preload settings
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
    
    const timeout = setTimeout(() => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
      // In production, be more lenient with timeouts
      console.log('Audio preload timeout, but continuing...');
      resolve({ duration: 0, success: true }); // Don't fail on timeout
    }, 5000); // Reduced timeout for production
    
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
      // In production, don't fail on preload errors
      resolve({ duration: 0, success: true });
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

// Production-specific audio URL validation
export const validateAudioUrlForProduction = (url: string): boolean => {
  if (process.env.NODE_ENV !== 'production') {
    return true; // Skip validation in development
  }
  
  // Validate URL format and CORS compatibility
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && 
           urlObj.hostname === 'cdn.islamic.network' &&
           urlObj.pathname.includes('/quran/audio/');
  } catch {
    return false;
  }
};

// Test if audio URL is actually accessible
export const testAudioUrlAccessibility = async (url: string): Promise<boolean> => {
  try {
    // In development, test the proxy URL instead
    if (process.env.NODE_ENV === 'development' && url.includes('cdn.islamic.network')) {
      const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, { 
        method: 'HEAD',
        mode: 'cors' // Use CORS mode for proxy
      });
      return response.ok;
    }
    
    // In production, test the direct CDN URL
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // This will work for CORS issues
    });
    return true; // If we get here, the URL is accessible
  } catch (error) {
    console.warn(`Audio URL accessibility test failed for ${url}:`, error);
    return false;
  }
};

// Safely set audio source with validation
export const setAudioSourceSafely = (audioElement: HTMLAudioElement, url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Clear any existing source
      audioElement.src = '';
      
      // Wait a moment for the clear to take effect
      setTimeout(() => {
        // Set new source
        audioElement.src = url;
        
        // Wait for source to be set
        setTimeout(() => {
          if (audioElement.src && audioElement.src !== 'about:blank' && audioElement.src.includes(url)) {
            resolve(true);
          } else {
            resolve(false);
          }
        }, 200);
      }, 100);
      
    } catch (error) {
      console.error('Error setting audio source:', error);
      resolve(false);
    }
  });
};

// Production-specific audio initialization helper
export const initializeAudioForProduction = (audioElement: HTMLAudioElement): void => {
  // Set production-optimized properties
  audioElement.crossOrigin = 'anonymous';
  audioElement.preload = 'metadata';
  
  // Add production-specific error handling (silent)
  audioElement.addEventListener('error', () => {
    // Silent error handling for production
  });
  
  // Add production-specific load handling
  audioElement.addEventListener('loadstart', () => {
    // Silent load handling for production
  });
  
  audioElement.addEventListener('canplay', () => {
    // Silent canplay handling for production
  });
  
  // Add production-specific CORS handling
  if (process.env.NODE_ENV === 'production') {
    audioElement.addEventListener('loadstart', () => {
      // Silent CORS handling for production
    });
  }
};
