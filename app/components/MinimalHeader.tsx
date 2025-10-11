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
      <circle cx="43.5" cy="8.5" r="1.5"/>
      <circle cx="47" cy="16" r="1"/>
      <line x1="54" y1="8.463" x2="54" y2="9.878" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="54" y1="14.122" x2="54" y2="15.537" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="50.463" y1="12" x2="51.878" y2="12" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="56.122" y1="12" x2="57.537" y2="12" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <path d="M55.689,39.588A13.8,13.8,0,0,0,57,33.636c0-6.326-9-11.454-9-11.454a24.758,24.758,0,0,0-2.146,1.425" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <path d="M20.846,19a12.891,12.891,0,0,0,1.287-5.714C22.133,7.605,14.5,3,14.5,3S6.867,7.605,6.867,13.286A12.891,12.891,0,0,0,8.154,19Z" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <path d="M44,31.533a9.9,9.9,0,0,0,2-5.9c0-6.326-14-11.454-14-11.454S18,19.31,18,25.636a9.888,9.888,0,0,0,2,5.9" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <path d="M44.389,40H56.5A1.5,1.5,0,0,1,58,41.5h0A1.5,1.5,0,0,1,56.5,43H44.324" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <rect x="17" y="32" width="30" height="3" rx="1.5" ry="1.5" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <polyline points="29 60.554 29 43 32 40 35 43 35 60.554" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="32" y1="14" x2="32" y2="10" style={{fill:'none',stroke:'currentColor',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <path d="M32.191,4.66a3,3,0,0,0,3.166,5.1" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <path d="M19.564,44H8.5A1.5,1.5,0,0,0,7,45.5H7A1.5,1.5,0,0,0,8.5,47H19.637" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="51" y1="43" x2="51" y2="48" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="48" y1="43" x2="48" y2="48" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="39" y1="35" x2="39" y2="50" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="25" y1="35" x2="25" y2="50" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="13" y1="47.364" x2="13" y2="52" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="16" y1="47.364" x2="16" y2="52" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="13" y1="39" x2="13" y2="43.564" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="16" y1="39" x2="16" y2="43.564" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="60" y1="61" x2="4" y2="61" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="9" y1="44" x2="9" y2="19" style={{fill:'none',stroke:'currentColor',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="20" y1="21" x2="20" y2="20" style={{fill:'none',stroke:'currentColor',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="55" y1="43" x2="55" y2="61" style={{fill:'none',stroke:'currentColor',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="9" y1="47" x2="9" y2="61" style={{fill:'none',stroke:'currentColor',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="20" y1="61" x2="20" y2="35" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
      <line x1="44" y1="61" x2="44" y2="35" style={{fill:'none',stroke:'currentColor',strokeLinecap:'round',strokeLinejoin:'round',strokeWidth:'2px'}}/>
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
      <div className="flex sm:hidden items-center justify-between w-full px-4 py-3 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
        {/* Left side: QuranGPT Title */}
        <div className="flex items-center">
          <h1 className="text-lg font-light tracking-tight text-gray-900 dark:text-white">
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
            className={`flex items-center justify-center w-10 h-10 sm:rounded-full sm:border transition-all duration-200 backdrop-blur-sm ${
              showMobileMenu 
                ? 'sm:bg-gray-200/80 sm:dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 sm:border-gray-200 sm:dark:border-gray-600' 
                : 'sm:bg-transparent sm:hover:bg-gray-100 sm:dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 sm:border-gray-200 sm:dark:border-gray-600'
            }`}
            title="Menu"
          >
            <motion.div
              animate={{ rotate: showMobileMenu ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-5 h-5"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" data-rtl-flip="" className="icon">
                <path d="M6.83496 3.99992C6.38353 4.00411 6.01421 4.0122 5.69824 4.03801C5.31232 4.06954 5.03904 4.12266 4.82227 4.20012L4.62207 4.28606C4.18264 4.50996 3.81498 4.85035 3.55859 5.26848L3.45605 5.45207C3.33013 5.69922 3.25006 6.01354 3.20801 6.52824C3.16533 7.05065 3.16504 7.71885 3.16504 8.66301V11.3271C3.16504 12.2712 3.16533 12.9394 3.20801 13.4618C3.25006 13.9766 3.33013 14.2909 3.45605 14.538L3.55859 14.7216C3.81498 15.1397 4.18266 15.4801 4.62207 15.704L4.82227 15.79C5.03904 15.8674 5.31234 15.9205 5.69824 15.9521C6.01398 15.9779 6.383 15.986 6.83398 15.9902L6.83496 3.99992ZM18.165 11.3271C18.165 12.2493 18.1653 12.9811 18.1172 13.5702C18.0745 14.0924 17.9916 14.5472 17.8125 14.9648L17.7295 15.1415C17.394 15.8 16.8834 16.3511 16.2568 16.7353L15.9814 16.8896C15.5157 17.1268 15.0069 17.2285 14.4102 17.2773C13.821 17.3254 13.0893 17.3251 12.167 17.3251H7.83301C6.91071 17.3251 6.17898 17.3254 5.58984 17.2773C5.06757 17.2346 4.61294 17.1508 4.19531 16.9716L4.01855 16.8896C3.36014 16.5541 2.80898 16.0434 2.4248 15.4169L2.27051 15.1415C2.03328 14.6758 1.93158 14.167 1.88281 13.5702C1.83468 12.9811 1.83496 12.2493 1.83496 11.3271V8.66301C1.83496 7.74072 1.83468 7.00898 1.88281 6.41985C1.93157 5.82309 2.03329 5.31432 2.27051 4.84856L2.4248 4.57317C2.80898 3.94666 3.36012 3.436 4.01855 3.10051L4.19531 3.0175C4.61285 2.83843 5.06771 2.75548 5.58984 2.71281C6.17898 2.66468 6.91071 2.66496 7.83301 2.66496H12.167C13.0893 2.66496 13.821 2.66468 14.4102 2.71281C15.0069 2.76157 15.5157 2.86329 15.9814 3.10051L16.2568 3.25481C16.8833 3.63898 17.394 4.19012 17.7295 4.84856L17.8125 5.02531C17.9916 5.44285 18.0745 5.89771 18.1172 6.41985C18.1653 7.00898 18.165 7.74072 18.165 8.66301V11.3271ZM8.16406 15.995H12.167C13.1112 15.995 13.7794 15.9947 14.3018 15.9521C14.8164 15.91 15.1308 15.8299 15.3779 15.704L15.5615 15.6015C15.9797 15.3451 16.32 14.9774 16.5439 14.538L16.6299 14.3378C16.7074 14.121 16.7605 13.8478 16.792 13.4618C16.8347 12.9394 16.835 12.2712 16.835 11.3271V8.66301C16.835 7.71885 16.8347 7.05065 16.792 6.52824C16.7605 6.14232 16.7073 5.86904 16.6299 5.65227L16.5439 5.45207C16.32 5.01264 15.9796 4.64498 15.5615 4.3886L15.3779 4.28606C15.1308 4.16013 14.8165 4.08006 14.3018 4.03801C13.7794 3.99533 13.1112 3.99504 12.167 3.99504H8.16406C8.16407 3.99667 8.16504 3.99829 8.16504 3.99992L8.16406 15.995Z"></path>
              </svg>
            </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            
            {/* Mobile Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-16 right-4 z-50 sm:hidden"
            >
              <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/70 dark:border-gray-700/70 rounded-xl shadow-xl p-4 min-w-[240px] max-w-[280px]">
                {/* Menu Items */}
                <div className="space-y-2">

                  {/* Ask Quran */}
                  <button
                    onClick={() => handleMobileMenuAction(() => {
                      const event = new CustomEvent('qgpt:reset-to-default');
                      window.dispatchEvent(event);
                    })}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 transition ${
                      activeButton === 'ask-quran' 
                        ? 'bg-gray-200/80 dark:bg-gray-700/80' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm text-gray-800 dark:text-gray-200">Ask Quran</span>
                  </button>

                  {/* Read Quran */}
                  <button
                    onClick={() => handleMobileMenuAction(() => {
                      const event = new CustomEvent('qgpt:show-component', { detail: { component: 'read-quran' } });
                      window.dispatchEvent(event);
                    })}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 transition ${
                      activeButton === 'read-quran' 
                        ? 'bg-gray-200/80 dark:bg-gray-700/80' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75c0-1.243 0-1.864.242-2.34a2.25 2.25 0 0 1 .918-.918C5.386 3.25 6.007 3.25 7.25 3.25h.5c1.657 0 2.486 0 3.191.205.9.265 1.719.77 2.309 1.45.59-.68 1.41-1.185 2.309-1.45.705-.205 1.534-.205 3.191-.205h.5c1.243 0 1.864 0 2.34.242.392.206.712.526.918.918.242.476.242 1.097.242 2.34v10.5c0 1.243 0 1.864-.242 2.34a2.25 2.25 0 0 1-.918.918c-.476.242-1.097.242-2.34.242h-.5c-1.657 0-2.486 0-3.191-.205-.9-.265-1.719-.77-2.309-1.45-.59.68-1.41 1.185-2.309 1.45-.705.205-1.534.205-3.191.205h-.5c-1.243 0-1.864 0-2.34-.242a2.25 2.25 0 0 1-.918-.918C3.75 19.114 3.75 18.493 3.75 17.25V6.75Z"/>
                    </svg>
                    <span className="text-sm text-gray-800 dark:text-gray-200">Read Quran</span>
                  </button>


                  {/* Nearest Mosque */}
                  <button
                    onClick={() => handleMobileMenuAction(() => {
                      const event = new CustomEvent('qgpt:show-component', { detail: { component: 'mosque-finder' } });
                      window.dispatchEvent(event);
                    })}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 transition ${
                      activeButton === 'mosque-finder' 
                        ? 'bg-gray-200/80 dark:bg-gray-700/80' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <MosqueIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm text-gray-800 dark:text-gray-200">Nearest Mosque</span>
                  </button>

                  {/* Zakat Calculator */}
                  <button
                    onClick={() => handleMobileMenuAction(() => {
                      const event = new CustomEvent('qgpt:show-component', { detail: { component: 'zakat-calculator' } });
                      window.dispatchEvent(event);
                    })}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 transition ${
                      activeButton === 'zakat-calculator' 
                        ? 'bg-gray-200/80 dark:bg-gray-700/80' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-sm text-gray-800 dark:text-gray-200">Zakat Calculator</span>
                  </button>

                  {/* Time Dashboard */}
                  <button
                    onClick={() => handleMobileMenuAction(() => {
                      const event = new CustomEvent('qgpt:toggle-time-dashboard', { detail: { open: true } });
                      window.dispatchEvent(event);
                    })}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 transition ${
                      activeButton === 'time-dashboard' 
                        ? 'bg-gray-200/80 dark:bg-gray-700/80' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <ClockIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm text-gray-800 dark:text-gray-200">Time and Calendar</span>
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-gray-200/70 dark:bg-gray-700/70 my-2" />




                  {/* Transparency Link */}
                  <Link
                    href="/transparency"
                    onClick={() => setShowMobileMenu(false)}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <Shield className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
                    <span className="text-sm text-gray-800 dark:text-gray-200">Transparency</span>
                  </Link>

                  {/* Contact Developer */}
                  <button
                    onClick={() => handleMobileMenuAction(() => {
                      window.open('https://menajul.vercel.app', '_blank');
                    })}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <UserIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <span className="text-sm text-gray-800 dark:text-gray-200">Contact Developer</span>
                  </button>

                  {/* Divider */}
                  <div className="h-px bg-gray-200/70 dark:bg-gray-700/70 my-2" />

                  {/* Theme Toggle - Inline Light/Dark Mode Icons */}
                  <div className="flex items-center justify-center gap-2 px-3 py-2">
                    <button
                      onClick={() => handleMobileMenuAction(() => {
                        if (!mounted) return;
                        setTheme?.('light');
                      })}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                        mounted && theme === 'light'
                          ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title="Light Mode"
                    >
                      <SunIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleMobileMenuAction(() => {
                        if (!mounted) return;
                        setTheme?.('dark');
                      })}
                      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                        mounted && theme === 'dark'
                          ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      title="Dark Mode"
                    >
                      <MoonIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Free Palestine - Minimal Footer */}
                  <div className="flex items-center justify-center px-3 py-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-light">
                      Free Palestine
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: Vertical layout */}
      <div className="hidden sm:flex flex-col items-start gap-2">
        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackToHome}
          className="flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-200 backdrop-blur-sm bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600"
          title="Back to home"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M4 12L10 6M4 12L10 18"/>
          </svg>
        </motion.button>

        {/* Theme Toggle removed on desktop */}

        {/* Text Size Toggle Button - Only show when there's content AND output is generated */}
        {userQuestion && onTextSizeChange && (
          <TextSizeToggle
            onSizeChange={onTextSizeChange}
            currentSize={textSize}
            className="w-10 h-10"
            variant="header"
          />
        )}


        {/* Share Button removed from desktop - now shown in ResponseSection */}

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
    </motion.header>
  );
}
