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
    
    // Fetch Arabic text for each ayah in the range
    const ayahTexts: string[] = [];
    
    for (let ayahNum = startAyahNum; ayahNum <= endAyahNum; ayahNum++) {
      const globalAyahNumber = calculateGlobalAyahNumber(surahNumber, ayahNum);
      
      try {
        const response = await fetch(`http://api.alquran.cloud/v1/ayah/${globalAyahNumber}`);
        
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
