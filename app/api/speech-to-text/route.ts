import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    // Client sends the file with field name 'file'
    const audioFileEntry = formData.get('file');
    
    // Check if audioFileEntry is a File or Blob
    if (!audioFileEntry) {
      console.log('FormData keys:', Array.from(formData.keys()));
      return NextResponse.json(
        { error: 'Audio file is required. Please ensure the file is sent with field name "file".' },
        { status: 400 }
      );
    }
    
    // Type guard: check if it's a File or Blob
    const isFile = audioFileEntry instanceof File;
    const isBlob = audioFileEntry instanceof Blob;
    
    if (!isFile && !isBlob) {
      console.log('Received file type:', typeof audioFileEntry, audioFileEntry);
      return NextResponse.json(
        { error: 'Invalid file type. Expected File or Blob.' },
        { status: 400 }
      );
    }
    
    // Now TypeScript knows audioFileEntry is File | Blob
    const audioFile = audioFileEntry as File | Blob;

    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ELEVENLABS_API_KEY is not configured' },
        { status: 500 }
      );
    }

    // ElevenLabs Speech-to-Text API endpoint (Scribe v1)
    // Note: This processes pre-recorded audio, not real-time streams
    const url = 'https://api.elevenlabs.io/v1/speech-to-text';
    
    // Create FormData for ElevenLabs API
    // ElevenLabs expects the audio file with field name 'file'
    const elevenLabsFormData = new FormData();
    
    // Get file name (File has name property, Blob doesn't)
    const fileName = (audioFile instanceof File && audioFile.name) ? audioFile.name : 'recording.webm';
    
    // In Node.js 18+, we can append File/Blob directly to FormData
    // Append the file - use 'file' as the field name (ElevenLabs API expects this)
    elevenLabsFormData.append('file', audioFile, fileName);
    
    // Required: Add model_id (ElevenLabs STT requires this field)
    // Available models: 'scribe_v1' or 'scribe_v1_experimental'
    elevenLabsFormData.append('model_id', 'scribe_v1');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        // Don't set Content-Type header - let browser set it with boundary for FormData
      },
      body: elevenLabsFormData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to transcribe audio';
      try {
        const errorData = await response.json();
        console.error('ElevenLabs Speech-to-Text API error:', JSON.stringify(errorData, null, 2));
        
        // Handle different error formats from ElevenLabs
        if (Array.isArray(errorData.detail)) {
          // Format: { detail: [{ type: 'missing', loc: [...], msg: 'Field required' }] }
          const errors = errorData.detail.map((err: any) => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
          errorMessage = errors || errorData.detail[0]?.msg || errorMessage;
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : errorData.detail.message || errorMessage;
        } else {
          errorMessage = errorData.message || errorMessage;
        }
      } catch (e) {
        const errorText = await response.text();
        console.error('ElevenLabs Speech-to-Text API error (text):', errorText);
        errorMessage = errorText || errorMessage;
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // ElevenLabs STT returns the transcription
    // Adjust based on their actual API response structure
    const transcription = data.text || data.transcription || data.transcript || '';
    
    if (!transcription || transcription.trim().length === 0) {
      return NextResponse.json(
        { error: 'No transcription found in response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      text: transcription.trim(),
    });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: 'Failed to process speech-to-text request' },
      { status: 500 }
    );
  }
}

