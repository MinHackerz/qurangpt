'use client';

import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, EyeIcon, ShieldCheckIcon, CpuChipIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Head from 'next/head';

export default function TransparencyPage() {
  const { theme } = useTheme();

  return (
    <>
      <Head>
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      </Head>
      <div className="min-h-screen bg-transparent relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-transparent to-gray-100/20 dark:from-gray-950/30 dark:via-transparent dark:to-gray-900/20"></div>
      
      {/* Minimal Back Button - Fixed top left */}
      <div className="fixed top-4 left-4 z-50">
        <div className="p-1 rounded-xl border border-gray-200/30 dark:border-gray-700/30 bg-white/5 dark:bg-gray-900/5 backdrop-blur-sm">
          <Link 
            href="/"
            className="group flex items-center justify-center w-16 h-8 rounded-lg bg-white/10 dark:bg-gray-900/10 backdrop-blur-xl hover:bg-white/20 dark:hover:bg-gray-900/20 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-200" />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-3xl mx-auto px-6 pt-20 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Page Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light text-gray-900 dark:text-white tracking-tight mb-2">
              Transparency
            </h1>
            <div className="w-16 h-px bg-gray-300 dark:bg-gray-600 mx-auto"></div>
          </div>

          {/* Introduction */}
          <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/5 rounded-2xl p-8 border border-gray-300/30 dark:border-gray-600/30">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 tracking-tight">
              Our Commitment
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base font-light">
              Quran GPT is built with transparency and trust at its core. We provide clear 
              information about our AI system, data sources, and reliability measures.
            </p>
          </div>

          {/* AI Technology */}
          <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/5 rounded-2xl p-8 border border-gray-300/30 dark:border-gray-600/30">
            <div className="flex items-center space-x-3 mb-6">
              <CpuChipIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                AI Technology
              </h2>
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-base">Language Model</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-light">
                  Google's Gemini AI model, designed for multilingual understanding with high accuracy.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-base">Training Data</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-light">
                  Diverse dataset including Islamic texts, scholarly works, and general knowledge.
                </p>
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/5 rounded-2xl p-8 border border-gray-300/30 dark:border-gray-600/30">
            <div className="flex items-center space-x-3 mb-6">
              <GlobeAltIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                Data Sources
              </h2>
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-base">Quran Text</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-light">
                  Authentic Quranic text from reliable sources with accurate Arabic and translations.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-base">Hadith Collections</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-light">
                  Sahih Bukhari, Sahih Muslim, Sunan Abu Dawood, Sunan Ibn Majah, and Jami' at-Tirmidhi.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-base">Tafsir Sources</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-light">
                  Multiple classical and contemporary tafsir works for comprehensive interpretations.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/5 rounded-2xl p-8 border border-gray-300/30 dark:border-gray-600/30">
            <div className="flex items-center space-x-3 mb-6">
              <ShieldCheckIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                Privacy & Security
              </h2>
            </div>
            <div className="space-y-5">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-base">Data Handling</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-light">
                  Questions processed securely with no permanent storage. Data retained temporarily only.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-base">No Personal Data</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-light">
                  No personal information collection, user tracking, or identifying data storage.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-base">Secure Processing</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-light">
                  Encrypted data transmission with industry-standard security practices.
                </p>
              </div>
            </div>
          </div>

          {/* Accuracy & Reliability */}
          <div className="backdrop-blur-md bg-white/5 dark:bg-gray-900/5 rounded-2xl p-8 border border-gray-300/30 dark:border-gray-600/30">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 tracking-tight">
              Accuracy & Reliability
            </h2>
            <div className="space-y-5">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-base">Source Verification</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-light">
                  All Quranic verses and hadith references verified against authentic sources.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-base">Continuous Improvement</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-light">
                  Regular updates and refinements to improve response accuracy.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-base">Limitations</h3>
                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-light">
                  AI responses are starting points for learning. Verify with qualified scholars for important matters.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="backdrop-blur-sm bg-white/3 dark:bg-gray-900/3 rounded-xl p-6 border border-gray-200/40 dark:border-gray-700/40">
            <div className="text-center">
              <h2 className="text-base font-medium text-gray-800 dark:text-gray-200 mb-3 tracking-tight">
                Questions?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed font-light">
                Have questions about our transparency practices?
              </p>
              <a
                href="https://www.linkedin.com/in/menajul-hoque/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-300 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <span>Contact Developer</span>
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-6">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
    </>
  );
}
