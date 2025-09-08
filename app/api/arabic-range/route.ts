import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const surah = searchParams.get('surah');
    const startAyah = searchParams.get('startAyah');
    const endAyah = searchParams.get('endAyah');
    
    if (!surah || !startAyah || !endAyah) {
      return NextResponse.json({ error: 'Surah, startAyah, and endAyah are required' }, { status: 400 });
    }
    
    const surahNumber = parseInt(surah);
    const startAyahNum = parseInt(startAyah);
    const endAyahNum = parseInt(endAyah);
    
    if (isNaN(surahNumber) || isNaN(startAyahNum) || isNaN(endAyahNum)) {
      return NextResponse.json({ error: 'Invalid surah or ayah numbers' }, { status: 400 });
    }
    
    // Fetch Arabic text for each ayah in the range
    const ayahTexts: string[] = [];
    
    for (let ayahNum = startAyahNum; ayahNum <= endAyahNum; ayahNum++) {
      try {
        const response = await fetch(`http://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNum}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.code === 200 && data.data && data.data.text) {
            ayahTexts.push(data.data.text);
          }
        }
      } catch (error) {
        console.error(`Error fetching Arabic text for ${surahNumber}:${ayahNum}:`, error);
      }
    }
    
    if (ayahTexts.length > 0) {
      // Combine all ayahs with proper spacing
      const combinedText = ayahTexts.join(' ');
      return NextResponse.json({ 
        success: true, 
        text: combinedText,
        surah: surahNumber,
        startAyah: startAyahNum,
        endAyah: endAyahNum,
        ayahCount: ayahTexts.length
      });
    } else {
      return NextResponse.json({ error: 'Failed to fetch any Arabic text for the range' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error fetching Arabic range:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
