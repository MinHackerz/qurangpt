'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

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

// 7-Segment LED Display Logic
const getSegmentState = (char: string, segment: string): boolean => {
  const segments: { [key: string]: string[] } = {
    '0': ['A', 'B', 'C', 'D', 'E', 'F'],
    '1': ['B', 'C'],
    '2': ['A', 'B', 'G', 'E', 'D'],
    '3': ['A', 'B', 'G', 'C', 'D'],
    '4': ['F', 'G', 'B', 'C'],
    '5': ['A', 'F', 'G', 'C', 'D'],
    '6': ['A', 'F', 'G', 'E', 'C', 'D'],
    '7': ['A', 'B', 'C'],
    '8': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    '9': ['A', 'B', 'C', 'D', 'F', 'G']
  };
  
  return segments[char]?.includes(segment) || false;
};

export default function TimeDashboard() {
  const { theme } = useTheme();
  const [islamicData, setIslamicData] = useState<IslamicData | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  // Calendar state: a Gregorian reference date within the displayed Hijri month
  const [calendarRefDate, setCalendarRefDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<{ gDate: Date; hDay: number } | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<IslamicEvent[]>([]);

  // Notify parent component about modal state for global blur effect
  useEffect(() => {
    const event = new CustomEvent('qgpt:modal-state', { 
      detail: { 
        isOpen: showEventModal && selectedDate && selectedEvents.length > 0,
        selectedDate,
        selectedEvents
      } 
    });
    window.dispatchEvent(event);
  }, [showEventModal, selectedDate, selectedEvents]);

  // Listen for modal close events to clear selected date
  useEffect(() => {
    const handleModalState = (e: any) => {
      if (e.detail?.clearSelectedDate && !e.detail?.isOpen) {
        setSelectedDate(null);
        setSelectedEvents([]);
      }
    };
    
    window.addEventListener('qgpt:modal-state', handleModalState);
    return () => window.removeEventListener('qgpt:modal-state', handleModalState);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);


  useEffect(() => {
    const fetchIslamicData = async () => {
      try {
        setLoading(true);
        const cachedData = localStorage.getItem('quran-gpt-islamic-data');
        const cacheTime = localStorage.getItem('quran-gpt-islamic-data-time');
        if (cachedData && cacheTime) {
          const cacheAge = Date.now() - parseInt(cacheTime);
          if (cacheAge < 5 * 60 * 1000) {
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
      } finally {
        setLoading(false);
      }
    };
    fetchIslamicData();
  }, []);

  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: islamicData?.location?.timezone || 'UTC',
  });

  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: islamicData?.location?.timezone || 'UTC',
  });

  // ---------------- Hijri Calendar (Umm al-Qura) synced to user's timezone ----------------
  const timeZone = islamicData?.location?.timezone || 'UTC';

  const formatHijriParts = (date: Date) => {
    // Use locale with calendar extension for islamic-umalqura
    // Use UTC to avoid timezone-related date shifts
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value || '';
    return {
      year: parseInt(get('year') || '0'),
      month: parseInt(get('month') || '0'),
      day: parseInt(get('day') || '0')
    };
  };

  const sameHijriMonth = (a: Date, b: Date) => {
    const pa = formatHijriParts(a);
    const pb = formatHijriParts(b);
    return pa.year === pb.year && pa.month === pb.month;
  };

  const getHijriMonthInfo = (refDate: Date) => {
    // Find the Gregorian date corresponding to day 1 of the Hijri month containing refDate
    // Use UTC to avoid timezone-related date shifts
    const today = new Date(refDate.getTime());
    const todayParts = formatHijriParts(today);
    let cursor = new Date(today.getTime());
    
    // Search backwards to find the first day of the current Hijri month
    for (let i = 0; i < 35; i++) {
      const p = formatHijriParts(cursor);
      if (p.day === 1 && p.month === todayParts.month && p.year === todayParts.year) break;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    const monthStart = new Date(cursor.getTime());

    // Collect days until next month (max 31 defensive)
    const days: { gDate: Date; hDay: number }[] = [];
    let d = new Date(monthStart.getTime());
    let currentMonth = todayParts.month;
    let currentYear = todayParts.year;
    
    for (let i = 0; i < 31; i++) {
      const p = formatHijriParts(d);
      
      // Check if we've moved to the next month
      if (i > 0 && (p.month !== currentMonth || p.year !== currentYear)) {
        break;
      }
      
      days.push({ gDate: new Date(d.getTime()), hDay: p.day });
      d.setUTCDate(d.getUTCDate() + 1);
    }

    // Weekday offset for first cell (0=Sun..6=Sat)
    // Simplified weekday calculation using UTC to avoid timezone issues
    const firstWeekday = monthStart.getUTCDay();

    // Hijri month/year label
    const monthLabel = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      timeZone: 'UTC',
      month: 'long',
      year: 'numeric'
    }).format(monthStart);

    const monthParts = formatHijriParts(monthStart);
    return { monthStart, monthLabel, days, firstWeekday, hijriYear: monthParts.year, hijriMonth: monthParts.month };
  };

  const hijri = getHijriMonthInfo(calendarRefDate);

  // Comprehensive Islamic events with detailed descriptions
  interface IslamicEvent {
    name: string;
    description: string;
    significance: string;
    type: 'major' | 'religious' | 'historical' | 'cultural';
  }

  const getEventsForMonth = (hYear: number, hMonth: number): Record<number, IslamicEvent[]> => {
    const events: Record<number, IslamicEvent[]> = {};
    const add = (day: number, event: IslamicEvent) => {
      if (!events[day]) events[day] = [];
      events[day].push(event);
    };

    // Muharram (1st month)
    if (hMonth === 1) {
      add(1, {
        name: 'Islamic New Year (Hijri New Year)',
        description: 'The first day of Muharram marks the beginning of the Islamic lunar calendar year, commemorating the migration (Hijra) of Prophet Muhammad from Mecca to Medina in 622 CE.',
        significance: 'This event represents a new beginning for the Muslim community and the establishment of the first Islamic state in Medina.',
        type: 'major'
      });
      add(10, {
        name: 'Day of Ashura',
        description: 'A significant day of mourning for Shia Muslims commemorating the martyrdom of Husayn ibn Ali, the grandson of Prophet Muhammad, at the Battle of Karbala in 680 CE.',
        significance: 'For Sunni Muslims, it is a day of fasting as Prophet Muhammad observed it. For Shia Muslims, it represents sacrifice, justice, and resistance against oppression.',
        type: 'major'
      });
    }

    // Safar (2nd month)
    if (hMonth === 2) {
      add(20, {
        name: 'Arbaeen',
        description: 'Observed 40 days after Ashura, marking the end of the mourning period for Imam Husayn. Millions of pilgrims walk to Karbala, Iraq.',
        significance: 'One of the largest peaceful gatherings in the world, representing solidarity, remembrance, and spiritual renewal.',
        type: 'religious'
      });
    }

    // Rabi' al-Awwal (3rd month)
    if (hMonth === 3) {
      add(12, {
        name: 'Mawlid an-Nabi (Prophet\'s Birthday)',
        description: 'Celebrates the birth of Prophet Muhammad (peace be upon him). While the exact date varies among scholars, the 12th of Rabi\' al-Awwal is widely observed.',
        significance: 'A time for reflection on the Prophet\'s teachings, character, and his role as the final messenger of Islam.',
        type: 'major'
      });
    }

    // Rajab (7th month)
    if (hMonth === 7) {
      add(27, {
        name: 'Isra and Mi\'raj (Night Journey)',
        description: 'Commemorates Prophet Muhammad\'s miraculous night journey from Mecca to Jerusalem and his ascension to the heavens.',
        significance: 'Demonstrates the spiritual connection between earth and heaven, and established the five daily prayers as a pillar of Islam.',
        type: 'major'
      });
    }

    // Sha\'ban (8th month)
    if (hMonth === 8) {
      add(15, {
        name: 'Laylat al-Bara\'at (Night of Forgiveness)',
        description: 'Known as the Night of Records or Night of Forgiveness, when it is believed that Allah determines the destiny of individuals for the coming year.',
        significance: 'A night of prayer, seeking forgiveness, and remembering deceased loved ones.',
        type: 'religious'
      });
    }

    // Ramadan (9th month)
    if (hMonth === 9) {
      add(1, {
        name: 'Beginning of Ramadan',
        description: 'The start of the holy month of fasting, one of the Five Pillars of Islam. Muslims fast from dawn to sunset, abstaining from food, drink, and other physical needs.',
        significance: 'A time of spiritual purification, self-discipline, empathy for the less fortunate, and increased devotion to Allah.',
        type: 'major'
      });
      add(27, {
        name: 'Laylat al-Qadr (Night of Power)',
        description: 'The night when the first verses of the Quran were revealed to Prophet Muhammad. It is believed to fall on one of the odd nights in the last ten days of Ramadan.',
        significance: 'Worship on this night is considered better than worship for a thousand months. Muslims seek this night through prayer and reflection.',
        type: 'major'
      });
    }

    // Shawwal (10th month)
    if (hMonth === 10) {
      add(1, {
        name: 'Eid al-Fitr (Festival of Breaking the Fast)',
        description: 'Celebrates the successful completion of Ramadan fasting. Muslims gather for special prayers, give charity (Zakat al-Fitr), and celebrate with family and friends.',
        significance: 'Marks spiritual renewal, gratitude, and joy. It emphasizes community, charity, and the bonds of family and friendship.',
        type: 'major'
      });
    }

    // Dhu al-Hijjah (12th month)
    if (hMonth === 12) {
      add(8, {
        name: 'Day of Tarwiyah',
        description: 'The beginning of Hajj pilgrimage. Pilgrims proceed to Mina, where they spend the night in preparation for the Day of Arafah.',
        significance: 'Marks the start of the most sacred days of Hajj, representing preparation, reflection, and spiritual readiness.',
        type: 'religious'
      });
      add(9, {
        name: 'Day of Arafah',
        description: 'The most important day of Hajj pilgrimage. Pilgrims gather at Mount Arafah for prayer and supplication from noon until sunset.',
        significance: 'Considered the day when Islam was perfected. Non-pilgrims are encouraged to fast, and it is believed that Allah forgives sins of the previous and coming year.',
        type: 'major'
      });
      add(10, {
        name: 'Eid al-Adha (Festival of Sacrifice)',
        description: 'Commemorates Prophet Ibrahim\'s willingness to sacrifice his son Ismail in obedience to Allah. Muslims who can afford it sacrifice an animal and distribute the meat.',
        significance: 'Emphasizes sacrifice, obedience to Allah, and sharing with those in need. It marks the end of Hajj pilgrimage.',
        type: 'major'
      });
      add(11, {
        name: 'First Day of Tashreeq',
        description: 'The first of three days following Eid al-Adha. Pilgrims continue Hajj rituals, including the symbolic stoning of Satan at Jamarat.',
        significance: 'Days of remembrance, gratitude, and completion of Hajj obligations.',
        type: 'religious'
      });
      add(12, {
        name: 'Second Day of Tashreeq',
        description: 'Continuation of post-Eid al-Adha celebrations and Hajj rituals.',
        significance: 'Emphasizes community, remembrance of Allah, and the bonds formed during pilgrimage.',
        type: 'religious'
      });
      add(13, {
        name: 'Third Day of Tashreeq',
        description: 'The final day of Tashreeq and the conclusion of Hajj pilgrimage for most pilgrims.',
        significance: 'Marks the completion of one of Islam\'s greatest spiritual journeys and the return to daily life with renewed faith.',
        type: 'religious'
      });
    }

    return events;
  };

  const monthEvents = getEventsForMonth(hijri.hijriYear, hijri.hijriMonth);

  const goToPrevMonth = () => {
    // Step back ~30 days until Hijri month changes
    let d = new Date(calendarRefDate.getTime());
    const current = formatHijriParts(d);
    for (let i = 0; i < 40; i++) {
      d.setDate(d.getDate() - 1);
      const p = formatHijriParts(d);
      if (p.month !== current.month || p.year !== current.year) break;
    }
    setCalendarRefDate(d);
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    let d = new Date(calendarRefDate.getTime());
    const current = formatHijriParts(d);
    for (let i = 0; i < 40; i++) {
      d.setDate(d.getDate() + 1);
      const p = formatHijriParts(d);
      if (p.month !== current.month || p.year !== current.year) break;
    }
    setCalendarRefDate(d);
    setSelectedDate(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="min-h-[70vh] flex items-start justify-center"
      >
        <div className="w-full mx-auto px-6 sm:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-mono tracking-wide text-gray-700 dark:text-gray-300">Time Dashboard</h2>
          {islamicData?.location && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {islamicData.location.city}, {islamicData.location.country} ({islamicData.location.timezoneAbbr})
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LED Clock */}
          <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-3 bg-transparent">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Time</div>
            <div className="relative">
              {/* LED Clock Display */}
              <div className="bg-transparent rounded-lg p-2">
                <div className="flex justify-center items-center space-x-1">
                  {loading ? (
                    <div className="flex space-x-1">
                      {[1,2,3,4,5,6,7,8].map((i) => (
                        <div key={i} className="w-8 h-12 bg-gray-300 dark:bg-gray-700 rounded-sm opacity-30"></div>
                      ))}
                    </div>
                  ) : (
                    timeString.split('').map((char, index) => (
                      <div key={index} className="flex items-center">
                        {char === ':' ? (
                          <div className="w-2 h-12 flex flex-col justify-center items-center space-y-1">
                            <div className="w-1 h-1 bg-red-500 rounded-full" style={{
                              boxShadow: '0 0 8px #ef4444, 0 0 16px #ef4444'
                            }}></div>
                            <div className="w-1 h-1 bg-red-500 rounded-full" style={{
                              boxShadow: '0 0 8px #ef4444, 0 0 16px #ef4444'
                            }}></div>
                          </div>
                        ) : (
                          <div className="w-8 h-12 relative">
                            {/* 7-Segment LED Display */}
                            <div className="absolute inset-0">
                              {/* Segment A (Top) */}
                              <div className={`absolute top-0 left-1 right-1 h-1 rounded-sm ${getSegmentState(char, 'A') ? 'bg-red-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'A') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'A') ? {boxShadow: 'inset 0 0 2px #ef4444'} : {}}></div>
                              
                              {/* Segment B (Top Right) */}
                              <div className={`absolute top-1 right-0 bottom-1/2 w-1 rounded-sm ${getSegmentState(char, 'B') ? 'bg-red-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'B') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'B') ? {boxShadow: 'inset 0 0 2px #ef4444'} : {}}></div>
                              
                              {/* Segment C (Bottom Right) */}
                              <div className={`absolute top-1/2 right-0 bottom-1 w-1 rounded-sm ${getSegmentState(char, 'C') ? 'bg-red-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'C') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'C') ? {boxShadow: 'inset 0 0 2px #ef4444'} : {}}></div>
                              
                              {/* Segment D (Bottom) */}
                              <div className={`absolute bottom-0 left-1 right-1 h-1 rounded-sm ${getSegmentState(char, 'D') ? 'bg-red-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'D') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'D') ? {boxShadow: 'inset 0 0 2px #ef4444'} : {}}></div>
                              
                              {/* Segment E (Bottom Left) */}
                              <div className={`absolute top-1/2 left-0 bottom-1 w-1 rounded-sm ${getSegmentState(char, 'E') ? 'bg-red-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'E') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'E') ? {boxShadow: 'inset 0 0 2px #ef4444'} : {}}></div>
                              
                              {/* Segment F (Top Left) */}
                              <div className={`absolute top-1 left-0 bottom-1/2 w-1 rounded-sm ${getSegmentState(char, 'F') ? 'bg-red-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'F') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'F') ? {boxShadow: 'inset 0 0 2px #ef4444'} : {}}></div>
                              
                              {/* Segment G (Middle) */}
                              <div className={`absolute top-1/2 left-1 right-1 h-1 rounded-sm ${getSegmentState(char, 'G') ? 'bg-red-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'G') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'G') ? {boxShadow: 'inset 0 0 2px #ef4444'} : {}}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Date Display */}
              <div className="mt-2 text-center">
                <div className="text-xs font-mono text-gray-400 dark:text-gray-500 bg-transparent rounded px-2 py-1 inline-block">
                  {loading ? '—' : dateString}
                </div>
              </div>
            </div>
          </div>

          {/* Prayer */}
          <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-3 bg-transparent">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Prayer Times</div>
            {loading ? (
              <div className="text-center py-2">
                <div className="text-xs text-gray-400">Loading prayer times...</div>
              </div>
            ) : islamicData?.currentPrayer ? (
              <div className="grid grid-cols-2 gap-2">
                {/* Current Prayer */}
                <div className="bg-transparent rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Current Prayer</span>
                    </div>
                  </div>
                  <div className="text-base font-mono font-bold text-gray-800 dark:text-gray-200 mb-2">
                    {islamicData.currentPrayer.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {islamicData.currentPrayer.name === 'Isha' 
                      ? islamicData.currentPrayer.endTimeString
                      : `Until ${islamicData.currentPrayer.endTimeString}`}
                  </div>
                  {/* Spacer to match Eid section height */}
                  {islamicData.currentPrayer.isActive && (
                    <div className="h-8 flex items-center justify-center">
                      <div className="text-xs text-gray-500 dark:text-gray-500">Active Now</div>
                    </div>
                  )}
                  {!islamicData.currentPrayer.isActive && (
                    <div className="h-8"></div>
                  )}
                </div>

                {/* Next Prayer */}
                <div className="bg-transparent rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Next Prayer</div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    {islamicData.nextPrayer.name}
                  </div>
                  {/* LED Time Display for Next Prayer - Matching Eid sections */}
                  <div className="flex justify-center items-center space-x-1 mb-1">
                    {islamicData.nextPrayer.timeString.split('').filter(char => /[0-9:]/.test(char)).map((char, index) => (
                      <div key={index} className="flex items-center">
                        {char === ':' ? (
                          <div className="w-1 h-8 flex flex-col justify-center items-center space-y-1">
                            <div className="w-0.5 h-0.5 bg-gray-500 rounded-full" style={{
                              boxShadow: '0 0 4px #6b7280, 0 0 8px #6b7280'
                            }}></div>
                            <div className="w-0.5 h-0.5 bg-gray-500 rounded-full" style={{
                              boxShadow: '0 0 4px #6b7280, 0 0 8px #6b7280'
                            }}></div>
                          </div>
                        ) : (
                          <div className="w-5 h-8 relative">
                            {/* 7-Segment LED Display - Matching Eid sections */}
                            <div className="absolute inset-0">
                              {/* Segment A (Top) */}
                              <div className={`absolute top-0 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'A') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'A') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'A') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                              
                              {/* Segment B (Top Right) */}
                              <div className={`absolute top-0.5 right-0 bottom-1/2 w-0.5 rounded-sm ${getSegmentState(char, 'B') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'B') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'B') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                              
                              {/* Segment C (Bottom Right) */}
                              <div className={`absolute top-1/2 right-0 bottom-0.5 w-0.5 rounded-sm ${getSegmentState(char, 'C') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'C') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'C') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                              
                              {/* Segment D (Bottom) */}
                              <div className={`absolute bottom-0 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'D') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'D') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'D') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                              
                              {/* Segment E (Bottom Left) */}
                              <div className={`absolute top-1/2 left-0 bottom-0.5 w-0.5 rounded-sm ${getSegmentState(char, 'E') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'E') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'E') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                              
                              {/* Segment F (Top Left) */}
                              <div className={`absolute top-0.5 left-0 bottom-1/2 w-0.5 rounded-sm ${getSegmentState(char, 'F') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'F') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'F') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                              
                              {/* Segment G (Middle) */}
                              <div className={`absolute top-1/2 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'G') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'G') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'G') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Spacer to match Eid section height */}
                  <div className="h-4 flex items-center justify-center">
                    <div className="text-xs text-gray-500 dark:text-gray-500">Upcoming</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-center py-2">
                  <div className="text-xs text-gray-500 dark:text-gray-500 mb-1">No active prayer</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Next: {islamicData?.nextPrayer?.name || '—'}</div>
                </div>
                {/* Compact LED Time Display for Next Prayer */}
                {islamicData?.nextPrayer?.timeString && (
                  <div className="bg-transparent rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Next Prayer Time</div>
                    <div className="flex justify-center items-center space-x-1">
                      {islamicData.nextPrayer.timeString.split('').filter(char => /[0-9:]/.test(char)).map((char, index) => (
                        <div key={index} className="flex items-center">
                          {char === ':' ? (
                            <div className="w-1 h-8 flex flex-col justify-center items-center space-y-1">
                              <div className="w-0.5 h-0.5 bg-gray-500 rounded-full" style={{
                                boxShadow: '0 0 4px #6b7280, 0 0 8px #6b7280'
                              }}></div>
                              <div className="w-0.5 h-0.5 bg-gray-500 rounded-full" style={{
                                boxShadow: '0 0 4px #6b7280, 0 0 8px #6b7280'
                              }}></div>
                            </div>
                          ) : (
                            <div className="w-5 h-8 relative">
                              {/* 7-Segment LED Display - Matching Eid sections */}
                              <div className="absolute inset-0">
                                {/* Segment A (Top) */}
                                <div className={`absolute top-0 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'A') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'A') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'A') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                                
                                {/* Segment B (Top Right) */}
                                <div className={`absolute top-0.5 right-0 bottom-1/2 w-0.5 rounded-sm ${getSegmentState(char, 'B') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'B') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'B') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                                
                                {/* Segment C (Bottom Right) */}
                                <div className={`absolute top-1/2 right-0 bottom-0.5 w-0.5 rounded-sm ${getSegmentState(char, 'C') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'C') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'C') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                                
                                {/* Segment D (Bottom) */}
                                <div className={`absolute bottom-0 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'D') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'D') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'D') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                                
                                {/* Segment E (Bottom Left) */}
                                <div className={`absolute top-1/2 left-0 bottom-0.5 w-0.5 rounded-sm ${getSegmentState(char, 'E') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'E') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'E') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                                
                                {/* Segment F (Top Left) */}
                                <div className={`absolute top-0.5 left-0 bottom-1/2 w-0.5 rounded-sm ${getSegmentState(char, 'F') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'F') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'F') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                                
                                {/* Segment G (Middle) */}
                                <div className={`absolute top-1/2 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'G') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'G') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'G') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Eids */}
          <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-3 bg-transparent">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Eid Celebrations</div>
            {loading ? (
              <div className="text-center py-2">
                <div className="text-xs text-gray-400">Loading Eid dates...</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {/* Eid-ul-Fitr */}
                <div className="bg-transparent rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Eid-ul-Fitr</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {islamicData?.eidFitr?.dateString || 'Date not available'}
                  </div>
                  {/* LED Countdown Display for Eid-ul-Fitr */}
                  <div className="flex justify-center items-center space-x-1 mb-1">
                    {islamicData?.eidFitr?.daysRemaining ? 
                      islamicData.eidFitr.daysRemaining.toString().split('').map((char, index) => (
                        <div key={index} className="w-5 h-8 relative">
                          {/* 7-Segment LED Display */}
                          <div className="absolute inset-0">
                            {/* Segment A (Top) */}
                            <div className={`absolute top-0 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'A') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'A') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'A') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment B (Top Right) */}
                            <div className={`absolute top-0.5 right-0 bottom-1/2 w-0.5 rounded-sm ${getSegmentState(char, 'B') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'B') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'B') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment C (Bottom Right) */}
                            <div className={`absolute top-1/2 right-0 bottom-0.5 w-0.5 rounded-sm ${getSegmentState(char, 'C') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'C') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'C') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment D (Bottom) */}
                            <div className={`absolute bottom-0 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'D') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'D') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'D') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment E (Bottom Left) */}
                            <div className={`absolute top-1/2 left-0 bottom-0.5 w-0.5 rounded-sm ${getSegmentState(char, 'E') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'E') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'E') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment F (Top Left) */}
                            <div className={`absolute top-0.5 left-0 bottom-1/2 w-0.5 rounded-sm ${getSegmentState(char, 'F') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'F') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'F') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment G (Middle) */}
                            <div className={`absolute top-1/2 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'G') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'G') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'G') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                          </div>
                        </div>
                      )) : 
                      <div className="text-gray-500 dark:text-gray-400">—</div>
                    }
                  </div>
                  <div className="text-xs text-center text-gray-600 dark:text-gray-400 mb-2">
                    {islamicData?.eidFitr?.daysRemaining ? 
                      `${islamicData.eidFitr.daysRemaining} days remaining` : 
                      'Date not available'
                    }
                  </div>
                  {/* Spacer to match prayer section height */}
                  <div className="h-4 flex items-center justify-center">
                    <div className="text-xs text-gray-500 dark:text-gray-500">Celebration</div>
                  </div>
                </div>

                {/* Eid-al-Adha */}
                <div className="bg-transparent rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Eid-al-Adha</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {islamicData?.eidAdha?.dateString || 'Date not available'}
                  </div>
                  {/* LED Countdown Display for Eid-al-Adha */}
                  <div className="flex justify-center items-center space-x-1 mb-1">
                    {islamicData?.eidAdha?.daysRemaining ? 
                      islamicData.eidAdha.daysRemaining.toString().split('').map((char, index) => (
                        <div key={index} className="w-5 h-8 relative">
                          {/* 7-Segment LED Display */}
                          <div className="absolute inset-0">
                            {/* Segment A (Top) */}
                            <div className={`absolute top-0 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'A') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'A') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'A') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment B (Top Right) */}
                            <div className={`absolute top-0.5 right-0 bottom-1/2 w-0.5 rounded-sm ${getSegmentState(char, 'B') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'B') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'B') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment C (Bottom Right) */}
                            <div className={`absolute top-1/2 right-0 bottom-0.5 w-0.5 rounded-sm ${getSegmentState(char, 'C') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'C') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'C') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment D (Bottom) */}
                            <div className={`absolute bottom-0 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'D') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'D') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'D') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment E (Bottom Left) */}
                            <div className={`absolute top-1/2 left-0 bottom-0.5 w-0.5 rounded-sm ${getSegmentState(char, 'E') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'E') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'E') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment F (Top Left) */}
                            <div className={`absolute top-0.5 left-0 bottom-1/2 w-0.5 rounded-sm ${getSegmentState(char, 'F') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'F') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'F') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                            
                            {/* Segment G (Middle) */}
                            <div className={`absolute top-1/2 left-0.5 right-0.5 h-0.5 rounded-sm ${getSegmentState(char, 'G') ? 'bg-gray-500' : 'bg-gray-400 dark:bg-gray-600'} ${getSegmentState(char, 'G') ? '' : 'opacity-20'}`} style={getSegmentState(char, 'G') ? {boxShadow: 'inset 0 0 1px #6b7280'} : {}}></div>
                          </div>
                        </div>
                      )) : 
                      <div className="text-gray-500 dark:text-gray-400">—</div>
                    }
                  </div>
                  <div className="text-xs text-center text-gray-600 dark:text-gray-400 mb-2">
                    {islamicData?.eidAdha?.daysRemaining ? 
                      `${islamicData.eidAdha.daysRemaining} days remaining` : 
                      'Date not available'
                    }
                  </div>
                  {/* Spacer to match prayer section height */}
                  <div className="h-4 flex items-center justify-center">
                    <div className="text-xs text-gray-500 dark:text-gray-500">Celebration</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Islamic Calendar */}
        <div className="mt-6 rounded-xl border border-gray-300 dark:border-gray-600 p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Islamic Calendar</div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">Today</span>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2">
              <div className="text-sm text-gray-700 dark:text-gray-300 text-center font-medium flex-1 sm:flex-none sm:min-w-[10ch]">{hijri.monthLabel}</div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={goToPrevMonth}
                  className="inline-flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50/60 dark:hover:bg-gray-800/50 transition-colors touch-manipulation"
                  aria-label="Previous month"
                  title="Previous month"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
                </button>
                <button
                  onClick={goToNextMonth}
                  className="inline-flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50/60 dark:hover:bg-gray-800/50 transition-colors touch-manipulation"
                  aria-label="Next month"
                  title="Next month"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5L15.75 12l-7.5 7.5"/></svg>
                </button>
                <button
                  onClick={() => setCalendarRefDate(new Date())}
                  className="inline-flex items-center justify-center w-8 h-8 sm:w-7 sm:h-7 rounded-md border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors touch-manipulation"
                  aria-label="Go to today"
                  title="Go to today"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <div className="text-center py-1">Sun</div>
            <div className="text-center py-1">Mon</div>
            <div className="text-center py-1">Tue</div>
            <div className="text-center py-1">Wed</div>
            <div className="text-center py-1">Thu</div>
            <div className="text-center py-1">Fri</div>
            <div className="text-center py-1">Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {Array.from({ length: hijri.firstWeekday }).map((_, i) => (
              <div key={`pad-${i}`} className="h-12 sm:h-16 rounded-md sm:rounded-lg border border-transparent" />
            ))}
            {hijri.days.map(({ gDate, hDay }) => {
              const isToday = sameHijriMonth(gDate, now) && hDay === formatHijriParts(now).day;
              const gDay = gDate.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' });
              const dayEvents = monthEvents[hDay] || [];
              const hasEvents = dayEvents.length > 0;
              const hasMajorEvent = dayEvents.some(e => e.type === 'major');
              const isSelected = selectedDate && selectedDate.gDate.toDateString() === gDate.toDateString();
              
              const handleDateClick = () => {
                setSelectedDate({ gDate, hDay });
                if (hasEvents) {
                  setSelectedEvents(dayEvents);
                  setShowEventModal(true);
                }
              };
              
              return (
                <button
                  type="button"
                  onClick={handleDateClick}
                  key={gDate.toISOString()}
                  className={`h-12 sm:h-16 rounded-md sm:rounded-lg border p-1 sm:p-2 flex flex-col justify-between text-left transition-all duration-200 touch-manipulation ${
                    isSelected 
                      ? 'border-emerald-400 ring-2 ring-emerald-300/50 bg-emerald-50/50 dark:bg-emerald-900/20 shadow-md' 
                      : isToday 
                        ? 'border-emerald-500 ring-2 ring-emerald-400/60 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30' 
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 hover:border-gray-400 dark:hover:border-gray-500 active:scale-95'
                  } ${hasEvents ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-xs sm:text-sm font-medium ${
                      isToday 
                        ? 'text-emerald-700 dark:text-emerald-300 bg-white/80 dark:bg-emerald-800/40 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shadow-sm' 
                        : isSelected
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {hDay}
                    </div>
                    {hasEvents && (
                      <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${hasMajorEvent ? 'bg-red-500' : 'bg-amber-500'}`} title={dayEvents.map(e => e.name).join(', ')} />
                    )}
                  </div>
                  <div className={`text-[9px] sm:text-[10px] self-end ${
                    isToday 
                      ? 'text-emerald-600 dark:text-emerald-400 font-medium' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {gDay}
                  </div>
                </button>
              );
            })}
          </div>
          {/* Event summary */}
          <div className="mt-3 min-h-[2rem] sm:min-h-[2.5rem]">
            {selectedDate ? (
              monthEvents[selectedDate.hDay]?.length ? (
                <div className="text-[11px] sm:text-[12px] text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Events:</span> {monthEvents[selectedDate.hDay].map(e => e.name).join(', ')}
                  {monthEvents[selectedDate.hDay].length > 0 && (
                    <span className="block text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 mt-1">Tap for detailed information</span>
                  )}
                </div>
              ) : (
                <div className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400">No notable events on this date.</div>
              )
            ) : (
              <div className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400">Tap a date to see events and details.</div>
            )}
          </div>
        </div>
        </div>

      </motion.div>

    </>
  );
}


