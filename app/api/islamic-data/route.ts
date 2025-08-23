import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

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
        !socket.remoteAddress.startsWith('10.') && !socket.remoteAddress.startsWith('172.') && !socket.remoteAddress.startsWith('192.168.')) {
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

// Alternative function to get location without IP (for cases where IP detection fails)
async function getLocationFromRequest(request: NextRequest): Promise<{
  lat: number;
  lng: number;
  city: string;
  country: string;
  timezone: string;
  region: string;
}> {
  // Try to get location from Accept-Language header as a fallback
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    console.log('Attempting location detection from Accept-Language:', acceptLanguage);
    
    // Simple mapping based on language preferences
    if (acceptLanguage.includes('hi') || acceptLanguage.includes('bn') || acceptLanguage.includes('ur')) {
      // Hindi, Bengali, Urdu - likely Indian subcontinent
      return {
        lat: 22.5726,
        lng: 88.3639,
        city: 'Kolkata',
        country: 'India',
        timezone: 'Asia/Kolkata',
        region: 'West Bengal'
      };
    } else if (acceptLanguage.includes('ar')) {
      // Arabic - likely Middle East
      return {
        lat: 21.4225,
        lng: 39.8262,
        city: 'Mecca',
        country: 'Saudi Arabia',
        timezone: 'Asia/Riyadh',
        region: 'Makkah'
      };
    } else if (acceptLanguage.includes('tr')) {
      // Turkish
      return {
        lat: 39.9334,
        lng: 32.8597,
        city: 'Ankara',
        country: 'Turkey',
        timezone: 'Europe/Istanbul',
        region: 'Ankara'
      };
    }
  }
  
  // Check other headers that might indicate location
  const userAgent = request.headers.get('user-agent') || '';
  const host = request.headers.get('host') || '';
  
  // If the request is coming from an Indian domain or has Indian indicators, use Kolkata
  if (host.includes('.in') || userAgent.includes('India') || userAgent.includes('IN')) {
    console.log('Detected Indian indicators, using Kolkata location');
    return {
      lat: 22.5726,
      lng: 88.3639,
      city: 'Kolkata',
      country: 'India',
      timezone: 'Asia/Kolkata',
      region: 'West Bengal'
    };
  }
  
  // Default fallback - Use UTC for unknown locations
  console.log('Using UTC as default fallback location');
  return {
    lat: 0,
    lng: 0,
    city: 'Unknown',
    country: 'Unknown',
    timezone: 'UTC',
    region: 'Unknown'
  };
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
  
  // Fallback to UTC coordinates when geolocation fails
  console.log('All geolocation services failed, using UTC as fallback');
  return {
    lat: 0,
    lng: 0,
    city: 'Unknown',
    country: 'Unknown',
    timezone: 'UTC',
    region: 'Unknown'
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let lat = searchParams.get('lat');
    let lng = searchParams.get('lng');
    let locationData: {
      lat: number;
      lng: number;
      city: string;
      country: string;
      timezone: string;
      region: string;
    } | null = null;
    
    // If no coordinates provided, try to get from IP geolocation
    if (!lat || !lng) {
      console.log('No coordinates provided, attempting IP-based geolocation...');
      const clientIP = getClientIP(request);
      console.log('Client IP detected:', clientIP);
      
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
          console.log('Direct ipapi.co call failed, using request-based fallback...');
          locationData = await getLocationFromRequest(request);
        }
      } catch (error) {
        console.log('Direct ipapi.co call error, using request-based fallback...');
        locationData = await getLocationFromRequest(request);
      }
    }
    
    // Ensure we have valid location data
    if (!locationData) {
      console.log('No location data obtained, using request-based fallback...');
      locationData = await getLocationFromRequest(request);
    }
    
    lat = locationData.lat.toString();
    lng = locationData.lng.toString();
    console.log(`Using location: ${locationData.city}, ${locationData.country} (${lat}, ${lng})`);
    } else {
      console.log('Using provided coordinates:', lat, lng);
      // For provided coordinates, try to get timezone info
      try {
        // Use a simple timezone lookup - for demo purposes, we'll use a basic mapping
        // In production, you'd want to use a proper timezone API
        const getTimezoneFromCoords = (lat: number, lng: number) => {
          // Simple heuristic mapping - this is basic but covers major regions
          if (lat >= 40 && lat <= 60 && lng >= -10 && lng <= 30) {
            // Europe
            if (lng >= -1 && lng <= 15) return 'Europe/Berlin'; // Central Europe
            if (lng >= -10 && lng <= 1) return 'Europe/London'; // UK
          }
          if (lat >= 20 && lat <= 40 && lng >= 65 && lng <= 95) {
            return 'Asia/Kolkata'; // India/South Asia
          }
          if (lat >= 35 && lat <= 45 && lng >= 125 && lng <= 145) {
            return 'Asia/Tokyo'; // Japan
          }
          if (lat >= 25 && lat <= 50 && lng >= -125 && lng <= -65) {
            // North America
            if (lng >= -85) return 'America/New_York'; // Eastern
            if (lng >= -105) return 'America/Chicago'; // Central
            if (lng >= -120) return 'America/Denver'; // Mountain
            return 'America/Los_Angeles'; // Pacific
          }
          return 'UTC'; // Default fallback
        };

        const timezone = getTimezoneFromCoords(parseFloat(lat), parseFloat(lng));
        locationData = {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          city: 'Unknown',
          country: 'Unknown',
          timezone: timezone,
          region: 'Unknown'
        };
      } catch (error) {
        console.warn('Failed to get timezone for coordinates:', error);
        locationData = {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          city: 'Unknown',
          country: 'Unknown',
          timezone: 'UTC',
          region: 'Unknown'
        };
      }
    }

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
    
    // Get current time in user's timezone
    const userTimezone = locationData.timezone || 'UTC';
    const currentTime = new Date();
    
    // Convert current time to user's timezone for accurate comparison
    const userCurrentTime = new Date(currentTime.toLocaleString('en-US', { timeZone: userTimezone }));
    
    // Parse all prayer times for today in user's timezone
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

    // Define prayer end times based on Islamic rules
    const getPrayerEndTime = (prayerName: string): Date | null => {
      switch (prayerName) {
        case 'Fajr':
          return sunrise; // Fajr ends at sunrise
        case 'Dhuhr':
          return prayerTimes['Asr']; // Dhuhr ends when Asr begins
        case 'Asr':
          return sunset || prayerTimes['Maghrib']; // Asr ends at sunset/Maghrib
        case 'Maghrib':
          return prayerTimes['Isha']; // Maghrib ends when Isha begins
        case 'Isha':
          // Isha ends at next day's Fajr
          const nextFajr = new Date(prayerTimes['Fajr']);
          nextFajr.setDate(nextFajr.getDate() + 1);
          return nextFajr;
        default:
          return null;
      }
    };

    // Find current active prayer or next prayer
    let currentPrayer: string | null = null;
    let currentPrayerEndTime: Date | null = null;
    let nextPrayer = 'Fajr';
    let nextPrayerTime = new Date();
    
    // Debug: Log prayer times and current time
    console.log('Prayer times in user timezone:', userTimezone);
    console.log('User current time:', userCurrentTime.toLocaleString('en-US', { timeZone: userTimezone }));
    console.log('Today\'s date:', new Date().toLocaleDateString('en-US', { timeZone: userTimezone }));
    for (const prayerName of prayerNames) {
      if (prayerTimes[prayerName]) {
        console.log(`${prayerName}: ${prayerTimes[prayerName].toLocaleString('en-US', { timeZone: userTimezone })}`);
      }
    }

    // Simplified prayer detection logic
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
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
    
    console.log('Prayer times in minutes:', prayerTimesInMinutes);
    console.log('Current time in minutes:', currentTimeInMinutes);
    
    // Find current prayer based on time ranges
    if (prayerTimesInMinutes['Fajr'] && prayerTimesInMinutes['Sunrise']) {
      if (currentTimeInMinutes >= prayerTimesInMinutes['Fajr'] && currentTimeInMinutes < prayerTimesInMinutes['Sunrise']) {
        currentPrayer = 'Fajr';
        // Create end time for Fajr (ends at sunrise)
        const fajrEndTime = new Date();
        fajrEndTime.setHours(Math.floor(prayerTimesInMinutes['Sunrise'] / 60), prayerTimesInMinutes['Sunrise'] % 60, 0, 0);
        currentPrayerEndTime = fajrEndTime;
      }
    }
    
    if (prayerTimesInMinutes['Sunrise'] && prayerTimesInMinutes['Dhuhr']) {
      if (currentTimeInMinutes >= prayerTimesInMinutes['Sunrise'] && currentTimeInMinutes < prayerTimesInMinutes['Dhuhr']) {
        currentPrayer = 'Sunrise';
        // Create end time for Sunrise (ends when Dhuhr begins)
        const sunriseEndTime = new Date();
        sunriseEndTime.setHours(Math.floor(prayerTimesInMinutes['Dhuhr'] / 60), prayerTimesInMinutes['Dhuhr'] % 60, 0, 0);
        currentPrayerEndTime = sunriseEndTime;
      }
    }
    
    if (prayerTimesInMinutes['Dhuhr'] && prayerTimesInMinutes['Asr']) {
      if (currentTimeInMinutes >= prayerTimesInMinutes['Dhuhr'] && currentTimeInMinutes < prayerTimesInMinutes['Asr']) {
        currentPrayer = 'Dhuhr';
        // Create end time for Dhuhr (ends when Asr begins)
        const dhuhrEndTime = new Date();
        dhuhrEndTime.setHours(Math.floor(prayerTimesInMinutes['Asr'] / 60), prayerTimesInMinutes['Asr'] % 60, 0, 0);
        currentPrayerEndTime = dhuhrEndTime;
      }
    }
    
    if (prayerTimesInMinutes['Asr'] && prayerTimesInMinutes['Maghrib']) {
      if (currentTimeInMinutes >= prayerTimesInMinutes['Asr'] && currentTimeInMinutes < prayerTimesInMinutes['Maghrib']) {
        currentPrayer = 'Asr';
        // Create end time for Asr (ends when Maghrib begins)
        const asrEndTime = new Date();
        asrEndTime.setHours(Math.floor(prayerTimesInMinutes['Maghrib'] / 60), prayerTimesInMinutes['Maghrib'] % 60, 0, 0);
        currentPrayerEndTime = asrEndTime;
      }
    }
    
    if (prayerTimesInMinutes['Maghrib'] && prayerTimesInMinutes['Isha']) {
      if (currentTimeInMinutes >= prayerTimesInMinutes['Maghrib'] && currentTimeInMinutes < prayerTimesInMinutes['Isha']) {
        currentPrayer = 'Maghrib';
        // Create end time for Maghrib (ends when Isha begins)
        const maghribEndTime = new Date();
        maghribEndTime.setHours(Math.floor(prayerTimesInMinutes['Isha'] / 60), prayerTimesInMinutes['Isha'] % 60, 0, 0);
        currentPrayerEndTime = maghribEndTime;
      }
    }
    
    // Handle Isha (overnight prayer)
    if (prayerTimesInMinutes['Isha']) {
      if (currentTimeInMinutes >= prayerTimesInMinutes['Isha'] || currentTimeInMinutes < prayerTimesInMinutes['Fajr']) {
        currentPrayer = 'Isha';
        // Isha ends at next day's Fajr
        const nextFajr = new Date();
        nextFajr.setDate(nextFajr.getDate() + 1);
        nextFajr.setHours(Math.floor(prayerTimesInMinutes['Fajr'] / 60), prayerTimesInMinutes['Fajr'] % 60, 0, 0);
        currentPrayerEndTime = nextFajr;
      }
    }
    
    // Find next prayer
    if (!currentPrayer) {
      // Find the next prayer that hasn't started yet
      for (const prayerName of prayerNames) {
        if (prayerTimesInMinutes[prayerName] && prayerTimesInMinutes[prayerName] > currentTimeInMinutes) {
          nextPrayer = prayerName;
          // Create next prayer time
          const nextTime = new Date();
          nextTime.setHours(Math.floor(prayerTimesInMinutes[prayerName] / 60), prayerTimesInMinutes[prayerName] % 60, 0, 0);
          nextPrayerTime = nextTime;
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
            'Europe/London': isDST(date, timezone) ? 'BST' : 'GMT',
            'Europe/Berlin': isDST(date, timezone) ? 'CEST' : 'CET',
            'Europe/Paris': isDST(date, timezone) ? 'CEST' : 'CET',
            'Europe/Rome': isDST(date, timezone) ? 'CEST' : 'CET',
            'Europe/Madrid': isDST(date, timezone) ? 'CEST' : 'CET',
            'America/New_York': isDST(date, timezone) ? 'EDT' : 'EST',
            'America/Chicago': isDST(date, timezone) ? 'CDT' : 'CST',
            'America/Denver': isDST(date, timezone) ? 'MDT' : 'MST',
            'America/Los_Angeles': isDST(date, timezone) ? 'PDT' : 'PST',
            'Asia/Tokyo': 'JST',
            'Asia/Shanghai': 'CST',
            'Australia/Sydney': isDST(date, timezone) ? 'AEDT' : 'AEST',
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

    // Helper function to check if DST is active
    const isDST = (date: Date, timezone: string) => {
      try {
        const jan = new Date(date.getFullYear(), 0, 1);
        const jul = new Date(date.getFullYear(), 6, 1);
        
        const janOffset = new Intl.DateTimeFormat('en', {
          timeZone: timezone,
          timeZoneName: 'longOffset'
        }).formatToParts(jan).find(part => part.type === 'timeZoneName')?.value || '';
        
        const julOffset = new Intl.DateTimeFormat('en', {
          timeZone: timezone,
          timeZoneName: 'longOffset'
        }).formatToParts(jul).find(part => part.type === 'timeZoneName')?.value || '';
        
        const currentOffset = new Intl.DateTimeFormat('en', {
          timeZone: timezone,
          timeZoneName: 'longOffset'
        }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value || '';
        
        // DST is active if current offset is different from standard (winter) offset
        return currentOffset !== janOffset && currentOffset === julOffset;
      } catch {
        return false;
      }
    };

    const timezoneAbbr = getTimezoneAbbr(userTimezone);

    const response = {
      currentPrayer: currentPrayer ? {
        name: currentPrayer,
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
        name: nextPrayer,
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

    return NextResponse.json({
      currentPrayer: null,
      nextPrayer: {
        name: 'Maghrib',
        time: fallbackPrayerTime.toISOString(),
        timeString: '6:30 PM UTC',
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
  }
}
