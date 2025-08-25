'use client';

import { HeartIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="relative z-10 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-700 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center justify-center gap-2">
            <span>Made with</span>
            <HeartIcon className="w-4 h-4 text-red-500" />
            <span>by</span>
            <a 
              href="https://www.linkedin.com/in/menajul-hoque/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors duration-200"
            >
              Menajul Hoque
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
