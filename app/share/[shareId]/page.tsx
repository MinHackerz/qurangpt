'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { processContentLinks } from '../../utils/contentUtils';
import SourcesSection from '../../components/SourcesSection';
import { useAIResponse } from '../../hooks/useAIResponse';
import { useGlobalEventDelegation } from '../../hooks/useGlobalEventDelegation';
import { detectLanguage } from '../../utils/languageDetection';

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
  
  // State for improve question
  const [isImproving, setIsImproving] = useState(false);
  const [hasBeenImproved, setHasBeenImproved] = useState(false);
  const isImprovingRef = useRef(false);

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
    return processContentBasedOnSelection(formattedResponse || sharedContent?.response || '');
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
          .finally(() => setIsFormatting(false));
      }
    }
    // Intentionally excluding selectedContentTypes and textSize from dependencies:
    // We only want to format when content/question changes, not when options are toggled.
    // Toggling options should only filter the already-formatted content (handled by filteredContent memo).
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
  
  // Reset hasBeenImproved when input value changes (user is typing new text)
  // Skip reset if we just improved the question
  useEffect(() => {
    if (!isImprovingRef.current) {
      setHasBeenImproved(false);
    }
    isImprovingRef.current = false;
  }, [inputValue]);

  // Handle reset - convert back to button
  const handleResetInput = () => {
    setShowNewQuestionInput(false);
    setInputValue('');
    setHasBeenImproved(false);
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
  
  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendToHomepage();
    }
  };





  // Handle text size change
  const handleTextSizeChange = (size: 'small' | 'medium' | 'large') => {
    setTextSize(size);
  };

  // Handle content type toggle
  const handleContentTypeToggle = (contentType: 'tafsir' | 'hadith' | 'webSearch' | 'suggestedQuestions') => {
    setSelectedContentTypes(prev => ({
      ...prev,
      [contentType]: !prev[contentType]
    }));
  };

  // Check if input has minimum words for improvement
  const hasMinimumWords = (text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length >= 3;
  };

  // Handle improve question - only affects the input field, not shared content
  const handleImproveQuestion = async () => {
    // Only allow improving question if input field is shown and has valid input
    if (!showNewQuestionInput || !inputValue.trim() || isImproving || hasBeenImproved || !hasMinimumWords(inputValue)) return;

    setIsImproving(true);
    try {
      const language = detectLanguage(inputValue);
      const response = await fetch('/api/improve-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputValue.trim(),
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to improve question');
      }

      const data = await response.json();
      if (data.improvedQuestion) {
        isImprovingRef.current = true; // Mark that we're setting improved value
        setInputValue(data.improvedQuestion);
        setHasBeenImproved(true);
      }
    } catch (error) {
      console.error('Error improving question:', error);
    } finally {
      setIsImproving(false);
    }
  };




  // Format creation date/time
  const formatCreationTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Show relative time if less than 7 days ago
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      // Show full date for older posts
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }, []);

  // Calculate time remaining until expiry
  const calculateTimeRemaining = useCallback((timestamp: number) => {
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
    if (!sharedContent) return;

    const updateTimer = () => {
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

    if (shareId) {
      fetchSharedContent();
    }
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
              
              audio.play().catch(() => {});
              
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
            audio.play().catch(() => {});
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

  // Update document title when error or no content
  useEffect(() => {
    if (error || !sharedContent) {
      document.title = 'Content Expired - QuranGPT';
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 'This shared content has expired or is no longer available.');
      }
    }
  }, [error, sharedContent]);

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

  // Update document metadata when shared content is available
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
      updateMetaTag('property', 'og:url', `https://quran-gpt.netlify.app/share/${shareId}`);
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

  return (
    <>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {sharedContent.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Shared from QuranGPT
              </p>
              {sharedContent.timestamp && (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created {formatCreationTime(sharedContent.timestamp)}
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
          <div className="bg-transparent rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Question
            </h2>
            <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${
              textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'
            }`}>
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
            {isFormatting ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Formatting response...</span>
              </div>
            ) : (
              <div 
                className={`text-gray-700 dark:text-gray-300 leading-relaxed space-y-4 ${
                  textSize === 'large' ? 'text-xl' : textSize === 'medium' ? 'text-lg' : 'text-base'
                }`}
                dangerouslySetInnerHTML={{ 
                  __html: filteredContent
                }}
              />
            )}
          </div>

          {/* Sources Section - Always visible when there's content */}
          {filteredContent && (
            <SourcesSection 
              content={filteredContent} 
              textSize={textSize}
            />
          )}


          {/* Bottom Spacing */}
          <div className="h-20"></div>

          {/* Floating Button/Input Section */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4 sm:px-6">
            <div className="w-full">
            {!showNewQuestionInput ? (
              /* Ask QuranGPT Button with Text Size Toggle and Share Icon */
              <div className="flex items-center gap-3 justify-center">
                {/* Text Size Toggle Button with Book Icon */}
                <button
                  onClick={() => handleTextSizeChange(textSize === 'small' ? 'medium' : textSize === 'medium' ? 'large' : 'small')}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
                  title={`Text size: ${textSize}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </button>
                
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
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
                    showShareSuccess 
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
              /* Converted Input Field with Options - Matching ChatSection Design */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-4xl mx-auto px-6 sm:px-0 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-sm"
              >
                <div 
                  className="relative"
                  style={{
                    minHeight: '80px'
                  }}
                >
                  {/* Main Input Field - Minimalist Professional - Exact ChatSection Design */}
                  <div className="relative bg-transparent rounded-xl border-[0.5px] border-gray-400 dark:border-gray-400 shadow-md dark:shadow-[0_8px_24px_rgba(255,255,255,0.18)] dark:ring-1 dark:ring-white/10 transition-all duration-200 px-3 sm:px-4">
                    
                    {/* Placeholder Text - At the top, hidden when typing */}
                    {!inputValue.trim() && (
                      <div className="absolute top-2 left-2 z-10 pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-light tracking-wide">
                          Ask me anything about Quran & Islam...
                        </span>
                      </div>
                    )}

                    {/* Mobile: Inline Content Type Toggles - Icon only */}
                    <div className="sm:hidden flex absolute bottom-2 left-2 right-20 z-20 items-center gap-1.5" style={{ pointerEvents: 'auto' }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContentTypeToggle('tafsir');
                        }}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                          selectedContentTypes.tafsir
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                        type="button"
                        title="Tafsir"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContentTypeToggle('hadith');
                        }}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                          selectedContentTypes.hadith
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                        type="button"
                        title="Hadith"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContentTypeToggle('webSearch');
                        }}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                          selectedContentTypes.webSearch
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                        type="button"
                        title="Web Search"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContentTypeToggle('suggestedQuestions');
                        }}
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                          selectedContentTypes.suggestedQuestions
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                        type="button"
                        title="Suggested Questions"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>

                    {/* Desktop: Inline Content Type Toggles - With text labels */}
                    <div className="hidden sm:flex absolute bottom-2 left-2 right-20 z-20 items-center gap-2" style={{ pointerEvents: 'auto' }}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContentTypeToggle('tafsir');
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                          selectedContentTypes.tafsir
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        type="button"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium">Tafsir</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContentTypeToggle('hadith');
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                          selectedContentTypes.hadith
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        type="button"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="font-medium">Hadith</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContentTypeToggle('webSearch');
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                          selectedContentTypes.webSearch
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        type="button"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span className="font-medium">Web Search</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleContentTypeToggle('suggestedQuestions');
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer transition-all duration-200 flex-shrink-0 ${
                          selectedContentTypes.suggestedQuestions
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800/40'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                        type="button"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Questions</span>
                      </button>
                    </div>
                    
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder=""
                      rows={1}
                      className="w-full py-3 sm:py-4 bg-transparent text-black dark:text-white border-none resize-none focus:outline-none text-sm sm:text-base leading-relaxed transition-all duration-200 pr-20 sm:pr-24 pt-2 pb-8 sm:pt-2 sm:pb-10"
                      style={{ 
                        height: 'auto',
                        overflowY: 'auto',
                        maxHeight: '280px',
                        pointerEvents: 'auto',
                        touchAction: 'manipulation',
                        WebkitUserSelect: 'text',
                        userSelect: 'text',
                        fontSize: '16px',
                        WebkitTransform: 'translateZ(0)',
                        transform: 'translateZ(0)',
                        position: 'relative',
                        zIndex: 10,
                        WebkitTouchCallout: 'default',
                        WebkitAppearance: 'none',
                        backfaceVisibility: 'hidden',
                        perspective: '1000px',
                        width: '100%',
                        minWidth: '100%',
                        minHeight: '60px',
                        cursor: 'text',
                        WebkitOverflowScrolling: 'touch'
                      }}
                    />
                    

                    {/* Action buttons container */}
                    <div className="absolute bottom-2 right-1 sm:right-2 flex items-center gap-1.5 sm:gap-3 z-20">
                      {/* Improve Question Button */}
                      {inputValue.trim() && hasMinimumWords(inputValue) && (
                        <motion.button
                          whileHover={!hasBeenImproved && !isImproving ? { scale: 1.05 } : {}}
                          whileTap={!hasBeenImproved && !isImproving ? { scale: 0.95 } : {}}
                          style={{ pointerEvents: 'auto', zIndex: 30 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!hasBeenImproved && !isImproving) {
                              handleImproveQuestion();
                            }
                          }}
                          disabled={isImproving || hasBeenImproved}
                          className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            hasBeenImproved || isImproving
                              ? 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                          }`}
                          title={hasBeenImproved ? "Question already improved" : "Improve question"}
                          type="button"
                        >
                          <div className="relative z-10 flex items-center justify-center">
                            {isImproving ? (
                              <svg className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                            )}
                          </div>
                        </motion.button>
                      )}
                      
                      {/* Send Button - Matching ChatSection Design */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ pointerEvents: 'auto', zIndex: 30 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSendToHomepage();
                        }}
                        disabled={!inputValue.trim()}
                        className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                          inputValue.trim()
                            ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                            : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }`}
                        title="Send message"
                        type="button"
                      >
                        <div className="relative z-10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                          </svg>
                        </div>
                      </motion.button>

                      {/* Reset/Close Button - Matching ChatSection Design */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleResetInput();
                        }}
                        className="group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                        title="Clear and reset"
                        type="button"
                      >
                        <div className="relative z-10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
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
