'use client';

import { motion } from 'framer-motion';

interface HeroSectionProps {
  getGreetingMessage: () => React.ReactNode;
}

export default function HeroSection({ getGreetingMessage }: HeroSectionProps) {
  return (
    <header className="relative z-10">
      <div className="container max-w-4xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          {/* Clean, Professional Title */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-gray-900 dark:text-white mb-4">
              QuranGPT
            </h1>
            
            {/* Minimalist Arabic Ornament */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="mx-6 text-2xl text-gray-400 dark:text-gray-500 font-[var(--font-scheherazade)]">۞</div>
              <div className="w-12 h-px bg-gray-300 dark:bg-gray-600"></div>
            </div>
          </div>

          {/* Greeting Message */}
          {getGreetingMessage() && (
            <div className="mb-6">
              {getGreetingMessage()}
            </div>
          )}

          {/* Professional Subtitle */}
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed font-light">
            AI-powered Islamic knowledge from the Holy Quran
          </p>

          {/* Refined Palestine Support */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="inline-flex items-center justify-center"
          >
            <div className="relative px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-full">
              <div className="flex items-center gap-3">
                {/* Palestinian Flag - Correct Colors and Triangle */}
                <div className="relative h-4 w-8 rounded-sm overflow-hidden border border-gray-300 dark:border-gray-600">
                  {/* Red Triangle on the left */}
                  <div className="absolute left-0 top-0 w-0 h-0 border-l-[8px] border-l-red-600 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent"></div>
                  
                  {/* Three horizontal stripes */}
                  <div className="flex flex-col h-full">
                    <div className="h-1/3 bg-black"></div>
                    <div className="h-1/3 bg-white"></div>
                    <div className="h-1/3 bg-green-600"></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 tracking-wide">
                  Free Palestine
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}
