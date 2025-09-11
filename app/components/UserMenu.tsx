'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';
import { 
  EllipsisVerticalIcon, 
  SunIcon,
  MoonIcon,
  HeartIcon,
  EyeIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface UserMenuProps {
  isVisible?: boolean;
}

export default function UserMenu({ isVisible = true }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeToggle = () => {
    toggleTheme();
    setIsOpen(false);
  };

  const handleContactMe = () => {
    window.open('https://www.linkedin.com/in/menajul-hoque/', '_blank');
    setIsOpen(false);
  };

  const handleTransparency = () => {
    router.push('/transparency');
    setIsOpen(false);
  };

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu Button */}
      <div className="p-0.5 rounded-lg border border-gray-300/50 dark:border-gray-600/50 bg-white/5 dark:bg-gray-900/5">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 rounded-md bg-white/5 dark:bg-gray-900/5 hover:bg-white/10 dark:hover:bg-gray-900/10 transition-all duration-200"
          aria-label="User menu"
        >
          <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-3 w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200/40 dark:border-gray-700/40 rounded-2xl shadow-xl z-50"
          >
            <div className="p-2">
              {/* Theme Toggle with Icons */}
              <div className="px-3 py-4">
                <div className="flex items-center justify-center space-x-3">
                  {/* Light Icon */}
                  <SunIcon 
                    className={`w-4 h-4 transition-colors duration-200 ${
                      theme === 'light' 
                        ? 'text-yellow-500' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} 
                  />
                  
                  {/* Slider Button */}
                  <button
                    onClick={handleThemeToggle}
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    <motion.div
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                        theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                      animate={{
                        x: theme === 'dark' ? 24 : 4
                      }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    />
                  </button>
                  
                  {/* Dark Icon */}
                  <MoonIcon 
                    className={`w-4 h-4 transition-colors duration-200 ${
                      theme === 'dark' 
                        ? 'text-blue-400' 
                        : 'text-gray-400 dark:text-gray-500'
                    }`} 
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="mx-3 border-t border-gray-200/30 dark:border-gray-700/30"></div>

              {/* Menu Items */}
              <div className="py-1">
                {/* Transparency Page */}
                <button
                  onClick={handleTransparency}
                  className="group w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-150 relative"
                >
                  <EyeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="tracking-tight relative">
                    Transparency
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-600 dark:bg-gray-400 transition-all duration-200 group-hover:w-full"></span>
                  </span>
                </button>

                {/* Contact Me */}
                <button
                  onClick={handleContactMe}
                  className="group w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all duration-150 relative"
                >
                  <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="tracking-tight relative">
                    Contact
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-600 dark:bg-gray-400 transition-all duration-200 group-hover:w-full"></span>
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="mx-3 border-t border-gray-200/30 dark:border-gray-700/30"></div>

              {/* Free Palestine - Footer */}
              <div className="px-3 py-2">
                <div className="flex items-center justify-center space-x-1.5">
                  <HeartIcon className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-light tracking-wide">
                    Free Palestine
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
