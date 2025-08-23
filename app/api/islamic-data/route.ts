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
        country: data.country_name
      })
    },
    {
      url: 'http://ip-api.com/json/',
      parser: (data: any) => ({
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        country: data.country
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
          console.log(`Successfully got location: ${location.city}, ${location.country} (${location.lat}, ${location.lng})`);
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
    country: 'Saudi Arabia'
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let lat = searchParams.get('lat');
    let lng = searchParams.get('lng');
    
    // If no coordinates provided, try to get from IP geolocation
    if (!lat || !lng) {
      console.log('No coordinates provided, attempting IP-based geolocation...');
      const location = await getLocationFromIP();
      lat = location.lat.toString();
      lng = location.lng.toString();
      console.log(`Using IP-based location: ${location.city}, ${location.country} (${lat}, ${lng})`);
    } else {
      console.log('Using provided coordinates:', lat, lng);
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

    // Calculate next prayer
    const prayers = prayerData.data?.timings || {};
    const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const currentTime = new Date();
    let nextPrayer = 'Fajr';
    let nextPrayerTime = new Date();

    // Set default next prayer time (Maghrib as fallback)
    nextPrayerTime.setHours(18, 30, 0, 0);

    for (const prayerName of prayerNames) {
      if (prayers[prayerName]) {
        const prayerTime = new Date();
        const timeStr = prayers[prayerName].split(' ')[0]; // Remove timezone if present
        const [hours, minutes] = timeStr.split(':');
        prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (prayerTime > currentTime) {
          nextPrayer = prayerName;
          nextPrayerTime = prayerTime;
          break;
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
      nextPrayer: {
        name: nextPrayer,
        time: nextPrayerTime.toISOString(),
        timeString: nextPrayerTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      },
      allPrayers: prayers,
      eidFitr: {
        date: eidFitr.toISOString(),
        daysRemaining: Math.max(0, daysToEidFitr)
      },
      eidAdha: {
        date: eidAdha.toISOString(),
        daysRemaining: Math.max(0, daysToEidAdha)
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
      nextPrayer: {
        name: 'Maghrib',
        time: fallbackPrayerTime.toISOString(),
        timeString: '6:30 PM'
      },
      allPrayers: {
        Fajr: '5:30',
        Dhuhr: '12:30',
        Asr: '3:30',
        Maghrib: '6:30',
        Isha: '8:00'
      },
      eidFitr: {
        date: fallbackEidFitr.toISOString(),
        daysRemaining: Math.max(0, daysToEidFitr)
      },
      eidAdha: {
        date: fallbackEidAdha.toISOString(),
        daysRemaining: Math.max(0, daysToEidAdha)
      }
    });
  }
}
