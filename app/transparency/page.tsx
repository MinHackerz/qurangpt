'use client';

import { motion } from 'framer-motion';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function TransparencyPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-transparent"
    >
      {/* Sticky Header - Matching ReadQuran style */}
      <div className="sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 sm:px-8 pt-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Page Title */}
          <header className="mb-16 text-center">
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900 dark:text-gray-50 mb-4 tracking-tight">
              Transparency
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-light text-lg max-w-xl mx-auto">
              Our commitment to openness about how QuranGPT works, the sources we use, and how we handle your data.
            </p>
          </header>

          {/* Content Sections */}
          <div className="space-y-16">

            {/* AI Technology */}
            <section>
              <h2 className="text-xs font-medium tracking-wide text-amber-600 dark:text-amber-400 uppercase mb-3">
                AI Technology
              </h2>
              <h3 className="text-2xl font-serif text-gray-900 dark:text-white mb-6">
                Powered by Google Gemini & OpenAI
              </h3>
              <div className="space-y-6">
                <div className="border-l-2 border-gray-200 dark:border-gray-800 pl-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Primary: Google Gemini</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    Google's Gemini AI model serves as our primary language model, designed for multilingual understanding with high accuracy and nuanced responses.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 dark:border-gray-800 pl-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Fallback: OpenAI GPT-4o-mini</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    OpenAI's GPT-4o-mini model is available as a fallback when Gemini is unavailable, ensuring uninterrupted service and reliable responses at all times.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 dark:border-gray-800 pl-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Training Data</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    Both models are trained on diverse datasets including Islamic texts, scholarly works, and general knowledge to provide contextual and accurate responses.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Sources */}
            <section>
              <h2 className="text-xs font-medium tracking-wide text-amber-600 dark:text-amber-400 uppercase mb-3">
                Data Sources
              </h2>
              <h3 className="text-2xl font-serif text-gray-900 dark:text-white mb-6">
                Authentic Islamic Sources
              </h3>
              <div className="space-y-6">
                <div className="border-l-2 border-gray-200 dark:border-gray-800 pl-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Quran Text</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    Authentic Quranic text from reliable sources with accurate Arabic script and multiple verified translations.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 dark:border-gray-800 pl-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Hadith Collections</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    Sahih Bukhari, Sahih Muslim, Sunan Abu Dawood, Sunan Ibn Majah, and Jami' at-Tirmidhi.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 dark:border-gray-800 pl-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tafsir Sources</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    Multiple classical and contemporary tafsir works for comprehensive Quranic interpretations.
                  </p>
                </div>
              </div>
            </section>

            {/* Privacy & Security */}
            <section>
              <h2 className="text-xs font-medium tracking-wide text-amber-600 dark:text-amber-400 uppercase mb-3">
                Privacy & Security
              </h2>
              <h3 className="text-2xl font-serif text-gray-900 dark:text-white mb-6">
                Your Data is Protected
              </h3>
              <div className="space-y-6">
                <div className="border-l-2 border-gray-200 dark:border-gray-800 pl-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Data Handling</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    Questions are processed securely with no permanent storage. Data is retained temporarily only for processing.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 dark:border-gray-800 pl-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">No Personal Data Collection</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    We do not collect personal information, track users, or store any identifying data.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 dark:border-gray-800 pl-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Secure Processing</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    All data transmission is encrypted using industry-standard security practices.
                  </p>
                </div>
              </div>
            </section>

            {/* Accuracy & Reliability */}
            <section>
              <h2 className="text-xs font-medium tracking-wide text-amber-600 dark:text-amber-400 uppercase mb-3">
                Accuracy & Reliability
              </h2>
              <h3 className="text-2xl font-serif text-gray-900 dark:text-white mb-6">
                Commitment to Accuracy
              </h3>
              <div className="space-y-6">
                <div className="border-l-2 border-gray-200 dark:border-gray-800 pl-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Source Verification</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    All Quranic verses and hadith references are verified against authentic sources.
                  </p>
                </div>
                <div className="border-l-2 border-gray-200 dark:border-gray-800 pl-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Continuous Improvement</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    We regularly update and refine our system to improve response accuracy and reliability.
                  </p>
                </div>
                <div className="border-l-2 border-amber-500/30 dark:border-amber-500/30 pl-6 bg-amber-50/50 dark:bg-amber-900/10 py-4 pr-4 rounded-r-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Important Note</h4>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    AI responses are educational starting points only. Always verify with authentic Islamic scholars and trusted sources before making any religious decisions.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="pt-8 border-t border-gray-100 dark:border-gray-900">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-4 font-light">
                  Have questions about our transparency practices?
                </p>
                <a
                  href="https://menajul.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                >
                  Contact the Developer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </section>

            {/* Footer */}
            <footer className="text-center pt-8">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Last updated: December 20, 2025
              </p>
            </footer>

          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
