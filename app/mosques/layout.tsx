import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Nearby Mosques & Islamic Centers | Mosque Finder | QuranGPT',
  description:
    'Discover nearby mosques and Islamic centers with directions, distance, and contact info. Works on mobile and desktop with precise location support.',
  keywords: [
    'mosque finder',
    'nearby mosques',
    'islamic centers',
    'mosque locator',
    'find mosque',
    'islamic places',
    'mosque directory',
    'islamic community',
    'prayer times',
    'mosque directions',
    'islamic worship',
    'local mosques',
    'islamic services',
    'mosque contact',
    'islamic facilities'
  ],
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
    images: [
      {
        url: 'https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png',
        width: 1200,
        height: 630,
        alt: 'QuranGPT Mosque Finder',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mosque Finder — Nearby Mosques & Islamic Centers',
    description:
      'Find the nearest mosques with driving directions, live distance, and contact details. Optimized for mobile and desktop.',
    images: ['https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png'],
  },
};

export default function MosquesLayout({ children }: { children: React.ReactNode }) {
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


      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 sm:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}


