import { NextRequest, NextResponse } from 'next/server';

// Function to get user's real IP address from request headers
function getClientIP(request: NextRequest): string {
  // Check various headers that might contain the real client IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  const forwarded = request.headers.get('x-forwarded');
  const clientIP = request.headers.get('x-client-ip');
  const trueClientIP = request.headers.get('x-true-client-ip'); // Akamai
  const via = request.headers.get('via');

  // Try to extract IP from x-forwarded-for (most common)
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    for (const ip of ips) {
      if (ip && ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1' &&
        !ip.startsWith('10.') && !ip.startsWith('172.') && !ip.startsWith('192.168.')) {
        return ip;
      }
    }
  }

  // Try other headers
  if (realIP && realIP !== 'unknown' && realIP !== '::1' && realIP !== '127.0.0.1' &&
    !realIP.startsWith('10.') && !realIP.startsWith('172.') && !realIP.startsWith('192.168.')) {
    return realIP;
  }

  if (cfConnectingIP && cfConnectingIP !== 'unknown' && cfConnectingIP !== '::1' && cfConnectingIP !== '127.0.0.1' &&
    !cfConnectingIP.startsWith('10.') && !cfConnectingIP.startsWith('172.') && !cfConnectingIP.startsWith('192.168.')) {
    return cfConnectingIP;
  }

  if (clientIP && clientIP !== 'unknown' && clientIP !== '::1' && clientIP !== '127.0.0.1' &&
    !clientIP.startsWith('10.') && !clientIP.startsWith('172.') && !clientIP.startsWith('192.168.')) {
    return clientIP;
  }

  if (trueClientIP && trueClientIP !== 'unknown' && trueClientIP !== '::1' && trueClientIP !== '127.0.0.1' &&
    !trueClientIP.startsWith('10.') && !trueClientIP.startsWith('172.') && !trueClientIP.startsWith('192.168.')) {
    return trueClientIP;
  }

  // Fallback to connection remote address
  const connection = (request as any).connection;
  if (connection?.remoteAddress && connection.remoteAddress !== '::1' && connection.remoteAddress !== '127.0.0.1' &&
    !connection.remoteAddress.startsWith('10.') && !connection.remoteAddress.startsWith('172.') && !connection.remoteAddress.startsWith('192.168.')) {
    return connection.remoteAddress;
  }

  // Last resort: try to get IP from socket connection
  try {
    const socket = (request as any).socket;
    if (socket?.remoteAddress && socket.remoteAddress !== '::1' && socket.remoteAddress !== '127.0.0.1' &&
      !socket.remoteAddress.startsWith('10.') && !socket.remoteAddress.startsWith('192.168.')) {
      return socket.remoteAddress;
    }
  } catch (error) {
    // Could not access socket remote address - silent fail for security
  }

  // If all else fails, return a placeholder that will trigger fallback
  return 'unknown';
}

// Function to get location from IP using multiple geolocation services
async function getLocationFromIP(clientIP: string): Promise<{
  lat: number;
  lng: number;
  city: string;
  country: string;
  timezone: string;
  region: string;
} | null> {
  // If no valid IP found, return null to trigger fallback logic
  if (!clientIP || clientIP === 'unknown') {
    return null;
  }

  // Try multiple services for better reliability
  const services = [
    {
      url: `https://ipapi.co/${clientIP}/json/`,
      parser: (data: any) => ({
        lat: data.latitude,
        lng: data.longitude,
        city: data.city,
        country: data.country_name,
        timezone: data.timezone,
        region: data.region
      })
    },
    {
      url: `https://ipapi.co/json/`,
      parser: (data: any) => ({
        lat: data.latitude,
        lng: data.longitude,
        city: data.city,
        country: data.country_name,
        timezone: data.timezone,
        region: data.region
      })
    },
    {
      url: `http://ip-api.com/json/${clientIP}`,
      parser: (data: any) => ({
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        country: data.country,
        timezone: data.timezone,
        region: data.regionName
      })
    }
  ];

  for (const service of services) {
    try {
      const response = await fetch(service.url, {
        headers: {
          'User-Agent': 'QuranGPT/1.0'
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();

        const location = service.parser(data);

        // Validate that we got valid coordinates
        if (location.lat && location.lng &&
          typeof location.lat === 'number' && typeof location.lng === 'number' &&
          location.lat !== 0 && location.lng !== 0) {
          return location;
        } else {
          // Invalid location data from service - silent fail for security
        }
      } else {
        // Service returned error status - silent fail for security
      }
    } catch (error) {
      // Failed to get location from service - silent fail for security
      continue;
    }
  }

  // Return null when all geolocation services fail
  return null;
}

// Helper to fetch Gregorian date for a specific Hijri date
async function getGregorianDateForHijri(day: string, month: string, year: string): Promise<Date | null> {
  try {
    const response = await fetch(`https://api.aladhan.com/v1/hToG/${day}-${month}-${year}`, {
      headers: { 'User-Agent': 'QuranGPT/1.0' },
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.gregorian && data.data.gregorian.date) {
        const [d, m, y] = data.data.gregorian.date.split('-');
        return new Date(`${y}-${m}-${d}`);
      }
    }
    return null;
  } catch (e) {
    console.error(`Failed to convert Hijri date ${day}-${month}-${year}`, e);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientLat = searchParams.get('lat');
    const clientLng = searchParams.get('lng');
    const useLocation = searchParams.get('useLocation') === 'true';

    let locationData: {
      lat: number;
      lng: number;
      city: string;
      country: string;
      timezone: string;
      region: string;
    };

    // If client provided location coordinates, use them
    if (useLocation && clientLat && clientLng) {
      const lat = parseFloat(clientLat);
      const lng = parseFloat(clientLng);

      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        // Use client-provided coordinates and get city info from reverse geocoding
        try {
          const reverseGeocodeResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
            {
              headers: {
                'User-Agent': 'QuranGPT/1.0'
              },
              signal: AbortSignal.timeout(5000)
            }
          );

          if (reverseGeocodeResponse.ok) {
            const reverseData = await reverseGeocodeResponse.json();
            locationData = {
              lat,
              lng,
              city: reverseData.city || reverseData.locality || 'Unknown',
              country: reverseData.countryName || 'Unknown',
              timezone: reverseData.localityInfo?.administrative?.[0]?.timezone || 'UTC',
              region: reverseData.principalSubdivision || reverseData.administrativeArea || 'Unknown'
            };
          } else {
            throw new Error('Reverse geocoding failed');
          }
        } catch (error) {
          // Fallback to coordinates without city info
          locationData = {
            lat,
            lng,
            city: 'Unknown',
            country: 'Unknown',
            timezone: 'UTC',
            region: 'Unknown'
          };
        }
      } else {
        throw new Error('Invalid coordinates provided');
      }
    } else {
      // Fallback to IP-based location detection
      const clientIP = getClientIP(request);
      const detectedLocation = await getLocationFromIP(clientIP);

      // Use detected location or fallback to Kolkata
      locationData = detectedLocation || {
        lat: 22.5726,
        lng: 88.3639,
        city: 'Kolkata',
        country: 'India',
        timezone: 'Asia/Kolkata',
        region: 'West Bengal'
      };
    }


    const lat = locationData.lat.toString();
    const lng = locationData.lng.toString();
    const userTimezone = locationData.timezone;

    // Get timezone abbreviation
    const getTimezoneAbbr = (timezone: string) => {
      try {
        const date = new Date();

        // First try to get the standard abbreviation
        const timeZoneFormatter = new Intl.DateTimeFormat('en', {
          timeZone: timezone,
          timeZoneName: 'short'
        });
        const parts = timeZoneFormatter.formatToParts(date);
        const timeZoneName = parts.find(part => part.type === 'timeZoneName');
        let abbr = timeZoneName ? timeZoneName.value : '';

        // If we get a GMT offset, try to map it to proper abbreviations
        if (abbr.startsWith('GMT') || !abbr) {
          // Common timezone mappings
          const timezoneMap: { [key: string]: string } = {
            'Asia/Kolkata': 'IST',
            'Asia/Mumbai': 'IST',
            'Asia/Delhi': 'IST',
            'Europe/London': 'GMT',
            'Europe/Berlin': 'CET',
            'Europe/Paris': 'CET',
            'America/New_York': 'EST',
            'America/Chicago': 'CST',
            'America/Denver': 'MST',
            'America/Los_Angeles': 'PST',
            'Asia/Tokyo': 'JST',
            'Asia/Shanghai': 'CST',
            'Australia/Sydney': 'AEST',
            'Asia/Dubai': 'GST',
            'Asia/Riyadh': 'AST',
            'Asia/Karachi': 'PKT',
            'Asia/Dhaka': 'BST'
          };

          abbr = timezoneMap[timezone] || timezone.split('/')[1] || 'UTC';
        }

        return abbr;
      } catch (error) {
        return timezone.split('/')[1] || 'UTC';
      }
    };

    const timezoneAbbr = getTimezoneAbbr(userTimezone);

    // Use calendar API endpoint for today's prayers (more reliable)
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    const day = currentDate.getDate();

    const prayerResponse = await fetch(
      `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=2`,
      {
        headers: {
          'User-Agent': 'QuranGPT/1.0'
        }
      }
    );

    if (!prayerResponse.ok) {
      // Prayer API failed
      throw new Error(`Prayer API failed: ${prayerResponse.status}`);
    }

    const prayerData = await prayerResponse.json();

    // Get today's prayer data from the calendar
    const todayPrayerData = prayerData.data?.[day - 1]; // day - 1 because array is 0-indexed
    if (!todayPrayerData) {
      throw new Error('No prayer data found for today');
    }

    // Get Hijri date info from the response
    const hijriData = todayPrayerData.date.hijri;
    const currentHijriYear = parseInt(hijriData.year);

    // Calculate current and next prayer
    const prayers = todayPrayerData.timings || {};
    const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const allTimings = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    // Check if it's Friday (getDay() returns 5 for Friday)
    const isFriday = currentDate.getDay() === 5;

    // Helper function to get display name for prayers (Jummah on Friday)
    const getPrayerDisplayName = (prayerName: string) => {
      if (prayerName === 'Dhuhr' && isFriday) {
        return 'Jummah';
      }
      return prayerName;
    };

    // Get current time in user's timezone
    const currentTime = new Date();

    // Get current time in user's timezone for accurate comparison
    const userCurrentTime = new Date(currentTime.toLocaleString('en-US', { timeZone: userTimezone }));

    // Parse all prayer times for today - API returns times in local timezone
    const prayerTimes: { [key: string]: Date } = {};
    for (const prayerName of prayerNames) {
      if (prayers[prayerName]) {
        const timeStr = prayers[prayerName].split(' ')[0]; // Remove timezone if present
        const [hours, minutes] = timeStr.split(':');

        // Create prayer time for today in the user's timezone
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const day = today.getDate();

        // Create date in user's timezone directly
        const prayerTime = new Date(year, month, day, parseInt(hours), parseInt(minutes), 0, 0);
        prayerTimes[prayerName] = prayerTime;
      }
    }

    // Also get sunrise and sunset for prayer end times
    const sunrise = prayers.Sunrise ? (() => {
      const timeStr = prayers.Sunrise.split(' ')[0];
      const [hours, minutes] = timeStr.split(':');

      // Create today's date in user's timezone
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();

      const time = new Date(year, month, day, parseInt(hours), parseInt(minutes), 0, 0);
      return time;
    })() : null;

    const sunset = prayers.Sunset ? (() => {
      const timeStr = prayers.Sunset.split(' ')[0];
      const [hours, minutes] = timeStr.split(':');

      // Create today's date in user's timezone
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      const day = today.getDate();

      const time = new Date(year, month, day, parseInt(hours), parseInt(minutes), 0, 0);
      return time;
    })() : null;

    // Find current active prayer or next prayer
    let currentPrayer: string | null = null;
    let currentPrayerEndTime: Date | null = null;
    let nextPrayer = 'Fajr';
    let nextPrayerTime = new Date();

    // Get current time in minutes for comparison
    const currentHour = userCurrentTime.getHours();
    const currentMinute = userCurrentTime.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Convert prayer times to minutes for easier comparison
    const prayerTimesInMinutes: { [key: string]: number } = {};
    for (const timingName of allTimings) {
      if (prayers[timingName]) {
        const timeStr = prayers[timingName].split(' ')[0];
        const [hours, minutes] = timeStr.split(':');
        prayerTimesInMinutes[timingName] = parseInt(hours) * 60 + parseInt(minutes);
      }
    }

    // Define prayer periods with proper end times
    const prayerPeriods = [
      {
        name: 'Fajr',
        start: prayerTimesInMinutes['Fajr'],
        end: prayerTimesInMinutes['Sunrise'] || prayerTimesInMinutes['Dhuhr'], // Fajr ends at sunrise or Dhuhr
        endTimeName: 'Sunrise'
      },
      {
        name: 'Dhuhr',
        start: prayerTimesInMinutes['Dhuhr'],
        end: prayerTimesInMinutes['Asr'],
        endTimeName: 'Asr'
      },
      {
        name: 'Asr',
        start: prayerTimesInMinutes['Asr'],
        end: prayerTimesInMinutes['Maghrib'],
        endTimeName: 'Maghrib'
      },
      {
        name: 'Maghrib',
        start: prayerTimesInMinutes['Maghrib'],
        end: prayerTimesInMinutes['Isha'],
        endTimeName: 'Isha'
      },
      {
        name: 'Isha',
        start: prayerTimesInMinutes['Isha'],
        end: prayerTimesInMinutes['Fajr'] + 24 * 60, // Isha ends at next day's Fajr (add 24 hours)
        endTimeName: 'Fajr (next day)',
        isOvernight: true
      }
    ];

    // Check if current time falls within any prayer period
    let foundCurrentPrayer = false;

    for (const period of prayerPeriods) {
      if (!period.start || !period.end) continue;

      let isInPeriod = false;

      if (period.isOvernight) {
        // Handle overnight prayer (Isha) - check if current time is after Isha or before next Fajr
        isInPeriod = currentTimeInMinutes >= period.start || currentTimeInMinutes < (period.end - 24 * 60);
      } else {
        // Handle regular prayers
        isInPeriod = currentTimeInMinutes >= period.start && currentTimeInMinutes < period.end;
      }

      if (isInPeriod) {
        currentPrayer = period.name;
        foundCurrentPrayer = true;

        // Create end time for current prayer
        if (period.isOvernight) {
          // Isha ends at next day's Fajr
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth();
          const day = today.getDate() + 1;

          const nextFajrMinutes = period.end - 24 * 60; // Convert back to today's minutes
          const nextFajr = new Date(year, month, day, Math.floor(nextFajrMinutes / 60), nextFajrMinutes % 60, 0, 0);
          currentPrayerEndTime = nextFajr;
        } else {
          // Regular prayer ends at next prayer time
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth();
          const day = today.getDate();

          const endTime = new Date(year, month, day, Math.floor(period.end / 60), period.end % 60, 0, 0);
          currentPrayerEndTime = endTime;
        }

        break;
      }
    }

    if (!foundCurrentPrayer) {
      // Find the next prayer that hasn't started yet for today
      let foundNextPrayerToday = false;
      for (const prayerName of prayerNames) {
        if (prayerTimesInMinutes[prayerName] && prayerTimesInMinutes[prayerName] > currentTimeInMinutes) {
          nextPrayer = prayerName;
          // Create next prayer time
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth();
          const day = today.getDate();

          const nextTime = new Date(year, month, day, Math.floor(prayerTimesInMinutes[prayerName] / 60), prayerTimesInMinutes[prayerName] % 60, 0, 0);
          nextPrayerTime = nextTime;
          foundNextPrayerToday = true;
          break;
        }
      }

      // If no prayer found for today, get tomorrow's Fajr
      if (!foundNextPrayerToday) {
        nextPrayer = 'Fajr';
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const day = today.getDate() + 1;

        const nextTime = new Date(year, month, day, Math.floor(prayerTimesInMinutes['Fajr'] / 60), prayerTimesInMinutes['Fajr'] % 60, 0, 0);
        nextPrayerTime = nextTime;
      }
    } else {
      // If we have a current prayer, find the next one
      if (currentPrayer) {
        const currentPrayerIndex = prayerNames.indexOf(currentPrayer);
        const nextPrayerIndex = (currentPrayerIndex + 1) % prayerNames.length;
        const nextPrayerName = prayerNames[nextPrayerIndex];

        if (nextPrayerName === 'Fajr' && currentPrayer !== 'Isha') {
          // If next prayer is Fajr but current isn't Isha, it should be tomorrow's Fajr
          const today = new Date();
          const year = today.getFullYear();
          const month = today.getMonth();
          const day = today.getDate() + 1;

          const nextTime = new Date(year, month, day, Math.floor(prayerTimesInMinutes['Fajr'] / 60), prayerTimesInMinutes['Fajr'] % 60, 0, 0);
          nextPrayerTime = nextTime;
          nextPrayer = 'Fajr';
        } else {
          nextPrayer = nextPrayerName;
          // Create next prayer time
          if (prayerTimesInMinutes[nextPrayerName]) {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth();
            const day = today.getDate();

            const nextPrayerMinutes = prayerTimesInMinutes[nextPrayerName];
            if (nextPrayerMinutes) {
              const nextTime = new Date(year, month, day, Math.floor(nextPrayerMinutes / 60), nextPrayerMinutes % 60, 0, 0);
              nextPrayerTime = nextTime;
            }
          }
        }
      }
    }

    // Dynamic Eid Calculation
    // Eid ul Fitr is 1st Shawwal (Month 10, Day 1)
    let eidFitrDate = await getGregorianDateForHijri('01', '10', currentHijriYear.toString());

    // If Eid Fitr has passed this hijri year, look for next year
    if (eidFitrDate && eidFitrDate < currentDate) {
      eidFitrDate = await getGregorianDateForHijri('01', '10', (currentHijriYear + 1).toString());
    }

    // Eid al Adha is 10th Dhul Hijjah (Month 12, Day 10)
    let eidAdhaDate = await getGregorianDateForHijri('10', '12', currentHijriYear.toString());

    // If Eid Adha has passed this hijri year, look for next year
    if (eidAdhaDate && eidAdhaDate < currentDate) {
      eidAdhaDate = await getGregorianDateForHijri('10', '12', (currentHijriYear + 1).toString());
    }

    // Fallback if API fails (approximate 2026/2027 dates)
    if (!eidFitrDate) {
      console.warn('Failed to fetch Eid Fitr date, using fallback');
      eidFitrDate = new Date(year + 1, 2, 20); // Default to next year approx date if fetch fails
    }
    if (!eidAdhaDate) {
      console.warn('Failed to fetch Eid Adha date, using fallback');
      eidAdhaDate = new Date(year + 1, 4, 27); // Default to next year approx date if fetch fails
    }

    const daysToEidFitr = eidFitrDate ? Math.ceil((eidFitrDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const daysToEidAdha = eidAdhaDate ? Math.ceil((eidAdhaDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Get current hour in user's timezone properly using formatToParts for reliable parsing
    const getCurrentHourInTimezone = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(now);
      const hourPart = parts.find(part => part.type === 'hour');
      return hourPart ? parseInt(hourPart.value, 10) : null;
    };

    const currentHourInTimezone = getCurrentHourInTimezone();

    // Check if Isha and it's after midnight (12:00 AM) 
    // Hours 0-11 (midnight to before noon) indicate it's after midnight
    // Since Isha typically starts in evening (7-9 PM), hours 0-11 means after midnight
    const isIshaAfterMidnight = currentPrayer === 'Isha' && currentHourInTimezone !== null && currentHourInTimezone >= 0 && currentHourInTimezone < 12;

    const response = {
      currentPrayer: currentPrayer ? {
        name: getPrayerDisplayName(currentPrayer),
        endTime: currentPrayerEndTime?.toISOString(),
        endTimeString: currentPrayer === 'Isha'
          ? 'Until Midnight'
          : currentPrayerEndTime?.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }) + ` ${timezoneAbbr}`,
        // For Isha: show as active only if it's NOT after midnight (i.e., evening Isha before midnight)
        // For all other prayers: always show as active
        isActive: currentPrayer === 'Isha' ? !isIshaAfterMidnight : true
      } : null,
      nextPrayer: {
        name: getPrayerDisplayName(nextPrayer),
        time: nextPrayerTime.toISOString(),
        timeString: nextPrayerTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) + ` ${timezoneAbbr}`,
        isActive: false
      },
      allPrayers: prayers,
      prayerTimes: prayerTimes,
      location: {
        city: locationData.city,
        region: locationData.region,
        country: locationData.country,
        timezone: userTimezone,
        timezoneAbbr: timezoneAbbr
      },
      hijri: hijriData, // Pass full hijri data to frontend
      eidFitr: {
        date: eidFitrDate.toISOString(),
        daysRemaining: Math.max(0, daysToEidFitr),
        dateString: eidFitrDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      },
      eidAdha: {
        date: eidAdhaDate.toISOString(),
        daysRemaining: Math.max(0, daysToEidAdha),
        dateString: eidAdhaDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    // Error fetching Islamic data - silent fail for security

    // Return fallback data instead of error
    const currentDate = new Date();
    const fallbackPrayerTime = new Date();
    fallbackPrayerTime.setHours(18, 30, 0, 0); // 6:30 PM default

    const fallbackEidFitr = new Date(2026, 2, 20);
    const fallbackEidAdha = new Date(2026, 4, 27);

    const daysToEidFitr = Math.ceil((fallbackEidFitr.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysToEidAdha = Math.ceil((fallbackEidAdha.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    // Check if it's Friday for fallback data
    const isFridayFallback = new Date().getDay() === 5;

    return NextResponse.json({
      currentPrayer: null,
      nextPrayer: {
        name: isFridayFallback ? 'Jummah' : 'Maghrib',
        time: fallbackPrayerTime.toISOString(),
        timeString: '6:30 PM IST',
        isActive: false
      },
      allPrayers: {
        Fajr: '5:30',
        Dhuhr: '12:30',
        Asr: '3:30',
        Maghrib: '6:30',
        Isha: '8:00'
      },
      prayerTimes: {},
      location: {
        city: 'Kolkata',
        region: 'West Bengal',
        country: 'India',
        timezone: 'Asia/Kolkata',
        timezoneAbbr: 'IST'
      },
      hijri: null,
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
  }
}
