'use client';

import { motion } from 'framer-motion';

export default function TransparencySection() {
  return (
    <div className="mb-12 max-w-4xl mx-auto px-0 -mx-1">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-transparent rounded-xl p-6 border border-gray-200 dark:border-gray-600"
      >
        <div className="text-center mb-6">
          <h2 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wider uppercase mb-2">
            How Quran GPT Works
          </h2>
          <p className="text-gray-500 dark:text-gray-500 text-xs font-mono uppercase tracking-wide">
            Complete transparency about our AI processing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - User Experience */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wider uppercase mb-4">
              User Experience
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-600 dark:bg-gray-300 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wide uppercase mb-1">
                    Ask Your Question
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">
                    Type any question about Islam, Quran, or Islamic practices
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-600 dark:bg-gray-300 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wide uppercase mb-1">
                    AI Processing
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">
                    Our AI analyzes and searches through Islamic knowledge
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-600 dark:bg-gray-300 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wide uppercase mb-1">
                    Rich Response
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">
                    Get answers with Quranic references, audio, and tafsir
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Technology Stack */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wider uppercase mb-4">
              Technology Stack
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-600 dark:bg-gray-300 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wide uppercase mb-1">
                    Google Gemini AI
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">
                    Processes questions and generates Islamic answers
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-600 dark:bg-gray-300 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wide uppercase mb-1">
                    QuranCloud API
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">
                    Fetches Quran verses with Arabic text and translations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-600 dark:bg-gray-300 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wide uppercase mb-1">
                    Islamic Network CDN
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">
                    Provides audio recitations from Sheikh Alafasy
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-gray-600 dark:bg-gray-300 rounded-full"></div>
                </div>
                <div>
                  <h4 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wide uppercase mb-1">
                    Tafsir API
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">
                    Multiple authentic sources: Ibn Kathir, Maarif Ul Quran
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Additional Features */}
        <div className="mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-600/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.5 0L9 3m0 0L7.5 5M9 3v18m0 0h6m-6 0a9 9 0 01-9-9" />
                </svg>
              </div>
              <h4 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wide uppercase mb-1">Multi-Language</h4>
              <p className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">125+ languages</p>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wide uppercase mb-1">Live Updates</h4>
              <p className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">Prayer times & calendar</p>
            </div>

            <div className="text-center">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wide uppercase mb-1">Secure Processing</h4>
              <p className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">Privacy protected</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
