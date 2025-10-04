import type { Metadata } from 'next';
import MosqueFinder from '../components/MosqueFinder';
import AskBar from './AskBar';

export const metadata: Metadata = {
  title: 'Find Nearby Mosques & Islamic Centers | Mosque Finder | QuranGPT',
  description:
    'Discover nearby mosques and Islamic centers with directions, distance, and contact info. Works on mobile and desktop with precise location support.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://quran-gpt.netlify.app/mosques',
  },
  openGraph: {
    title: 'Mosque Finder — Nearby Mosques & Islamic Centers',
    description:
      'Find the nearest mosques with driving directions, live distance, and contact details. Optimized for mobile and desktop.',
    url: 'https://quran-gpt.netlify.app/mosques',
    siteName: 'QuranGPT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mosque Finder — Nearby Mosques & Islamic Centers',
    description:
      'Find the nearest mosques with driving directions, live distance, and contact details. Optimized for mobile and desktop.',
  },
};

export default function MosqueFinderPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Mosque Finder',
    url: 'https://quran-gpt.netlify.app/mosques',
    description:
      'Discover nearby mosques and Islamic centers with directions, distance, and contact info.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://quran-gpt.netlify.app/mosques?lat={lat}&lon={lon}&radius={radius}',
      'query-input': 'required name=lat required name=lon optional name=radius',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 pb-28">
        {/* Main feature */}
        <MosqueFinder />
      </div>

      {/* Bottom Ask QuranGPT input with 20px padding */}
      <AskBar />
    </div>
  );
}


