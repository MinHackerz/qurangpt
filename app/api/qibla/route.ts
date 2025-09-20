import { NextResponse } from "next/server";

interface QiblaRequest {
  latitude: number;
  longitude: number;
}

interface QiblaResponse {
  direction: number;
  distance: number;
  bearing: number;
  kaaba: {
    latitude: number;
    longitude: number;
  };
}

// Kaaba coordinates - Most accurate coordinates as of 2024
// Source: Islamic Society of North America (ISNA) and other authoritative sources
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

export async function POST(request: Request) {
  try {
    const body: QiblaRequest = await request.json();
    const { latitude, longitude } = body;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude values" },
        { status: 400 }
      );
    }

    // Calculate Qibla direction using the same formula as the client
    const qiblaInfo = calculateQibla(latitude, longitude);

    const response: QiblaResponse = {
      ...qiblaInfo,
      kaaba: {
        latitude: KAABA_LAT,
        longitude: KAABA_LON,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get("lat") || "");
    const longitude = parseFloat(searchParams.get("lon") || "");

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { error: "Invalid or missing lat/lon parameters" },
        { status: 400 }
      );
    }

    // Calculate Qibla direction
    const qiblaInfo = calculateQibla(latitude, longitude);

    const response: QiblaResponse = {
      ...qiblaInfo,
      kaaba: {
        latitude: KAABA_LAT,
        longitude: KAABA_LON,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function calculateQibla(lat: number, lon: number): Omit<QiblaResponse, 'kaaba'> {
  // Convert to radians
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  const lat2 = (KAABA_LAT * Math.PI) / 180;
  const lon2 = (KAABA_LON * Math.PI) / 180;

  // Calculate bearing using the most accurate formula for great circle navigation
  // This is the standard formula used by navigation systems and GPS
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x);
  bearing = (bearing * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  // Calculate distance using Haversine formula (most accurate for short distances)
  const R = 6371; // Earth's radius in kilometers
  const dLat = lat2 - lat1;
  const dLon2 = lon2 - lon1;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLon2 / 2) * Math.sin(dLon2 / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return {
    direction: bearing,
    distance: distance,
    bearing: bearing,
  };
}
