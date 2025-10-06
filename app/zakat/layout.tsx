import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zakat Calculator - Calculate Your Islamic Charity Obligation | QuranGPT',
  description:
    'Calculate your Zakat obligation accurately with our comprehensive Islamic charity calculator. Includes assets, liabilities, and current Nisab thresholds.',
  keywords: [
    'zakat calculator',
    'islamic charity',
    'zakat calculation',
    'nisab calculator',
    'zakat obligation',
    'islamic giving',
    'charity calculator',
    'zakat amount',
    'islamic finance',
    'zakat rules',
    'islamic wealth',
    'zakat threshold',
    'charity obligation',
    'islamic donation',
    'zakat formula'
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
    canonical: 'https://quran-gpt.netlify.app/zakat',
  },
  openGraph: {
    title: 'Zakat Calculator - Islamic Charity Calculator',
    description:
      'Calculate your Zakat obligation with our comprehensive calculator. Includes all assets, liabilities, and current Nisab thresholds.',
    url: 'https://quran-gpt.netlify.app/zakat',
    siteName: 'QuranGPT',
    type: 'website',
    images: [
      {
        url: 'https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png',
        width: 1200,
        height: 630,
        alt: 'QuranGPT Zakat Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zakat Calculator - Islamic Charity Calculator',
    description:
      'Calculate your Zakat obligation with our comprehensive calculator. Includes all assets, liabilities, and current Nisab thresholds.',
    images: ['https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png'],
  },
};

export default function ZakatLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Zakat Calculator',
    url: 'https://quran-gpt.netlify.app/zakat',
    description:
      'Calculate your Zakat obligation accurately with our comprehensive Islamic charity calculator.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://quran-gpt.netlify.app/zakat',
      'query-input': 'zakat calculation',
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
