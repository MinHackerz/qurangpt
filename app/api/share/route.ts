import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getStore } from '@netlify/blobs';

// Netlify Blobs storage for shared content
interface SharedContent {
  question: string;
  response: string;
  timestamp: number;
  title: string;
}

// In-memory store for local development
const localStore = new Map<string, SharedContent>();

// Get Netlify Blobs store
const getBlobStore = () => {
  try {
    // Check if we're in production environment (Netlify, Vercel, or production)
    const isProduction = process.env.NODE_ENV === 'production' || 
                        process.env.NETLIFY || 
                        process.env.VERCEL ||
                        process.env.NETLIFY_SITE_ID;
    
    if (isProduction) {
      console.log('Production environment detected, using Netlify Blobs');
      return getStore('quran-gpt-shares');
    } else {
      console.log('Development environment detected, using local store');
      return null;
    }
  } catch (error) {
    console.log('Netlify Blobs not available:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

// Store shared content in Blobs
const storeSharedContent = async (shareId: string, content: SharedContent): Promise<void> => {
  try {
    const blobStore = getBlobStore();
    if (blobStore) {
      console.log('Using Netlify Blobs for storage');
      // Store content (TTL handled by manual cleanup)
      await blobStore.set(`share-${shareId}`, JSON.stringify(content));
      console.log('Content stored (7-day expiration handled by cleanup)');
    } else {
      // Fallback for local development - use in-memory store
      console.log('Using local in-memory store for development');
      localStore.set(`share-${shareId}`, content);
    }
  } catch (error) {
    console.error('Error storing shared content:', error);
    // Don't throw error, just log it and continue with local store
    console.log('Falling back to local store due to Blobs error');
    localStore.set(`share-${shareId}`, content);
  }
};

// Retrieve shared content from Blobs
const getSharedContent = async (shareId: string): Promise<SharedContent | null> => {
  try {
    const blobStore = getBlobStore();
    if (blobStore) {
      console.log('Retrieving from Netlify Blobs');
      const data = await blobStore.get(`share-${shareId}`);
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
    console.log('Falling back to local store due to Blobs error');
    const content = localStore.get(`share-${shareId}`);
    return content || null;
  }
};

// Clean up old entries (older than 7 days)
const cleanupOldEntries = async (): Promise<void> => {
  try {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const blobStore = getBlobStore();
    if (blobStore) {
      // In production, TTL will automatically expire entries in Netlify Blobs
      // But we can still do manual cleanup for any entries that might have slipped through
      try {
        // List all blobs and check their timestamps
        const listResult = await blobStore.list();
        const blobs = listResult.blobs || [];
        for (const blob of blobs) {
          if (blob.key.startsWith('share-')) {
            try {
              const data = await blobStore.get(blob.key);
              if (data) {
                const content = JSON.parse(data);
                if (content.timestamp && content.timestamp < sevenDaysAgo) {
                  await blobStore.delete(blob.key);
                  console.log('Deleted expired content:', blob.key);
                }
              }
            } catch (err) {
              // If we can't parse or access the blob, it might already be expired
              // Try to delete it anyway
              try {
                await blobStore.delete(blob.key);
                console.log('Deleted inaccessible blob:', blob.key);
              } catch (deleteErr) {
                // Ignore delete errors for already expired blobs
              }
            }
          }
        }
      } catch (listError) {
        console.log('Could not list blobs for cleanup:', listError);
        // This is not critical, TTL will handle expiration
      }
    } else {
      // Clean up local store
      for (const [key, value] of Array.from(localStore.entries())) {
        if (value.timestamp < sevenDaysAgo) {
          localStore.delete(key);
          console.log('Deleted expired local content:', key);
        }
      }
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

// Add CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { question, response, title } = await request.json();

    if (!question || !response) {
      return NextResponse.json(
        { error: 'Question and response are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Trigger cleanup in the background to avoid delaying share creation
    // This preserves functionality while reducing response latency
    cleanupOldEntries().catch(() => {});

    // Generate unique share ID
    const shareId = uuidv4();
    
    // Prepare content
    const content: SharedContent = {
      question: question.trim(),
      response: response.trim(),
      timestamp: Date.now(),
      title: title?.trim() || question.substring(0, 50) + (question.length > 50 ? '...' : '')
    };

    // Store in Blobs
    await storeSharedContent(shareId, content);

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://quran-gpt.netlify.app';
    const shareUrl = `${baseUrl}/share/${shareId}`;

    return NextResponse.json({
      shareId,
      shareUrl,
      success: true
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Cleanup endpoint for manual cleanup calls
export async function DELETE(request: NextRequest) {
  try {
    console.log('Manual cleanup requested');
    await cleanupOldEntries();
    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup completed' 
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error during manual cleanup:', error);
    return NextResponse.json(
      { error: 'Cleanup failed' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const shareId = url.searchParams.get('shareId');

    console.log('GET request for shareId:', shareId);

    if (!shareId) {
      console.log('No shareId provided');
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get shared content from Blobs
    const content = await getSharedContent(shareId);

    if (!content) {
      console.log('Content not found for shareId:', shareId);
      return NextResponse.json(
        { error: 'Share not found or expired' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if content is expired (older than 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    if (content.timestamp < sevenDaysAgo) {
      
      // Delete expired content
      try {
        const blobStore = getBlobStore();
        if (blobStore) {
          await blobStore.delete(`share-${shareId}`);
        } else {
          localStore.delete(`share-${shareId}`);
        }
      } catch (deleteError) {
        console.error('Error deleting expired content:', deleteError);
      }
      
      return NextResponse.json(
        { error: 'Share not found or expired' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      shareId,
      question: content.question,
      response: content.response,
      title: content.title,
      timestamp: content.timestamp
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error retrieving share:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve share content' },
      { status: 500, headers: corsHeaders }
    );
  }
}
