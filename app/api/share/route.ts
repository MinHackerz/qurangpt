import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';

// File-based storage for shared content (persists across server restarts)
const STORAGE_DIR = path.join(process.cwd(), 'data', 'shares');
const STORAGE_FILE = path.join(STORAGE_DIR, 'shared-content.json');

// Ensure storage directory exists
const ensureStorageDir = async () => {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating storage directory:', error);
  }
};

// Load shared content from file
const loadSharedContent = async (): Promise<Map<string, {
  question: string;
  response: string;
  timestamp: number;
  title: string;
}>> => {
  try {
    await ensureStorageDir();
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return new Map(Object.entries(parsed));
  } catch (error) {
    // File doesn't exist or is invalid, return empty map
    return new Map();
  }
};

// Save shared content to file
const saveSharedContent = async (sharedContent: Map<string, {
  question: string;
  response: string;
  timestamp: number;
  title: string;
}>) => {
  try {
    await ensureStorageDir();
    const data = Object.fromEntries(sharedContent);
    await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving shared content:', error);
  }
};

// Clean up old entries (older than 7 days)
const cleanupOldEntries = (sharedContent: Map<string, {
  question: string;
  response: string;
  timestamp: number;
  title: string;
}>) => {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  for (const [key, value] of Array.from(sharedContent.entries())) {
    if (value.timestamp < sevenDaysAgo) {
      sharedContent.delete(key);
    }
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

    // Load existing shared content
    const sharedContent = await loadSharedContent();

    // Clean up old entries
    cleanupOldEntries(sharedContent);

    // Generate unique share ID
    const shareId = uuidv4();
    
    // Store the content
    sharedContent.set(shareId, {
      question: question.trim(),
      response: response.trim(),
      timestamp: Date.now(),
      title: title?.trim() || question.substring(0, 50) + (question.length > 50 ? '...' : '')
    });

    // Save to file
    await saveSharedContent(sharedContent);

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
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

    // Load existing shared content
    const sharedContent = await loadSharedContent();
    const content = sharedContent.get(shareId);

    if (!content) {
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
