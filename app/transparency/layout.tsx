import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transparency - AI Technology & Data Sources | QuranGPT',
  description:
    'Learn about QuranGPT\'s AI technology, data sources, privacy practices, and commitment to transparency. Built with Google Gemini AI and authentic Islamic sources.',
  keywords: [
    'quran gpt transparency',
    'ai technology',
    'islamic ai',
    'quran ai',
    'gemini ai',
    'islamic data sources',
    'quran authenticity',
    'hadith sources',
    'tafsir sources',
    'privacy policy',
    'data security',
    'islamic technology',
    'quran accuracy',
    'ai reliability',
    'transparent ai'
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
    canonical: 'https://quran-gpt.netlify.app/transparency',
  },
  openGraph: {
    title: 'Transparency - AI Technology & Data Sources | QuranGPT',
    description:
      'Learn about QuranGPT\'s AI technology, data sources, privacy practices, and commitment to transparency. Built with Google Gemini AI and authentic Islamic sources.',
    url: 'https://quran-gpt.netlify.app/transparency',
    siteName: 'QuranGPT',
    type: 'website',
    images: [
      {
        url: 'https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png',
        width: 1200,
        height: 630,
        alt: 'QuranGPT Transparency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Transparency - AI Technology & Data Sources | QuranGPT',
    description:
      'Learn about QuranGPT\'s AI technology, data sources, privacy practices, and commitment to transparency. Built with Google Gemini AI and authentic Islamic sources.',
    images: ['https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png'],
  },
};

export default function TransparencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Transparency - AI Technology & Data Sources',
    url: 'https://quran-gpt.netlify.app/transparency',
    description:
      'Learn about QuranGPT\'s AI technology, data sources, privacy practices, and commitment to transparency.',
    about: {
      '@type': 'Thing',
      name: 'AI Transparency',
    },
    mainEntity: {
      '@type': 'Organization',
      name: 'QuranGPT',
      description: 'AI-powered Islamic guidance platform',
      url: 'https://quran-gpt.netlify.app',
    },
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </div>
  );
}

