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

interface IslamicWidgetsProps {
  showWidgets: boolean;
}

// Segmented Digital Display Component
const DigitalTimeDisplay = ({ time }: { time: Date }) => {
  const timeString = time.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

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
      <div className="relative w-10 h-14 mx-0.5">
        {/* Segment A (top) */}
        <div className={`absolute top-0 left-0.5 right-0.5 h-1 ${activeSegments[0] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
        
        {/* Segment B (top right) */}
        <div className={`absolute top-0.5 right-0 w-1 h-6 ${activeSegments[1] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
        
        {/* Segment C (bottom right) */}
        <div className={`absolute bottom-0.5 right-0 w-1 h-6 ${activeSegments[2] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
        
        {/* Segment D (bottom) */}
        <div className={`absolute bottom-0 left-0.5 right-0.5 h-1 ${activeSegments[3] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
        
        {/* Segment E (bottom left) */}
        <div className={`absolute bottom-0.5 left-0 w-1 h-6 ${activeSegments[4] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
        
        {/* Segment F (top left) */}
        <div className={`absolute top-0.5 left-0 w-1 h-6 ${activeSegments[5] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
        
        {/* Segment G (middle) */}
        <div className={`absolute top-1/2 left-0.5 right-0.5 h-1 transform -translate-y-1/2 ${activeSegments[6] ? 'bg-gray-800 dark:bg-gray-200' : 'bg-gray-200 dark:bg-gray-700'} rounded-sm`}></div>
      </div>
    );
  };

  return (
    <div className="flex justify-center items-center">
      {timeString.split('').map((char, index) => (
        <SegmentedDigit key={index} digit={char} />
      ))}
    </div>
  );
};

export default function IslamicWidgets({ showWidgets }: IslamicWidgetsProps) {
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

  // Get user location and fetch Islamic data
  useEffect(() => {
    const fetchIslamicData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch Islamic data from our API (IP-based geolocation)
        const response = await fetch('/api/islamic-data');
        
        if (!response.ok) {
          const errorText = await response.text();
          // API Error
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
        
        // Always provide fallback data - no error state
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
        
        // Show error but still display widgets
        // Using fallback Islamic data due to error - silent fail for security
      } finally {
        setLoading(false);
      }
    };

    fetchIslamicData();
  }, []);

  // Don't render if widgets should be hidden
  if (!showWidgets) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-0 -mx-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-transparent rounded-xl p-6 border border-gray-200 dark:border-gray-600 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  <div className="h-5 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
              </div>
              {i === 1 ? (
                // Segmented digital clock loading state
                <div className="text-center">
                  <div className="flex justify-center items-center mb-3">
                    <div className="w-10 h-14 mx-0.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-10 h-14 mx-0.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-2 h-6 mx-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-10 h-14 mx-0.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="w-10 h-14 mx-0.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-600 rounded mx-auto"></div>
                </div>
              ) : (
                // Regular widget loading state
                <div className="text-center">
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-600 rounded mx-auto mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded mx-auto"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }



  return (
    <div className="max-w-4xl mx-auto px-0 -mx-1">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Digital Clock Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-transparent rounded-xl p-6 border border-gray-200 dark:border-gray-600"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {islamicData?.location?.city || 'Kolkata'}, {islamicData?.location?.country || 'IN'}
            </span>
          </div>
          
          {/* Minimal Digital Clock Display */}
          <div className="text-center">
            {/* Time Display - Segmented Digital Style */}
            <div className="mb-3">
              <DigitalTimeDisplay time={currentTime} />
            </div>
            
            {/* Date Display - Minimal */}
            <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short',
                day: '2-digit'
              }).toUpperCase()}
            </div>
          </div>
        </motion.div>

        {/* Eid-ul-Fitr Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-transparent rounded-xl p-6 border border-gray-200 dark:border-gray-600"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wider uppercase">Eid-ul-Fitr</h3>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {islamicData?.eidFitr.daysRemaining || 0} days
            </span>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 mb-1 tracking-wider uppercase">
              {islamicData?.eidFitr.date ? new Date(islamicData.eidFitr.date).toLocaleDateString('en-US', { 
                month: 'short',
                day: 'numeric'
              }) : 'Mar 31'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-mono tracking-wide uppercase">
              {islamicData?.eidFitr.date ? new Date(islamicData.eidFitr.date).getFullYear() : '2025'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">
              Festival of Breaking Fast
            </div>
          </div>
        </motion.div>

        {/* Eid-al-Adha Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-transparent rounded-xl p-6 border border-gray-200 dark:border-gray-600"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-xs font-mono text-gray-600 dark:text-gray-400 tracking-wider uppercase">Eid-al-Adha</h3>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {islamicData?.eidAdha.daysRemaining || 0} days
            </span>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100 mb-1 tracking-wider uppercase">
              {islamicData?.eidAdha.date ? new Date(islamicData.eidAdha.date).toLocaleDateString('en-US', { 
                month: 'short',
                day: 'numeric'
              }) : 'Jun 7'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-mono tracking-wide uppercase">
              {islamicData?.eidAdha.date ? new Date(islamicData.eidAdha.date).getFullYear() : '2025'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 font-mono uppercase tracking-wide">
              Festival of Sacrifice
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
