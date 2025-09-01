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
  
  // Fallback to Kolkata coordinates when geolocation fails
  return {
    lat: 22.5726,
    lng: 88.3639,
    city: 'Kolkata',
    country: 'India',
    timezone: 'Asia/Kolkata',
    region: 'West Bengal'
  };
}

export async function GET(request: NextRequest) {
  try {
    // Get user's location from IP address
    const clientIP = getClientIP(request);
    
    // Force Kolkata location for consistent prayer times
    const locationData = {
      lat: 22.5726,
      lng: 88.3639,
      city: 'Kolkata',
      country: 'India',
      timezone: 'Asia/Kolkata',
      region: 'West Bengal'
    };
    
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
    
    // Use a simpler API endpoint for today's prayers
    const currentDate = new Date();
    const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const prayerResponse = await fetch(
      `https://api.aladhan.com/v1/timings/${dateString}?latitude=${lat}&longitude=${lng}&method=2`,
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
    
    // Calculate current and next prayer
    const prayers = prayerData.data?.timings || {};
    const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const allTimings = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    // Check if it's Friday (getDay() returns 5 for Friday)
    const isFriday = new Date().getDay() === 5;
    
    // Helper function to get display name for prayers (Jummah on Friday)
    const getPrayerDisplayName = (prayerName: string) => {
      if (prayerName === 'Dhuhr' && isFriday) {
        return 'Jummah';
      }
      return prayerName;
    };
    
    // Get current time in user's timezone
    const currentTime = new Date();
    
    // Convert current time to user's timezone for accurate comparison
    const userCurrentTime = new Date(currentTime.toLocaleString('en-US', { timeZone: userTimezone }));
    
    // Parse all prayer times for today in user's timezone
    const prayerTimes: { [key: string]: Date } = {};
    for (const prayerName of prayerNames) {
      if (prayers[prayerName]) {
        const timeStr = prayers[prayerName].split(' ')[0]; // Remove timezone if present
        const [hours, minutes] = timeStr.split(':');
        
        // Create today's date in user's timezone and set the prayer time
        const prayerTime = new Date();
        // Set to user's timezone first
        const userDate = new Date(prayerTime.toLocaleString('en-US', { timeZone: userTimezone }));
        userDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        prayerTimes[prayerName] = userDate;
      }
    }

    // Also get sunrise and sunset for prayer end times
    const sunrise = prayerData.data?.timings?.Sunrise ? (() => {
      const timeStr = prayerData.data.timings.Sunrise.split(' ')[0];
      const [hours, minutes] = timeStr.split(':');
      
      // Create today's date and set the time
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      return time;
    })() : null;

    const sunset = prayerData.data?.timings?.Sunset ? (() => {
      const timeStr = prayerData.data.timings.Sunset.split(' ')[0];
      const [hours, minutes] = timeStr.split(':');
      
      // Create today's date and set the time
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      return time;
    })() : null;

    // Find current active prayer or next prayer
    let currentPrayer: string | null = null;
    let currentPrayerEndTime: Date | null = null;
    let nextPrayer = 'Fajr';
    let nextPrayerTime = new Date();
    
    // Simplified prayer detection logic - use IST time
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
        end: prayerTimesInMinutes['Fajr'], // Isha ends at next day's Fajr
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
        // Handle overnight prayer (Isha)
        isInPeriod = currentTimeInMinutes >= period.start || currentTimeInMinutes < period.end;
      } else {
        // Handle regular prayers
        isInPeriod = currentTimeInMinutes >= period.start && currentTimeInMinutes < period.end;
      }
      
      if (isInPeriod) {
        currentPrayer = period.name;
        
        // Create end time for current prayer
        if (period.isOvernight) {
          // Isha ends at next day's Fajr
          const nextFajr = new Date();
          nextFajr.setDate(nextFajr.getDate() + 1);
          nextFajr.setHours(Math.floor(period.end / 60), period.end % 60, 0, 0);
          currentPrayerEndTime = nextFajr;
        } else {
          // Regular prayer ends at next prayer time
          const endTime = new Date();
          endTime.setHours(Math.floor(period.end / 60), period.end % 60, 0, 0);
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
          const nextTime = new Date();
          nextTime.setHours(Math.floor(prayerTimesInMinutes[prayerName] / 60), prayerTimesInMinutes[prayerName] % 60, 0, 0);
          nextPrayerTime = nextTime;
          foundNextPrayerToday = true;
          break;
        }
      }
      
      // If no prayer found for today, check if Isha is still coming up
      if (!foundNextPrayerToday) {
        // Check if we're before Isha time (Isha is usually the last prayer of the day)
        if (prayerTimesInMinutes['Isha'] && currentTimeInMinutes < prayerTimesInMinutes['Isha']) {
          nextPrayer = 'Isha';
          const nextTime = new Date();
          nextTime.setHours(Math.floor(prayerTimesInMinutes['Isha'] / 60), prayerTimesInMinutes['Isha'] % 60, 0, 0);
          nextPrayerTime = nextTime;
        } else {
          // All prayers for today have passed, get tomorrow's Fajr
          nextPrayer = 'Fajr';
          nextPrayerTime = new Date();
          nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
          nextPrayerTime.setHours(Math.floor(prayerTimesInMinutes['Fajr'] / 60), prayerTimesInMinutes['Fajr'] % 60, 0, 0);
        }
      }
    } else {
      // If we have a current prayer, find the next one
      if (currentPrayer) {
        const currentPrayerIndex = prayerNames.indexOf(currentPrayer);
        const nextPrayerIndex = (currentPrayerIndex + 1) % prayerNames.length;
        const nextPrayerName = prayerNames[nextPrayerIndex];
      
      if (nextPrayerName === 'Fajr' && currentPrayer !== 'Isha') {
        // If next prayer is Fajr but current isn't Isha, it should be tomorrow's Fajr
        nextPrayerTime = new Date();
        nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
        nextPrayerTime.setHours(Math.floor(prayerTimesInMinutes['Fajr'] / 60), prayerTimesInMinutes['Fajr'] % 60, 0, 0);
        nextPrayer = 'Fajr';
      } else {
        nextPrayer = nextPrayerName;
        // Create next prayer time
        if (prayerTimesInMinutes[nextPrayerName]) {
          const nextTime = new Date();
          const nextPrayerMinutes = prayerTimesInMinutes[nextPrayerName];
          if (nextPrayerMinutes) {
            nextTime.setHours(Math.floor(nextPrayerMinutes / 60), nextPrayerMinutes % 60, 0, 0);
            nextPrayerTime = nextTime;
          }
        }
      }
    }
    }
    
    // Calculate Eid dates for 2025 (updated dates)
    const currentYear = currentDate.getFullYear();
    
    // Eid-ul-Fitr 2025: March 31 (approximate)
    let eidFitr = new Date(2025, 2, 31); // March 31, 2025
    if (currentYear > 2025 || (currentYear === 2025 && currentDate > eidFitr)) {
      eidFitr = new Date(currentYear + 1, 2, 31);
    }
    
    // Eid-al-Adha 2025: June 7 (approximate)
    let eidAdha = new Date(2025, 5, 7); // June 7, 2025
    if (currentYear > 2025 || (currentYear === 2025 && currentDate > eidAdha)) {
      eidAdha = new Date(currentYear + 1, 5, 7);
    }

    const daysToEidFitr = Math.ceil((eidFitr.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysToEidAdha = Math.ceil((eidAdha.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    const response = {
      currentPrayer: currentPrayer ? {
        name: getPrayerDisplayName(currentPrayer),
        endTime: currentPrayerEndTime?.toISOString(),
        endTimeString: currentPrayerEndTime?.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true,
          timeZone: userTimezone
        }) + ` ${timezoneAbbr}`,
        isActive: true
      } : null,
      nextPrayer: {
        name: getPrayerDisplayName(nextPrayer),
        time: nextPrayerTime.toISOString(),
        timeString: nextPrayerTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true,
          timeZone: userTimezone
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
      eidFitr: {
        date: eidFitr.toISOString(),
        daysRemaining: Math.max(0, daysToEidFitr),
        dateString: eidFitr.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: userTimezone
        })
      },
      eidAdha: {
        date: eidAdha.toISOString(),
        daysRemaining: Math.max(0, daysToEidAdha),
        dateString: eidAdha.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: userTimezone
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
    
    const fallbackEidFitr = new Date(2025, 2, 31);
    const fallbackEidAdha = new Date(2025, 5, 7);
    
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
