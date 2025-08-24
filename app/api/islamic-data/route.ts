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
  
  // Log IP headers for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('IP Headers found:', {
      'x-forwarded-for': forwardedFor,
      'x-real-ip': realIP,
      'cf-connecting-ip': cfConnectingIP,
      'x-forwarded': forwarded,
      'x-client-ip': clientIP,
      'x-true-client-ip': trueClientIP,
      'via': via
    });
  }
  
  // Try to extract IP from x-forwarded-for (most common)
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    for (const ip of ips) {
      if (ip && ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1' && 
          !ip.startsWith('10.') && !ip.startsWith('172.') && !ip.startsWith('192.168.')) {
        console.log('Using x-forwarded-for IP:', ip);
        return ip;
      }
    }
  }
  
  // Try other headers
  if (realIP && realIP !== 'unknown' && realIP !== '::1' && realIP !== '127.0.0.1' &&
      !realIP.startsWith('10.') && !realIP.startsWith('172.') && !realIP.startsWith('192.168.')) {
    console.log('Using x-real-ip:', realIP);
    return realIP;
  }
  
  if (cfConnectingIP && cfConnectingIP !== 'unknown' && cfConnectingIP !== '::1' && cfConnectingIP !== '127.0.0.1' &&
      !cfConnectingIP.startsWith('10.') && !cfConnectingIP.startsWith('172.') && !cfConnectingIP.startsWith('192.168.')) {
    console.log('Using cf-connecting-ip:', cfConnectingIP);
    return cfConnectingIP;
  }
  
  if (clientIP && clientIP !== 'unknown' && clientIP !== '::1' && clientIP !== '127.0.0.1' &&
      !clientIP.startsWith('10.') && !clientIP.startsWith('172.') && !clientIP.startsWith('192.168.')) {
    console.log('Using x-client-ip:', clientIP);
    return clientIP;
  }
  
  if (trueClientIP && trueClientIP !== 'unknown' && trueClientIP !== '::1' && trueClientIP !== '127.0.0.1' &&
      !trueClientIP.startsWith('10.') && !trueClientIP.startsWith('172.') && !trueClientIP.startsWith('192.168.')) {
    console.log('Using x-true-client-ip:', trueClientIP);
    return trueClientIP;
  }
  
  // Fallback to connection remote address
  const connection = (request as any).connection;
  if (connection?.remoteAddress && connection.remoteAddress !== '::1' && connection.remoteAddress !== '127.0.0.1' &&
      !connection.remoteAddress.startsWith('10.') && !connection.remoteAddress.startsWith('172.') && !connection.remoteAddress.startsWith('192.168.')) {
    console.log('Using connection remote address:', connection.remoteAddress);
    return connection.remoteAddress;
  }
  
  // Last resort: try to get IP from socket connection
  try {
    const socket = (request as any).socket;
    if (socket?.remoteAddress && socket.remoteAddress !== '::1' && socket.remoteAddress !== '127.0.0.1' &&
        !socket.remoteAddress.startsWith('10.') && !socket.remoteAddress.startsWith('192.168.')) {
      console.log('Using socket remote address:', socket.remoteAddress);
      return socket.remoteAddress;
    }
  } catch (error) {
    console.log('Could not access socket remote address');
  }
  
  // If all else fails, return a placeholder that will trigger fallback
  console.log('No valid client IP found, will use fallback location');
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
    console.log('No valid client IP provided, will use fallback logic');
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
      console.log(`Trying geolocation service: ${service.url}`);
      const response = await fetch(service.url, {
        headers: {
          'User-Agent': 'QuranGPT/1.0'
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Service ${service.url} response:`, data);
        
        const location = service.parser(data);
        
        // Validate that we got valid coordinates
        if (location.lat && location.lng && 
            typeof location.lat === 'number' && typeof location.lng === 'number' &&
            location.lat !== 0 && location.lng !== 0) {
          console.log(`Successfully got location: ${location.city}, ${location.region}, ${location.country} (${location.lat}, ${location.lng}) - ${location.timezone}`);
          return location;
        } else {
          console.warn(`Invalid location data from ${service.url}:`, location);
        }
      } else {
        console.warn(`Service ${service.url} returned status: ${response.status}`);
        const errorText = await response.text();
        console.warn(`Error response:`, errorText);
      }
    } catch (error) {
      console.warn(`Failed to get location from ${service.url}:`, error);
      continue;
    }
  }
  
  // Fallback to Kolkata coordinates when geolocation fails
  console.log('All geolocation services failed, using Kolkata as fallback');
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
    console.log('Attempting IP-based geolocation...');
    const clientIP = getClientIP(request);
    console.log('Client IP detected:', clientIP);
    
    let locationData: {
      lat: number;
      lng: number;
      city: string;
      country: string;
      timezone: string;
      region: string;
    } | null = null;
    
    if (clientIP && clientIP !== 'unknown') {
      console.log('Using detected client IP for geolocation:', clientIP);
      locationData = await getLocationFromIP(clientIP);
    } else {
      console.log('IP detection failed, trying direct ipapi.co call...');
      try {
        // Try to get location directly from ipapi.co (it will auto-detect the caller's IP)
        const response = await fetch('https://ipapi.co/json/', {
          headers: {
            'User-Agent': 'QuranGPT/1.0'
          },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          const data = await response.json();
          locationData = {
            lat: data.latitude,
            lng: data.longitude,
            city: data.city,
            country: data.country_name,
            timezone: data.timezone,
            region: data.region
          };
          console.log('Successfully got location from direct ipapi.co call:', locationData);
        } else {
          console.log('Direct ipapi.co call failed, using Kolkata fallback...');
          locationData = {
            lat: 22.5726,
            lng: 88.3639,
            city: 'Kolkata',
            country: 'India',
            timezone: 'Asia/Kolkata',
            region: 'West Bengal'
          };
        }
      } catch (error) {
        console.log('Direct ipapi.co call error, using Kolkata fallback...');
        locationData = {
          lat: 22.5726,
          lng: 88.3639,
          city: 'Kolkata',
          country: 'India',
          timezone: 'Asia/Kolkata',
          region: 'West Bengal'
        };
      }
    }
    
    // Ensure we have valid location data
    if (!locationData) {
      console.log('No location data obtained, using Kolkata fallback...');
      locationData = {
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
    
    console.log(`Using detected location: ${locationData.city}, ${locationData.country} (${lat}, ${lng})`);
    console.log(`Using detected timezone: ${userTimezone} (${timezoneAbbr})`);

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
    
    console.log('Prayer API response status:', prayerResponse.status);
    
    if (!prayerResponse.ok) {
      console.error('Prayer API failed:', prayerResponse.statusText);
      throw new Error(`Prayer API failed: ${prayerResponse.status}`);
    }
    
    const prayerData = await prayerResponse.json();
    console.log('Prayer data received:', prayerData);

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
    
    // Get current time in IST timezone
    const currentTime = new Date();
    
    // Convert current time to IST for accurate comparison
    const userCurrentTime = new Date(currentTime.toLocaleString('en-US', { timeZone: userTimezone }));
    
    // Parse all prayer times for today in IST
    const prayerTimes: { [key: string]: Date } = {};
    for (const prayerName of prayerNames) {
      if (prayers[prayerName]) {
        const timeStr = prayers[prayerName].split(' ')[0]; // Remove timezone if present
        const [hours, minutes] = timeStr.split(':');
        
        // Create today's date and set the prayer time
        const prayerTime = new Date();
        prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        prayerTimes[prayerName] = prayerTime;
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
    
    // Debug: Log prayer times and current time
    console.log('Prayer times in IST timezone:', userTimezone);
    console.log('User current time:', userCurrentTime.toLocaleString('en-US', { timeZone: userTimezone }));
    console.log('Today\'s date:', new Date().toLocaleDateString('en-US', { timeZone: userTimezone }));
    console.log('Raw prayer data from API:', prayers);
    
    for (const prayerName of prayerNames) {
      if (prayerTimes[prayerName]) {
        console.log(`${prayerName}: ${prayerTimes[prayerName].toLocaleString('en-US', { timeZone: userTimezone })}`);
      }
    }

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
    
    // Validate prayer times
    console.log('Prayer times validation:');
    for (const timingName of allTimings) {
      if (prayers[timingName]) {
        console.log(`${timingName}: ${prayers[timingName]} -> ${prayerTimesInMinutes[timingName]} minutes`);
      }
    }
    
    console.log('Prayer times in minutes:', prayerTimesInMinutes);
    console.log('Current time in minutes:', currentTimeInMinutes);
    
    // Reliable prayer time period detection
    console.log('=== PRAYER TIME DETECTION ===');
    console.log('Current time in minutes:', currentTimeInMinutes);
    console.log('Prayer times in minutes:', prayerTimesInMinutes);
    
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
      
      console.log(`Checking ${period.name}: ${period.start} to ${period.end} (${period.endTimeName}) - In period: ${isInPeriod}`);
      
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
        
        console.log(`✅ ${period.name} is current prayer, ends at:`, currentPrayerEndTime.toLocaleString('en-US', { timeZone: userTimezone }));
        foundCurrentPrayer = true;
        break;
      }
    }
    
    if (!foundCurrentPrayer) {
      console.log('❌ No current prayer found - time is between prayers');
    }
    
    // Find next prayer
    console.log('Current prayer is null, finding next prayer...');
    if (!currentPrayer) {
      // Find the next prayer that hasn't started yet
      for (const prayerName of prayerNames) {
        console.log(`Checking ${prayerName}: ${prayerTimesInMinutes[prayerName]} > ${currentTimeInMinutes}?`);
        if (prayerTimesInMinutes[prayerName] && prayerTimesInMinutes[prayerName] > currentTimeInMinutes) {
          nextPrayer = prayerName;
          // Create next prayer time
          const nextTime = new Date();
          nextTime.setHours(Math.floor(prayerTimesInMinutes[prayerName] / 60), prayerTimesInMinutes[prayerName] % 60, 0, 0);
          nextPrayerTime = nextTime;
          console.log(`Next prayer is ${prayerName} at ${nextTime.toLocaleString('en-US', { timeZone: userTimezone })}`);
          break;
        }
      }
      
      // If no prayer found for today, get tomorrow's Fajr
      if (nextPrayer === 'Fajr' && prayerTimesInMinutes['Fajr'] && prayerTimesInMinutes['Fajr'] <= currentTimeInMinutes) {
        nextPrayerTime = new Date();
        nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
        nextPrayerTime.setHours(Math.floor(prayerTimesInMinutes['Fajr'] / 60), prayerTimesInMinutes['Fajr'] % 60, 0, 0);
      }
    } else {
      // If we have a current prayer, find the next one
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
          nextTime.setHours(Math.floor(prayerTimesInMinutes[nextPrayerName] / 60), prayerTimesInMinutes[nextPrayerName] % 60, 0, 0);
          nextPrayerTime = nextTime;
        }
      }
    }
    
    // Debug: Log final prayer detection results
    console.log('Prayer detection results:');
    console.log('Current prayer:', currentPrayer);
    console.log('Next prayer:', nextPrayer);
    console.log('Next prayer time:', nextPrayerTime.toLocaleString('en-US', { timeZone: userTimezone }));
    if (currentPrayerEndTime) {
      console.log('Current prayer end time:', currentPrayerEndTime.toLocaleString('en-US', { timeZone: userTimezone }));
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
    console.error('Error fetching Islamic data:', error);
    
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
