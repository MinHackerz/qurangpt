'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import ReadQuran from '../components/ReadQuran';

// Loading fallback for ReadQuran
function ReadQuranLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
    </div>
  );
}

export default function QuranPage() {
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

      <Suspense fallback={<ReadQuranLoading />}>
        <ReadQuran />
      </Suspense>

      {/* Bottom spacing for floating buttons */}
      <div className="h-24"></div>
    </motion.div>
  );
}
