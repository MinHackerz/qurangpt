import type { Metadata } from 'next';
import ZakatCalculator from '../components/ZakatCalculator';
import AskBar from '../mosques/AskBar';

export const metadata: Metadata = {
  title: 'Zakat Calculator - Calculate Your Islamic Charity Obligation | QuranGPT',
  description:
    'Calculate your Zakat obligation accurately with our comprehensive Islamic charity calculator. Includes assets, liabilities, and current Nisab thresholds.',
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zakat Calculator - Islamic Charity Calculator',
    description:
      'Calculate your Zakat obligation with our comprehensive calculator. Includes all assets, liabilities, and current Nisab thresholds.',
  },
};

export default function ZakatCalculatorPage() {
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

      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 pb-28">
        {/* Main feature */}
        <ZakatCalculator />
      </div>

      {/* Bottom Ask QuranGPT input */}
      <AskBar />
    </div>
  );
}
