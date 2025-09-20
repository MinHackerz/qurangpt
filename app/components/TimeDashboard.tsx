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
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      timeZone,
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
    const today = new Date(refDate.getTime());
    const todayParts = formatHijriParts(today);
    let cursor = new Date(today.getTime());
    for (let i = 0; i < 35; i++) {
      const p = formatHijriParts(cursor);
      if (p.day === 1 && p.month === todayParts.month && p.year === todayParts.year) break;
      cursor.setDate(cursor.getDate() - 1);
    }
    const monthStart = new Date(cursor.getTime());

    // Collect days until next month (max 31 defensive)
    const days: { gDate: Date; hDay: number }[] = [];
    let d = new Date(monthStart.getTime());
    for (let i = 0; i < 31; i++) {
      const p = formatHijriParts(d);
      if (i > 0) {
        const prev = formatHijriParts(new Date(d.getTime() - 24 * 60 * 60 * 1000));
        if (p.month !== prev.month) break;
      }
      days.push({ gDate: new Date(d.getTime()), hDay: p.day });
      d.setDate(d.getDate() + 1);
    }

    // Weekday offset for first cell (0=Sun..6=Sat)
    const firstWeekday = parseInt(new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone }).formatToParts(monthStart).find(p => p.type === 'weekday') ? new Date(monthStart.toLocaleString('en-US', { timeZone })).getDay().toString() : monthStart.getDay().toString());

    // Hijri month/year label
    const monthLabel = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      timeZone,
      month: 'long',
      year: 'numeric'
    }).format(monthStart);

    const monthParts = formatHijriParts(monthStart);
    return { monthStart, monthLabel, days, firstWeekday: new Date(monthStart.toLocaleString('en-US', { timeZone })).getDay(), hijriYear: monthParts.year, hijriMonth: monthParts.month };
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

        {/* Grid */
        }
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Time */}
          <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Time</div>
            <div className="text-3xl font-mono text-gray-900 dark:text-gray-100">{loading ? '— — : — — : — —' : timeString}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{loading ? '—' : dateString}</div>
          </div>

          {/* Prayer */}
          <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Prayer</div>
            {loading ? (
              <div className="text-xs text-gray-400">Loading...</div>
            ) : islamicData?.currentPrayer ? (
              <div className="space-y-1">
                <div className="text-sm text-emerald-700 dark:text-emerald-300">{islamicData.currentPrayer.name} (active)</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">Until {islamicData.currentPrayer.endTimeString}</div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                <div className="text-xs text-gray-600 dark:text-gray-400">Next: {islamicData.nextPrayer.name}</div>
                <div className="text-xs font-mono text-gray-700 dark:text-gray-300">{islamicData.nextPrayer.timeString}</div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs text-gray-500 dark:text-gray-500">No active prayer</div>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                <div className="text-xs text-gray-600 dark:text-gray-400">Next: {islamicData?.nextPrayer?.name || '—'}</div>
                <div className="text-xs font-mono text-gray-700 dark:text-gray-300">{islamicData?.nextPrayer?.timeString || '—'}</div>
              </div>
            )}
          </div>

          {/* Eids */}
          <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Eid</div>
            {loading ? (
              <div className="text-xs text-gray-400">Loading...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Eid-ul-Fitr</div>
                  <div className="text-2xl font-mono text-gray-900 dark:text-gray-100">{islamicData?.eidFitr?.daysRemaining ?? '—'}</div>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400">{islamicData?.eidFitr?.dateString || '—'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-0.5">Eid-al-Adha</div>
                  <div className="text-2xl font-mono text-gray-900 dark:text-gray-100">{islamicData?.eidAdha?.daysRemaining ?? '—'}</div>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400">{islamicData?.eidAdha?.dateString || '—'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Islamic Calendar */}
        <div className="mt-6 rounded-xl border border-gray-300 dark:border-gray-600 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Islamic Calendar</div>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevMonth}
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50/60 dark:hover:bg-gray-800/50"
                aria-label="Previous month"
                title="Previous month"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
              </button>
              <div className="text-sm text-gray-700 dark:text-gray-300 min-w-[10ch] text-center">{hijri.monthLabel}</div>
              <button
                onClick={goToNextMonth}
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50/60 dark:hover:bg-gray-800/50"
                aria-label="Next month"
                title="Next month"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5L15.75 12l-7.5 7.5"/></svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
            <div className="text-center">Sun</div>
            <div className="text-center">Mon</div>
            <div className="text-center">Tue</div>
            <div className="text-center">Wed</div>
            <div className="text-center">Thu</div>
            <div className="text-center">Fri</div>
            <div className="text-center">Sat</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: hijri.firstWeekday }).map((_, i) => (
              <div key={`pad-${i}`} className="h-16 rounded-lg border border-transparent" />
            ))}
            {hijri.days.map(({ gDate, hDay }) => {
              const isToday = sameHijriMonth(gDate, now) && hDay === formatHijriParts(now).day;
              const gDay = gDate.toLocaleDateString('en-US', { day: 'numeric', timeZone });
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
                  className={`h-16 rounded-lg border p-2 flex flex-col justify-between text-left transition ${isSelected ? 'border-emerald-400 ring-1 ring-emerald-300/50' : isToday ? 'border-emerald-300' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'} ${hasEvents ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`text-sm ${isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-200'}`}>{hDay}</div>
                    {hasEvents && (
                      <span className={`w-2 h-2 rounded-full ${hasMajorEvent ? 'bg-red-500' : 'bg-amber-500'}`} title={dayEvents.map(e => e.name).join(', ')} />
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 self-end">{gDay}</div>
                </button>
              );
            })}
          </div>
          {/* Event summary */}
          <div className="mt-3 min-h-[2.5rem]">
            {selectedDate ? (
              monthEvents[selectedDate.hDay]?.length ? (
                <div className="text-[12px] text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Events:</span> {monthEvents[selectedDate.hDay].map(e => e.name).join(', ')}
                  {monthEvents[selectedDate.hDay].length > 0 && (
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-1">Click for detailed information</span>
                  )}
                </div>
              ) : (
                <div className="text-[12px] text-gray-500 dark:text-gray-400">No notable events on this date.</div>
              )
            ) : (
              <div className="text-[12px] text-gray-500 dark:text-gray-400">Click a date to see events and details.</div>
            )}
          </div>
        </div>

        {/* Event Details Modal - Minimal Design */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setShowEventModal(false)}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl rounded-lg border border-gray-300 dark:border-gray-600 shadow-lg max-w-md w-full max-h-[70vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-300 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {selectedDate && new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
                      timeZone: timeZone,
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }).format(selectedDate.gDate)}
                  </h3>
                  <button
                    onClick={() => setShowEventModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 overflow-y-auto max-h-[50vh]">
                {selectedEvents.length > 0 ? (
                  <div className="space-y-4">
                    {selectedEvents.map((event, index) => (
                      <div key={index}>
                        <div className="mb-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            event.type === 'major' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                            event.type === 'religious' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' :
                            event.type === 'historical' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                            'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                          }`}>
                            {event.type}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {event.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                          {event.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">
                          {event.significance}
                        </p>
                        {index < selectedEvents.length - 1 && (
                          <div className="mt-4 h-px bg-gray-200/70 dark:bg-gray-700/70" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No events recorded for this date.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}


