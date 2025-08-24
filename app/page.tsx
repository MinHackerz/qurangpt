'use client';

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Script from 'next/script';
import {
  HeroSection,
  QuickQuestions,
  ChatSection,
  ThinkingProcess,
  ResponseSection,
  Footer,
  IslamicWidgets,
  LanguageTabs
} from './components';
import { useAudioManager } from './hooks/useAudioManager';

export default function Home() {
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  
  // Audio management
  const {
    currentAyahId,
    isPlaying,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    isAyahPlaying,
    isAyahActive,
    getAudioProgress,
    seekToTime,
    cleanup: cleanupAudio
  } = useAudioManager();

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
    
    // Clean up audio state
    stopAudio();
  };

  const copyContent = async () => {
    try {
      // Use displayed content if available, otherwise use summary
      const contentToCopy = displayedContent || summary;
      
      // Clean the content for copying - remove HTML tags and audio elements, keep only reference links
      const cleanContent = contentToCopy
        // Remove HTML tags but keep line breaks
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '')
        // Remove audio player sections
        .replace(/Audio Recitation[\s\S]*?Ready/g, '')
        .replace(/Select Reciter[\s\S]*?128kbps MP3/g, '')
        // Remove progress bars
        .replace(/progress-container[\s\S]*?hidden/g, '')
        // Clean up extra whitespace
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/^\s+|\s+$/gm, '')
        // Add reference links at the end
        .replace(/"([^"]+)"\s*\[(.*?)\:\s*(\d+)\]\(([^)]+)\)/g, (match, verseText, surahName, ayahNumber, url) => {
          return `"${verseText}"\nReference: ${surahName}, Verse ${ayahNumber} - ${url}`;
        })
        .trim();

      await navigator.clipboard.writeText(cleanContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to copy summary:', error.message);
      }
    }
  };

  const handleTranslationChange = useCallback((translatedText: string, language: string) => {
    setDisplayedContent(translatedText);
    setCurrentLanguage(language);
  }, []);

  // Audio management functions
  const handleAudioPlay = useCallback(async (ayahId: string, globalAyahNumber: string) => {
    const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;
    try {
      await playAudio(ayahId, audioUrl);
    } catch (error) {
      // Silently handle audio errors
    }
  }, [playAudio]);

  const handleAudioPause = useCallback(() => {
    pauseAudio();
  }, [pauseAudio]);

  const handleAudioEnd = useCallback(() => {
    // Audio ended naturally, no action needed
  }, []);

  // Helper function to format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };







  const formatResponse = (response: string) => {
    
    const processedText = response
      // Format section headers with enhanced styling
      .replace(/^#{1,3}\s*(.+)$/gm, '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-3 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')
      
      // Format ayah references with embedded audio players
      .replace(/"([^"]+)"\s*\[(.*?)\:\s*(\d+)\]\((https?:\/\/[^\s)]+)\)/g, (match, verseText, surahName, ayahNumber, url) => {
        // Map surah names to numbers for audio
        const surahNameToNumber: { [key: string]: number } = {
          'Al-Fatiha': 1, 'Al-Baqarah': 2, 'Aal-Imran': 3, 'An-Nisa': 4, 'Al-Ma\'idah': 5,
          'Al-An\'am': 6, 'Al-A\'raf': 7, 'Al-Anfal': 8, 'At-Tawbah': 9, 'Yunus': 10,
          'Hud': 11, 'Yusuf': 12, 'Ar-Ra\'d': 13, 'Ibrahim': 14, 'Al-Hijr': 15,
          'An-Nahl': 16, 'Al-Isra': 17, 'Al-Kahf': 18, 'Maryam': 19, 'Ta-Ha': 20,
          'Al-Anbya': 21, 'Al-Hajj': 22, 'Al-Mu\'minun': 23, 'An-Nur': 24, 'Al-Furqan': 25,
          'Ash-Shu\'ara': 26, 'An-Naml': 27, 'Al-Qasas': 28, 'Al-Ankabut': 29, 'Ar-Rum': 30,
          'Luqman': 31, 'As-Sajdah': 32, 'Al-Ahzab': 33, 'Saba': 34, 'Fatir': 35,
          'Ya-Sin': 36, 'As-Saffat': 37, 'Sad': 38, 'Az-Zumar': 39, 'Ghafir': 40,
          'Fussilat': 41, 'Ash-Shura': 42, 'Az-Zukhruf': 43, 'Ad-Dukhan': 44, 'Al-Jathiyah': 45,
          'Al-Ahqaf': 46, 'Muhammad': 47, 'Al-Fath': 48, 'Al-Hujurat': 49, 'Qaf': 50,
          'Adh-Dhariyat': 51, 'At-Tur': 52, 'An-Najm': 53, 'Al-Qamar': 54, 'Ar-Rahman': 55,
          'Al-Waqi\'ah': 56, 'Al-Hadid': 57, 'Al-Mujadila': 58, 'Al-Hashr': 59, 'Al-Mumtahanah': 60,
          'As-Saf': 61, 'Al-Jumu\'ah': 62, 'Al-Munafiqun': 63, 'At-Taghabun': 64, 'At-Talaq': 65,
          'At-Tahrim': 66, 'Al-Mulk': 67, 'Al-Qalam': 68, 'Al-Haqqah': 69, 'Al-Ma\'arij': 70,
          'Nuh': 71, 'Al-Jinn': 72, 'Al-Muzzammil': 73, 'Al-Muddathir': 74, 'Al-Qiyamah': 75,
          'Al-Insan': 76, 'Al-Mursalat': 77, 'An-Naba': 78, 'An-Nazi\'at': 79, 'Abasa': 80,
          'At-Takwir': 81, 'Al-Infitar': 82, 'Al-Mutaffifin': 83, 'Al-Inshiqaq': 84, 'Al-Buruj': 85,
          'At-Tariq': 86, 'Al-A\'la': 87, 'Al-Ghashiyah': 88, 'Al-Fajr': 89, 'Al-Balad': 90,
          'Ash-Shams': 91, 'Al-Layl': 92, 'Ad-Duha': 93, 'Ash-Sharh': 94, 'At-Tin': 95,
          'Al-Alaq': 96, 'Al-Qadr': 97, 'Al-Bayyinah': 98, 'Az-Zalzalah': 99, 'Al-Adiyat': 100,
          'Al-Qari\'ah': 101, 'At-Takathur': 102, 'Al-Asr': 103, 'Al-Humazah': 104, 'Al-Fil': 105,
          'Quraish': 106, 'Al-Ma\'un': 107, 'Al-Kawthar': 108, 'Al-Kafirun': 109, 'An-Nasr': 110,
          'Al-Masad': 111, 'Al-Ikhlas': 112, 'Al-Falaq': 113, 'An-Nas': 114
        };
        
        // Calculate global ayah number
        const surahNumber = surahNameToNumber[surahName.trim()] || 1;
        const ayahNum = parseInt(ayahNumber);
        
        // The Islamic Network API uses sequential ayah numbers from 1 to 6236
        // We need to calculate the correct global ayah number
        const surahAyahCounts = [
          7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
        ];
        
        // Calculate the global ayah number (1-6236)
        let globalAyahNumber = 0;
        for (let i = 0; i < surahNumber - 1; i++) {
          globalAyahNumber += surahAyahCounts[i] || 0;
        }
        globalAyahNumber += ayahNum;
        

        
        // Generate unique ID for this ayah
        const ayahId = `ayah-${surahNumber}-${ayahNum}-${Date.now()}`;
        
        return `<div class="stylish-ayah-reference mb-4 pt-1.5 pb-1.5" data-ayah-id="${ayahId}" data-global-ayah="${globalAyahNumber}" data-surah-name="${surahName}" data-ayah-number="${ayahNumber}" data-surah-number="${surahNumber}">
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
            <!-- Compact Header -->
            <div class="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-white font-[var(--font-amiri)]">${surahName}</h3>
                    <p class="text-xs text-emerald-100">Verse ${ayahNumber}</p>
                  </div>
                </div>
                <span class="px-2 py-0.5 bg-white/20 text-white text-xs font-mono rounded">${surahNumber}:${ayahNumber}</span>
              </div>
            </div>
            
            <!-- Compact Verse Content -->
            <div class="p-4">
              <div class="text-center mb-3">
                <div class="relative inline-block">
                  <div class="text-2xl md:text-3xl text-emerald-600 dark:text-emerald-400 opacity-30 absolute -top-1 -left-6">"</div>
                  <div class="text-2xl md:text-3xl text-emerald-600 dark:text-emerald-400 opacity-30 absolute -top-1 -right-6">"</div>
                  <blockquote class="text-lg md:text-xl text-gray-800 dark:text-gray-200 font-[var(--font-amiri)] leading-relaxed font-bold tracking-wide px-6">
                    ${verseText}
                  </blockquote>
                </div>
              </div>
              
              <!-- Compact Audio Player -->
              <div class="enhanced-audio-player" data-ayah-id="${ayahId}" data-global-ayah="${globalAyahNumber}">
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-3">
                      <button class="play-pause-btn w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:scale-105 active:scale-95 transition-transform duration-200" data-ayah-id="${ayahId}">
                        <svg class="play-icon w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                        <svg class="pause-icon w-4 h-4 hidden" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                      </button>
                      <span class="status-text text-sm font-medium text-gray-800 dark:text-gray-200">Click to play</span>
                    </div>
                    <span class="time-display text-xs text-gray-500 dark:text-gray-400 font-mono">--:--</span>
                  </div>
                  
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span class="current-time">0:00</span>
                      <span class="total-duration">--:--</span>
                      <span class="status-indicator w-2 h-2 bg-emerald-500 rounded-full hidden animate-pulse"></span>
                    </div>
                    <div class="relative">
                      <div class="progress-bg w-full h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div class="progress-fill h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-300 ease-out" style="width: 0%"></div>
                      </div>
                      <input type="range" class="progress-slider absolute inset-0 w-full h-1 opacity-0 cursor-pointer" min="0" max="100" value="0" data-ayah-id="${ayahId}">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
      })
      
      // Format bold text
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-800 dark:text-gray-200">$1</strong>')
      
      // Format italic text
      .replace(/\*([^*]+)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
      
      // Format underlined text
      .replace(/\_\_([^_]+)\_\_/g, '<span class="underline decoration-gray-400 dark:decoration-gray-500">$1</span>')
      
      // Format numbered lists with enhanced styling and spacing
      .replace(/^(\d+)\.\s+(.+)$/gm, '<div class="mb-6 flex items-start p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200"><span class="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 text-white dark:text-gray-800 rounded-full text-sm font-bold mr-4 mt-0.5 flex-shrink-0 shadow-md">$1</span><span class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">$2</span></div>')
      
      // Format bullet points
      .replace(/^[-•]\s+(.+)$/gm, '<div class="mb-5 flex items-start p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200"><span class="w-3 h-3 bg-gradient-to-br from-gray-600 to-gray-500 dark:from-gray-400 dark:to-gray-300 rounded-full mr-4 mt-3 flex-shrink-0 shadow-sm"></span><span class="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">$1</span></div>')
      
      // Format specific Islamic terms with enhanced styling
      .replace(/Allah\s*\(SWT\)/g, '<span class="inline-flex items-center px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-bold border-2 border-gray-300 dark:border-gray-500 shadow-sm hover:shadow-md transition-all duration-200">🕌 Allah (SWT)</span>')
      .replace(/Prophet Muhammad\s*\(PBUH\)/g, '<span class="inline-flex items-center px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-sm font-bold border-2 border-gray-300 dark:border-gray-500 shadow-sm hover:shadow-md transition-all duration-200">📖 Prophet Muhammad (PBUH)</span>')
      .replace(/\(peace be upon him\)/gi, '<span class="text-sm text-gray-600 dark:text-gray-400 font-medium">(peace be upon him)</span>')
      
      // Format Explanation headers with distinctive styling
      .replace(/^(Explanation):?\s*$/gmi, 
        '<div class="explanation-section mt-12 mb-8"><div class="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl border-l-4 border-blue-500 dark:border-blue-400 shadow-lg"><div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl flex items-center justify-center shadow-md"><svg class="w-6 h-6 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div><div><h3 class="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-200 font-[var(--font-amiri)] tracking-wide">💡 Explanation</h3><p class="text-sm text-blue-600 dark:text-blue-400 mt-1">Understanding the meaning and context</p></div></div></div>')
      
      // Format Tafsir/Tafseer headers with distinctive styling
      .replace(/^(Tafs[ie]r):?\s*$/gmi, 
        '<div class="tafsir-section mt-12 mb-8"><div class="flex items-center gap-4 p-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl border-l-4 border-emerald-500 dark:border-emerald-400 shadow-lg"><div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 rounded-xl flex items-center justify-center shadow-md"><svg class="w-6 h-6 text-white dark:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div><div><h3 class="text-2xl md:text-3xl font-bold text-emerald-800 dark:text-emerald-200 font-[var(--font-amiri)] tracking-wide">📚 Tafsir</h3><p class="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Detailed scholarly interpretation</p></div></div></div>')
      
      // Format other common section headers with enhanced styling
      .replace(/^(Introduction|Additional Information|References|Conclusion):?\s*$/gmi, 
        '<h3 class="section-heading text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mt-12 mb-6 pb-4 border-b-2 border-gray-300 dark:border-gray-500 font-[var(--font-amiri)] tracking-wide">$1</h3>')
      
      // Format Quranic section headers with enhanced styling
      .replace(/Allah\s*\(SWT\)\s*says\s*in\s*the\s*(Glorious\s*)?Quran:?/gi, 
        '<div class="my-8 p-6 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-2xl border-l-4 border-gray-800 dark:border-gray-200 shadow-lg"><h3 class="divine-quote-heading text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 font-[var(--font-amiri)] tracking-wide flex items-center">📖 <span class="ml-3">Allah (SWT) says in the Glorious Quran:</span></h3><div class="w-16 h-1 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 rounded-full"></div></div>')
      
      // Clean up any remaining formatting markers
      .replace(/###\s*Quran GPT's Answer:?\s*/gi, '')
      .replace(/^\s*[\r\n]+/gm, '') // Remove empty lines
      .replace(/\n{3,}/g, '\n\n'); // Limit consecutive line breaks
    
    return processedText;
  };

  const getPrompt = useCallback(() => {
    return `You are Quran GPT, an AI-powered Islamic Library with experience as a Quran Scholar/Researcher. Your task is to answer questions by providing authentic references from the Holy Quran.

IMPORTANT: You must format your response exactly as follows:

1. Start with a brief introduction to the topic
2. Include at least 2-3 relevant Quranic verses in this EXACT format:
   "Verse text here" [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})

3. Provide explanation and tafseer for each verse
4. End with practical guidance or conclusion

CRITICAL FORMAT REQUIREMENTS:
- Use EXACTLY this format for ayah references: [Surah Name: Ayah Number](https://alquran.cloud/ayah?reference={Surah No.}:{Ayah No.})
- Replace {Surah No.} and {Ayah No.} with actual numbers
- Use proper surah names like: Al-Fatiha, Al-Baqarah, Aal-Imran, An-Nisa, Al-Ma'idah, etc.
- Include the full verse text in quotes before each reference

Example format:
"Indeed, Allah is with those who are patient." [Al-Baqarah: 153](https://alquran.cloud/ayah?reference=2:153)

Question: ${content}`;
  }, [content]);

  const askQuran = async () => {
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      setError('Please enter a question');
      return;
    }

    // Clean up any existing audio before starting new question
    stopAudio();

    setIsProcessing(true);
    setSummary('');
    setShowSummary(false);
    setError('');

    const prompt = getPrompt();

    try {
      const response = await generate_response_with_gemini(prompt);
      const formattedResponse = formatResponse(response);
      setSummary(formattedResponse);
      setDisplayedContent(formattedResponse); // Set initial displayed content
      setCurrentLanguage('en'); // Default to English
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

  const getGreetingMessage = useCallback(() => {
    const today = new Date();
    const ramadanEnd = new Date(today.getFullYear(), 2, 31); // March 31st
    const eidDate = new Date(today.getFullYear(), 2, 31); // March 31st

    if (today <= ramadanEnd) {
      return (
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl md:text-5xl">🌙</span>
          <span className="text-xl md:text-2xl font-semibold text-black dark:text-white">
            Ramadan Mubarak
          </span>
          <span className="text-4xl md:text-5xl">⭐</span>
        </div>
      );
    } else if (today.toDateString() === eidDate.toDateString()) {
      return (
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl md:text-4xl">🎉</span>
          <span className="text-xl md:text-2xl font-semibold text-black dark:text-white">
            Eid Mubarak
          </span>
          <span className="text-4xl md:text-4xl">🎊</span>
        </div>
      );
    }
    return '';
  }, []);

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

      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-NMNGXPDXNK"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-NMNGXPDXNK');
        `}
      </Script>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <HeroSection getGreetingMessage={getGreetingMessage} />

        {/* Main Content */}
        <main className="relative z-10">
          <div className="container max-w-7xl mx-auto px-6">
            
            {/* Quick Questions Section */}
            <QuickQuestions insertQuestion={insertQuestion} />

            {/* Question Input Section */}
            <ChatSection 
              content={content}
              setContent={setContent}
              askQuran={askQuran}
              resetForm={resetForm}
              isProcessing={isProcessing}
              error={error}
              showSummary={showSummary}
            />

            {/* Islamic Widgets */}
            <div className="mb-12">
              <IslamicWidgets showWidgets={!isProcessing && !showSummary} />
            </div>

            {/* Thinking Process */}
            <ThinkingProcess isProcessing={isProcessing} />

            {/* Language Translation Tabs - Above Response */}
            {showSummary && (
              <div className="mb-6 max-w-6xl mx-auto px-4">
                <LanguageTabs
                  originalText={summary}
                  onTranslationChange={handleTranslationChange}
                  context="islamic"
                  preserveFormatting={true}
                />
              </div>
            )}

            {/* Response Section */}
            <ResponseSection 
              showSummary={showSummary}
              summary={summary}
              copyContent={copyContent}
              copied={copied}
              onAudioPlay={handleAudioPlay}
              onAudioPause={handleAudioPause}
              onAudioEnd={handleAudioEnd}
              isAudioPlaying={isAyahPlaying}
              isAudioActive={isAyahActive}
              getAudioProgress={getAudioProgress}
              seekToTime={seekToTime}
              displayedContent={displayedContent}
            />
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}