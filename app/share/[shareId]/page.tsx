'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { processContentLinks } from '../../utils/contentUtils';
import SourcesSection from '../../components/SourcesSection';
import { useAIResponse } from '../../hooks/useAIResponse';
import { useGlobalEventDelegation } from '../../hooks/useGlobalEventDelegation';
import AskQuranGPTInput from '../../components/AskQuranGPTInput';
import TextSizeToggle from '../../components/TextSizeToggle';
import TextSizeStyles from '../../components/TextSizeStyles';

interface SharedContent {
  shareId: string;
  question: string;
  response: string;
  title: string;
  timestamp: number;
}

export default function SharePage() {
  const params = useParams();
  const shareId = params?.shareId as string | undefined;

  const [sharedContent, setSharedContent] = useState<SharedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Share functionality state
  const [isSharing, setIsSharing] = useState(false);
  const [showShareSuccess, setShowShareSuccess] = useState(false);


  // Content type selection state
  const [selectedContentTypes, setSelectedContentTypes] = useState({
    tafsir: true,
    hadith: false,
    webSearch: false,
    suggestedQuestions: false
  });

  // Show new question input state
  const [showNewQuestionInput, setShowNewQuestionInput] = useState(false);

  // Input field state for the converted button
  const [inputValue, setInputValue] = useState('');

  // Text size state
  const [textSize, setTextSize] = useState<'small' | 'medium' | 'large'>('small');

  // Formatted response state
  const [formattedResponse, setFormattedResponse] = useState<string>('');
  const [isFormatting, setIsFormatting] = useState<boolean>(false);

  // Use the same AI response formatting as the main page
  const { formatResponse } = useAIResponse(textSize, selectedContentTypes);


  // Use global event delegation for audio progress bars
  useGlobalEventDelegation();
  // Note: useContextManager is disabled - contexts are now fetched during response formatting

  // Process content based on selected content types
  const processContentBasedOnSelection = useCallback((content: string) => {
    if (!content) return content;

    // Create a temporary DOM element to parse the content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Remove sections based on selection
    if (!selectedContentTypes.tafsir) {
      // Remove tafsir sections
      const tafsirSections = tempDiv.querySelectorAll('.tafsir-content, .tafsir-section');
      tafsirSections.forEach(section => section.remove());
    }

    // Note: Hadith content is preserved when option is unselected
    // Only new hadith content generation is controlled by the option
    // Existing hadith content remains visible regardless of option state

    // Note: Suggested questions content is preserved when option is unselected
    // Only new suggested questions content generation is controlled by the option
    // Existing suggested questions content remains visible regardless of option state

    return tempDiv.innerHTML;
  }, [selectedContentTypes]);

  // Get filtered content based on current selection
  const filteredContent = useMemo(() => {
    const content = processContentBasedOnSelection(formattedResponse || sharedContent?.response || '');
    return processContentLinks(content);
  }, [formattedResponse, sharedContent?.response, processContentBasedOnSelection]);

  // Format response when shared content changes (only when content/question changes, not when options toggle)
  useEffect(() => {
    if (sharedContent?.response) {
      // Check if content is already formatted (contains HTML elements like ayah boxes)
      const isAlreadyFormatted = sharedContent.response.includes('stylish-ayah-reference') ||
        sharedContent.response.includes('ayah-audio-play-btn') ||
        sharedContent.response.includes('<div class="stylish-ayah-reference"');

      if (isAlreadyFormatted) {
        // Content is already formatted, use it directly
        setFormattedResponse(sharedContent.response);
        setIsFormatting(false);
      } else {
        // Content needs formatting - use fixed content types to avoid refetching
        // Shared content should be displayed as-is, without triggering new API calls
        setIsFormatting(true);
        // Use default content types that don't trigger additional API calls
        formatResponse(sharedContent.response, sharedContent.question, textSize, {
          tafsir: true,
          hadith: true,
          webSearch: false, // Don't fetch contexts for shared content
          suggestedQuestions: false // Don't fetch questions for shared content
        })
          .then(setFormattedResponse)
          .catch(() => {
            // If formatting fails, use the original response
            setFormattedResponse(sharedContent.response);
          })
          .finally(() => setIsFormatting(false));
      }
    } else {
      // Reset formatted response when sharedContent is cleared
      setFormattedResponse('');
      setIsFormatting(false);
    }
    // Intentionally excluding selectedContentTypes, textSize, and formatResponse from dependencies:
    // We only want to format when content/question changes, not when options are toggled or formatResponse changes.
    // Toggling options should only filter the already-formatted content (handled by filteredContent memo).
    // formatResponse is stable enough and adding it would cause unnecessary re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedContent?.response, sharedContent?.question]);

  // Handle sharing current page content
  const handleShareContent = useCallback(async () => {
    if (!sharedContent) {
      return;
    }

    setIsSharing(true);
    setShowShareSuccess(false);

    try {
      // Get current page URL
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

      // Copy current page URL to clipboard
      await navigator.clipboard.writeText(currentUrl);
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 3000);

      // Track share event in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'content_shared', {
          event_category: 'engagement',
          event_label: 'share_current_page',
          custom_parameter_1: sharedContent.question.substring(0, 100),
          custom_parameter_2: 'shared_page'
        });
      }

    } catch (error) {
    } finally {
      setIsSharing(false);
    }
  }, [sharedContent]);

  // Handle share button click
  const handleShareClick = () => {
    handleShareContent();
  };

  // Handle Ask QuranGPT button click - convert to input field
  const handleAskQuranClick = () => {
    setShowNewQuestionInput(true);
  };

  // Handle reset - convert back to button
  const handleResetInput = () => {
    setShowNewQuestionInput(false);
    setInputValue('');
  };

  // Handle send - redirect to homepage with query and options
  const handleSendToHomepage = () => {
    if (!inputValue.trim()) return;

    // Create URL with query parameters
    const params = new URLSearchParams({
      question: inputValue.trim(),
      tafsir: selectedContentTypes.tafsir.toString(),
      hadith: selectedContentTypes.hadith.toString(),
      webSearch: selectedContentTypes.webSearch.toString(),
      suggestedQuestions: selectedContentTypes.suggestedQuestions.toString(),
      textSize: textSize
    });

    // Redirect to homepage with parameters
    window.location.href = `/?${params.toString()}`;
  };

  // Handle text size change
  const handleTextSizeChange = (size: 'small' | 'medium' | 'large') => {
    setTextSize(size);
  };


  // Format creation date/time - shows exact time in user's timezone
  const formatCreationTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);

    // Always show full date and time in user's local timezone
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }, []);

  // Calculate time remaining until expiry
  const calculateTimeRemaining = useCallback((timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) {
      return 'Expired';
    }
    const now = Date.now();
    const expiryTime = timestamp + (7 * 24 * 60 * 60 * 1000); // 7 days from creation
    const timeLeft = expiryTime - now;

    if (timeLeft <= 0) {
      return 'Expired';
    }

    const days = Math.floor(timeLeft / (24 * 60 * 60 * 1000));
    const hours = Math.floor((timeLeft % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      return `${minutes}m`;
    }
  }, []);

  // Update time remaining every minute
  useEffect(() => {
    if (!sharedContent || !sharedContent.timestamp) return;

    const updateTimer = () => {
      // Safety check: ensure sharedContent and timestamp still exist
      if (!sharedContent || !sharedContent.timestamp) {
        setTimeRemaining('Expired');
        return;
      }
      setTimeRemaining(calculateTimeRemaining(sharedContent.timestamp));
    };

    // Update immediately
    updateTimer();

    // Update every minute
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [sharedContent, calculateTimeRemaining]);

  useEffect(() => {
    const fetchSharedContent = async () => {
      if (!shareId) {
        setError('Share ID is missing');
        setLoading(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`/api/share?shareId=${encodeURIComponent(shareId)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Handle 404 (expired/not found) gracefully without throwing error
          if (response.status === 404) {
            setError('Share not found or expired');
            setLoading(false);
            return;
          }

          // For other errors, handle them normally
          let errorMessage = 'Failed to load shared content';

          // Check if response has content before trying to parse JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await response.json();
              if (errorData && typeof errorData === 'object' && errorData.error) {
                errorMessage = errorData.error;
              } else {
                errorMessage = `Request failed with status ${response.status}`;
              }
            } catch (parseError) {
              errorMessage = `Request failed with status ${response.status}`;
            }
          } else {
            errorMessage = `Request failed with status ${response.status}`;
          }

          setError(errorMessage);
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data && data.shareId) {
          setSharedContent(data);
          setLoading(false);
        } else {
          setError('Invalid data received from server');
          setLoading(false);
        }
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            setError('Request timed out. Please try again.');
          } else if (err.message.includes('Failed to fetch')) {
            setError('Network error. Please check your connection and try again.');
          } else {
            setError(err.message);
          }
        } else {
          setError('Failed to load shared content');
        }

        setLoading(false);
      }
    };

    fetchSharedContent();
  }, [shareId]);


  // Track shared content view in Google Analytics
  useEffect(() => {
    if (sharedContent && typeof window !== 'undefined' && (window as any).gtag) {
      // Track shared content view
      (window as any).gtag('event', 'shared_content_view', {
        event_category: 'engagement',
        event_label: sharedContent.shareId,
        custom_parameter_1: sharedContent.question.substring(0, 100), // First 100 chars of question
        custom_parameter_2: 'shared_page'
      });

      // Track page view for shared content
      (window as any).gtag('config', 'G-NMNGXPDXNK', {
        page_title: `${sharedContent.title} - QuranGPT`,
        page_location: window.location.href,
        custom_map: {
          'custom_parameter_1': 'question_preview',
          'custom_parameter_2': 'content_type'
        }
      });
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

              audio.play().catch(() => { });

              // Track audio play event
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'audio_play', {
                  event_category: 'engagement',
                  event_label: `surah_${surah}_ayah_${ayah}`,
                  custom_parameter_1: sharedContent.shareId,
                  custom_parameter_2: 'shared_page'
                });
              }
            } else {
            }
          } catch (error) {
          }
        } else {
          // Audio exists, toggle play/pause
          if (audio.paused) {
            // Play audio
            audio.play().catch(() => { });
            const playIcon = button.querySelector('svg');
            if (playIcon) {
              playIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>';
            }

            // Track audio play event
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'audio_play', {
                event_category: 'engagement',
                event_label: `surah_${surah}_ayah_${ayah}`,
                custom_parameter_1: sharedContent.shareId,
                custom_parameter_2: 'shared_page'
              });
            }
          } else {
            // Pause audio
            audio.pause();
            const playIcon = button.querySelector('svg');
            if (playIcon) {
              playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
            }

            // Track audio pause event
            if (typeof window !== 'undefined' && (window as any).gtag) {
              (window as any).gtag('event', 'audio_pause', {
                event_category: 'engagement',
                event_label: `surah_${surah}_ayah_${ayah}`,
                custom_parameter_1: sharedContent.shareId,
                custom_parameter_2: 'shared_page'
              });
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

      // Track tafsir interaction
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'tafsir_interaction', {
          event_category: 'engagement',
          event_label: tafsirId,
          custom_parameter_1: sharedContent.shareId,
          custom_parameter_2: isVisible ? 'tafsir_close' : 'tafsir_open'
        });
      }
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

        // Track tafsir close event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'tafsir_interaction', {
            event_category: 'engagement',
            event_label: tafsirId,
            custom_parameter_1: sharedContent.shareId,
            custom_parameter_2: 'tafsir_close_button'
          });
        }
      }
    };

    // Add event listeners
    document.addEventListener('click', handleAudioPlay);
    document.addEventListener('click', handleTafsirToggle);
    document.addEventListener('click', handleTafsirClose);

    // Track "Ask QuranGPT" button clicks
    const askQuranGPTButton = document.querySelector('a[href="/"]');
    if (askQuranGPTButton) {
      askQuranGPTButton.addEventListener('click', () => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'shared_content_cta_click', {
            event_category: 'engagement',
            event_label: 'ask_qurangpt_button',
            custom_parameter_1: sharedContent.shareId,
            custom_parameter_2: 'shared_page'
          });
        }
      });
    }

    // Cleanup
    return () => {
      document.removeEventListener('click', handleAudioPlay);
      document.removeEventListener('click', handleTafsirToggle);
      document.removeEventListener('click', handleTafsirClose);
    };
  }, [sharedContent]);

  // Update document title when error or no content - MUST be before early returns
  useEffect(() => {
    if (error || !sharedContent) {
      document.title = 'Content Expired - QuranGPT';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'This shared content has expired or is no longer available.');
      }
    }
  }, [error, sharedContent]);

  // Update document metadata when shared content is available - MUST be before early returns
  useEffect(() => {
    if (sharedContent) {
      document.title = `${sharedContent.title} - QuranGPT`;

      const updateMetaTag = (attribute: string, value: string, content: string) => {
        const selector = attribute === 'name' ? `meta[${attribute}="${value}"]` : `meta[property="${value}"]`;
        let meta = document.querySelector(selector) as HTMLMetaElement;
        if (!meta) {
          meta = document.createElement('meta');
          if (attribute === 'name') {
            meta.setAttribute('name', value);
          } else {
            meta.setAttribute('property', value);
          }
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      };

      updateMetaTag('name', 'description', `QuranGPT answer: ${sharedContent.question}`);
      updateMetaTag('property', 'og:title', `${sharedContent.title} - QuranGPT`);
      updateMetaTag('property', 'og:type', 'website');
      updateMetaTag('property', 'og:url', `https://quran-gpt.netlify.app/share/${shareId || ''}`);
      updateMetaTag('property', 'og:image', 'https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png');
      updateMetaTag('property', 'og:site_name', 'QuranGPT - Get the Guidance from the Holy Quran');
      updateMetaTag('property', 'og:description', sharedContent.question);
      updateMetaTag('name', 'twitter:card', 'summary_large_image');
      updateMetaTag('name', 'twitter:title', `${sharedContent.title} - QuranGPT`);
      updateMetaTag('name', 'twitter:description', sharedContent.question);
      updateMetaTag('name', 'twitter:image', 'https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png');
      updateMetaTag('name', 'google-site-verification', 'NGBfty7J9MyQwQ5DT-wvArocgpJC72IXOrH4M1IIJAs');
      updateMetaTag('name', 'msvalidate.01', '5CC4429FDE08444C1CB98ECB946F1E2C');
      updateMetaTag('name', 'robots', 'noindex, nofollow');
      updateMetaTag('name', 'googlebot', 'noindex, nofollow');
    }
  }, [sharedContent, shareId]);

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
      <>
        <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Content Expired
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                This shared content is no longer available. Shared content expires after 7 days.
              </p>
            </div>

            <a
              href="/"
              className="inline-flex items-center gap-3 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-full transition-all duration-200 text-base font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Ask QuranGPT
            </a>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TextSizeStyles />
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-NMNGXPDXNK"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-NMNGXPDXNK');
        `}
      </Script>

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
              <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Shared from QuranGPT
                </p>
                {sharedContent.timestamp && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Created: {formatCreationTime(sharedContent.timestamp)}
                  </div>
                )}
                {timeRemaining && timeRemaining !== 'Expired' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Expires in {timeRemaining}
                  </div>
                )}
              </div>
            </div>

            {/* Question */}
            <div className="bg-transparent px-6 pb-6">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Question
                </h2>
                <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'
                  }`}>
                  {sharedContent.question}
                </p>
              </div>
            </div>

            {/* Response */}
            <div className="bg-transparent rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Answer
              </h2>
              {isFormatting ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Formatting response...</span>
                </div>
              ) : (
                <div
                  data-text-size={textSize}
                  className={`group/textsize text-gray-700 dark:text-gray-300 leading-relaxed space-y-4 ${textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'
                    }`}
                  dangerouslySetInnerHTML={{
                    __html: filteredContent
                  }}
                />
              )}
            </div>

            {/* Sources Section - Always render to maintain hook consistency */}
            <SourcesSection
              content={filteredContent || ''}
              textSize={textSize}
            />


            {/* Bottom Spacing */}
            <div className="h-20"></div>

            {/* Floating Button/Input Section */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4 sm:px-6">
              <div className="w-full">
                {!showNewQuestionInput ? (
                  /* Ask QuranGPT Button with Text Size Toggle and Share Icon */
                  <div className="flex items-center gap-3 justify-center">
                    {/* Text Size Toggle Button with Book Icon */}
                    <TextSizeToggle
                      onSizeChange={handleTextSizeChange}
                      currentSize={textSize}
                      variant="default"
                    />

                    <button
                      onClick={handleAskQuranClick}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-full transition-all duration-200 text-base font-medium shadow-sm hover:shadow-md"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Ask QuranGPT
                    </button>

                    {/* Share Button - Minimalist Design matching MinimalHeader */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShareClick}
                      disabled={isSharing}
                      className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${showShareSuccess
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : isSharing
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      title={showShareSuccess ? "Share link copied!" : "Share this content"}
                    >
                      <AnimatePresence mode="wait">
                        {showShareSuccess ? (
                          <motion.svg
                            key="tick"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </motion.svg>
                        ) : isSharing ? (
                          <motion.div
                            key="loading"
                            className="w-5 h-5"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </motion.div>
                        ) : (
                          <motion.svg
                            key="share"
                            initial={{ scale: 0, rotate: 90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: -90 }}
                            transition={{ duration: 0.2 }}
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                ) : (
                  /* AskQuranGPTInput */
                  <AskQuranGPTInput
                    value={inputValue}
                    onChange={setInputValue}
                    selectedContentTypes={selectedContentTypes}
                    onContentTypeChange={setSelectedContentTypes}
                    onSend={handleSendToHomepage}
                    onReset={handleResetInput}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Hidden scrollbar styles for content type buttons */}
      <style jsx>{`
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
    </>
  );
}
