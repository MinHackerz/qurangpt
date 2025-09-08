import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const globalAyah = searchParams.get('globalAyah');
    
    if (!globalAyah) {
      return NextResponse.json({ error: 'Global ayah number is required' }, { status: 400 });
    }
    
    // Fetch Arabic text using global ayah number
    const response = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyah}`);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch Arabic text' }, { status: response.status });
    }
    
    const data = await response.json();
    
    if (data.code === 200 && data.data && data.data.text) {
      return NextResponse.json({ 
        success: true, 
        text: data.data.text,
        surah: data.data.surah,
        ayah: data.data.numberInSurah
      });
    } else {
      return NextResponse.json({ error: 'Invalid response from AlQuran API' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error fetching Arabic ayah:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
