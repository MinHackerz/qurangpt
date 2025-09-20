'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import QiblaFinder from '../components/QiblaFinder';
import AskQuranGPTInput from '../components/AskQuranGPTInput';

export default function QiblaPage() {
  // State for Ask QuranGPT functionality
  const [showNewQuestionInput, setShowNewQuestionInput] = useState(false);

  // Handle Ask QuranGPT button click - convert to input field
  const handleAskQuranClick = () => {
    setShowNewQuestionInput(true);
  };

  // Set document title and meta tags
  useEffect(() => {
    document.title = 'Qibla Direction Finder - Find Mecca Direction from Anywhere | QuranGPT';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Find the exact Qibla direction to Mecca from your location with our accurate compass. Get real-time Qibla direction, distance to Kaaba, and compass guidance for prayer.');
    }
    
    // Update Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Qibla Direction Finder - Find Mecca Direction from Anywhere | QuranGPT');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Find the exact Qibla direction to Mecca from your location with our accurate compass. Get real-time Qibla direction, distance to Kaaba, and compass guidance for prayer.');
    }
    
    // Update Twitter title
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', 'Qibla Direction Finder - Find Mecca Direction from Anywhere | QuranGPT');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Find the exact Qibla direction to Mecca from your location with our accurate compass. Get real-time Qibla direction, distance to Kaaba, and compass guidance for prayer.');
    }
  }, []);

  return (
    <>
      <Head>
        <title>Qibla Direction Finder - Find Mecca Direction from Anywhere | QuranGPT</title>
        <meta name="description" content="Find the exact Qibla direction to Mecca from your location with our accurate compass. Get real-time Qibla direction, distance to Kaaba, and compass guidance for prayer." />
        <meta name="keywords" content="qibla direction, mecca direction, qibla compass, kaaba direction, prayer direction, islamic compass, qibla finder, makkah direction, prayer times, islamic prayer, muslim compass, qibla calculator, direction to mecca, qibla app, islamic navigation" />
        <meta property="og:title" content="Qibla Direction Finder - Find Mecca Direction from Anywhere | QuranGPT" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://quran-gpt.netlify.app/qibla" />
        <meta property="og:image" content="https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png" />
        <meta property="og:site_name" content="QuranGPT - Get the Guidance from the Holy Quran" />
        <meta property="og:description" content="Find the exact Qibla direction to Mecca from your location with our accurate compass. Get real-time Qibla direction, distance to Kaaba, and compass guidance for prayer." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Qibla Direction Finder - Find Mecca Direction from Anywhere | QuranGPT" />
        <meta name="twitter:description" content="Find the exact Qibla direction to Mecca from your location with our accurate compass. Get real-time Qibla direction, distance to Kaaba, and compass guidance for prayer." />
        <meta name="twitter:image" content="https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png" />
        <meta name="google-site-verification" content="NGBfty7J9MyQwQ5DT-wvArocgpJC72IXOrH4M1IIJAs" />
        <meta name="msvalidate.01" content="5CC4429FDE08444C1CB98ECB946F1E2C" />
        <link rel="canonical" href="https://quran-gpt.netlify.app/qibla" />
      </Head>
      {/* Structured Data for Qibla Finder */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Qibla Direction Finder",
            "description": "Find the exact Qibla direction to Mecca from your location with our accurate compass. Get real-time Qibla direction, distance to Kaaba, and compass guidance for prayer.",
            "url": "https://quran-gpt.netlify.app/qibla",
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
              "Real-time Qibla direction",
              "Distance to Kaaba calculation",
              "Compass guidance",
              "Mobile-optimized interface",
              "Accurate geolocation"
            ]
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
                "name": "How do I find the Qibla direction?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Our Qibla finder uses your device's GPS location to calculate the exact direction to Mecca. Simply allow location access and the compass will show you the precise Qibla direction."
                }
              },
              {
                "@type": "Question",
                "name": "Is the Qibla direction accurate?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, our Qibla finder uses advanced geolocation algorithms to provide highly accurate direction calculations to the Kaaba in Mecca."
                }
              },
              {
                "@type": "Question",
                "name": "Can I use this on mobile devices?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely! Our Qibla finder is fully optimized for mobile devices and includes a compass feature for real-time direction guidance."
                }
              },
              {
                "@type": "Question",
                "name": "What is the distance to Kaaba?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The app calculates and displays the exact distance from your current location to the Kaaba in Mecca, measured in kilometers."
                }
              }
            ]
          })
        }}
      />

      <QiblaFinder />
      
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
