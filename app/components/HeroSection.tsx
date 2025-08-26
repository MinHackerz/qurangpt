'use client';

import { motion } from 'framer-motion';

interface HeroSectionProps {
  getGreetingMessage: () => React.ReactNode;
}

export default function HeroSection({ getGreetingMessage }: HeroSectionProps) {
  return (
    <header className="relative z-10">
      <div className="container max-w-6xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center"
        >
          {/* Advanced Arabic-Styled Title */}
          <div className="text-center mb-12 title-container">
            <h1 className="text-4xl md:text-5xl lg:text-6xl leading-[1.1] tracking-wide">
              <span className="quran-word font-extralight">QuranGPT</span>
            </h1>
            {/* Enhanced Arabic-inspired ornament */}
            <div className="mt-6 flex items-center justify-center">
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400 dark:via-amber-500 to-transparent"></div>
              <div className="mx-4 text-amber-500 dark:text-amber-400 text-2xl font-bold font-[var(--font-scheherazade)] arabic-ornament">۞</div>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400 dark:via-amber-500 to-transparent"></div>
            </div>
          </div>

          {/* Greeting Message */}
          {getGreetingMessage() && (
            <div className="mb-4">
              {getGreetingMessage()}
            </div>
          )}

          {/* Enhanced Subtitle with Arabic styling */}
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-lg mx-auto mb-6 font-[var(--font-noto-naskh)]">
            AI-powered Islamic knowledge from the Holy Quran
          </p>

          {/* Palestine Support Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <div className="relative overflow-hidden px-3 py-2 rounded-md">
              {/* Minimalist Palestinian Flag Background - Black top, White center, Green bottom */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-800/40 via-gray-100/60 to-emerald-600/40 dark:from-gray-700/50 dark:via-gray-200/40 dark:to-emerald-500/50"></div>
              
              {/* Red Triangle (left side) - Minimal */}
              <div className="absolute left-0 top-0 w-0 h-0 border-l-[12px] border-l-rose-600/60 border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent"></div>
              
              {/* Content */}
              <div className="relative z-10 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-800 dark:text-gray-200">Free Palestine</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </header>
  );
}
