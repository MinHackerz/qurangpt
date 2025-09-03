'use client';

import { HeartIcon } from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="relative z-10 bg-transparent border-t border-gray-200 dark:border-gray-700 mt-20">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-light tracking-wide flex items-center justify-center gap-2">
            <span>Created with</span>
            <HeartIcon className="w-4 h-4 text-red-500" />
            <span>by</span>
            <a 
              href="https://www.linkedin.com/in/menajul-hoque/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors duration-200"
            >
              Menajul Hoque
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
