import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // ElevenLabs API endpoint
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default voice (Rachel)
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    // Truncate text if too long (ElevenLabs has limits)
    const maxLength = 5000; // Limit to 5000 characters
    const textToSpeak = text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: textToSpeak,
        model_id: 'eleven_multilingual_v2', // Free tier model - supports 29 languages
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate speech';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail?.message || errorData.detail || errorData.message || errorMessage;
        console.error('ElevenLabs API error:', errorData);
      } catch (e) {
        const errorText = await response.text();
        console.error('ElevenLabs API error (text):', errorText);
        errorMessage = errorText || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    // Get the audio data as a buffer
    const audioBuffer = await response.arrayBuffer();

    // Return the audio as a blob
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="speech.mp3"',
      },
    });
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json(
      { error: 'Failed to process text-to-speech request' },
      { status: 500 }
    );
  }
}

