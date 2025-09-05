import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Netlify KV storage for shared content
interface SharedContent {
  question: string;
  response: string;
  timestamp: number;
  title: string;
}

// In-memory store for local development
const localStore = new Map<string, SharedContent>();

// Get Netlify KV instance
const getKV = () => {
  try {
    // Check if we're in Netlify environment
    if (typeof process !== 'undefined' && 
        (process.env.NETLIFY || process.env.VERCEL || process.env.NODE_ENV === 'production')) {
      // Try to require Netlify KV
      const netlifyFunctions = require('@netlify/functions');
      return netlifyFunctions?.kv || null;
    }
  } catch (error) {
    console.log('Netlify KV not available:', error instanceof Error ? error.message : String(error));
  }
  // Fallback for local development
  return null;
};

// Store shared content in KV
const storeSharedContent = async (shareId: string, content: SharedContent): Promise<void> => {
  try {
    const kv = getKV();
    if (kv) {
      console.log('Using Netlify KV for storage');
      // Set TTL to 7 days (604800 seconds) to match our expiration logic
      await kv.set(`share-${shareId}`, JSON.stringify(content), { ttl: 604800 });
      console.log('Content stored with 7-day TTL');
    } else {
      // Fallback for local development - use in-memory store
      console.log('Using local in-memory store for development');
      localStore.set(`share-${shareId}`, content);
    }
  } catch (error) {
    console.error('Error storing shared content:', error);
    // Don't throw error, just log it and continue with local store
    console.log('Falling back to local store due to KV error');
    localStore.set(`share-${shareId}`, content);
  }
};

// Retrieve shared content from KV
const getSharedContent = async (shareId: string): Promise<SharedContent | null> => {
  try {
    const kv = getKV();
    if (kv) {
      console.log('Retrieving from Netlify KV');
      const data = await kv.get(`share-${shareId}`);
      return data ? JSON.parse(data) : null;
    } else {
      // Fallback for local development - use in-memory store
      console.log('Retrieving from local store');
      const content = localStore.get(`share-${shareId}`);
      return content || null;
    }
  } catch (error) {
    console.error('Error retrieving shared content:', error);
    // Try local store as fallback
    console.log('Falling back to local store due to KV error');
    const content = localStore.get(`share-${shareId}`);
    return content || null;
  }
};

// Clean up old entries (older than 7 days)
const cleanupOldEntries = async (): Promise<void> => {
  try {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const kv = getKV();
    if (kv) {
      // In production, cleanup is handled when individual shares are accessed
      // since KV doesn't support easy key listing
      return;
    } else {
      // Clean up local store
      for (const [key, value] of Array.from(localStore.entries())) {
        if (value.timestamp < sevenDaysAgo) {
          localStore.delete(key);
        }
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

export async function POST(request: NextRequest) {
  try {
    const { question, response, title } = await request.json();

    if (!question || !response) {
      return NextResponse.json(
        { error: 'Question and response are required' },
        { status: 400 }
      );
    }

    // Clean up old entries first
    await cleanupOldEntries();

    // Generate unique share ID
    const shareId = uuidv4();
    
    // Prepare content
    const content: SharedContent = {
      question: question.trim(),
      response: response.trim(),
      timestamp: Date.now(),
      title: title?.trim() || question.substring(0, 50) + (question.length > 50 ? '...' : '')
    };

    // Store in KV
    await storeSharedContent(shareId, content);

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://quran-gpt.netlify.app';
    const shareUrl = `${baseUrl}/share/${shareId}`;

    return NextResponse.json({
      shareId,
      shareUrl,
      success: true
    });

  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shareId = url.searchParams.get('shareId');

    console.log('GET request for shareId:', shareId);
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NETLIFY: process.env.NETLIFY,
      VERCEL: process.env.VERCEL
    });

    if (!shareId) {
      console.log('No shareId provided');
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    // Get shared content from KV
    const content = await getSharedContent(shareId);
    console.log('Retrieved content:', content ? 'Found' : 'Not found');

    if (!content) {
      console.log('Content not found for shareId:', shareId);
      return NextResponse.json(
        { error: 'Share not found or expired' },
        { status: 404 }
      );
    }

    // Check if content is expired (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const contentAge = Date.now() - content.timestamp;
    const contentAgeHours = Math.round(contentAge / (1000 * 60 * 60));
    
    console.log('Content age:', contentAgeHours, 'hours');
    console.log('Content timestamp:', new Date(content.timestamp).toISOString());
    
    if (content.timestamp < sevenDaysAgo) {
      console.log('Content expired for shareId:', shareId, 'Age:', contentAgeHours, 'hours');
      // Content is expired, we could delete it here if needed
      return NextResponse.json(
        { error: 'Share not found or expired' },
        { status: 404 }
      );
    }

    console.log('Returning content for shareId:', shareId);
    return NextResponse.json({
      shareId,
      question: content.question,
      response: content.response,
      title: content.title,
      timestamp: content.timestamp
    });

  } catch (error) {
    console.error('Error retrieving share:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve share content' },
      { status: 500 }
    );
  }
}
