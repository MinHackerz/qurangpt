import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const globalAyah = searchParams.get('globalAyah');
    
    if (!globalAyah) {
      return NextResponse.json({ error: 'Global ayah number is required' }, { status: 400 });
    }
    
    // First try Muhammad Asad's translation
    let asadResponse;
    try {
      asadResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyah}/en.asad`);
    } catch (error) {
      console.log('Asad translation failed, trying English fallback');
    }
    
    if (asadResponse && asadResponse.ok) {
      const asadData = await asadResponse.json();
      if (asadData.code === 200 && asadData.data && asadData.data.text) {
        return NextResponse.json({ 
          success: true, 
          text: asadData.data.text,
          translation: 'asad',
          surah: asadData.data.surah,
          ayah: asadData.data.numberInSurah
        });
      }
    }
    
    // Fallback to English translation
    const englishResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyah}/en.sahih`);
    
    if (englishResponse.ok) {
      const englishData = await englishResponse.json();
      if (englishData.code === 200 && englishData.data && englishData.data.text) {
        return NextResponse.json({ 
          success: true, 
          text: englishData.data.text,
          translation: 'english',
          surah: englishData.data.surah,
          ayah: englishData.data.numberInSurah
        });
      }
    }
    
    // Final fallback to Arabic
    const arabicResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyah}`);
    
    if (arabicResponse.ok) {
      const arabicData = await arabicResponse.json();
      if (arabicData.code === 200 && arabicData.data && arabicData.data.text) {
        return NextResponse.json({ 
          success: true, 
          text: arabicData.data.text,
          translation: 'arabic',
          surah: arabicData.data.surah,
          ayah: arabicData.data.numberInSurah
        });
      }
    }
    
    return NextResponse.json({ error: 'Failed to fetch ayah text from all sources' }, { status: 500 });
    
  } catch (error) {
    console.error('Error fetching ayah text:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
