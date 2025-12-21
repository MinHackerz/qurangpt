import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: Request) {
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

    const count = endAyahNum - startAyahNum + 1;
    const offset = startAyahNum - 1;

    // Fetch range using surah endpoint (most efficient)
    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-simple?offset=${offset}&limit=${count}`);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && data.data && data.data.ayahs) {
        const combinedText = data.data.ayahs.map((a: any) => a.text).join(' ');
        return NextResponse.json({
          success: true,
          text: combinedText,
          surah: surahNumber,
          startAyah: startAyahNum,
          endAyah: endAyahNum,
          ayahCount: data.data.ayahs.length
        });
      }
    }

    return NextResponse.json({ error: 'Failed to fetch Arabic range from AlQuran API' }, { status: 500 });

  } catch (error) {
    console.error('Error fetching Arabic range:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
