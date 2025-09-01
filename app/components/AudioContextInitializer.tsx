'use client';

import { useEffect, useRef } from 'react';
import { resumeAudioContext, isAudioContextReady } from '../utils/audioUtils';

/**
 * AudioContextInitializer component
 * 
 * This component handles the initialization of AudioContext after user gesture
 * to prevent Chrome's autoplay policy warnings. It listens for various user
 * interactions and resumes the AudioContext when they occur.
 */
export default function AudioContextInitializer() {
  const hasInitialized = useRef(false);
  const initializationAttempts = useRef(0);
  const maxAttempts = 3;

  useEffect(() => {
    if (hasInitialized.current) return;

    const initializeAudioContext = async () => {
      try {
        // Check if already ready
        if (isAudioContextReady()) {
          hasInitialized.current = true;
          return;
        }

        // Limit initialization attempts
        if (initializationAttempts.current >= maxAttempts) {
          return;
        }

        initializationAttempts.current++;
        await resumeAudioContext();
        hasInitialized.current = true;
      } catch (error) {
        // Reset initialization flag for retry
        hasInitialized.current = false;
      }
    };

    // List of events that constitute user gesture
    const userGestureEvents = [
      'mousedown',
      'mouseup',
      'click',
      'touchstart',
      'touchend',
      'keydown',
      'keyup',
      'scroll',
      'wheel',
      'focus',
      'blur'
    ];

    const handleUserGesture = () => {
      if (!hasInitialized.current) {
        // Use requestIdleCallback for better performance
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => initializeAudioContext());
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(initializeAudioContext, 0);
        }
        
        // Remove all event listeners after first gesture
        userGestureEvents.forEach(event => {
          document.removeEventListener(event, handleUserGesture);
        });
      }
    };

    // Add event listeners for user gestures
    userGestureEvents.forEach(event => {
      document.addEventListener(event, handleUserGesture);
    });

    // Also try to initialize on page load if user has already interacted
    const handlePageLoad = () => {
      // Check if user has already interacted with the page
      if (document.hasFocus() || (navigator as any)?.userActivation?.hasBeenActive) {
        initializeAudioContext();
      }
    };

    // Try initialization on page load
    if (document.readyState === 'complete') {
      handlePageLoad();
    } else {
      window.addEventListener('load', handlePageLoad);
    }

    // Cleanup function
    return () => {
      userGestureEvents.forEach(event => {
        document.removeEventListener(event, handleUserGesture);
      });
      window.removeEventListener('load', handlePageLoad);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
