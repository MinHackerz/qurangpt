import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audioUrl = searchParams.get('url');
    
    if (!audioUrl) {
      return NextResponse.json({ error: 'Audio URL parameter is required' }, { status: 400 });
    }
    
    // Validate that the URL is from the Islamic Network CDN
    if (!audioUrl.includes('cdn.islamic.network')) {
      return NextResponse.json({ error: 'Invalid audio source' }, { status: 400 });
    }
    
    // Fetch the audio file from the CDN
    const response = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'QuranGPT/1.0',
        'Accept': 'audio/*',
        'Range': request.headers.get('range') || 'bytes=0-',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch audio' }, { status: response.status });
    }
    
    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    // Create response with proper headers
    const audioResponse = new NextResponse(audioBuffer, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
        'Content-Length': response.headers.get('content-length') || audioBuffer.byteLength.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD',
        'Access-Control-Allow-Headers': 'Range',
      },
    });
    
    // Handle range requests for audio streaming
    if (response.headers.get('content-range')) {
      audioResponse.headers.set('Content-Range', response.headers.get('content-range')!);
      audioResponse.headers.set('Accept-Ranges', 'bytes');
    }
    
    return audioResponse;
    
  } catch (error) {
    console.error('Audio proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
