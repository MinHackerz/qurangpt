import { NextResponse } from "next/server";

interface GooglePlace {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types: string[];
}

interface PlacesResponse {
  results: GooglePlace[];
  status: string;
  error_message?: string;
}

interface PlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_phone_number?: string;
    website?: string;
    opening_hours?: {
      open_now: boolean;
      weekday_text: string[];
    };
    rating?: number;
    user_ratings_total?: number;
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
    }>;
    types: string[];
  };
  status: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get("lat") || "");
    const longitude = parseFloat(searchParams.get("lon") || "");
    const radius = parseInt(searchParams.get("radius") || "3000", 10);
    const enhanced = searchParams.get("enhanced") === "true";

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { error: "Invalid or missing lat/lon parameters" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found in environment variables');
      return NextResponse.json(
        { error: "Google Maps API key not configured. Please set GOOGLE_MAPS_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    // Enhanced search with multiple strategies for better accuracy
    const searchStrategies = enhanced ? [
      { keyword: "mosque", type: "place_of_worship" },
      { keyword: "mosjid", type: "place_of_worship" },
      { keyword: "islamic center", type: "place_of_worship" },
      { keyword: "masjid", type: "place_of_worship" },
      { keyword: "muslim", type: "place_of_worship" }
    ] : [
      { keyword: "mosque", type: "place_of_worship" }
    ];

    const allResults: GooglePlace[] = [];
    const seenPlaceIds = new Set<string>();

    // Execute multiple searches in parallel for enhanced mode
    const searchPromises = searchStrategies.map(async (strategy) => {
      const placesUrl = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
      placesUrl.searchParams.set("location", `${latitude},${longitude}`);
      placesUrl.searchParams.set("radius", radius.toString());
      placesUrl.searchParams.set("keyword", strategy.keyword);
      placesUrl.searchParams.set("type", strategy.type);
      placesUrl.searchParams.set("key", apiKey);

      console.log(`Fetching mosques with strategy: ${strategy.keyword} - ${placesUrl.toString().replace(apiKey, 'API_KEY_HIDDEN')}`);
      
      try {
        const placesResponse = await fetch(placesUrl.toString(), {
          cache: "no-store",
        });

        if (!placesResponse.ok) {
          console.error(`Google Places API error for ${strategy.keyword}:`, placesResponse.status);
          return [];
        }

        const placesData: PlacesResponse = await placesResponse.json();

        if (placesData.status !== "OK" && placesData.status !== "ZERO_RESULTS") {
          console.error(`Google Places API error for ${strategy.keyword}:`, placesData.status, placesData.error_message);
          return [];
        }

        return placesData.results || [];
      } catch (error) {
        console.error(`Error fetching mosques for ${strategy.keyword}:`, error);
        return [];
      }
    });

    const searchResults = await Promise.all(searchPromises);
    
    // Combine and deduplicate results
    searchResults.forEach(results => {
      results.forEach(place => {
        if (!seenPlaceIds.has(place.place_id)) {
          seenPlaceIds.add(place.place_id);
          allResults.push(place);
        }
      });
    });

    // Filter and prioritize mosque-related results
    const filteredResults = allResults.filter(place => {
      const name = place.name.toLowerCase();
      const types = place.types || [];
      
      // Prioritize places with mosque-related keywords in name
      const mosqueKeywords = ['mosque', 'masjid', 'islamic', 'muslim', 'center', 'centre'];
      const hasMosqueKeyword = mosqueKeywords.some(keyword => name.includes(keyword));
      
      // Include places of worship that are likely mosques
      const isPlaceOfWorship = types.includes('place_of_worship');
      
      return hasMosqueKeyword || isPlaceOfWorship;
    });

    // Sort by relevance (mosque keywords in name get higher priority)
    filteredResults.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      const aScore = ['mosque', 'masjid'].some(keyword => aName.includes(keyword)) ? 2 : 
                    ['islamic', 'muslim'].some(keyword => aName.includes(keyword)) ? 1 : 0;
      const bScore = ['mosque', 'masjid'].some(keyword => bName.includes(keyword)) ? 2 : 
                    ['islamic', 'muslim'].some(keyword => bName.includes(keyword)) ? 1 : 0;
      
      return bScore - aScore;
    });

    // Get detailed information for each place (limit to top 20 for performance)
    const mosquesWithDetails = await Promise.all(
      filteredResults.slice(0, 20).map(async (place) => {
        try {
          const detailsUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
          detailsUrl.searchParams.set("place_id", place.place_id);
          detailsUrl.searchParams.set("fields", "place_id,name,formatted_address,geometry,formatted_phone_number,website,opening_hours,rating,user_ratings_total,photos,types");
          detailsUrl.searchParams.set("key", apiKey);

          const detailsResponse = await fetch(detailsUrl.toString(), {
            cache: "no-store",
          });

          if (!detailsResponse.ok) {
            throw new Error(`Details API error: ${detailsResponse.status}`);
          }

          const detailsData: PlaceDetailsResponse = await detailsResponse.json();

          if (detailsData.status !== "OK") {
            throw new Error(`Details API status: ${detailsData.status}`);
          }

          const result = detailsData.result;
          return {
            id: result.place_id,
            name: result.name,
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            address: result.formatted_address,
            phone: result.formatted_phone_number,
            website: result.website,
            rating: result.rating,
            user_ratings_total: result.user_ratings_total,
            opening_hours: result.opening_hours,
            photos: result.photos,
            types: result.types,
          };
        } catch (error) {
          console.error(`Error fetching details for place ${place.place_id}:`, error);
          // Return basic info if details fail
          return {
            id: place.place_id,
            name: place.name,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            address: place.vicinity || place.formatted_address,
            types: place.types,
          };
        }
      })
    );

    // Calculate distances and sort by proximity
    const mosquesWithDistance = mosquesWithDetails
      .map((mosque) => {
        const distance = calculateDistance(latitude, longitude, mosque.latitude, mosque.longitude);
        return { ...mosque, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json({ mosques: mosquesWithDistance });
  } catch (error: unknown) {
    console.error("Mosques API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
