// Production-specific audio loading utilities

export const createProductionAudioElement = (): HTMLAudioElement => {
  const audio = new Audio();
  
  // Set production-optimized properties
  audio.crossOrigin = 'anonymous';
  audio.preload = 'metadata';
  
  // Add production-specific event listeners (silent)
  audio.addEventListener('error', () => {
    // Silent error handling for production
  });
  
  audio.addEventListener('loadstart', () => {
    // Silent load start handling
  });
  
  audio.addEventListener('canplay', () => {
    // Silent can play handling
  });
  
  audio.addEventListener('canplaythrough', () => {
    // Silent can play through handling
  });
  
  return audio;
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
