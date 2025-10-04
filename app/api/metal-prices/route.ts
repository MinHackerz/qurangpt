import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to fetch from a reliable metal prices API
    // For now, we'll use fallback prices and you can integrate with a real API later
    const fallbackPrices = {
      gold: 2000, // USD per ounce
      silver: 25, // USD per ounce
      timestamp: new Date().toISOString(),
      source: 'fallback'
    };

    // You can replace this with a real API call like:
    // const response = await fetch('https://api.metals.live/v1/spot');
    // const data = await response.json();
    
    return NextResponse.json(fallbackPrices);
  } catch (error) {
    // Return fallback prices if API fails
    return NextResponse.json({
      gold: 2000,
      silver: 25,
      timestamp: new Date().toISOString(),
      source: 'fallback'
    });
  }
}
