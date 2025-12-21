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

    const count = endAyahNum - startAyahNum + 1;
    const offset = startAyahNum - 1;
    const editions = 'en.asad,en.sahih,quran-simple';

    const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/editions/${editions}?offset=${offset}&limit=${count}`);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 200 && data.data && Array.isArray(data.data)) {
        // Priority: Asad -> Sahih -> Arabic
        const asad = data.data.find((e: any) => e.identifier === 'en.asad');
        const sahih = data.data.find((e: any) => e.identifier === 'en.sahih');
        const arabic = data.data.find((e: any) => e.identifier === 'quran-simple');

        const best = asad || sahih || arabic;

        if (best && best.ayahs) {
          return NextResponse.json({
            success: true,
            text: best.ayahs.map((a: any) => a.text).join(' '),
            translation: best.identifier,
            surah: surahNumber,
            startAyah: startAyahNum,
            endAyah: endAyahNum,
            ayahCount: best.ayahs.length
          });
        }
      }
    }

    // Individual fallback if batch fails
    const fallback = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.asad?offset=${offset}&limit=${count}`);
    if (fallback.ok) {
      const data = await fallback.json();
      return NextResponse.json({
        success: true,
        text: data.data.ayahs.map((a: any) => a.text).join(' '),
        translation: 'asad',
        surah: surahNumber,
        startAyah: startAyahNum,
        endAyah: endAyahNum,
        ayahCount: data.data.ayahs.length
      });
    }

    return NextResponse.json({ error: 'Failed to fetch ayah range' }, { status: 500 });

  } catch (error) {
    console.error('Error fetching ayah range text:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
