import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const globalAyah = searchParams.get('globalAyah');

    if (!globalAyah) {
      return NextResponse.json({ error: 'Global ayah number is required' }, { status: 400 });
    }

    // Fetch multiple editions at once for better efficiency and fallback
    // en.asad (Asad), en.sahih (Sahih International), ar (Arabic)
    const editions = 'en.asad,en.sahih,quran-simple';
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${globalAyah}/editions/${editions}`);

    if (!response.ok) {
      // Fallback to a single fetch if multi-fetch fails
      const fallback = await fetch(`https://api.alquran.cloud/v1/ayah/${globalAyah}/en.asad`);
      if (fallback.ok) {
        const data = await fallback.json();
        return NextResponse.json({
          success: true,
          text: data.data.text,
          translation: 'asad',
          surah: data.data.surah,
          ayah: data.data.numberInSurah
        });
      }
      return NextResponse.json({ error: 'Failed to fetch ayah text' }, { status: response.status });
    }

    const data = await response.json();

    if (data.code === 200 && data.data && Array.isArray(data.data)) {
      // Find the best available translation
      const asad = data.data.find((e: any) => e.edition.identifier === 'en.asad');
      const sahih = data.data.find((e: any) => e.edition.identifier === 'en.sahih');
      const arabic = data.data.find((e: any) => e.edition.identifier === 'quran-simple');

      const best = asad || sahih || arabic;

      if (best) {
        return NextResponse.json({
          success: true,
          text: best.text,
          translation: best.edition.identifier,
          surah: best.surah,
          ayah: best.numberInSurah
        });
      }
    }

    return NextResponse.json({ error: 'Failed to find suitable translation' }, { status: 500 });

  } catch (error) {
    console.error('Error fetching ayah text:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
