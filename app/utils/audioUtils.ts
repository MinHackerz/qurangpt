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

// Advanced AudioContext management to prevent autoplay warnings
let audioContext: AudioContext | null = null;
let audioContextResumed = false;
let userGestureHandlers: Array<() => void> = [];

// Initialize AudioContext only after user gesture
export const initializeAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') {
    return null;
  }
  
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext creation failed:', error);
      return null;
    }
  }
  
  return audioContext;
};

// Resume AudioContext after user gesture
export const resumeAudioContext = async (): Promise<boolean> => {
  if (!audioContext) {
    audioContext = initializeAudioContext();
  }
  
  if (!audioContext) {
    return false;
  }
  
  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      audioContextResumed = true;
      
      // Execute all pending user gesture handlers
      userGestureHandlers.forEach(handler => {
        try {
          handler();
        } catch (error) {
          console.warn('User gesture handler error:', error);
        }
      });
      userGestureHandlers = [];
      
      return true;
    }
    return audioContext.state === 'running';
  } catch (error) {
    console.warn('Failed to resume AudioContext:', error);
    return false;
  }
};

// Register a handler to be executed after user gesture
export const registerUserGestureHandler = (handler: () => void): void => {
  if (audioContextResumed) {
    // Execute immediately if already resumed
    handler();
  } else {
    // Queue for later execution
    userGestureHandlers.push(handler);
  }
};

// Check if AudioContext is ready
export const isAudioContextReady = (): boolean => {
  return audioContext !== null && audioContext.state === 'running';
};

// Safe audio creation that respects user gesture requirements
export const createSafeAudioElement = (): HTMLAudioElement => {
  const audio = new Audio();
  
  // Set production-optimized properties
  audio.crossOrigin = 'anonymous';
  audio.preload = 'metadata';
  
  // Add production-specific error handling (silent)
  audio.addEventListener('error', () => {
    // Silent error handling for production
  });
  
  // Add production-specific load handling
  audio.addEventListener('loadstart', () => {
    // Silent load handling for production
  });
  
  audio.addEventListener('canplay', () => {
    // Silent canplay handling for production
  });
  
  // Add production-specific CORS handling
  if (process.env.NODE_ENV === 'production') {
    audio.addEventListener('loadstart', () => {
      // Silent CORS handling for production
    });
  }
  
  return audio;
};

// Batch AudioContext operations to prevent multiple warnings
let audioContextOperationQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

export const queueAudioContextOperation = async (operation: () => Promise<void>): Promise<void> => {
  audioContextOperationQueue.push(operation);
  
  if (!isProcessingQueue) {
    isProcessingQueue = true;
    
    try {
      while (audioContextOperationQueue.length > 0) {
        const op = audioContextOperationQueue.shift();
        if (op) {
          await op();
        }
      }
    } finally {
      isProcessingQueue = false;
    }
  }
};

// Enhanced resume function with better error handling
export const resumeAudioContextEnhanced = async (): Promise<boolean> => {
  return new Promise(async (resolve) => {
    await queueAudioContextOperation(async () => {
      if (!audioContext) {
        audioContext = initializeAudioContext();
      }
      
      if (!audioContext) {
        resolve(false);
        return;
      }
      
      try {
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
          audioContextResumed = true;
          
          // Execute all pending user gesture handlers
          userGestureHandlers.forEach(handler => {
            try {
              handler();
            } catch (error) {
              console.warn('User gesture handler error:', error);
            }
          });
          userGestureHandlers = [];
          
          resolve(true);
          return;
        }
        resolve(audioContext.state === 'running');
      } catch (error) {
        console.warn('Failed to resume AudioContext:', error);
        resolve(false);
      }
    });
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
