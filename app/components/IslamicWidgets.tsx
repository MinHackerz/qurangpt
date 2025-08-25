'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, CalendarDaysIcon, GiftIcon } from '@heroicons/react/24/outline';

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
          console.error('API Error:', response.status, errorText);
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
        
        // Only show error for debugging, but still show widgets
        console.warn('Using fallback Islamic data due to error:', err instanceof Error ? err.message : String(err));
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
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-6 animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const calculateTimeRemaining = (targetTime: string) => {
    const now = new Date();
    const target = new Date(targetTime);
    const diff = target.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds, isNegative: diff < 0 };
  };

  // Get the active prayer info (current prayer if active, otherwise next prayer)
  const activePrayer = islamicData?.currentPrayer || islamicData?.nextPrayer;
  
  // Calculate time remaining based on whether we have a current prayer or next prayer
  let timeRemaining = null;
  let countdownLabel = '';
  
  if (islamicData?.currentPrayer) {
    // If there's a current prayer, count down to when it ends
    timeRemaining = calculateTimeRemaining(islamicData.currentPrayer.endTime);
    countdownLabel = 'remaining';
  } else if (islamicData?.nextPrayer) {
    // If there's no current prayer, count down to the next prayer
    timeRemaining = calculateTimeRemaining(islamicData.nextPrayer.time);
    
    // Check if the next prayer is tomorrow's Fajr (all prayers passed for today)
    const nextPrayerDate = new Date(islamicData.nextPrayer.time);
    const today = new Date();
    const isNextPrayerTomorrow = nextPrayerDate.getDate() !== today.getDate();
    
    if (isNextPrayerTomorrow) {
      countdownLabel = 'until tomorrow\'s Fajr';
    } else {
      countdownLabel = 'until next prayer';
    }
  }

  // Calculate current time for analog clock using state
  const getCurrentTimeForClock = () => {
    return {
      hours: currentTime.getHours() % 12,
      minutes: currentTime.getMinutes(),
      seconds: currentTime.getSeconds()
    };
  };

  const clockTime = getCurrentTimeForClock();

  return (
    <div className="max-w-6xl mx-auto px-4">

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Prayer Time Clock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 islamic-border prayer-widget"
        >
          {/* Location indicator - Top Right */}
          <div className="absolute top-4 right-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
            Kolkata, IN
          </div>
          

          
          {/* Analog Clock - Centered */}
          <div className="flex justify-center mb-8">
            <div className="relative w-56 h-56">
              {/* Clock face */}
              <div className="w-full h-full rounded-full border-4 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 relative">
                {/* Clock numbers */}
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, index) => {
                  const angle = (index * 30 - 90) * (Math.PI / 180);
                  const x = 50 + 38 * Math.cos(angle);
                  const y = 50 + 38 * Math.sin(angle);
                  return (
                                          <div
                        key={num}
                        className="absolute text-lg font-semibold text-gray-600 dark:text-gray-400"
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                      {num}
                    </div>
                  );
                })}
                
                {/* Hour hand */}
                <div
                  className="absolute w-3 h-20 bg-gray-800 dark:bg-gray-200 rounded-full origin-bottom"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -100%) rotate(${(clockTime.hours % 12) * 30 + (clockTime.minutes * 0.5)}deg)`
                  }}
                />
                
                {/* Minute hand */}
                <div
                  className="absolute w-2 h-28 bg-gray-600 dark:bg-gray-300 rounded-full origin-bottom"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -100%) rotate(${clockTime.minutes * 6}deg)`
                  }}
                />
                
                {/* Second hand */}
                <div
                  className="absolute w-0.5 h-32 bg-red-500 dark:bg-red-400 rounded-full origin-bottom"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -100%) rotate(${clockTime.seconds * 6}deg)`
                  }}
                />
                
                {/* Center dot */}
                <div className="absolute w-5 h-5 bg-gray-800 dark:bg-gray-200 rounded-full" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
              </div>
            </div>
          </div>
          
          {/* Time and Message - Bottom */}
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              {currentTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
              Time is life's most precious gift
            </div>
          </div>

          

        </motion.div>

        {/* Eid-ul-Fitr Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 overflow-hidden islamic-border eid-fitr-widget"
        >
          {/* Location indicator - Top Right */}
          <div className="absolute top-4 right-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
            India
          </div>
          
          {/* Calendar Header */}
          <div className="text-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Eid-ul-Fitr</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Festival of Breaking Fast</p>
          </div>
          
          {/* Calendar Design */}
          <div className="relative">
            {/* Calendar Page Effect */}
            <div className="relative bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-500">
              {/* Calendar Ring Binding */}
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-gray-400 dark:bg-gray-500 rounded-r-full"></div>
              
              {/* Calendar Content */}
              <div className="p-4 text-center">
                {/* Month */}
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {islamicData?.eidFitr.date ? new Date(islamicData.eidFitr.date).toLocaleDateString('en-US', { month: 'short' }) : 'MAR'}
                </div>
                
                {/* Day */}
                <div className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {islamicData?.eidFitr.date ? new Date(islamicData.eidFitr.date).getDate() : '31'}
                </div>
                
                {/* Year */}
                <div className="text-lg text-gray-600 dark:text-gray-400">
                  {islamicData?.eidFitr.date ? new Date(islamicData.eidFitr.date).getFullYear() : '2025'}
                </div>
              </div>
              
              {/* Calendar Corner Fold */}
              <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-gray-200 dark:border-t-gray-600"></div>
            </div>
            
            {/* Days Remaining Badge */}
            <div className="absolute -top-2 -right-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-black text-sm font-bold px-3 py-1 rounded-full">
              {islamicData?.eidFitr.daysRemaining || 0} days
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected Date</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {islamicData?.eidFitr.dateString || 'Loading...'}
            </p>
          </div>
        </motion.div>

        {/* Eid-al-Adha Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 overflow-hidden islamic-border eid-adha-widget"
        >
          {/* Location indicator - Top Right */}
          <div className="absolute top-4 right-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
            India
          </div>
          
          {/* Calendar Header */}
          <div className="text-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg">Eid-al-Adha</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Festival of Sacrifice</p>
          </div>
          
          {/* Calendar Design */}
          <div className="relative">
            {/* Calendar Page Effect */}
            <div className="relative bg-white dark:bg-gray-700 rounded-lg border-2 border-gray-300 dark:border-gray-500">
              {/* Calendar Ring Binding */}
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-16 bg-gray-400 dark:bg-gray-500 rounded-r-full"></div>
              
              {/* Calendar Content */}
              <div className="p-4 text-center">
                {/* Month */}
                <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {islamicData?.eidAdha.date ? new Date(islamicData.eidAdha.date).toLocaleDateString('en-US', { month: 'short' }) : 'JUN'}
                </div>
                
                {/* Day */}
                <div className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {islamicData?.eidAdha.date ? new Date(islamicData.eidAdha.date).getDate() : '7'}
                </div>
                
                {/* Year */}
                <div className="text-lg text-gray-600 dark:text-gray-400">
                  {islamicData?.eidAdha.date ? new Date(islamicData.eidAdha.date).getFullYear() : '2025'}
                </div>
              </div>
              
              {/* Calendar Corner Fold */}
              <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-gray-200 dark:border-t-gray-600"></div>
            </div>
            
            {/* Days Remaining Badge */}
            <div className="absolute -top-2 -right-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-black text-sm font-bold px-3 py-1 rounded-full">
              {islamicData?.eidAdha.daysRemaining || 0} days
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected Date</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {islamicData?.eidAdha.dateString || 'Loading...'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
