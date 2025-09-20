'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon, PauseIcon, BookOpenIcon, LanguageIcon, MusicalNoteIcon, MagnifyingGlassIcon, ChevronDownIcon, ClipboardDocumentIcon, XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { fetchTafsir, TafsirData } from '../utils/tafsirUtils';

interface Ayah {
  number: number;
  text: string;
  translation: string;
  transliteration?: string;
  audio?: string;
  juz?: number;
  page?: number;
  hizbQuarter?: number;
  ruku?: number;
  manzil?: number;
  sajda?: boolean;
}

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  ayahs: Ayah[];
}

interface Edition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
  direction: string;
}

interface AudioState {
  isPlaying: boolean;
  currentAyah: number | null;
  audioElement: HTMLAudioElement | null;
  isLoading: boolean;
  error: string | null;
  duration: number;
  currentTime: number;
}

export default function ReadQuran() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [currentAyah, setCurrentAyah] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showSurahList, setShowSurahList] = useState(true);
  const [selectedTranslation, setSelectedTranslation] = useState('en.asad');
  const [selectedReciter, setSelectedReciter] = useState('ar.alafasy');
  const [showTransliteration, setShowTransliteration] = useState(false);
  const [availableTranslations, setAvailableTranslations] = useState<Edition[]>([]);
  const [availableReciters, setAvailableReciters] = useState<Edition[]>([]);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentAyah: null,
    audioElement: null,
    isLoading: false,
    error: null,
    duration: 0,
    currentTime: 0
  });
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedAyahs, setBookmarkedAyahs] = useState<Set<string>>(new Set());
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslationDropdown, setShowTranslationDropdown] = useState(false);
  const [showReciterDropdown, setShowReciterDropdown] = useState(false);
  
  // Tafsir state
  const [tafsirData, setTafsirData] = useState<TafsirData | null>(null);
  const [isLoadingTafsir, setIsLoadingTafsir] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [selectedTafsirAuthor, setSelectedTafsirAuthor] = useState<string>('');
  const [showTafsirSection, setShowTafsirSection] = useState(false);
  const [showTafsirPopup, setShowTafsirPopup] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showReciterDropdownVertical, setShowReciterDropdownVertical] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const translationDropdownRef = useRef<HTMLDivElement>(null);
  const reciterDropdownRef = useRef<HTMLDivElement>(null);
  const reciterDropdownVerticalRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Fetch available editions (translations and reciters)
  useEffect(() => {
    const fetchEditions = async () => {
      try {
        // Fetch text editions (translations)
        const textResponse = await fetch('https://api.alquran.cloud/v1/edition?format=text&language=en&type=translation');
        if (textResponse.ok) {
          const textData = await textResponse.json();
          setAvailableTranslations(textData.data || []);
        }

        // Fetch audio editions (reciters)
        const audioResponse = await fetch('https://api.alquran.cloud/v1/edition?format=audio&language=ar');
        if (audioResponse.ok) {
          const audioData = await audioResponse.json();
          setAvailableReciters(audioData.data || []);
        }
      } catch (error) {
        console.error('Error fetching editions:', error);
      }
    };

    fetchEditions();
  }, []);

  // Fetch surahs list
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        if (response.ok) {
          const data = await response.json();
          setSurahs(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching surahs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  // Fetch ayahs for selected surah
  const fetchAyahs = useCallback(async (surahNumber: number) => {
    setIsLoading(true);
    setIsTranslating(true);
    try {
      // Fetch Arabic text
      const arabicResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`);
      const arabicData = await arabicResponse.json();

      // Fetch translation
      const translationResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${selectedTranslation}`);
      const translationData = await translationResponse.json();

      // Fetch transliteration if available
      let transliterationData: any = null;
      try {
        const transliterationResponse = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.transliteration`);
        if (transliterationResponse.ok) {
          transliterationData = await transliterationResponse.json();
        }
      } catch (error) {
        console.log('Transliteration not available for this surah');
      }

      if (arabicData.data && translationData.data) {
        const combinedAyahs: Ayah[] = arabicData.data.ayahs.map((arabicAyah: any, index: number) => ({
          number: arabicAyah.numberInSurah,
          text: arabicAyah.text,
          translation: translationData.data.ayahs[index]?.text || '',
          transliteration: transliterationData?.data?.ayahs[index]?.text || '',
          juz: arabicAyah.juz,
          page: arabicAyah.page,
          hizbQuarter: arabicAyah.hizbQuarter,
          ruku: arabicAyah.ruku,
          manzil: arabicAyah.manzil,
          sajda: arabicAyah.sajda
        }));

        setAyahs(combinedAyahs);
        setCurrentAyah(0);
      }
    } catch (error) {
      console.error('Error fetching ayahs:', error);
    } finally {
      setIsLoading(false);
      setIsTranslating(false);
    }
  }, [selectedTranslation]);

  // Refetch ayahs when translation changes
  useEffect(() => {
    if (selectedSurah) {
      fetchAyahs(selectedSurah.number);
    }
  }, [selectedTranslation, fetchAyahs, selectedSurah]);

  // Fetch tafsir for current ayah
  const fetchTafsirForAyah = useCallback(async (surahNumber: number, ayahNumber: number, author?: string) => {
    if (!selectedSurah) return;
    
    setIsLoadingTafsir(true);
    setTafsirData(null);
    setSelectedTafsirAuthor('');
    
    try {
      const tafsir = await fetchTafsir(surahNumber, ayahNumber);
      if (tafsir && tafsir.tafsirs && tafsir.tafsirs.length > 0) {
        setTafsirData(tafsir);
        
        // If specific author is requested, try to find it with better matching
        if (author) {
          const authorLower = author.toLowerCase();
          const foundTafsir = tafsir.tafsirs.find(t => {
            const tafsirAuthorLower = t.author.toLowerCase();
            return tafsirAuthorLower.includes(authorLower) || 
                   (authorLower.includes('ibn kathir') && tafsirAuthorLower.includes('ibn kathir')) ||
                   (authorLower.includes('marif') && tafsirAuthorLower.includes('marif')) ||
                   (authorLower.includes('tafsirul') && tafsirAuthorLower.includes('tafsirul'));
          });
          
          if (foundTafsir) {
            setSelectedTafsirAuthor(foundTafsir.author);
          } else {
            // If specific author not found, use first available
            setSelectedTafsirAuthor(tafsir.tafsirs[0].author);
          }
        } else {
          setSelectedTafsirAuthor(tafsir.tafsirs[0].author);
        }
        
        setShowTafsir(true);
        setShowTafsirSection(true);
        setShowTafsirPopup(true);
      }
    } catch (error) {
      console.error('Error fetching tafsir:', error);
    } finally {
      setIsLoadingTafsir(false);
    }
  }, [selectedSurah]);

  // Helper function to stop audio immediately
  const stopCurrentAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0;
        audioRef.current.muted = true;
        audioRef.current.src = '';
        audioRef.current.srcObject = null;
        audioRef.current.load();
      } catch (error) {
        console.log('Error stopping audio:', error);
      }
    }
    setAudioState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentAyah: null, 
      currentTime: 0,
      isLoading: false,
      error: null
    }));
  };

  // Helper function to handle reciter selection and auto-play
  const handleReciterSelection = (reciterIdentifier: string, dropdownType: 'horizontal' | 'vertical') => {
    setSelectedReciter(reciterIdentifier);
    
    // Close the appropriate dropdown
    if (dropdownType === 'horizontal') {
      setShowReciterDropdown(false);
    } else {
      setShowReciterDropdownVertical(false);
    }
    
    // Auto-play current ayah with new reciter if we're in ayah view
    if (!showSurahList && ayahs.length > 0 && selectedSurah) {
      // Small delay to ensure state is updated
      setTimeout(() => {
        playAyahAudio(ayahs[currentAyah]?.number || 1);
      }, 100);
    }
  };

  const handleSurahSelect = (surah: Surah) => {
    stopCurrentAudio(); // Stop audio when selecting a new surah
    setSelectedSurah(surah);
    setShowSurahList(false);
    fetchAyahs(surah.number);
  };

  const nextAyah = () => {
    stopCurrentAudio(); // Stop audio when navigating to next ayah
    if (currentAyah < ayahs.length - 1) {
      setCurrentAyah(currentAyah + 1);
    }
  };

  const prevAyah = () => {
    stopCurrentAudio(); // Stop audio when navigating to previous ayah
    if (currentAyah > 0) {
      setCurrentAyah(currentAyah - 1);
    }
  };

  const toggleBookmark = (surahNumber: number, ayahNumber: number) => {
    const bookmarkKey = `${surahNumber}:${ayahNumber}`;
    setBookmarkedAyahs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookmarkKey)) {
        newSet.delete(bookmarkKey);
      } else {
        newSet.add(bookmarkKey);
      }
      return newSet;
    });
  };

  const isBookmarked = (surahNumber: number, ayahNumber: number) => {
    return bookmarkedAyahs.has(`${surahNumber}:${ayahNumber}`);
  };

  const copyAyahText = async () => {
    const arabicText = ayahs[currentAyah]?.text || '';
    const translation = ayahs[currentAyah]?.translation || '';
    const combinedText = `${arabicText}\n\n${translation}`;
    
    try {
      await navigator.clipboard.writeText(combinedText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleAudioSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setAudioState(prev => ({ ...prev, currentTime: newTime }));
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const filteredSurahs = surahs.filter(surah => 
    searchQuery === '' || 
    surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (translationDropdownRef.current && !translationDropdownRef.current.contains(event.target as Node)) {
        setShowTranslationDropdown(false);
      }
      if (reciterDropdownRef.current && !reciterDropdownRef.current.contains(event.target as Node)) {
        setShowReciterDropdown(false);
      }
      if (reciterDropdownVerticalRef.current && !reciterDropdownVerticalRef.current.contains(event.target as Node)) {
        setShowReciterDropdownVertical(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stop audio when component unmounts or user navigates away
  useEffect(() => {
    const forceStopAudio = () => {
      if (audioRef.current) {
        try {
          // Force stop audio immediately
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.volume = 0;
          audioRef.current.muted = true;
          audioRef.current.src = '';
          audioRef.current.srcObject = null;
          audioRef.current.load();
          
          // Remove all event listeners from audio element
          audioRef.current.onloadstart = null;
          audioRef.current.oncanplay = null;
          audioRef.current.onloadedmetadata = null;
          audioRef.current.ontimeupdate = null;
          audioRef.current.onplay = null;
          audioRef.current.onpause = null;
          audioRef.current.onended = null;
          audioRef.current.onerror = null;
          
          // Clear the reference
          audioRef.current = null;
        } catch (error) {
          console.log('Error stopping audio:', error);
        }
      }
      
      if (isMountedRef.current) {
        setAudioState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          currentAyah: null, 
          currentTime: 0,
          audioElement: null,
          isLoading: false,
          error: null
        }));
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      forceStopAudio();
      // Some browsers require returnValue to be set
      e.preventDefault();
      e.returnValue = '';
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        forceStopAudio();
      }
    };

    const handlePageHide = () => {
      forceStopAudio();
    };

    const handleUnload = () => {
      forceStopAudio();
    };

    // Add multiple event listeners for better coverage
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function - this runs when component unmounts
    return () => {
      isMountedRef.current = false;
      forceStopAudio();
      
      // Remove event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Audio playback functionality
  const playAyahAudio = async (ayahNumber: number) => {
    if (audioState.isPlaying && audioState.currentAyah === ayahNumber) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
        setAudioState(prev => ({ ...prev, isPlaying: false, currentAyah: null }));
      }
      return;
    }

    // Check if component is still mounted
    if (!isMountedRef.current) {
      return;
    }

    setAudioState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Calculate global ayah number
      const surahAyahCounts = [
        7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
      ];

      let baseGlobalAyah = 0;
      for (let i = 0; i < (selectedSurah?.number || 1) - 1; i++) {
        baseGlobalAyah += surahAyahCounts[i];
      }
      const globalAyahNumber = baseGlobalAyah + ayahNumber;

      const audioUrl = `https://api.alquran.cloud/v1/ayah/${globalAyahNumber}/${selectedReciter}`;
      const response = await fetch(audioUrl);
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.audio) {
          // Stop current audio if playing
          if (audioRef.current) {
            audioRef.current.pause();
          }

          // Create new audio element
          const audio = new Audio(data.data.audio);
          audioRef.current = audio;

          audio.onloadstart = () => {
            setAudioState(prev => ({ ...prev, isLoading: true }));
          };

          audio.oncanplay = () => {
            setAudioState(prev => ({ ...prev, isLoading: false }));
          };

          audio.onloadedmetadata = () => {
            setAudioState(prev => ({ ...prev, duration: audio.duration }));
          };

          audio.ontimeupdate = () => {
            setAudioState(prev => ({ ...prev, currentTime: audio.currentTime }));
          };

          audio.onplay = () => {
            setAudioState(prev => ({ ...prev, isPlaying: true, currentAyah: ayahNumber }));
          };

          audio.onpause = () => {
            setAudioState(prev => ({ ...prev, isPlaying: false, currentAyah: null }));
          };

          audio.onended = () => {
            setAudioState(prev => ({ ...prev, isPlaying: false, currentAyah: null, currentTime: 0 }));
          };

          audio.onerror = () => {
            setAudioState(prev => ({ ...prev, isLoading: false, error: 'Failed to load audio' }));
          };

          await audio.play();
        }
      }
    } catch (error) {
      setAudioState(prev => ({ ...prev, isLoading: false, error: 'Failed to load audio' }));
    }
  };

  if (isLoading && surahs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="min-h-[70vh] flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading Quran...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-[70vh] flex items-start justify-center"
    >
      <div className="w-full mx-auto px-6 sm:px-8 py-8">
        <AnimatePresence mode="wait">
          {showSurahList ? (
            <motion.div
              key="surah-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Flexible Header - Only visible in surah list */}
              <div className="mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  {/* Left side - Quran Title */}
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-mono tracking-wide text-gray-700 dark:text-gray-300">القرآن الكريم</h2>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      The Holy Quran
                    </div>
                  </div>
                  
                  
                  {/* Right side - Controls */}
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                    {/* Translation Selector */}
                    <div className="relative" ref={translationDropdownRef}>
                      <button
                        onClick={() => setShowTranslationDropdown(!showTranslationDropdown)}
                        className="flex items-center justify-between space-x-2 px-3 py-2 text-sm border border-gray-400 dark:border-gray-500 rounded-lg bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-200 min-w-[140px]"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <LanguageIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate text-left">
                            {availableTranslations.find(t => t.identifier === selectedTranslation)?.englishName || 'Translation'}
                          </span>
                        </div>
                        <ChevronDownIcon className="w-3 h-3 flex-shrink-0" />
                      </button>
                      
                      <AnimatePresence>
                        {showTranslationDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-500 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-[200px] sm:min-w-[220px]"
                          >
                            {availableTranslations.slice(0, 6).map((translation) => (
                              <button
                                key={translation.identifier}
                                onClick={() => {
                                  setSelectedTranslation(translation.identifier);
                                  setShowTranslationDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap ${
                                  selectedTranslation === translation.identifier
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {translation.englishName}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Reciter Selector */}
                    <div className="relative" ref={reciterDropdownRef}>
                      <button
                        onClick={() => setShowReciterDropdown(!showReciterDropdown)}
                        className="flex items-center justify-between space-x-2 px-3 py-2 text-sm border border-gray-400 dark:border-gray-500 rounded-lg bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-200 min-w-[140px]"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <MusicalNoteIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate text-left">
                            {availableReciters.find(r => r.identifier === selectedReciter)?.englishName || 'Reciter'}
                          </span>
                        </div>
                        <ChevronDownIcon className="w-3 h-3 flex-shrink-0" />
                      </button>
                      
                      <AnimatePresence>
                        {showReciterDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-500 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-[200px] sm:min-w-[220px]"
                          >
                            {availableReciters.slice(0, 6).map((reciter) => (
                              <button
                                key={reciter.identifier}
                                onClick={() => handleReciterSelection(reciter.identifier, 'horizontal')}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                  selectedReciter === reciter.identifier
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {reciter.englishName}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-sm sm:max-w-md mx-auto">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search surahs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm border border-gray-400 dark:border-gray-500 rounded-lg bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500/50 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Flexible Surah Grid - Mobile Optimized */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                {filteredSurahs.map((surah) => (
                  <motion.div
                    key={surah.number}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSurahSelect(surah)}
                    className="rounded-xl border border-gray-400 dark:border-gray-500 p-4 sm:p-5 lg:p-6 cursor-pointer hover:bg-gray-50/30 dark:hover:bg-gray-800/20 transition-all duration-200 group min-h-0"
                  >
                    <div className="text-center h-full flex flex-col justify-between">
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                          {surah.number}
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-1 sm:mb-2 leading-tight">
                          {surah.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3 font-medium leading-tight">
                          {surah.englishName}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                        {surah.numberOfAyahs} verses • {surah.revelationType}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="ayah-reader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Professional Navigation Bar */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => {
                    stopCurrentAudio(); // Stop audio when going back to surahs
                    setShowSurahList(true);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  <span>Back to Surahs</span>
                </button>
                
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {currentAyah + 1} / {ayahs.length}
                </div>
              </div>

              {/* Minimal Surah Header */}
              <div className="text-center mb-8">
                <h3 className="text-lg font-mono text-gray-800 dark:text-white mb-2">
                  {selectedSurah?.name} ({selectedSurah?.englishName})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {selectedSurah?.englishNameTranslation}
                </p>
                
                {/* Mobile Action Buttons - Horizontal Layout */}
                <div className="flex sm:hidden flex-col items-center space-y-3 mt-4 px-4">
                  {/* Ayah Reference for Mobile */}
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {selectedSurah?.number}:{ayahs[currentAyah]?.number}
                  </div>
                  
                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-center space-x-3">
                  {/* Copy Button */}
                  <button
                    onClick={copyAyahText}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      copyFeedback 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-700' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-400 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    title="Copy Arabic text and translation"
                  >
                    <ClipboardDocumentIcon className="w-5 h-5" />
                  </button>
                  
                  {/* Transliteration Button */}
                  <button
                    onClick={() => setShowTransliteration(!showTransliteration)}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      showTransliteration 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-400 dark:border-gray-500' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-400 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                    title="Toggle transliteration"
                  >
                    <DocumentTextIcon className="w-5 h-5" />
                  </button>
                  
                  {/* Reciter Dropdown */}
                  <div className="relative" ref={reciterDropdownVerticalRef}>
                    <button
                      onClick={() => setShowReciterDropdownVertical(!showReciterDropdownVertical)}
                      className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-400 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-500"
                      title="Select reciter"
                    >
                      <MusicalNoteIcon className="w-5 h-5" />
                    </button>
                    
                    <AnimatePresence>
                      {showReciterDropdownVertical && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-500 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto w-[280px] max-w-[calc(100vw-2rem)] sm:min-w-[220px] sm:w-auto sm:left-1/2 sm:transform sm:-translate-x-1/2"
                        >
                          {availableReciters.slice(0, 8).map((reciter) => (
                            <button
                              key={reciter.identifier}
                              onClick={() => handleReciterSelection(reciter.identifier, 'vertical')}
                              className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation ${
                                selectedReciter === reciter.identifier
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {reciter.englishName}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Tafsir Button */}
                  <button
                    onClick={() => fetchTafsirForAyah(selectedSurah?.number || 1, ayahs[currentAyah]?.number || 1)}
                    disabled={isLoadingTafsir}
                    className={`p-3 transition-all duration-200 rounded-lg border ${
                      showTafsirPopup 
                        ? 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-500' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-400 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-500'
                    } disabled:opacity-50`}
                    title="Tafsir"
                  >
                    {isLoadingTafsir ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                    ) : (
                      <BookOpenIcon className="w-5 h-5" />
                    )}
                  </button>
                  </div>
                </div>
              </div>

              {/* Compact Ayah Display */}
              {ayahs.length > 0 && (
                <div className="flex min-h-[50vh]">
                  {/* Compact Vertical Action Bar - Hidden on Mobile */}
                  <div className="hidden sm:flex flex-col items-center space-y-3 p-4 border-r border-gray-400 dark:border-gray-500">
                    {/* Ayah Reference */}
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      {selectedSurah?.number}:{ayahs[currentAyah]?.number}
                    </div>
                    
                    {/* Copy Button */}
                    <button
                      onClick={copyAyahText}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        copyFeedback 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      title="Copy Arabic text and translation"
                    >
                      <ClipboardDocumentIcon className="w-5 h-5" />
                    </button>
                    
                    {/* Transliteration Button */}
                    <button
                      onClick={() => setShowTransliteration(!showTransliteration)}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        showTransliteration 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' 
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      title="Toggle transliteration"
                    >
                      <DocumentTextIcon className="w-5 h-5" />
                    </button>
                    
                    {/* Reciter Dropdown */}
                    <div className="relative" ref={reciterDropdownVerticalRef}>
                      <button
                        onClick={() => setShowReciterDropdownVertical(!showReciterDropdownVertical)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        title="Select reciter"
                      >
                        <MusicalNoteIcon className="w-5 h-5" />
                      </button>
                      
                      <AnimatePresence>
                        {showReciterDropdownVertical && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 border border-gray-400 dark:border-gray-500 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-[200px] sm:min-w-[220px]"
                          >
                            {availableReciters.slice(0, 8).map((reciter) => (
                              <button
                                key={reciter.identifier}
                                onClick={() => handleReciterSelection(reciter.identifier, 'vertical')}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                  selectedReciter === reciter.identifier
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {reciter.englishName}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Tafsir Button */}
                    <button
                      onClick={() => fetchTafsirForAyah(selectedSurah?.number || 1, ayahs[currentAyah]?.number || 1)}
                      disabled={isLoadingTafsir}
                      className={`p-2 transition-colors rounded-lg ${
                        showTafsirPopup 
                          ? 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700' 
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      } disabled:opacity-50`}
                      title="Tafsir"
                    >
                      {isLoadingTafsir ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                      ) : (
                        <BookOpenIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6">
                    {/* Ayah Content */}
                    <div className="text-center max-w-3xl">
                      {/* Transliteration */}
                      {showTransliteration && ayahs[currentAyah]?.transliteration && (
                        <div className={`text-gray-500 dark:text-gray-400 mb-3 italic ${
                          fontSize === 'large' ? 'text-lg' : fontSize === 'medium' ? 'text-base' : 'text-sm'
                        }`}>
                          {ayahs[currentAyah]?.transliteration}
                        </div>
                      )}
                      
                      {/* Arabic Text with Ayah Number */}
                      <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className={`font-arabic text-gray-900 dark:text-white leading-relaxed ${
                          fontSize === 'large' ? 'text-3xl' : fontSize === 'medium' ? 'text-2xl' : 'text-xl'
                        }`}>
                          {ayahs[currentAyah]?.text}
                        </div>
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                          {ayahs[currentAyah]?.number}
                        </div>
                      </div>
                      
                      {/* Translation */}
                      <div className={`text-gray-700 dark:text-gray-300 leading-relaxed ${
                        fontSize === 'large' ? 'text-lg' : fontSize === 'medium' ? 'text-base' : 'text-sm'
                      }`}>
                        {ayahs[currentAyah]?.translation}
                      </div>

                      {/* Audio Progress Bar - Always Visible */}
                      <div className="mt-4 max-w-md mx-auto">
                        <div className="flex items-center space-x-3">
                          {/* Play/Pause Button */}
                          <button
                            onClick={() => playAyahAudio(ayahs[currentAyah]?.number || 1)}
                            disabled={audioState.isLoading}
                            className="flex-shrink-0 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-all duration-200 disabled:opacity-50"
                          >
                            {audioState.isLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                            ) : audioState.isPlaying && audioState.currentAyah === ayahs[currentAyah]?.number ? (
                              <PauseIcon className="w-4 h-4" />
                            ) : (
                              <PlayIcon className="w-4 h-4" />
                            )}
                          </button>

                          {/* Time Display */}
                          <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {formatTime(audioState.currentTime)}
                          </div>

                          {/* Progress Bar */}
                          <div className="flex-1">
                            <input
                              type="range"
                              min="0"
                              max={audioState.duration || 0}
                              value={audioState.currentTime || 0}
                              onChange={handleAudioSeek}
                              className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                              style={{
                                background: `linear-gradient(to right, #6b7280 0%, #6b7280 ${(audioState.currentTime / (audioState.duration || 1)) * 100}%, #e5e7eb ${(audioState.currentTime / (audioState.duration || 1)) * 100}%, #e5e7eb 100%)`
                              }}
                            />
                          </div>

                          {/* Duration Display */}
                          <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {formatTime(audioState.duration)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Controls - Bottom */}
                    <div className="flex items-center justify-center space-x-3 mt-8">
                      <button
                        onClick={prevAyah}
                        disabled={currentAyah === 0}
                        className="p-2 rounded-full border border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>

                      <div className="flex-1 max-w-xs">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                          <div
                            className="bg-gray-500 h-1 rounded-full transition-all duration-500"
                            style={{ width: `${((currentAyah + 1) / ayahs.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <button
                        onClick={nextAyah}
                        disabled={currentAyah === ayahs.length - 1}
                        className="p-2 rounded-full border border-gray-400 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Minimal Tafsir Popup */}
              <AnimatePresence>
                {showTafsirPopup && tafsirData && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowTafsirPopup(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg max-w-3xl w-full max-h-[70vh] overflow-hidden border border-gray-300 dark:border-gray-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Minimal Header with Dropdown */}
                      <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-600">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-mono text-gray-800 dark:text-white">
                            Tafsir
                          </h3>
                          {tafsirData.tafsirs.length > 1 && (
                            <div className="relative">
                              <select
                                value={selectedTafsirAuthor}
                                onChange={(e) => setSelectedTafsirAuthor(e.target.value)}
                                className="appearance-none bg-transparent border border-gray-400 dark:border-gray-500 rounded-lg px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:border-gray-500/50 transition-all duration-200 cursor-pointer"
                              >
                                {tafsirData.tafsirs.map((tafsir) => (
                                  <option key={tafsir.author} value={tafsir.author} className="bg-white dark:bg-gray-800">
                                    {tafsir.author}
                                  </option>
                                ))}
                              </select>
                              <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => setShowTafsirPopup(false)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Tafsir Content */}
                      <div className="p-6 overflow-y-auto max-h-[60vh]">
                        <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                          <div className="whitespace-pre-wrap break-words">
                            {tafsirData.tafsirs.find(t => t.author === selectedTafsirAuthor)?.content || 
                             tafsirData.tafsirs[0]?.content}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}