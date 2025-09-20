'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import ReadQuran from '../components/ReadQuran';
import AskQuranGPTInput from '../components/AskQuranGPTInput';

export default function QuranPage() {
  // State for Ask QuranGPT functionality
  const [showNewQuestionInput, setShowNewQuestionInput] = useState(false);

  // Handle Ask QuranGPT button click - convert to input field
  const handleAskQuranClick = () => {
    setShowNewQuestionInput(true);
  };

  // Set document title and meta tags
  useEffect(() => {
    document.title = 'Read Quran Online - Complete Holy Quran with Translation & Audio | QuranGPT';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Read the complete Holy Quran online with Arabic text, English translation, transliteration, and audio recitation. Browse all 114 surahs with multiple translations and reciters.');
    }
    
    // Update Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Read Quran Online - Complete Holy Quran with Translation & Audio | QuranGPT');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Read the complete Holy Quran online with Arabic text, English translation, transliteration, and audio recitation. Browse all 114 surahs with multiple translations and reciters.');
    }
    
    // Update Twitter title
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', 'Read Quran Online - Complete Holy Quran with Translation & Audio | QuranGPT');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Read the complete Holy Quran online with Arabic text, English translation, transliteration, and audio recitation. Browse all 114 surahs with multiple translations and reciters.');
    }
  }, []);

  return (
    <>
      <Head>
        <title>Read Quran Online - Complete Holy Quran with Translation & Audio | QuranGPT</title>
        <meta name="description" content="Read the complete Holy Quran online with Arabic text, English translation, transliteration, and audio recitation. Browse all 114 surahs with multiple translations and reciters." />
        <meta name="keywords" content="read quran online, holy quran, quran translation, quran audio, quran recitation, arabic quran, quran with translation, quran transliteration, quran surahs, quran verses, islamic quran, quran app, quran reader, quran study, quran tafsir, quran commentary, quran interpretation, quran meaning, quran english, quran arabic" />
        <meta property="og:title" content="Read Quran Online - Complete Holy Quran with Translation & Audio | QuranGPT" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://quran-gpt.netlify.app/quran" />
        <meta property="og:image" content="https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png" />
        <meta property="og:site_name" content="QuranGPT - Get the Guidance from the Holy Quran" />
        <meta property="og:description" content="Read the complete Holy Quran online with Arabic text, English translation, transliteration, and audio recitation. Browse all 114 surahs with multiple translations and reciters." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Read Quran Online - Complete Holy Quran with Translation & Audio | QuranGPT" />
        <meta name="twitter:description" content="Read the complete Holy Quran online with Arabic text, English translation, transliteration, and audio recitation. Browse all 114 surahs with multiple translations and reciters." />
        <meta name="twitter:image" content="https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png" />
        <meta name="google-site-verification" content="NGBfty7J9MyQwQ5DT-wvArocgpJC72IXOrH4M1IIJAs" />
        <meta name="msvalidate.01" content="5CC4429FDE08444C1CB98ECB946F1E2C" />
        <link rel="canonical" href="https://quran-gpt.netlify.app/quran" />
      </Head>
      {/* Structured Data for Quran Reader */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Quran Reader - Read Holy Quran Online",
            "description": "Read the complete Holy Quran online with Arabic text, English translation, transliteration, and audio recitation. Browse all 114 surahs with multiple translations and reciters.",
            "url": "https://quran-gpt.netlify.app/quran",
            "applicationCategory": "ReligionApplication",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "creator": {
              "@type": "Organization",
              "name": "QuranGPT"
            },
            "featureList": [
              "Complete Quran with Arabic text",
              "Multiple English translations",
              "Audio recitation by famous reciters",
              "Transliteration support",
              "Tafsir and commentary",
              "Bookmark verses",
              "Search functionality",
              "Mobile-optimized reading"
            ]
          })
        }}
      />
      
      {/* Book Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            "name": "The Holy Quran",
            "alternateName": "Quran",
            "description": "The Holy Quran is the central religious text of Islam, believed by Muslims to be a revelation from God. It is organized in 114 chapters (surahs) and contains 6,236 verses (ayahs).",
            "author": {
              "@type": "Person",
              "name": "Allah (God)"
            },
            "publisher": {
              "@type": "Organization",
              "name": "QuranGPT"
            },
            "inLanguage": ["ar", "en"],
            "bookFormat": "EBook",
            "numberOfPages": 604,
            "isbn": "978-0-00-000000-0",
            "genre": "Religious Text",
            "about": {
              "@type": "Thing",
              "name": "Islam"
            }
          })
        }}
      />

      {/* FAQ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How many surahs are in the Quran?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Holy Quran contains 114 surahs (chapters), ranging from the longest (Al-Baqarah with 286 verses) to the shortest (Al-Kawthar with 3 verses)."
                }
              },
              {
                "@type": "Question",
                "name": "Can I listen to Quran recitation?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! Our Quran reader includes audio recitation by famous reciters. You can listen to each verse while reading the Arabic text and translation."
                }
              },
              {
                "@type": "Question",
                "name": "What translations are available?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We offer multiple English translations including popular versions like Muhammad Asad, Abdullah Yusuf Ali, and others to help you understand the meaning of the Quran."
                }
              },
              {
                "@type": "Question",
                "name": "Can I bookmark verses?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, you can bookmark your favorite verses for easy access later. The bookmarks are saved locally on your device."
                }
              },
              {
                "@type": "Question",
                "name": "Is there tafsir available?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, we provide tafsir (commentary) for verses to help you understand the deeper meaning and context of the Quranic text."
                }
              }
            ]
          })
        }}
      />

      <ReadQuran />
      
      {/* Bottom spacing for floating button */}
      <div className="h-24"></div>
      
      {/* Floating Button/Input Section */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4 sm:px-6">
        <div className="w-full">
        {!showNewQuestionInput ? (
          /* Ask QuranGPT Button */
          <div className="flex items-center justify-center">
            <button 
              onClick={handleAskQuranClick}
              className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-full transition-all duration-200 text-sm sm:text-base font-medium shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Ask QuranGPT
            </button>
          </div>
        ) : (
          /* Converted Input Field */
          <AskQuranGPTInput 
            onSend={(question, options) => {
              // Create URL with query parameters
              const params = new URLSearchParams({
                question: question,
                tafsir: options.tafsir.toString(),
                hadith: options.hadith.toString(),
                suggestedQuestions: options.suggestedQuestions.toString(),
                textSize: options.textSize
              });
              
              // Redirect to homepage with parameters
              window.location.href = `/?${params.toString()}`;
            }}
            onReset={() => {
              setShowNewQuestionInput(false);
            }}
          />
        )}
        </div>
      </div>
    </>
  );
}
