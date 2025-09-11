'use client';

import { motion } from 'framer-motion';
import ChatSection from './ChatSection';
import DigitalClock from './DigitalClock';

interface HeroSectionProps {
  getGreetingMessage: () => React.ReactNode;
  // Chat section props
  content: string;
  setContent: (content: string) => void;
  askQuran: () => void;
  resetForm: () => void;
  isProcessing: boolean;
  error: string;
  showSummary: boolean;
  // Language translation props
  originalText?: string;
  onTranslationChange?: (translatedText: string, language: string) => void;
  isTranslating?: boolean;
  translationProgress?: number;
  currentLanguage?: string;
  // Content type selection props
  selectedContentTypes?: {
    tafsir: boolean;
    hadith: boolean;
    suggestedQuestions: boolean;
  };
  onContentTypeChange?: (contentTypes: {
    tafsir: boolean;
    hadith: boolean;
    suggestedQuestions: boolean;
  }) => void;
  // Stop operation functionality
  onStopOperation?: () => void;
}

export default function HeroSection({ 
  getGreetingMessage,
  content,
  setContent,
  askQuran,
  resetForm,
  isProcessing,
  error,
  showSummary,
  originalText,
  onTranslationChange,
  isTranslating,
  translationProgress,
  currentLanguage,
  selectedContentTypes,
  onContentTypeChange,
  onStopOperation
}: HeroSectionProps) {
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

          {/* Wave Animation - Below subtitle when processing */}
          {isProcessing && (
            <div className="mb-8">
              <div className="h-24 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex items-center justify-center space-x-2 w-full"
                >
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-1 rounded-full bg-gray-400 dark:bg-gray-600"
                      animate={{
                        height: ['20px', '60px', '20px'],
                        opacity: [0.4, 0.8, 0.4]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </div>
          )}

          {/* Chat Section */}
          <div className="mb-8">
            <ChatSection 
              content={content}
              setContent={setContent}
              askQuran={askQuran}
              resetForm={resetForm}
              isProcessing={isProcessing}
              error={error}
              showSummary={showSummary}
              originalText={originalText}
              onTranslationChange={onTranslationChange}
              isTranslating={isTranslating}
              translationProgress={translationProgress}
              currentLanguage={currentLanguage}
              selectedContentTypes={selectedContentTypes}
              onContentTypeChange={onContentTypeChange}
              onStopOperation={onStopOperation}
            />
          </div>

          {/* Digital Clock */}
          <DigitalClock />
        </motion.div>
      </div>
    </header>
  );
}
