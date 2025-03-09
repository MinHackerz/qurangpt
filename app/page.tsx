'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionMarkCircleIcon, ArrowPathIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Head from 'next/head';

export default function Home() {
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const insertQuestion = (question: string) => {
    setContent(question);
    setError('');
  };

  const resetForm = () => {
    setContent('');
    setSummary('');
    setShowSummary(false);
    setIsProcessing(false);
    setError('');
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to copy summary:', error.message);
      }
    }
  };

  const formatResponse = (response: string) => {
    const processedText = response
      .replace(/\[(.*?)\:\s*(\d+)\]\((https?:\/\/[^\s)]+)\)/g, '<span class="quran-link"><span class="surah-name">$1 $2</span><a href="$3" target="_blank" rel="noopener noreferrer" class="link-icon">↗</a></span>')
      .replace(/\*\*([^*]*)\*\*/g, '<span class="font-bold">$1</span>')
      .replace(/\_\_([^_]*)\_\_/g, '<span class="italic">$1</span>')
      .replace(/### Quran GPT's Answer:/g, '')
      .replace(/Allah\(SWT\) says in the Glorious Quran:/g, '<h3 class="divine-quote-heading">Allah (SWT) says in the Glorious Quran:</h3>')
      .replace(/"(.*?)" \[(.*?)\:\s*(\d+)\]\((https?:\/\/[^\s)]+)\)/g, '<blockquote class="divine-quote">"$1" <span class="surah-reference">$2 $3 <a href="$4" target="_blank" rel="noopener noreferrer" class="link-icon">↗</a></span></blockquote>')
      .replace(/Explanation:/g, '<h3 class="section-heading">Explanation</h3>')
      .replace(/Tafseer:/g, '<h3 class="section-heading">Tafseer</h3>')
      .replace(/Additional Information:/g, '<h3 class="section-heading">Additional Information</h3>')
      .replace(/References:/g, '<h3 class="section-heading">References</h3>');
    return processedText;
  };

  const getPrompt = () => {
    return `**Introduction:**\n\nI am Quran GPT, an AI-powered Islamic Library with experience as a Quran Scholar/Researcher. My task is to answer questions by providing authentic references from the Holy Quran. I will include at least one to three relevant Ayahs of the Quran to support my answers.\n\n**Format:**\n\nI will respond to your question in a peaceful and polite manner. In my answer, I will include Quranic references to support my response. I will use references from different Surahs of the Quran if found to ensure accuracy.\n\n**Reference Format:**\n\n1. I will provide the answer in the following format:\n\nAllah(SWT) says in the Glorious Quran:**\n\n"Ayah text" [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})\n\n2. I will explain the Ayahs with proper and exact tafseer as an authority.\n\n3. ............................................\n\nPlease note that you should replace \`{Surah No.}\` and \`{Ayah No.}\` with the actual Surah and Ayah number when you use this format to provide the answer.\n\nQuestion: ${content}`;
  };

  const askQuran = async () => {
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      setError('Please enter a question');
      return;
    }

    setIsProcessing(true);
    setSummary('');
    setShowSummary(false);
    setError('');

    const prompt = getPrompt();

    try {
      const response = await generate_response_with_gemini(prompt);
      const formattedResponse = formatResponse(response);
      setSummary(formattedResponse);
      setShowSummary(true);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
        console.error('Error generating response:', error.message);
      } else {
        setError('An unexpected error occurred');
        console.error('Error generating response:', error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const generate_response_with_gemini = async (prompt: string): Promise<string> => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      return result.response;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error((error as Error).message || 'Failed to generate response');
    }
  };

  const getGreetingMessage = () => {
    const today = new Date();
    const ramadanEnd = new Date(today.getFullYear(), 2, 31); // March 31st
    const eidDate = new Date(today.getFullYear(), 2, 31); // March 31st

    if (today <= ramadanEnd) {
      return (
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl md:text-4xl text-emerald-600 dark:text-emerald-400">🌙</span>
          <span className="text-xl md:text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
            Ramadan Mubarak!
          </span>
          <span className="text-3xl md:text-4xl text-emerald-600 dark:text-emerald-400">⭐</span>
        </div>
      );
    } else if (today.toDateString() === eidDate.toDateString()) {
      return (
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl md:text-4xl text-emerald-600 dark:text-emerald-400">🎉</span>
          <span className="text-xl md:text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
            Eid Mubarak!
          </span>
          <span className="text-3xl md:text-4xl text-emerald-600 dark:text-emerald-400">🎊</span>
        </div>
      );
    }
    return '';
  };

  return (
    <>
      <Head>
        <title>Quran GPT - AI-Powered Islamic Knowledge Base</title>
        <meta property="og:title" content="Quran GPT" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://quran-gpt.netlify.app/" />
        <meta property="og:image" content="https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png" />
        <meta property="og:site_name" content="Quran GPT - Get the Guidance from the Holy Quran" />
        <meta property="og:description" content="Quran GPT is an AI-powered Islamic knowledge base that provides answers to your questions based on the Holy Quran. It utilizes advanced language models to offer insightful and accurate responses, supported by relevant verses and interpretations from the Quran." />
        <meta name="description" content="Quran GPT is an AI-powered Islamic knowledge base that provides answers to your questions based on the Holy Quran. Get insightful and accurate responses supported by relevant verses and interpretations from the Quran." />
        <meta name="google-site-verification" content="NGBfty7J9MyQwQ5DT-wvArocgpJC72IXOrH4M1IIJAs" />
        <meta name="msvalidate.01" content="5CC4429FDE08444C1CB98ECB946F1E2C" />
        <link rel="icon" type="image/png" href="https://qurangpt.life/wp-content/uploads/2023/04/Quran-GPT-Favicon.png" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
          integrity="sha512-iBBXm8fW90+nuLcSKlbmrPcLa0OT92xO1BIsZ+ywDWZCvqsWgccV3gFoRBv0z+8dLJgyAHIhR35VZc2oM/gI1w=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-NMNGXPDXNK"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-NMNGXPDXNK');
            `
          }}
        />
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "mhnlj5neqn");
            `
          }}
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container max-w-5xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-block mb-6">
              <div className="relative h-20 w-20 mx-auto">
                <div className="absolute inset-0 bg-emerald-500 rounded-full opacity-20 animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="relative flex items-center justify-center h-full w-full bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mb-4">
              {getGreetingMessage()}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-teal-300 mb-4">
              Quran GPT
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
              An AI-powered Islamic knowledge base providing authentic answers from the Holy Quran
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full">AI-Powered</span>
              <span className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full">Quranic Knowledge</span>
              <span className="px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full">Islamic Guidance</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
          >
            {[
              { question: 'What is the purpose of life?', icon: '🌱' },
              { question: 'Who is Prophet Muhammad (PBUH)?', icon: '☪️' },
              { question: 'Who is Allah?', icon: '✨' }
            ].map((item) => (
              <motion.button
                key={item.question}
                whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => insertQuestion(item.question)}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl px-6 py-4 text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-gray-700/80 transition-all duration-300 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{item.icon}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Popular Question</span>
                </div>
                <p className="text-left font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-200">{item.question}</p>
              </motion.button>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8 relative"
          >
            <div className="absolute top-4 left-4 text-gray-400 dark:text-gray-500 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <textarea
              placeholder="Assalamu Alaikum! Ask your question about Islam and the Holy Quran..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-40 p-4 pl-12 rounded-xl shadow-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-base resize-none"
            />
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-center gap-4 mb-10">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={askQuran}
              disabled={isProcessing}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
            >
              <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />
              Ask Quran
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={resetForm}
              className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg shadow-lg transition-all duration-300 font-medium"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Reset
            </motion.button>
          </div>

          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center mb-10"
              >
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-500"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <p className="ml-3 text-emerald-600 dark:text-emerald-400 font-medium">Consulting the Quran...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSummary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 mb-20 border border-gray-100 dark:border-gray-700"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-t-xl"></div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={copyContent}
                  className={`absolute top-4 right-4 flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <ClipboardIcon className="w-5 h-5 mr-2" />
                  {copied ? 'Copied!' : 'Copy'}
                </motion.button>
                <div className="mt-6 mb-2 flex items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Quran GPT's Answer</h2>
                </div>
                <div 
                  className="prose dark:prose-invert max-w-none mt-4 text-gray-700 dark:text-gray-300 space-y-4"
                  dangerouslySetInnerHTML={{ __html: summary }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="bg-white dark:bg-gray-800 shadow-md border-t border-gray-200 dark:border-gray-700 mt-10 w-full">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <span>Made with <span className="text-red-500">♥</span> by <a href="https://www.linkedin.com/in/menajul-hoque/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">Menajul Hoque</a></span>
              </div>
              <Image src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" className="h-8" width={100} height={40} />
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}