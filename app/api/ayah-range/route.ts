import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const surah = searchParams.get('surah');
    const startAyah = searchParams.get('startAyah');
    const endAyah = searchParams.get('endAyah');
    
    if (!surah || !startAyah || !endAyah) {
      return NextResponse.json({ error: 'Surah number, start ayah, and end ayah are required' }, { status: 400 });
    }
    
    const surahNumber = parseInt(surah);
    const startAyahNum = parseInt(startAyah);
    const endAyahNum = parseInt(endAyah);
    
    if (isNaN(surahNumber) || isNaN(startAyahNum) || isNaN(endAyahNum)) {
      return NextResponse.json({ error: 'Invalid surah or ayah numbers' }, { status: 400 });
    }
    
    // Calculate global ayah numbers for the range
    const calculateGlobalAyahNumber = (surah: number, ayah: number): number => {
      const surahAyahCounts = [
        0, 7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
      ];
      
      let globalAyah = 0;
      for (let i = 1; i < surah; i++) {
        globalAyah += surahAyahCounts[i];
      }
      return globalAyah + ayah;
    };
    
    // Fetch each ayah in the range
    const ayahTexts: string[] = [];
    
    for (let ayahNum = startAyahNum; ayahNum <= endAyahNum; ayahNum++) {
      const globalAyahNumber = calculateGlobalAyahNumber(surahNumber, ayahNum);
      
      // First try Muhammad Asad's translation
      let asadResponse;
      try {
        asadResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyahNumber}/en.asad`);
      } catch (error) {
        console.log(`Asad translation failed for ayah ${ayahNum}, trying English fallback`);
      }
      
      let ayahText = '';
      
      if (asadResponse && asadResponse.ok) {
        const asadData = await asadResponse.json();
        if (asadData.code === 200 && asadData.data && asadData.data.text) {
          ayahText = asadData.data.text;
        }
      }
      
      if (!ayahText) {
        // Fallback to English translation
        const englishResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyahNumber}/en.sahih`);
        
        if (englishResponse.ok) {
          const englishData = await englishResponse.json();
          if (englishData.code === 200 && englishData.data && englishData.data.text) {
            ayahText = englishData.data.text;
          }
        }
      }
      
      if (!ayahText) {
        // Final fallback to Arabic
        const arabicResponse = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyahNumber}`);
        
        if (arabicResponse.ok) {
          const arabicData = await arabicResponse.json();
          if (arabicData.code === 200 && arabicData.data && arabicData.data.text) {
            ayahText = arabicData.data.text;
          }
        }
      }
      
      if (ayahText) {
        ayahTexts.push(ayahText);
      } else {
        // If all sources fail, use a placeholder
        ayahTexts.push(`[Ayah ${ayahNum}]`);
      }
    }
    
    // Combine all ayah texts
    const combinedText = ayahTexts.join(' ');
    
    return NextResponse.json({ 
      success: true, 
      text: combinedText,
      translation: 'mixed',
      surah: surahNumber,
      startAyah: startAyahNum,
      endAyah: endAyahNum,
      ayahCount: ayahTexts.length
    });
    
  } catch (error) {
    console.error('Error fetching ayah range text:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
