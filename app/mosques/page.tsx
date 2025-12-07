'use client';

import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import MosqueFinder from '../components/MosqueFinder';
import AskBar from './AskBar';

export default function MosqueFinderPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-transparent"
    >
      {/* Sticky Header */}
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

      <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8 pb-28">
        {/* Main feature */}
        <MosqueFinder />
      </div>

      {/* Bottom Ask QuranGPT input with 20px padding */}
      <AskBar />
    </motion.div>
  );
}
