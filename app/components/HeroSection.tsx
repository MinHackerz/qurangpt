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
            <h1 className="text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-wide cairo-title">
              <span className="quran-word font-bold">Quran</span>
              <span className="gpt-word font-normal ml-3 md:ml-5 lg:ml-7">GPT</span>
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
        </motion.div>
      </div>
    </header>
  );
}
