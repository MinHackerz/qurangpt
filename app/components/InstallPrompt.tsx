'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, DevicePhoneMobileIcon, PlusIcon } from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isInStandaloneMode = (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode || isInStandaloneMode);
    };

    // Check if device is iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      setIsIOS(isIOSDevice);
    };

    checkStandalone();
    checkIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after a delay if not already installed
      if (!isStandalone) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000); // Show after 3 seconds
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if already installed or dismissed in this session
  if (isStandalone || !showInstallPrompt || sessionStorage.getItem('installPromptDismissed')) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <DevicePhoneMobileIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Install QuranGPT
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Add to your home screen
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {isIOS ? (
                <>
                  Tap the <PlusIcon className="w-4 h-4 inline mx-1" /> button and select 
                  "Add to Home Screen" to install QuranGPT as an app.
                </>
              ) : (
                <>
                  Install QuranGPT for quick access to Islamic guidance. 
                  Get instant answers about Quran and Islam right from your home screen.
                </>
              )}
            </p>
            
            {isIOS && (
              <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span>Look for the share button in your browser</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {!isIOS && deferredPrompt && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstallClick}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Install App</span>
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDismiss}
              className={`${isIOS ? 'flex-1' : 'px-4'} bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2.5 rounded-xl transition-colors`}
            >
              {isIOS ? 'Got it' : 'Later'}
            </motion.button>
          </div>

          {/* Benefits */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>✓ Offline access</span>
              <span>✓ Fast loading</span>
              <span>✓ Native feel</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
