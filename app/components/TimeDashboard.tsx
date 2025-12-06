'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { CalendarDaysIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';

interface IslamicData {
  currentPrayer: {
    name: string;
    endTime: string;
    endTimeString: string;
    isActive: boolean;
  } | null;
  nextPrayer: {
    name: string;
    time: string;
    timeString: string;
    isActive: boolean;
  };
  location: {
    city: string;
    region: string;
    country: string;
    timezone: string;
    timezoneAbbr: string;
  };
  eidFitr: {
    date: string;
    daysRemaining: number;
    dateString: string;
  };
  eidAdha: {
    date: string;
    daysRemaining: number;
    dateString: string;
  };
}

export default function TimeDashboard() {
  const { theme } = useTheme();
  const [islamicData, setIslamicData] = useState<IslamicData | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchIslamicData = async () => {
      try {
        setLoading(true);
        // Try cache first
        const cachedData = localStorage.getItem('quran-gpt-islamic-data');
        const cacheTime = localStorage.getItem('quran-gpt-islamic-data-time');
        if (cachedData && cacheTime) {
          const cacheAge = Date.now() - parseInt(cacheTime);
          if (cacheAge < 15 * 60 * 1000) { // 15 mins cache
            setIslamicData(JSON.parse(cachedData));
            setLoading(false);
            return;
          }
        }

        const res = await fetch('/api/islamic-data');
        if (res.ok) {
          const data = await res.json();
          setIslamicData(data);
          localStorage.setItem('quran-gpt-islamic-data', JSON.stringify(data));
          localStorage.setItem('quran-gpt-islamic-data-time', Date.now().toString());
        }
      } catch (e) {
        console.error("Failed to fetch Islamic data", e);
      } finally {
        setLoading(false);
      }
    };
    fetchIslamicData();
  }, []);

  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Hijri Date Formatter
  const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const hijriDateString = hijriFormatter.format(now);


  if (loading && !islamicData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-b-2 border-gray-900 dark:border-white rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-gray-500">SYNCING TIME</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto px-6 py-12"
    >
      <header className="mb-16 text-center">
        {islamicData?.location && (
          <div className="flex items-center justify-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400">
            <MapPinIcon className="w-4 h-4" />
            <span className="text-xs font-bold tracking-widest uppercase">{islamicData.location.city}, {islamicData.location.country}</span>
          </div>
        )}
        <h1 className="text-6xl md:text-8xl font-serif text-gray-900 dark:text-white tracking-tighter mb-4">
          {timeString.replace(' AM', '').replace(' PM', '')}
          <span className="text-xl md:text-3xl text-gray-400 font-sans font-light ml-2">{timeString.slice(-2)}</span>
        </h1>
        <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400 font-light text-lg">
          <p>{dateString}</p>
          <p className="font-serif italic text-emerald-700 dark:text-emerald-400">{hijriDateString}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Prayer Status Card */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 flex flex-col justify-between h-64">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Current Prayer</span>
            {islamicData?.currentPrayer && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </div>

          <div>
            <h2 className="text-3xl font-serif text-gray-900 dark:text-white mb-1">
              {islamicData?.currentPrayer?.name || 'Waiting...'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ends at {islamicData?.currentPrayer?.endTimeString}
            </p>
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Next Prayer</p>
                <p className="text-xl font-medium text-gray-900 dark:text-white">{islamicData?.nextPrayer?.name}</p>
              </div>
              <p className="text-2xl font-mono text-gray-900 dark:text-white">{islamicData?.nextPrayer?.timeString}</p>
            </div>
          </div>
        </div>

        {/* Eid Countdown Card */}
        <div className="bg-emerald-900 text-white rounded-3xl p-8 border border-emerald-800/50 flex flex-col justify-between h-64 shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-200/60">Upcoming Eid</span>
            <CalendarDaysIcon className="w-5 h-5 text-emerald-200/60" />
          </div>

          {islamicData?.eidFitr && islamicData.eidFitr.daysRemaining >= 0 ? (
            <div className="text-center">
              <h2 className="text-2xl font-serif mb-2">Eid Al-Fitr</h2>
              <div className="text-5xl font-mono font-bold mb-2">{islamicData.eidFitr.daysRemaining}</div>
              <p className="text-emerald-200 text-sm">Days Remaining</p>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-serif mb-2">Eid Al-Adha</h2>
              <div className="text-5xl font-mono font-bold mb-2">{islamicData?.eidAdha?.daysRemaining ?? '--'}</div>
              <p className="text-emerald-200 text-sm">Days Remaining</p>
            </div>
          )}

          <div className="text-center text-xs text-emerald-200/50 uppercase tracking-widest">
            May Allah accept our deeds
          </div>
        </div>

        {/* Date Info / Quote Card */}
        <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-3xl p-8 border border-gray-100 dark:border-gray-700 flex flex-col justify-between h-64 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ClockIcon className="w-32 h-32" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Calendar</span>
          </div>

          <div className="z-10">
            <p className="text-lg font-serif italic leading-relaxed text-gray-600 dark:text-gray-300">
              "Verily, prayer has been decreed upon the believers a decree of specified times."
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-4">Surah An-Nisa 4:103</p>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
