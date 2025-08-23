import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Function to get location from IP using multiple geolocation services
async function getLocationFromIP() {
  // Try multiple services for better reliability
  const services = [
    {
      url: 'https://ipapi.co/json/',
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
      url: 'http://ip-api.com/json/',
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
        const location = service.parser(data);
        
        // Validate that we got valid coordinates
        if (location.lat && location.lng && 
            typeof location.lat === 'number' && typeof location.lng === 'number') {
          console.log(`Successfully got location: ${location.city}, ${location.region}, ${location.country} (${location.lat}, ${location.lng}) - ${location.timezone}`);
          return location;
        }
      }
    } catch (error) {
      console.warn(`Failed to get location from ${service.url}:`, error);
      continue;
    }
  }
  
  // Fallback to Mecca coordinates
  console.log('All geolocation services failed, using Mecca as fallback');
  return {
    lat: 21.4225,
    lng: 39.8262,
    city: 'Mecca',
    country: 'Saudi Arabia',
    timezone: 'Asia/Riyadh',
    region: 'Makkah'
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let lat = searchParams.get('lat');
    let lng = searchParams.get('lng');
    let locationData = null;
    
    // If no coordinates provided, try to get from IP geolocation
    if (!lat || !lng) {
      console.log('No coordinates provided, attempting IP-based geolocation...');
      locationData = await getLocationFromIP();
      lat = locationData.lat.toString();
      lng = locationData.lng.toString();
      console.log(`Using IP-based location: ${locationData.city}, ${locationData.country} (${lat}, ${lng})`);
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
    
    // Get current time in user's timezone
    const userTimezone = locationData.timezone || 'UTC';
    const currentTime = new Date();
    
    // Parse all prayer times for today
    const prayerTimes: { [key: string]: Date } = {};
    for (const prayerName of prayerNames) {
      if (prayers[prayerName]) {
        const prayerTime = new Date();
        const timeStr = prayers[prayerName].split(' ')[0]; // Remove timezone if present
        const [hours, minutes] = timeStr.split(':');
        prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        prayerTimes[prayerName] = prayerTime;
      }
    }

    // Also get sunrise and sunset for prayer end times
    const sunrise = prayerData.data?.timings?.Sunrise ? (() => {
      const time = new Date();
      const timeStr = prayerData.data.timings.Sunrise.split(' ')[0];
      const [hours, minutes] = timeStr.split(':');
      time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return time;
    })() : null;

    const sunset = prayerData.data?.timings?.Sunset ? (() => {
      const time = new Date();
      const timeStr = prayerData.data.timings.Sunset.split(' ')[0];
      const [hours, minutes] = timeStr.split(':');
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

    // Check if we're currently in a prayer window
    for (const prayerName of prayerNames) {
      const prayerStart = prayerTimes[prayerName];
      const prayerEnd = getPrayerEndTime(prayerName);
      
      if (prayerStart && prayerEnd) {
        // Handle overnight prayers (Isha)
        if (prayerName === 'Isha') {
          if (currentTime >= prayerStart || currentTime < prayerEnd) {
            currentPrayer = prayerName;
            currentPrayerEndTime = prayerEnd;
            break;
          }
        } else {
          if (currentTime >= prayerStart && currentTime < prayerEnd) {
            currentPrayer = prayerName;
            currentPrayerEndTime = prayerEnd;
            break;
          }
        }
      }
    }

    // Find the next upcoming prayer (regardless of whether we have a current prayer)
    for (const prayerName of prayerNames) {
      const prayerTime = prayerTimes[prayerName];
      if (prayerTime && prayerTime > currentTime) {
        nextPrayer = prayerName;
        nextPrayerTime = prayerTime;
        break;
      }
    }

    // If no prayer found for today, get tomorrow's Fajr
    if (nextPrayer === 'Fajr' && prayerTimes['Fajr'] && prayerTimes['Fajr'] <= currentTime) {
      nextPrayerTime = new Date(prayerTimes['Fajr']);
      nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
    }

    // If we have a current prayer, make sure next prayer is actually the next one
    if (currentPrayer) {
      const currentPrayerIndex = prayerNames.indexOf(currentPrayer);
      const nextPrayerIndex = (currentPrayerIndex + 1) % prayerNames.length;
      const nextPrayerName = prayerNames[nextPrayerIndex];
      
      if (nextPrayerName === 'Fajr' && currentPrayer !== 'Isha') {
        // If next prayer is Fajr but current isn't Isha, it should be tomorrow's Fajr
        nextPrayerTime = new Date(prayerTimes['Fajr']);
        nextPrayerTime.setDate(nextPrayerTime.getDate() + 1);
        nextPrayer = 'Fajr';
      } else {
        nextPrayer = nextPrayerName;
        nextPrayerTime = prayerTimes[nextPrayerName] || nextPrayerTime;
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

    console.log('Returning response:', response);
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
