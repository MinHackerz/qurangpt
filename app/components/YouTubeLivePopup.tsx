'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, useCallback } from 'react';

const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@official.minhaj';
// To get your YouTube profile picture URL:
// 1. Visit your YouTube channel page
// 2. Right-click on your profile picture and "Copy image address"
// 2. Or use YouTube Data API: https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername=official.minhaj
// 3. Replace the URL below with your actual profile picture URL
const YOUTUBE_PROFILE_PICTURE_URL = 'https://yt3.ggpht.com/your-profile-picture-url'; // TODO: Update with actual profile picture URL

export default function YouTubeLivePopup() {
  const [showPopup, setShowPopup] = useState(false);

  // Check if popup should be shown (once per day) and auto-dismiss after 15 seconds
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const today = new Date().toDateString();
    const lastShownDate = localStorage.getItem('youtube-popup-last-shown');
    
    // Show if not shown today
    if (lastShownDate !== today) {
      setShowPopup(true);
      
      // Mark as shown for today
      localStorage.setItem('youtube-popup-last-shown', today);
      
      // Auto-dismiss after 15 seconds
      const timer = setTimeout(() => {
        setShowPopup(false);
      }, 15000);
      
      // Cleanup timer on unmount
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle manual dismissal
  const handleDismiss = useCallback(() => {
    setShowPopup(false);
  }, []);

  if (!showPopup) return null;

  return (
    <AnimatePresence>
      {showPopup && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5, scale: 0.98 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className="mb-3"
        >
          <div className="relative w-full max-w-4xl mx-auto px-0 sm:px-0">
            <motion.div
              className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800/50 rounded-lg px-4 py-3 w-full shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* YouTube Profile Picture */}
                  <div className="flex-shrink-0">
                    <a
                      href={YOUTUBE_CHANNEL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative"
                    >
                      <img
                        src={YOUTUBE_PROFILE_PICTURE_URL}
                        alt="YouTube Channel"
                        className="w-12 h-12 rounded-full object-cover border-2 border-red-200 dark:border-red-800/50 shadow-sm hover:border-red-300 dark:hover:border-red-700 transition-colors duration-200"
                        onError={(e) => {
                          // Fallback to YouTube icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                      <div 
                        className="w-12 h-12 rounded-full bg-red-600 dark:bg-red-500 border-2 border-red-200 dark:border-red-800/50 shadow-sm hidden"
                        style={{ display: 'none' }}
                      >
                        <svg 
                          className="w-6 h-6 text-white m-auto" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ 
                            width: '24px',
                            height: '24px',
                            margin: 'auto',
                            display: 'block'
                          }}
                        >
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                    </a>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 animate-pulse">
                        LIVE
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Weekend Live Streaming
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      Join me every weekend for live streaming where I work on feature improvements, additions, and listen to your suggestions.{' '}
                      <a 
                        href={YOUTUBE_CHANNEL_URL}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors duration-200 underline decoration-red-300 dark:decoration-red-600 underline-offset-2"
                      >
                        Watch on YouTube
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </p>
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  aria-label="Dismiss"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

