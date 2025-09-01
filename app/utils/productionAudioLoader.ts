// Production-specific audio loading utilities
import { createSafeAudioElement, resumeAudioContext, registerUserGestureHandler } from '../utils/audioUtils';

export const createProductionAudioElement = (): HTMLAudioElement => {
  // Use the safe audio creation function
  return createSafeAudioElement();
};

export const loadAudioInProduction = async (url: string): Promise<HTMLAudioElement> => {
  return new Promise((resolve, reject) => {
    const audio = createProductionAudioElement();
    
    // Set up loading event handlers
    const onCanPlay = () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      resolve(audio);
    };
    
    const onError = (e: Event) => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      console.warn('Production audio load error, but continuing...', e);
      // In production, don't fail on load errors
      resolve(audio);
    };
    
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    
    // Set source to trigger loading
    audio.src = url;
    
    // Fallback timeout for production
    setTimeout(() => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      console.log('Production audio load timeout, proceeding anyway...');
      resolve(audio);
    }, 3000);
  });
};

export const preloadAudioForProduction = (urls: string[]): void => {
  if (process.env.NODE_ENV !== 'production') {
    return; // Only preload in production
  }
  
  // Register preloading as a user gesture handler to prevent AudioContext warnings
  const preloadHandler = () => {
    urls.forEach((url, index) => {
      if (url && url.startsWith('http')) {
        setTimeout(() => {
          const audio = createProductionAudioElement();
          audio.src = url;
          
          // Cleanup after preloading
          setTimeout(() => {
            audio.src = '';
          }, 5000);
        }, index * 100); // Stagger preloading
      }
    });
  };
  
  registerUserGestureHandler(preloadHandler);
};

// Enhanced production audio element creation with user gesture handling
export const createProductionAudioElementWithGesture = async (): Promise<HTMLAudioElement> => {
  // Ensure AudioContext is resumed before creating audio
  await resumeAudioContext();
  return createProductionAudioElement();
};
