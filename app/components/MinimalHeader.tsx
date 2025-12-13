'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';
import { Code, Shield, Monitor } from 'lucide-react';
import ShareModal from './ShareModal';
import TextSizeToggle from './TextSizeToggle';
import Link from 'next/link';

interface MinimalHeaderProps {
  isVisible: boolean;
  // New props for the moved buttons
  userQuestion?: string;
  textSize?: 'small' | 'medium' | 'large';
  onTextSizeChange?: (size: 'small' | 'medium' | 'large') => void;
  // Share functionality props
  onShareContent?: () => void;
  shareUrl?: string;
  isSharing?: boolean;
  showShareSuccess?: boolean;
}

export default function MinimalHeader({
  isVisible,
  userQuestion,
  textSize = 'medium',
  onTextSizeChange,
  onShareContent,
  shareUrl,
  isSharing,
  showShareSuccess
}: MinimalHeaderProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const [pendingShareModal, setPendingShareModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeButton, setActiveButton] = useState<string | null>('ask-quran');
  const [isMobile, setIsMobile] = useState(false);
  const { theme, toggleTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Custom Mosque Icon Component
  const MosqueIcon = ({ className }: { className?: string }) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="43.5" cy="8.5" r="1.5" />
      <circle cx="47" cy="16" r="1" />
      <line x1="54" y1="8.463" x2="54" y2="9.878" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="54" y1="14.122" x2="54" y2="15.537" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="50.463" y1="12" x2="51.878" y2="12" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="56.122" y1="12" x2="57.537" y2="12" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <path d="M55.689,39.588A13.8,13.8,0,0,0,57,33.636c0-6.326-9-11.454-9-11.454a24.758,24.758,0,0,0-2.146,1.425" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <path d="M20.846,19a12.891,12.891,0,0,0,1.287-5.714C22.133,7.605,14.5,3,14.5,3S6.867,7.605,6.867,13.286A12.891,12.891,0,0,0,8.154,19Z" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <path d="M44,31.533a9.9,9.9,0,0,0,2-5.9c0-6.326-14-11.454-14-11.454S18,19.31,18,25.636a9.888,9.888,0,0,0,2,5.9" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <path d="M44.389,40H56.5A1.5,1.5,0,0,1,58,41.5h0A1.5,1.5,0,0,1,56.5,43H44.324" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <rect x="17" y="32" width="30" height="3" rx="1.5" ry="1.5" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <polyline points="29 60.554 29 43 32 40 35 43 35 60.554" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="32" y1="14" x2="32" y2="10" style={{ fill: 'none', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <path d="M32.191,4.66a3,3,0,0,0,3.166,5.1" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <path d="M19.564,44H8.5A1.5,1.5,0,0,0,7,45.5H7A1.5,1.5,0,0,0,8.5,47H19.637" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="51" y1="43" x2="51" y2="48" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="48" y1="43" x2="48" y2="48" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="39" y1="35" x2="39" y2="50" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="25" y1="35" x2="25" y2="50" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="13" y1="47.364" x2="13" y2="52" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="16" y1="47.364" x2="16" y2="52" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="13" y1="39" x2="13" y2="43.564" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="16" y1="39" x2="16" y2="43.564" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="60" y1="61" x2="4" y2="61" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="9" y1="44" x2="9" y2="19" style={{ fill: 'none', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="20" y1="21" x2="20" y2="20" style={{ fill: 'none', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="55" y1="43" x2="55" y2="61" style={{ fill: 'none', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="9" y1="47" x2="9" y2="61" style={{ fill: 'none', stroke: 'currentColor', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="20" y1="61" x2="20" y2="35" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
      <line x1="44" y1="61" x2="44" y2="35" style={{ fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: '2px' }} />
    </svg>
  );

  // Prevent hydration mismatch for theme toggle and detect mobile
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      const mobile = typeof window !== 'undefined' && window.innerWidth < 640;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Apply theme from sidebar triple-toggle
  useEffect(() => {
    const onApplyTheme = (e: any) => {
      const mode = e?.detail?.mode as 'system' | 'light' | 'dark' | undefined;
      if (!mode) return;
      if (mode === 'system') {
        // Set to system by cycling until state is 'system'
        setTheme?.('system' as any);
      } else {
        setTheme?.(mode as any);
      }
    };
    window.addEventListener('qgpt:apply-theme', onApplyTheme as EventListener);
    return () => window.removeEventListener('qgpt:apply-theme', onApplyTheme as EventListener);
  }, [setTheme]);

  // Open share modal when share URL is generated
  useEffect(() => {
    if (pendingShareModal && shareUrl && !isSharing) {
      setShowShareModal(true);
      setPendingShareModal(false);
    }
  }, [shareUrl, isSharing, pendingShareModal]);

  // Listen to component switch events to update active button state
  useEffect(() => {
    const onShowComponent = (e: any) => {
      const component = e?.detail?.component as string;
      if (component) {
        setActiveButton(component);
        setShowMobileMenu(false); // Close mobile menu when component is selected
      }
    };

    const onOpenChat = () => {
      setActiveButton('chat');
      setShowMobileMenu(false); // Close mobile menu when chat is opened
    };

    const onResetToDefault = () => {
      setActiveButton('ask-quran');
      setShowMobileMenu(false); // Close mobile menu when reset to default
    };

    const onToggleTime = (e: any) => {
      if (e?.detail?.open) {
        setActiveButton('time-dashboard');
        setShowMobileMenu(false); // Close mobile menu when time dashboard is opened
      } else {
        setActiveButton(null);
      }
    };

    window.addEventListener('qgpt:show-component', onShowComponent as EventListener);
    window.addEventListener('qgpt:open-chat', onOpenChat as EventListener);
    window.addEventListener('qgpt:reset-to-default', onResetToDefault as EventListener);
    window.addEventListener('qgpt:toggle-time-dashboard', onToggleTime as EventListener);

    return () => {
      window.removeEventListener('qgpt:show-component', onShowComponent as EventListener);
      window.removeEventListener('qgpt:open-chat', onOpenChat as EventListener);
      window.removeEventListener('qgpt:reset-to-default', onResetToDefault as EventListener);
      window.removeEventListener('qgpt:toggle-time-dashboard', onToggleTime as EventListener);
    };
  }, []);

  // Always show on mobile, only show when visible on desktop
  if (!isVisible && !isMobile) return null;

  const handleBackToHome = () => {
    window.location.reload();
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  const handleMobileMenuAction = (action: () => void) => {
    action();
    setShowMobileMenu(false); // Close menu after action
  };

  // Handle share button click - open modal instead of direct copy
  const handleShareClick = () => {
    // Track share button click in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share_button_click', {
        event_category: 'engagement',
        event_label: 'share_button',
        custom_parameter_1: userQuestion ? userQuestion.substring(0, 100) : 'unknown_question',
        custom_parameter_2: 'minimal_header'
      });
    }

    // If we have a share URL, open modal directly
    if (shareUrl) {
      setShowShareModal(true);
    } else {
      // If no share URL, trigger the share creation first
      if (onShareContent) {
        setPendingShareModal(true);
        onShareContent();
      }
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-40 sm:p-6"
    >
      {/* Mobile: Minimalist horizontal header layout */}
      <div className="flex sm:hidden items-center justify-between w-full px-5 py-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 transition-all duration-300">
        {/* Left side: QuranGPT Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-white font-serif font-bold text-lg">Q</span>
          </div>
          <h1 className="text-xl font-medium tracking-tight text-gray-900 dark:text-white font-[var(--font-inter)]">
            QuranGPT
          </h1>
        </div>

        {/* Right side: Mobile Menu Toggle Button */}
        <div className="flex items-center gap-2">

          {/* Mobile Menu Toggle Button */}
          <motion.button
            onClick={toggleMobileMenu}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${showMobileMenu
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rotate-90'
              : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
              }`}
            title="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              {showMobileMenu ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 sm:hidden bg-white/95 dark:bg-black/95 backdrop-blur-3xl pt-24 px-8 pb-10 overflow-y-auto flex flex-col"
          >
            {/* Close Button - Top Right */}
            <button
              onClick={() => setShowMobileMenu(false)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all"
              title="Close Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex-1 flex flex-col gap-8 max-w-sm mx-auto w-full">

              {/* Primary Navigation */}
              <div className="flex flex-col gap-6">
                <button
                  onClick={() => handleMobileMenuAction(() => {
                    const event = new CustomEvent('qgpt:reset-to-default');
                    window.dispatchEvent(event);
                  })}
                  className={`text-2xl font-light text-left transition-colors ${activeButton === 'ask-quran'
                    ? 'text-emerald-600 dark:text-emerald-400 font-normal'
                    : 'text-gray-900 dark:text-white'
                    }`}
                >
                  Ask Quran
                </button>

                <button
                  onClick={() => handleMobileMenuAction(() => {
                    const event = new CustomEvent('qgpt:show-component', { detail: { component: 'read-quran' } });
                    window.dispatchEvent(event);
                  })}
                  className={`text-2xl font-light text-left transition-colors ${activeButton === 'read-quran'
                    ? 'text-emerald-600 dark:text-emerald-400 font-normal'
                    : 'text-gray-900 dark:text-white'
                    }`}
                >
                  Read Quran
                </button>

                <button
                  onClick={() => handleMobileMenuAction(() => {
                    const event = new CustomEvent('qgpt:show-component', { detail: { component: 'mosque-finder' } });
                    window.dispatchEvent(event);
                  })}
                  className={`text-2xl font-light text-left transition-colors ${activeButton === 'mosque-finder'
                    ? 'text-emerald-600 dark:text-emerald-400 font-normal'
                    : 'text-gray-900 dark:text-white'
                    }`}
                >
                  Find Mosque
                </button>

                <button
                  onClick={() => handleMobileMenuAction(() => {
                    const event = new CustomEvent('qgpt:show-component', { detail: { component: 'zakat-calculator' } });
                    window.dispatchEvent(event);
                  })}
                  className={`text-2xl font-light text-left transition-colors ${activeButton === 'zakat-calculator'
                    ? 'text-emerald-600 dark:text-emerald-400 font-normal'
                    : 'text-gray-900 dark:text-white'
                    }`}
                >
                  Zakat Calculator
                </button>

                <button
                  onClick={() => handleMobileMenuAction(() => {
                    const event = new CustomEvent('qgpt:toggle-time-dashboard', { detail: { open: true } });
                    window.dispatchEvent(event);
                  })}
                  className={`text-2xl font-light text-left transition-colors ${activeButton === 'time-dashboard'
                    ? 'text-emerald-600 dark:text-emerald-400 font-normal'
                    : 'text-gray-900 dark:text-white'
                    }`}
                >
                  Prayer Times
                </button>
              </div>

              {/* Secondary Navigation */}
              <div className="flex flex-col gap-4 mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href="/transparency"
                  onClick={() => setShowMobileMenu(false)}
                  className="text-lg text-gray-500 dark:text-gray-400 font-light hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Transparency
                </Link>

                <button
                  onClick={() => handleMobileMenuAction(() => {
                    window.open('https://menajul.vercel.app', '_blank');
                  })}
                  className="text-lg text-left text-gray-500 dark:text-gray-400 font-light hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Developer
                </button>

                <button
                  onClick={() => handleMobileMenuAction(() => {
                    window.open('https://buymeacoffee.com/qurangpt', '_blank');
                  })}
                  className="text-lg text-left text-amber-600 dark:text-amber-500 font-light hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                >
                  Support Project
                </button>
              </div>

              {/* Minimal Theme Toggle */}
              <div className="mt-auto pt-6 flex gap-6">
                <button
                  onClick={() => handleMobileMenuAction(() => {
                    if (!mounted) return;
                    setTheme?.('light');
                  })}
                  className={`text-sm tracking-widest uppercase transition-colors ${theme === 'light'
                    ? 'text-gray-900 dark:text-white font-medium border-b border-gray-900 dark:border-white'
                    : 'text-gray-400 dark:text-gray-600'
                    }`}
                >
                  Light
                </button>
                <button
                  onClick={() => handleMobileMenuAction(() => {
                    if (!mounted) return;
                    setTheme?.('dark');
                  })}
                  className={`text-sm tracking-widest uppercase transition-colors ${theme === 'dark'
                    ? 'text-gray-900 dark:text-white font-medium border-b border-gray-900 dark:border-white'
                    : 'text-gray-400 dark:text-gray-600'
                    }`}
                >
                  Dark
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: Close Button (Reset to Default) - Top Right */}
      <button
        onClick={() => {
          const event = new CustomEvent('qgpt:reset-to-default');
          window.dispatchEvent(event);
        }}
        className="hidden sm:flex absolute top-6 right-6 items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 backdrop-blur-sm"
        title="Close View"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Desktop: Vertical layout - Positioned on the Right Side */}
      <div className="hidden sm:flex flex-col items-end gap-3 absolute top-20 right-6 z-50">

        {/* Back to Home Button - Simplified */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackToHome}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-gray-600 dark:text-gray-300 min-w-[140px]"
          title="Back to home"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-sm font-medium">Home</span>
        </motion.button>

        {/* Text Size Toggle Button */}
        {userQuestion && onTextSizeChange && (
          <TextSizeToggle
            onSizeChange={onTextSizeChange}
            currentSize={textSize}
            className="shadow-sm hover:shadow-md"
            variant="header"
          />
        )}

        {/* Share Button */}
        {userQuestion && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShareClick}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-gray-600 dark:text-gray-300 hover:text-emerald-500 dark:hover:text-emerald-400 min-w-[140px]"
            title="Share this conversation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span className="text-sm font-medium">Share</span>
          </motion.button>
        )}

      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl || (typeof window !== 'undefined' ? window.location.href : '')}
        title={userQuestion ? `QuranGPT: ${userQuestion}` : 'QuranGPT Answer'}
        question={userQuestion || 'QuranGPT Question'}
        isCreatingShare={isSharing}
      />
    </motion.header >
  );
}
