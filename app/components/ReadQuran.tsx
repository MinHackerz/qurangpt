'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSurahList, setShowSurahList] = useState(true);
  const [selectedTranslation, setSelectedTranslation] = useState('en.asad');
  const [selectedReciter, setSelectedReciter] = useState('ar.alafasy');
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranslationDropdown, setShowTranslationDropdown] = useState(false);

  // State for toggling transliteration per ayah
  const [visibleTransliterations, setVisibleTransliterations] = useState<Set<number>>(new Set());

  const toggleTransliteration = (ayahNumber: number) => {
    setVisibleTransliterations(prev => {
      const next = new Set(prev);
      if (next.has(ayahNumber)) {
        next.delete(ayahNumber);
      } else {
        next.add(ayahNumber);
      }
      return next;
    });
  };

  // Tafsir state
  const [tafsirData, setTafsirData] = useState<TafsirData | null>(null);
  const [isLoadingTafsir, setIsLoadingTafsir] = useState(false);
  const [selectedTafsirAuthor, setSelectedTafsirAuthor] = useState<string>('');
  const [showTafsirPopup, setShowTafsirPopup] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const translationDropdownRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Fetch available editions (translations and reciters)
  useEffect(() => {
    const fetchEditions = async () => {
      try {
        const textResponse = await fetch('https://api.alquran.cloud/v1/edition?format=text&language=en&type=translation');
        if (textResponse.ok) {
          const textData = await textResponse.json();
          setAvailableTranslations(textData.data || []);
        }

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
    try {
      // Fetch Arabic, Translation and Transliteration in parallel
      const [arabicResponse, translationResponse, transliterationResponse] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/${selectedTranslation}`),
        fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.transliteration`)
      ]);

      const arabicData = await arabicResponse.json();
      const translationData = await translationResponse.json();
      const transliterationData = await transliterationResponse.json();

      if (arabicData.data && translationData.data) {
        const combinedAyahs: Ayah[] = arabicData.data.ayahs.map((arabicAyah: any, index: number) => ({
          number: arabicAyah.numberInSurah,
          text: arabicAyah.text,
          translation: translationData.data.ayahs[index]?.text || '',
          transliteration: transliterationData.data?.ayahs[index]?.text || '',
          juz: arabicAyah.juz,
          page: arabicAyah.page,
          hizbQuarter: arabicAyah.hizbQuarter,
          ruku: arabicAyah.ruku,
          manzil: arabicAyah.manzil,
          sajda: arabicAyah.sajda
        }));

        setAyahs(combinedAyahs);
      }
    } catch (error) {
      console.error('Error fetching ayahs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTranslation]);

  // Refetch ayahs when translation changes
  useEffect(() => {
    if (selectedSurah) {
      fetchAyahs(selectedSurah.number);
    }
  }, [selectedTranslation, fetchAyahs, selectedSurah]);

  // Handle URL params for Deep Linking
  const [pendingScrollAyah, setPendingScrollAyah] = useState<number | null>(null);

  useEffect(() => {
    if (surahs.length > 0 && searchParams) {
      const surahParam = searchParams.get('surah');
      const ayahParam = searchParams.get('ayah');

      if (surahParam) {
        const surahNum = parseInt(surahParam);
        const targetSurah = surahs.find(s => s.number === surahNum);

        // Only select if it matches and is different from current to avoid loops
        if (targetSurah && (!selectedSurah || selectedSurah.number !== surahNum)) {
          setSelectedSurah(targetSurah);
          setShowSurahList(false);
          fetchAyahs(surahNum);

          if (ayahParam) {
            setPendingScrollAyah(parseInt(ayahParam));
          }
        }
      }
    }
  }, [surahs, searchParams]); // Intentionally omitting dependencies that might cause loops

  // Scroll to pending ayah when ayahs are loaded
  useEffect(() => {
    if (pendingScrollAyah && ayahs.length > 0) {
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(`ayah-${pendingScrollAyah}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the ayah temporarily
          element.classList.add('bg-emerald-50', 'dark:bg-emerald-900/20');
          setTimeout(() => {
            element.classList.remove('bg-emerald-50', 'dark:bg-emerald-900/20');
          }, 2000);
          setPendingScrollAyah(null);
        }
      }, 500);
    }
  }, [ayahs, pendingScrollAyah]);

  // Fetch tafsir for current ayah
  const fetchTafsirForAyah = useCallback(async (surahNumber: number, ayahNumber: number) => {
    setIsLoadingTafsir(true);
    setTafsirData(null);
    setSelectedTafsirAuthor('');

    try {
      const tafsir = await fetchTafsir(surahNumber, ayahNumber);
      if (tafsir && tafsir.tafsirs && tafsir.tafsirs.length > 0) {
        setTafsirData(tafsir);
        setSelectedTafsirAuthor(tafsir.tafsirs[0].author);
        setShowTafsirPopup(true);
      }
    } catch (error) {
      console.error('Error fetching tafsir:', error);
    } finally {
      setIsLoadingTafsir(false);
    }
  }, []);

  // Helper function to stop audio immediately
  const stopCurrentAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
      } catch (error) {
        console.log('Error stopping audio:', error);
      }
    }
    setAudioState(prev => ({
      ...prev,
      isPlaying: false,
      currentAyah: null,
      currentTime: 0,
      isLoading: false
    }));
  };

  const handleSurahSelect = (surah: Surah) => {
    stopCurrentAudio();
    setSelectedSurah(surah);
    setShowSurahList(false);
    fetchAyahs(surah.number);
  };

  const goToNextSurah = () => {
    if (!selectedSurah) return;
    const currentIndex = surahs.findIndex((s) => s.number === selectedSurah.number);
    const nextSurah = currentIndex >= 0 ? surahs[currentIndex + 1] : null;
    if (!nextSurah) return;

    stopCurrentAudio();
    setSelectedSurah(nextSurah);
    setShowSurahList(false);
    fetchAyahs(nextSurah.number);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousSurah = () => {
    if (!selectedSurah) return;
    const currentIndex = surahs.findIndex((s) => s.number === selectedSurah.number);
    const prevSurah = currentIndex > 0 ? surahs[currentIndex - 1] : null;
    if (!prevSurah) return;

    stopCurrentAudio();
    setSelectedSurah(prevSurah);
    setShowSurahList(false);
    fetchAyahs(prevSurah.number);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (translationDropdownRef.current && !translationDropdownRef.current.contains(event.target as Node)) {
        setShowTranslationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopCurrentAudio();
    };
  }, []);

  // Audio playback functionality
  const playAyahAudio = async (ayahNumber: number) => {
    if (audioState.isPlaying && audioState.currentAyah === ayahNumber) {
      if (audioRef.current) {
        audioRef.current.pause();
        setAudioState(prev => ({ ...prev, isPlaying: false, currentAyah: null }));
      }
      return;
    }

    if (!isMountedRef.current) return;

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
          if (audioRef.current) {
            audioRef.current.pause();
          }

          const audio = new Audio(data.data.audio);
          audioRef.current = audio;

          audio.oncanplay = () => setAudioState(prev => ({ ...prev, isLoading: false }));
          audio.onplay = () => setAudioState(prev => ({ ...prev, isPlaying: true, currentAyah: ayahNumber }));
          audio.onpause = () => setAudioState(prev => ({ ...prev, isPlaying: false, currentAyah: null }));
          audio.onended = () => setAudioState(prev => ({ ...prev, isPlaying: false, currentAyah: null }));

          await audio.play();
        }
      }
    } catch (error) {
      setAudioState(prev => ({ ...prev, isLoading: false, error: 'Failed to load audio' }));
    }
  };

  const filteredSurahs = surahs.filter(surah =>
    searchQuery === '' ||
    surah.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && surahs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 dark:border-emerald-400 mx-auto mb-4"></div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading Quran...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-transparent"
    >
      <AnimatePresence mode="wait">
        {showSurahList ? (
          <motion.div
            key="surah-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-4xl mx-auto px-6 py-12 sm:px-8"
          >
            {/* Header */}
            <header className="mb-12 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-serif text-gray-900 dark:text-gray-50 mb-2 tracking-tight">The Holy Quran</h1>
              <p className="text-gray-500 dark:text-gray-400 font-light text-lg">Select a Surah to begin reading</p>

              {/* Search Bar - Minimal */}
              <div className="relative max-w-md mt-8 md:mx-0 mx-auto">
                <MagnifyingGlassIcon className="absolute left-0 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Surah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 text-lg border-b border-gray-200 dark:border-gray-800 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </header>

            {/* Surah List - Minimal Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              {filteredSurahs.map((surah) => (
                <motion.div
                  key={surah.number}
                  onClick={() => handleSurahSelect(surah)}
                  whileHover={{ x: 4 }}
                  className="group cursor-pointer py-4 border-b border-gray-100 dark:border-gray-900 flex items-baseline justify-between"
                >
                  <div className="flex items-baseline gap-4">
                    <span className="text-sm font-mono text-gray-300 dark:text-gray-700 w-8">{surah.number.toString().padStart(2, '0')}</span>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{surah.englishName}</h3>
                      <p className="text-sm text-gray-500 font-light">{surah.englishNameTranslation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-xl text-gray-400 dark:text-gray-600 group-hover:text-gray-800 dark:group-hover:text-gray-300 transition-colors">{surah.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ayah-reader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pb-10"
          >
            {/* Sticky Professional Header */}
            <div className="sticky top-0 z-30 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-900">
              <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                <button
                  onClick={() => {
                    stopCurrentAudio();
                    setShowSurahList(true);
                    setSearchQuery('');
                  }}
                  className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Index
                </button>

                <h2 className="font-medium text-gray-900 dark:text-white">{selectedSurah?.englishName}</h2>

                <div className="flex items-center gap-4">
                  {/* Translation Selector - Text Only */}
                  <div className="relative hidden sm:block" ref={translationDropdownRef}>
                    <button
                      onClick={() => setShowTranslationDropdown(!showTranslationDropdown)}
                      className="text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {availableTranslations.find(t => t.identifier === selectedTranslation)?.name || 'TRANS'}
                    </button>
                    {showTranslationDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl rounded-lg py-1 max-h-64 overflow-auto">
                        {availableTranslations.slice(0, 10).map(t => (
                          <button
                            key={t.identifier}
                            onClick={() => {
                              setSelectedTranslation(t.identifier);
                              setShowTranslationDropdown(false);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                          >
                            {t.englishName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 sm:px-8 pt-12">
              {/* Bismillah */}
              {selectedSurah?.number !== 1 && selectedSurah?.number !== 9 && (
                <div className="text-center mb-16 pt-8">
                  <span className="font-serif text-3xl md:text-4xl text-gray-800 dark:text-gray-200" style={{ fontFamily: 'Amiri, serif' }}>
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </span>
                </div>
              )}

              {/* Continuous Reading List */}
              <div className="space-y-12">
                {ayahs.length > 0 ? (
                  ayahs.map((ayah, index) => (
                    <article key={ayah.number} id={`ayah-${ayah.number}`} className="group relative scroll-mt-32">
                      <div className="flex flex-col gap-6">
                        {/* Arabic */}
                        <div className="text-right w-full leading-loose">
                          <span className="font-serif text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-gray-100 leading-[2.5]" style={{ fontFamily: 'Amiri, serif', lineHeight: '2.2' }}>
                            {ayah.text}
                          </span>
                          <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 border border-gray-300 dark:border-gray-700 rounded-full text-sm md:text-base font-mono text-gray-400 ml-4 align-middle">
                            {ayah.number}
                          </span>
                        </div>

                        {/* Transliteration (Conditional) */}
                        {ayah.transliteration && visibleTransliterations.has(ayah.number) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-left w-full pl-0 md:pl-8 mb-2"
                          >
                            <p className="text-base text-emerald-600 dark:text-emerald-400 font-medium tracking-wide font-sans opacity-80">
                              {ayah.transliteration}
                            </p>
                          </motion.div>
                        )}

                        {/* Translation */}
                        <div className="text-left w-full pl-0 md:pl-8 border-l-2 border-transparent group-hover:border-emerald-500/30 transition-colors">
                          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 font-light leading-relaxed font-serif">
                            {ayah.translation}
                          </p>
                        </div>
                      </div>

                      {/* Minimal Actions - Appear on Hover */}
                      <div className="absolute -left-16 top-2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity hidden xl:flex text-gray-300 dark:text-gray-600">
                        <button
                          onClick={() => playAyahAudio(ayah.number)}
                          className={`p-2 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${audioState.isPlaying && audioState.currentAyah === ayah.number ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                          title="Play Audio"
                        >
                          {audioState.isPlaying && audioState.currentAyah === ayah.number ? (
                            <PauseIcon className="w-5 h-5" />
                          ) : (
                            <PlayIcon className="w-5 h-5" />
                          )}
                        </button>

                        <button
                          onClick={() => toggleTransliteration(ayah.number)}
                          className={`p-2 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 ${visibleTransliterations.has(ayah.number) ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                          title="Show/Hide Transliteration"
                        >
                          <LanguageIcon className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => fetchTafsirForAyah(selectedSurah?.number || 1, ayah.number)}
                          className="p-2 rounded-full transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                          title="Read Tafsir"
                        >
                          <BookOpenIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  // Skeleton Loading for Reading View
                  <div className="space-y-12 animate-pulse">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex flex-col gap-6">
                        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded w-3/4 self-end"></div>
                        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom Navigation */}
              <div className="flex justify-between mt-24 pt-12 border-t border-gray-100 dark:border-gray-900">
                <button
                  onClick={goToPreviousSurah}
                  disabled={!selectedSurah || selectedSurah.number <= 1}
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors flex items-center gap-2"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Previous Surah
                </button>
                <button
                  onClick={goToNextSurah}
                  disabled={!selectedSurah || selectedSurah.number >= 114}
                  className="text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors flex items-center gap-2"
                >
                  Next Surah
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Improved Tafsir Popup */}
      <AnimatePresence>
        {showTafsirPopup && tafsirData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowTafsirPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modern Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <div>
                  <span className="text-xs font-bold tracking-widest text-emerald-500 uppercase mb-2 block">Interpretation</span>
                  <h3 className="text-2xl sm:text-3xl font-serif text-gray-900 dark:text-white leading-tight">
                    Surah {selectedSurah?.englishName}, Ayah {tafsirData.ayah}
                  </h3>
                </div>

                <div className="flex items-center gap-4 mt-4 sm:mt-0">
                  {tafsirData.tafsirs.length > 1 && (
                    <div className="relative">
                      <select
                        value={selectedTafsirAuthor}
                        onChange={(e) => setSelectedTafsirAuthor(e.target.value)}
                        className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer shadow-sm"
                      >
                        {tafsirData.tafsirs.map((tafsir) => (
                          <option key={tafsir.author} value={tafsir.author}>
                            {tafsir.author}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}

                  <button
                    onClick={() => setShowTafsirPopup(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Active Tafsir Content */}
                  <motion.div
                    key={selectedTafsirAuthor}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-serif text-lg md:text-xl">
                      {tafsirData.tafsirs.find(t => t.author === selectedTafsirAuthor)?.content ||
                        tafsirData.tafsirs[0]?.content}
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* Footer / Context */}
              <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 flex justify-between items-center text-sm text-gray-400">
                <span>Source: {selectedTafsirAuthor}</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}