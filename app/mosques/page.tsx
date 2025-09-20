'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import MosqueFinder from '../components/MosqueFinder';
import AskQuranGPTInput from '../components/AskQuranGPTInput';

export default function MosquesPage() {
  // State for Ask QuranGPT functionality
  const [showNewQuestionInput, setShowNewQuestionInput] = useState(false);

  // Handle Ask QuranGPT button click - convert to input field
  const handleAskQuranClick = () => {
    setShowNewQuestionInput(true);
  };

  // Set document title and meta tags
  useEffect(() => {
    document.title = 'Find Mosques Near Me - Islamic Centers & Prayer Places | QuranGPT';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Find nearby mosques and Islamic centers with our mosque finder. Get directions, prayer times, contact information, and real-time navigation to the nearest mosque.');
    }
    
    // Update Open Graph title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', 'Find Mosques Near Me - Islamic Centers & Prayer Places | QuranGPT');
    }
    
    // Update Open Graph description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', 'Find nearby mosques and Islamic centers with our mosque finder. Get directions, prayer times, contact information, and real-time navigation to the nearest mosque.');
    }
    
    // Update Twitter title
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', 'Find Mosques Near Me - Islamic Centers & Prayer Places | QuranGPT');
    }
    
    // Update Twitter description
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', 'Find nearby mosques and Islamic centers with our mosque finder. Get directions, prayer times, contact information, and real-time navigation to the nearest mosque.');
    }
  }, []);

  return (
    <>
      <Head>
        <title>Find Mosques Near Me - Islamic Centers & Prayer Places | QuranGPT</title>
        <meta name="description" content="Find nearby mosques and Islamic centers with our mosque finder. Get directions, prayer times, contact information, and real-time navigation to the nearest mosque." />
        <meta name="keywords" content="find mosques near me, nearby mosques, islamic centers, mosque finder, prayer places, mosque directory, islamic places of worship, mosque locator, nearest mosque, mosque directions, islamic community centers, prayer hall finder, mosque search, islamic worship places, mosque map, islamic centers near me, mosque contact info, prayer times, islamic community, mosque services" />
        <meta property="og:title" content="Find Mosques Near Me - Islamic Centers & Prayer Places | QuranGPT" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://quran-gpt.netlify.app/mosques" />
        <meta property="og:image" content="https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png" />
        <meta property="og:site_name" content="QuranGPT - Get the Guidance from the Holy Quran" />
        <meta property="og:description" content="Find nearby mosques and Islamic centers with our mosque finder. Get directions, prayer times, contact information, and real-time navigation to the nearest mosque." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Find Mosques Near Me - Islamic Centers & Prayer Places | QuranGPT" />
        <meta name="twitter:description" content="Find nearby mosques and Islamic centers with our mosque finder. Get directions, prayer times, contact information, and real-time navigation to the nearest mosque." />
        <meta name="twitter:image" content="https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png" />
        <meta name="google-site-verification" content="NGBfty7J9MyQwQ5DT-wvArocgpJC72IXOrH4M1IIJAs" />
        <meta name="msvalidate.01" content="5CC4429FDE08444C1CB98ECB946F1E2C" />
        <link rel="canonical" href="https://quran-gpt.netlify.app/mosques" />
      </Head>

      {/* Structured Data for Mosque Finder */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Mosque Finder - Find Islamic Centers Near You",
            "description": "Find nearby mosques and Islamic centers with our mosque finder. Get directions, prayer times, contact information, and real-time navigation to the nearest mosque.",
            "url": "https://quran-gpt.netlify.app/mosques",
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
              "Find nearby mosques",
              "Interactive map with directions",
              "Contact information",
              "Prayer times",
              "Real-time navigation",
              "Distance calculation",
              "Opening hours",
              "Ratings and reviews"
            ]
          })
        }}
      />
      
      {/* Local Business Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Mosques and Islamic Centers",
            "description": "A comprehensive directory of mosques and Islamic centers worldwide",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "item": {
                  "@type": "PlaceOfWorship",
                  "@id": "https://quran-gpt.netlify.app/mosques",
                  "name": "Mosques and Islamic Centers",
                  "description": "Find mosques and Islamic centers near your location",
                  "url": "https://quran-gpt.netlify.app/mosques",
                  "address": {
                    "@type": "PostalAddress",
                    "addressCountry": "Worldwide"
                  },
                  "telephone": "Available through individual mosque listings",
                  "openingHours": "Varies by location",
                  "priceRange": "Free",
                  "amenityFeature": [
                    {
                      "@type": "LocationFeatureSpecification",
                      "name": "Prayer Hall",
                      "value": true
                    },
                    {
                      "@type": "LocationFeatureSpecification",
                      "name": "Islamic Education",
                      "value": true
                    },
                    {
                      "@type": "LocationFeatureSpecification",
                      "name": "Community Services",
                      "value": true
                    }
                  ]
                }
              }
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
                "name": "How do I find mosques near my location?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Our mosque finder uses your device's GPS location to search for nearby mosques and Islamic centers. Simply allow location access and the app will show you all mosques within your selected radius."
                }
              },
              {
                "@type": "Question",
                "name": "What information do you provide about each mosque?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "For each mosque, we provide the name, address, contact information, opening hours, ratings, distance from your location, and directions to get there."
                }
              },
              {
                "@type": "Question",
                "name": "Can I get directions to a mosque?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! You can get turn-by-turn directions to any mosque using our integrated map feature. The app will show you the best route and estimated travel time."
                }
              },
              {
                "@type": "Question",
                "name": "How accurate is the mosque information?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Our mosque finder uses Google Places API to provide accurate and up-to-date information about mosques and Islamic centers, including their current status and contact details."
                }
              },
              {
                "@type": "Question",
                "name": "Can I search for mosques in different cities?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, you can search for mosques in any location by updating your location or searching for specific areas. The app works worldwide wherever Google Maps is available."
                }
              }
            ]
          })
        }}
      />

      <MosqueFinder />
      
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
              console.log('onSend called with:', question, options);
              // Create URL with query parameters
              const params = new URLSearchParams({
                question: question,
                tafsir: options.tafsir.toString(),
                hadith: options.hadith.toString(),
                suggestedQuestions: options.suggestedQuestions.toString(),
                textSize: options.textSize
              });
              
              console.log('Redirecting to:', `/?${params.toString()}`);
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
