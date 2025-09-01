import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const surah = searchParams.get('surah');
    const ayah = searchParams.get('ayah');

    if (!surah || !ayah) {
      return NextResponse.json(
        { error: 'Surah and ayah parameters are required' },
        { status: 400 }
      );
    }

    // Validate surah and ayah numbers
    const surahNum = parseInt(surah);
    const ayahNum = parseInt(ayah);

    if (isNaN(surahNum) || isNaN(ayahNum) || surahNum < 1 || surahNum > 114 || ayahNum < 1) {
      return NextResponse.json(
        { error: 'Invalid surah or ayah number' },
        { status: 400 }
      );
    }

    // Calculate the global ayah number (sum of all previous surahs + current ayah)
    // This is needed because AlQuran Cloud API uses global ayah numbers
    const surahAyahCounts = [
      7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6
    ];

    // Calculate global ayah number
    let globalAyahNumber = 0;
    for (let i = 0; i < surahNum - 1; i++) {
      globalAyahNumber += surahAyahCounts[i];
    }
    globalAyahNumber += ayahNum;

    // Fetch audio URL from AlQuran Cloud API using the correct endpoint format
    const audioUrl = `https://api.alquran.cloud/v1/ayah/${globalAyahNumber}/ar.alafasy`;
    
    const response = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'QuranGPT/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch audio from AlQuran Cloud API' },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.data || !data.data.audio) {
      return NextResponse.json(
        { error: 'Audio not available for this ayah' },
        { status: 404 }
      );
    }

    // Return the audio URL
    return NextResponse.json({
      success: true,
      audioUrl: data.data.audio,
      surah: surahNum,
      ayah: ayahNum,
      globalAyah: globalAyahNumber,
      reciter: 'Alafasy'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Audio API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
