'use client';

interface ShareData {
  question: string;
  response: string;
  title?: string;
}

export async function createShareLink(data: ShareData): Promise<string> {
  try {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: data.question,
        response: data.response,
        title: data.title || data.question.substring(0, 50) + (data.question.length > 50 ? '...' : '')
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create share link');
    }

    const result = await response.json();
    return result.shareUrl;
  } catch (error) {
    console.error('Error creating share link:', error);
    // Fallback to current page URL if share creation fails
    return window.location.href;
  }
}

export function getShareText(question: string, response: string): string {
  return `QuranGPT Answer:\n\nQuestion: ${question}\n\nAnswer: ${response.substring(0, 200)}${response.length > 200 ? '...' : ''}`;
}
