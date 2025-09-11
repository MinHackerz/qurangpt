'use client';

import { useRef, useCallback } from 'react';

interface AbortManager {
  isAborted: () => boolean;
  setAborted: (aborted: boolean) => void;
  reset: () => void;
  createAbortController: () => AbortController;
  getCurrentController: () => AbortController | null;
}

export const useAbortManager = (): AbortManager => {
  // Global abort state - 0 = not aborted, 1 = aborted
  const abortStateRef = useRef<number>(0);
  
  // Current abort controller reference
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if operation is aborted
  const isAborted = useCallback((): boolean => {
    return abortStateRef.current === 1;
  }, []);

  // Set abort state
  const setAborted = useCallback((aborted: boolean): void => {
    console.log('AbortManager - Setting abort state to:', aborted ? 1 : 0);
    abortStateRef.current = aborted ? 1 : 0;
    
    if (aborted && abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
        console.log('AbortManager - Aborted current controller');
      } catch (error) {
        console.log('AbortManager - Error aborting controller:', error);
      }
    }
  }, []);

  // Reset abort state
  const reset = useCallback((): void => {
    console.log('AbortManager - Resetting abort state');
    abortStateRef.current = 0;
    abortControllerRef.current = null;
  }, []);

  // Create new abort controller
  const createAbortController = useCallback((): AbortController => {
    // Abort any existing controller
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (error) {
        console.log('AbortManager - Error aborting existing controller:', error);
      }
    }

    // Create new controller
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    console.log('AbortManager - Created new abort controller');
    return controller;
  }, []);

  // Get current controller
  const getCurrentController = useCallback((): AbortController | null => {
    return abortControllerRef.current;
  }, []);

  return {
    isAborted,
    setAborted,
    reset,
    createAbortController,
    getCurrentController
  };
};

// Global abort manager instance for use across components
let globalAbortManager: AbortManager | null = null;

export const getGlobalAbortManager = (): AbortManager => {
  if (!globalAbortManager) {
    // Create a simple global manager
    let abortState = 0;
    let currentController: AbortController | null = null;

    globalAbortManager = {
      isAborted: () => {
        console.log('GlobalAbortManager - Checking abort state:', abortState);
        return abortState === 1;
      },
      setAborted: (aborted: boolean) => {
        console.log('GlobalAbortManager - Setting abort state to:', aborted ? 1 : 0);
        abortState = aborted ? 1 : 0;
        
        if (aborted && currentController) {
          try {
            currentController.abort();
            console.log('GlobalAbortManager - Aborted current controller');
          } catch (error) {
            console.log('GlobalAbortManager - Error aborting controller:', error);
          }
        }
      },
      reset: () => {
        console.log('GlobalAbortManager - Resetting abort state');
        abortState = 0;
        currentController = null;
      },
      createAbortController: () => {
        // Abort any existing controller
        if (currentController) {
          try {
            currentController.abort();
          } catch (error) {
            console.log('GlobalAbortManager - Error aborting existing controller:', error);
          }
        }

        // Create new controller
        const controller = new AbortController();
        currentController = controller;
        
        console.log('GlobalAbortManager - Created new abort controller');
        return controller;
      },
      getCurrentController: () => currentController
    };
  }
  
  return globalAbortManager;
};
