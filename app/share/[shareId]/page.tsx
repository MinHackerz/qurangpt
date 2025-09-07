'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { processContentLinks } from '../../utils/contentUtils';
import ShareModal from '../../components/ShareModal';
import { useAIResponse } from '../../hooks/useAIResponse';
import { useTranslationManager } from '../../hooks/useTranslationManager';

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
  
  // Chat functionality state
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputContent, setInputContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [responseError, setResponseError] = useState('');
  const [isTextLarge, setIsTextLarge] = useState(false);
  
  // Share functionality state
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Translation functionality
  const { extractAIContentForTranslation, extractAyahInfoForCopy, mergeTranslatedContent, translateAIContent } = useTranslationManager();
  const { askQuran } = useAIResponse(isTextLarge);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle asking Quran with the new hook
  const handleAskQuran = useCallback(async () => {
    if (!inputContent || inputContent.trim().length === 0) {
      setResponseError('Question content is missing. Please try again.');
      return;
    }
    
    const questionText = inputContent.trim();
    
    try {
      await askQuran(
        questionText,
        setIsProcessing,
        setAiResponse,
        setShowAiResponse,
        setResponseError,
        setAiResponse, // For displayed content
        () => {}, // setCurrentLanguage - not needed for shared page
        () => {}, // setShowTranslateSection - not needed for shared page
      );
      
      // Show the AI response
      setShowAiResponse(true);
    } catch (error) {
      setResponseError('Failed to process question. Please try again.');
    }
  }, [askQuran, inputContent]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputContent(e.target.value);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return; // Allow new line with Shift+Enter
      } else {
        e.preventDefault();
        handleAskQuran();
      }
    }
  };

  // Handle copying AI content
  const handleCopyAIContent = useCallback(async () => {
    try {
      const ayahInfo = extractAyahInfoForCopy(aiResponse);
      const aiContentToCopy = extractAIContentForTranslation(aiResponse);
      
      let cleanAIContent = aiContentToCopy
        .replace(/<[^>]*>/g, '')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/^\s+|\s+$/gm, '')
        .trim();

      if (ayahInfo.length > 0) {
        ayahInfo.forEach((ayah, index) => {
          const placeholder = `__AYAH_BOX_${index}__`;
          const formattedAyah = `"${ayah.text}" (${ayah.surahName} ${ayah.ayahNumber})`;
          cleanAIContent = cleanAIContent.replace(placeholder, formattedAyah);
        });
      }

      const combinedContent = `Question: ${inputContent}\n\nAnswer: ${cleanAIContent}`;
      
      await navigator.clipboard.writeText(combinedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
    }
  }, [aiResponse, inputContent, extractAIContentForTranslation, extractAyahInfoForCopy]);

  // Handle sharing AI content
  const handleShareContent = useCallback(async () => {
    if (!inputContent || !aiResponse) {
      return;
    }

    setIsSharing(true);
    setShowShareSuccess(false);

    try {
      const title = inputContent.length > 50 
        ? inputContent.substring(0, 50) + '...' 
        : inputContent;

      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: inputContent,
          response: aiResponse,
          title: title
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);

      // Track share creation in Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'content_shared', {
          event_category: 'engagement',
          event_label: 'share_created',
          custom_parameter_1: inputContent.substring(0, 100),
          custom_parameter_2: 'shared_page'
        });
      }

      await navigator.clipboard.writeText(data.shareUrl);
      setShowShareSuccess(true);
      setTimeout(() => setShowShareSuccess(false), 3000);

    } catch (error) {
      console.error('Error sharing content:', error);
    } finally {
      setIsSharing(false);
    }
  }, [inputContent, aiResponse]);

  // Handle share button click
  const handleShareClick = () => {
    if (shareUrl) {
      setShowShareModal(true);
    } else {
      if (handleShareContent) {
        handleShareContent();
      }
    }
  };

  // Handle text size toggle
  const handleTextSizeToggle = useCallback(() => {
    setIsTextLarge(!isTextLarge);
  }, [isTextLarge]);

  // Auto-resize textarea
  const autoResize = (target: HTMLTextAreaElement) => {
    target.style.height = 'auto';
    const scrollHeight = target.scrollHeight;
    const isMobile = window.innerWidth < 640;
    const minHeight = isMobile ? 56 : 60;
    const maxHeight = isMobile ? 300 : 240;
    
    let newHeight = Math.max(scrollHeight, minHeight);
    
    if (isMobile && scrollHeight > minHeight) {
      newHeight = Math.min(scrollHeight + 20, maxHeight);
    } else {
      newHeight = Math.min(newHeight, maxHeight);
    }
    
    target.style.height = newHeight + 'px';
    
    if (isMobile && newHeight >= maxHeight) {
      target.style.overflowY = 'auto';
    } else {
      target.style.overflowY = 'hidden';
    }
  };

  // Effect to handle textarea resize
  useEffect(() => {
    if (textareaRef.current) {
      autoResize(textareaRef.current);
    }
  }, [inputContent]);

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
          
          console.error('API Error:', { status: response.status, message: errorMessage });
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

  if (error || !sharedContent) {
    return (
      <>
        <Head>
          <title>Content Expired - QuranGPT</title>
          <meta name="description" content="This shared content has expired or is no longer available." />
        </Head>

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
      <Head>
        <title>Shared Content - QuranGPT</title>
        <meta name="description" content="Shared content from QuranGPT - AI-Powered Islamic Knowledge Base" />
        <meta property="og:title" content="Shared Content - QuranGPT" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://quran-gpt.netlify.app/share/${shareId}`} />
        <meta property="og:image" content="https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png" />
        <meta property="og:site_name" content="QuranGPT - Get the Guidance from the Holy Quran" />
        <meta property="og:description" content="Shared content from QuranGPT - AI-Powered Islamic Knowledge Base" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Shared Content - QuranGPT" />
        <meta name="twitter:description" content="Shared content from QuranGPT - AI-Powered Islamic Knowledge Base" />
        <meta name="twitter:image" content="https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png" />
        <meta name="google-site-verification" content="NGBfty7J9MyQwQ5DT-wvArocgpJC72IXOrH4M1IIJAs" />
        <meta name="msvalidate.01" content="5CC4429FDE08444C1CB98ECB946F1E2C" />
      </Head>

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
            <div className="flex items-center justify-center gap-3 mb-2">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Shared from QuranGPT
              </p>
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

          {/* AI Response Section - Only show when there's a response */}
          {showAiResponse && aiResponse && (
            <div className="bg-transparent rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                AI Response
              </h2>
              <div 
                className={`text-gray-700 dark:text-gray-300 leading-relaxed space-y-4 ${
                  isTextLarge ? 'text-base' : 'text-sm'
                }`}
                dangerouslySetInnerHTML={{ 
                  __html: processContentLinks(aiResponse) 
                }}
              />
              
              {/* Action buttons for AI response */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {/* Copy Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopyAIContent}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    copied 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {copied ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">
                    {copied ? 'Copied!' : 'Copy Response'}
                  </span>
                </motion.button>

                {/* Share Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShareClick}
                  disabled={isSharing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    showShareSuccess 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : isSharing
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {showShareSuccess ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : isSharing ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  )}
                  <span className="text-sm font-medium">
                    {showShareSuccess ? 'Shared!' : isSharing ? 'Sharing...' : 'Share Response'}
                  </span>
                </motion.button>

                {/* Text Size Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTextSizeToggle}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isTextLarge 
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' 
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  title={isTextLarge ? "Reduce text size" : "Increase text size"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <span className="text-sm font-medium">
                    {isTextLarge ? 'Smaller Text' : 'Larger Text'}
                  </span>
                </motion.button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {responseError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-8">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                  {responseError}
                </p>
              </div>
            </div>
          )}

          {/* Bottom Spacing */}
          <div className="h-20"></div>

          {/* Floating Button/Input Section */}
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
            {!isInputMode ? (
              /* Ask QuranGPT Button with Share Icon */
              <div className="flex items-center gap-3 justify-center">
                <button 
                  onClick={() => setIsInputMode(true)}
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
              /* Input Field Mode - ChatGPT-style */
              <div className="relative">
                <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 shadow-sm">
                  <textarea
                    ref={textareaRef}
                    placeholder="Ask me anything about Quran & Islam..."
                    value={inputContent}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className={`w-full p-3 sm:p-4 bg-transparent text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 placeholder:font-light placeholder:tracking-wide border-none resize-none focus:outline-none text-sm sm:text-base leading-relaxed min-h-[48px] sm:min-h-[52px] max-h-[200px] sm:max-h-[180px] transition-all duration-200 ${
                      inputContent.trim() ? 'pr-24 sm:pr-28' : 'pr-14 sm:pr-16'
                    }`}
                    style={{ 
                      height: 'auto',
                      overflow: 'hidden'
                    }}
                  />
                  
                  {/* Action buttons container */}
                  <div className="absolute top-1/2 right-3 sm:right-4 transform -translate-y-1/2 flex items-center gap-3">
                    {/* Send Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAskQuran}
                      disabled={isProcessing || !inputContent.trim()}
                      className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        inputContent.trim() && !isProcessing
                          ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                          : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      }`}
                      title="Send message"
                    >
                      {isProcessing ? (
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                      )}
                    </motion.button>

                    {/* Clear Button */}
                    <AnimatePresence>
                      {inputContent.trim() && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setInputContent('');
                            setIsInputMode(false);
                            setShowAiResponse(false);
                            setAiResponse('');
                            setResponseError('');
                          }}
                          disabled={isProcessing}
                          className={`group relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            !isProcessing
                              ? 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                              : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          }`}
                          title="Clear and reset"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl || (typeof window !== 'undefined' ? window.location.href : '')}
        title={inputContent ? `QuranGPT: ${inputContent}` : 'QuranGPT Answer'}
        question={inputContent || 'QuranGPT Question'}
        isCreatingShare={isSharing}
        onCopyContent={handleCopyAIContent}
        copied={copied}
        content={aiResponse}
      />
    </div>
    </>
  );
}