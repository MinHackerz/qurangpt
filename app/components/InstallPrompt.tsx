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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
    };

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

    checkMobile();
    checkStandalone();
    checkIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after a delay if not already installed and on mobile
      if (!isStandalone && isMobile) {
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
  }, [isStandalone, isMobile]);

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

  // Don't show if already installed, dismissed in this session, or not on mobile
  if (isStandalone || !showInstallPrompt || !isMobile || sessionStorage.getItem('installPromptDismissed')) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-xs mx-auto"
      >
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <DevicePhoneMobileIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  Install App
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Quick access
                </p>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <XMarkIcon className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              {isIOS ? (
                'Tap share button and select "Add to Home Screen"'
              ) : (
                'Get instant access to Islamic guidance'
              )}
            </p>
            
            {isIOS && (
              <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Look for share button in browser</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-4 pb-4 flex space-x-2">
            {!isIOS && deferredPrompt && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstallClick}
                className="flex-1 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium py-2.5 px-4 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-1.5"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Install</span>
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDismiss}
              className={`${isIOS ? 'flex-1' : 'px-4'} bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium py-2.5 rounded-2xl transition-all duration-200`}
            >
              {isIOS ? 'Got it' : 'Later'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
