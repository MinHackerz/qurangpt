'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { processContentLinks } from '../../utils/contentUtils';

interface SharedContent {
  shareId: string;
  question: string;
  response: string;
  title: string;
  timestamp: number;
}

export default function SharePage() {
  const params = useParams();
  const shareId = params.shareId as string;
  
  const [sharedContent, setSharedContent] = useState<SharedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedContent = async () => {
      try {
        console.log('Fetching shared content for shareId:', shareId);
        const response = await fetch(`/api/share?shareId=${encodeURIComponent(shareId)}`);
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.error || 'Failed to load shared content');
        }

        const data = await response.json();
        console.log('Received data:', data);
        setSharedContent(data);
      } catch (err) {
        console.error('Error fetching shared content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load shared content');
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedContent();
    }
  }, [shareId]);

  // Update document title when shared content is loaded
  useEffect(() => {
    if (sharedContent) {
      document.title = `${sharedContent.title} - QuranGPT`;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `QuranGPT answer: ${sharedContent.question}`);
      }
      
      // Update Open Graph title
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', `${sharedContent.title} - QuranGPT`);
      }
      
      // Update Open Graph description
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', sharedContent.question);
      }
      
      // Update Twitter title
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (twitterTitle) {
        twitterTitle.setAttribute('content', `${sharedContent.title} - QuranGPT`);
      }
      
      // Update Twitter description
      const twitterDescription = document.querySelector('meta[name="twitter:description"]');
      if (twitterDescription) {
        twitterDescription.setAttribute('content', sharedContent.question);
      }
    }
  }, [sharedContent]);

  // Add event listeners for audio and tafsir functionality
  useEffect(() => {
    if (!sharedContent) return;

    // Audio functionality with play/pause states - only one audio at a time
    const handleAudioPlay = async (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.ayah-audio-play-btn');
      if (!button) return;

      const surah = button.getAttribute('data-surah');
      const ayah = button.getAttribute('data-ayah');
      
      if (surah && ayah) {
        const audioId = `audio-${surah}-${ayah}`;
        let audio = (window as any)[audioId];
        
        // Pause all other audio instances and reset their icons
        const allAudioButtons = document.querySelectorAll('.ayah-audio-play-btn');
        allAudioButtons.forEach((otherButton) => {
          if (otherButton !== button) {
            const otherSurah = otherButton.getAttribute('data-surah');
            const otherAyah = otherButton.getAttribute('data-ayah');
            if (otherSurah && otherAyah) {
              const otherAudioId = `audio-${otherSurah}-${otherAyah}`;
              const otherAudio = (window as any)[otherAudioId];
              if (otherAudio && !otherAudio.paused) {
                otherAudio.pause();
                const otherPlayIcon = otherButton.querySelector('svg');
                if (otherPlayIcon) {
                  otherPlayIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
                }
              }
            }
          }
        });
        
        // If audio doesn't exist, create it
        if (!audio) {
          try {
            // Fetch audio URL from our API
            const response = await fetch(`/api/audio?surah=${surah}&ayah=${ayah}`, {
              headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache',
              },
              signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
              console.error('Audio API error:', response.status, response.statusText);
              return;
            }

            const data = await response.json();
            
            if (data.success && data.audioUrl) {
              audio = new Audio();
              audio.src = data.audioUrl;
              (window as any)[audioId] = audio;
              
              // Update button to show pause icon
              const playIcon = button.querySelector('svg');
              if (playIcon) {
                playIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>';
              }
              
              // Handle audio end event
              audio.addEventListener('ended', () => {
                const playIcon = button.querySelector('svg');
                if (playIcon) {
                  playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
                }
              });
              
              audio.play().catch(console.error);
            } else {
              console.error('No audio URL received:', data);
            }
          } catch (error) {
            console.error('Error fetching audio:', error);
          }
        } else {
          // Audio exists, toggle play/pause
          if (audio.paused) {
            // Play audio
            audio.play().catch(console.error);
            const playIcon = button.querySelector('svg');
            if (playIcon) {
              playIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>';
            }
          } else {
            // Pause audio
            audio.pause();
            const playIcon = button.querySelector('svg');
            if (playIcon) {
              playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
            }
          }
        }
      }
    };

    // Tafsir functionality
    const handleTafsirToggle = (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.tafsir-toggle-btn');
      if (!button) return;

      const tafsirId = button.getAttribute('data-tafsir-id');
      if (!tafsirId) return;

      const tafsirContent = document.getElementById(tafsirId);
      if (!tafsirContent) return;

      // Toggle visibility
      const isVisible = tafsirContent.style.display !== 'none';
      tafsirContent.style.display = isVisible ? 'none' : 'block';
    };

    // Close tafsir functionality
    const handleTafsirClose = (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.tafsir-close-btn');
      if (!button) return;

      const tafsirId = button.getAttribute('data-tafsir-id');
      if (!tafsirId) return;

      const tafsirContent = document.getElementById(tafsirId);
      if (tafsirContent) {
        tafsirContent.style.display = 'none';
      }
    };

    // Add event listeners
    document.addEventListener('click', handleAudioPlay);
    document.addEventListener('click', handleTafsirToggle);
    document.addEventListener('click', handleTafsirClose);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleAudioPlay);
      document.removeEventListener('click', handleTafsirToggle);
      document.removeEventListener('click', handleTafsirClose);
    };
  }, [sharedContent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error || !sharedContent) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Content Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The shared content could not be found or has expired.'}
          </p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg transition-colors duration-200 font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to QuranGPT
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
        {/* Main Content */}
        <div className="pt-8 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="space-y-8">
          {/* Shared Content Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Shared Content
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {sharedContent.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Shared from QuranGPT
            </p>
          </div>

          {/* Question */}
          <div className="bg-transparent rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Question
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
              {sharedContent.question}
            </p>
          </div>

          {/* Response */}
          <div className="bg-transparent rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Answer
            </h2>
            <div 
              className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4 text-sm"
              dangerouslySetInnerHTML={{ 
                __html: processContentLinks(sharedContent.response) 
              }}
            />
          </div>

          {/* Bottom Spacing */}
          <div className="h-20"></div>

          {/* Floating Button */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <a 
              href="/" 
              className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 text-base font-normal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Ask QuranGPT
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}