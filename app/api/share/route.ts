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
  if (typeof process !== 'undefined' && process.env.NETLIFY) {
    // In Netlify environment
    return require('@netlify/functions').kv;
  }
  // Fallback for local development - you might want to use a different approach
  return null;
};

// Store shared content in KV
const storeSharedContent = async (shareId: string, content: SharedContent): Promise<void> => {
  try {
    const kv = getKV();
    if (kv) {
      await kv.set(`share-${shareId}`, JSON.stringify(content));
    } else {
      // Fallback for local development - use in-memory store
      localStore.set(`share-${shareId}`, content);
      console.log('Using local in-memory store for development');
    }
  } catch (error) {
    console.error('Error storing shared content:', error);
    throw error;
  }
};

// Retrieve shared content from KV
const getSharedContent = async (shareId: string): Promise<SharedContent | null> => {
  try {
    const kv = getKV();
    if (kv) {
      const data = await kv.get(`share-${shareId}`);
      return data ? JSON.parse(data) : null;
    } else {
      // Fallback for local development - use in-memory store
      const content = localStore.get(`share-${shareId}`);
      return content || null;
    }
  } catch (error) {
    console.error('Error retrieving shared content:', error);
    return null;
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

    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }

    // Get shared content from KV
    const content = await getSharedContent(shareId);

    if (!content) {
      return NextResponse.json(
        { error: 'Share not found or expired' },
        { status: 404 }
      );
    }

    // Check if content is expired (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    if (content.timestamp < sevenDaysAgo) {
      // Content is expired, we could delete it here if needed
      return NextResponse.json(
        { error: 'Share not found or expired' },
        { status: 404 }
      );
    }

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
