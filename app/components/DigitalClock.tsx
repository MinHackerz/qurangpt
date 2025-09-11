'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

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

// Segmented Digital Display Component
const SegmentedDigit = ({ digit }: { digit: string }) => {
  const segments = {
    '0': [1, 1, 1, 1, 1, 1, 0],
    '1': [0, 1, 1, 0, 0, 0, 0],
    '2': [1, 1, 0, 1, 1, 0, 1],
    '3': [1, 1, 1, 1, 0, 0, 1],
    '4': [0, 1, 1, 0, 0, 1, 1],
    '5': [1, 0, 1, 1, 0, 1, 1],
    '6': [1, 0, 1, 1, 1, 1, 1],
    '7': [1, 1, 1, 0, 0, 0, 0],
    '8': [1, 1, 1, 1, 1, 1, 1],
    '9': [1, 1, 1, 1, 0, 1, 1],
    ':': [0, 0, 0, 0, 0, 0, 0] // Special case for colon
  };

  const activeSegments = segments[digit as keyof typeof segments] || [0, 0, 0, 0, 0, 0, 0];

  if (digit === ':') {
    return (
      <div className="flex flex-col justify-center items-center mx-1">
        <div className="w-1.5 h-1.5 bg-gray-800 dark:bg-gray-200 rounded-full mb-1"></div>
        <div className="w-1.5 h-1.5 bg-gray-800 dark:bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="relative w-8 h-12 mx-0.5">
      {/* Segment A (top) */}
      <div className={`absolute top-0 left-1 right-1 h-0.5 ${activeSegments[0] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
      
      {/* Segment B (top right) */}
      <div className={`absolute top-0.5 right-0 w-0.5 h-5 ${activeSegments[1] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
      
      {/* Segment C (bottom right) */}
      <div className={`absolute bottom-0.5 right-0 w-0.5 h-5 ${activeSegments[2] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
      
      {/* Segment D (bottom) */}
      <div className={`absolute bottom-0 left-1 right-1 h-0.5 ${activeSegments[3] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
      
      {/* Segment E (bottom left) */}
      <div className={`absolute bottom-0.5 left-0 w-0.5 h-5 ${activeSegments[4] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
      
      {/* Segment F (top left) */}
      <div className={`absolute top-0.5 left-0 w-0.5 h-5 ${activeSegments[5] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
      
      {/* Segment G (middle) */}
      <div className={`absolute top-1/2 left-1 right-1 h-0.5 transform -translate-y-1/2 ${activeSegments[6] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
    </div>
  );
};

const DigitalTimeDisplay = ({ time, timezone }: { time: Date; timezone?: string }) => {
  const timeString = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false,
    timeZone: timezone || 'UTC'
  });

  return (
    <div className="flex justify-center items-center">
      {timeString.split('').map((char, index) => (
        <SegmentedDigit key={index} digit={char} />
      ))}
    </div>
  );
};

export default function DigitalClock() {
  const [islamicData, setIslamicData] = useState<IslamicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch Islamic data using IP-based location detection
  useEffect(() => {
    const fetchIslamicData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/islamic-data');
        
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setIslamicData(data);
        setError(null);
        
      } catch (err) {
        console.error('Error fetching Islamic data:', err);
        
        // Fallback data
        const currentDate = new Date();
        const fallbackPrayerTime = new Date();
        fallbackPrayerTime.setHours(18, 30, 0, 0);
        
        const fallbackEidFitr = new Date(2025, 2, 31);
        const fallbackEidAdha = new Date(2025, 5, 7);
        
        const daysToEidFitr = Math.ceil((fallbackEidFitr.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysToEidAdha = Math.ceil((fallbackEidAdha.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        setIslamicData({
          currentPrayer: null,
          nextPrayer: {
            name: 'Maghrib',
            time: fallbackPrayerTime.toISOString(),
            timeString: '6:30 PM UTC',
            isActive: false
          },
          location: {
            city: 'Unknown',
            region: 'Unknown',
            country: 'Unknown',
            timezone: 'UTC',
            timezoneAbbr: 'UTC'
          },
          eidFitr: {
            date: fallbackEidFitr.toISOString(),
            daysRemaining: Math.max(0, daysToEidFitr),
            dateString: fallbackEidFitr.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })
          },
          eidAdha: {
            date: fallbackEidAdha.toISOString(),
            daysRemaining: Math.max(0, daysToEidAdha),
            dateString: fallbackEidAdha.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIslamicData();
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: islamicData?.location?.timezone || 'UTC'
  });

  const dateString = currentTime.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: islamicData?.location?.timezone || 'UTC'
  });


  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center justify-center space-y-4 mt-6"
      >
        <div className="w-full max-w-4xl mx-auto px-6 sm:px-0">
          {/* Separate Containers Loading */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-transparent border-[0.5px] border-gray-600 dark:border-gray-400 rounded-lg p-4 text-center">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2 animate-pulse"></div>
                <div className="flex justify-center items-center mb-2">
                  <div className="w-8 h-12 mx-0.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-8 h-12 mx-0.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-2 h-6 mx-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-8 h-12 mx-0.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="w-8 h-12 mx-0.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded mx-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center space-y-4 mt-6"
    >
      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto px-6 sm:px-0">
        {/* Separate Containers - All Information in One Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Digital Clock */}
          <div className="bg-transparent border-[0.5px] border-gray-600 dark:border-gray-400 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono uppercase tracking-wide mb-2">
              Time
            </div>
            <DigitalTimeDisplay time={currentTime} timezone={islamicData?.location?.timezone} />
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-2 uppercase">
              {dateString}
            </div>
            {islamicData?.location && (
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {islamicData.location.city}, {islamicData.location.country}
              </div>
            )}
          </div>

          {/* Prayer Time */}
          <div className="bg-transparent border-[0.5px] border-gray-600 dark:border-gray-400 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono uppercase tracking-wide mb-2">
              Prayer
            </div>
            <div className="space-y-2">
              {/* Current Prayer */}
              {islamicData?.currentPrayer ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      {islamicData.currentPrayer.name}
                    </span>
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                    Until {islamicData.currentPrayer.endTimeString}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-500">
                    No active prayer
                  </div>
                </div>
              )}
              
              {/* Divider */}
              <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 mx-auto"></div>
              
              {/* Next Prayer */}
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Next: {islamicData?.nextPrayer.name || 'Maghrib'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {islamicData?.nextPrayer.timeString || '6:30 PM'}
                </div>
              </div>
            </div>
          </div>

          {/* Eid-ul-Fitr */}
          <div className="bg-transparent border-[0.5px] border-gray-600 dark:border-gray-400 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono uppercase tracking-wide mb-2">
              Eid-ul-Fitr
            </div>
            <div className="text-xl font-mono font-bold text-gray-900 dark:text-gray-100">
              {islamicData?.eidFitr.daysRemaining || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
              days
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">
              {islamicData?.eidFitr.dateString || 'Mar 31, 2025'}
            </div>
          </div>

          {/* Eid-al-Adha */}
          <div className="bg-transparent border-[0.5px] border-gray-600 dark:border-gray-400 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono uppercase tracking-wide mb-2">
              Eid-al-Adha
            </div>
            <div className="text-xl font-mono font-bold text-gray-900 dark:text-gray-100">
              {islamicData?.eidAdha.daysRemaining || 0}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
              days
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">
              {islamicData?.eidAdha.dateString || 'Jun 7, 2025'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
