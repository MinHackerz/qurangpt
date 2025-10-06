import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Read Quran Online - Complete Holy Quran with Translation & Audio | QuranGPT',
  description:
    'Read the complete Holy Quran online with Arabic text, English translation, transliteration, and audio recitation. Browse all 114 surahs with multiple translations and reciters.',
  keywords: [
    'read quran online',
    'holy quran',
    'quran translation',
    'quran audio',
    'quran recitation',
    'arabic quran',
    'quran with translation',
    'quran transliteration',
    'quran surahs',
    'quran verses',
    'islamic quran',
    'quran app',
    'quran reader',
    'quran study',
    'quran tafsir',
    'quran commentary',
    'quran interpretation',
    'quran meaning',
    'quran english',
    'quran arabic'
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
    canonical: 'https://quran-gpt.netlify.app/quran',
  },
  openGraph: {
    title: 'Read Quran Online - Complete Holy Quran with Translation & Audio | QuranGPT',
    description:
      'Read the complete Holy Quran online with Arabic text, English translation, transliteration, and audio recitation. Browse all 114 surahs with multiple translations and reciters.',
    url: 'https://quran-gpt.netlify.app/quran',
    siteName: 'QuranGPT - Get the Guidance from the Holy Quran',
    type: 'website',
    images: [
      {
        url: 'https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png',
        width: 1200,
        height: 630,
        alt: 'QuranGPT - Read Quran Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Read Quran Online - Complete Holy Quran with Translation & Audio | QuranGPT',
    description:
      'Read the complete Holy Quran online with Arabic text, English translation, transliteration, and audio recitation. Browse all 114 surahs with multiple translations and reciters.',
    images: ['https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png'],
  },
  verification: {
    google: 'NGBfty7J9MyQwQ5DT-wvArocgpJC72IXOrH4M1IIJAs',
    other: {
      'msvalidate.01': '5CC4429FDE08444C1CB98ECB946F1E2C',
    },
  },
};

export default function QuranLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Quran Reader - Read Holy Quran Online',
    description:
      'Read the complete Holy Quran online with Arabic text, English translation, transliteration, and audio recitation. Browse all 114 surahs with multiple translations and reciters.',
    url: 'https://quran-gpt.netlify.app/quran',
    applicationCategory: 'ReligionApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    creator: {
      '@type': 'Organization',
      name: 'QuranGPT',
    },
    featureList: [
      'Complete Quran with Arabic text',
      'Multiple English translations',
      'Audio recitation by famous reciters',
      'Transliteration support',
      'Tafsir and commentary',
      'Bookmark verses',
      'Search functionality',
      'Mobile-optimized reading',
    ],
  };

  const bookJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: 'The Holy Quran',
    alternateName: 'Quran',
    description:
      'The Holy Quran is the central religious text of Islam, believed by Muslims to be a revelation from God. It is organized in 114 chapters (surahs) and contains 6,236 verses (ayahs).',
    author: {
      '@type': 'Person',
      name: 'Allah (God)',
    },
    publisher: {
      '@type': 'Organization',
      name: 'QuranGPT',
    },
    inLanguage: ['ar', 'en'],
    bookFormat: 'EBook',
    numberOfPages: 604,
    isbn: '978-0-00-000000-0',
    genre: 'Religious Text',
    about: {
      '@type': 'Thing',
      name: 'Islam',
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How many surahs are in the Quran?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The Holy Quran contains 114 surahs (chapters), ranging from the longest (Al-Baqarah with 286 verses) to the shortest (Al-Kawthar with 3 verses).',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I listen to Quran recitation?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Our Quran reader includes audio recitation by famous reciters. You can listen to each verse while reading the Arabic text and translation.',
        },
      },
      {
        '@type': 'Question',
        name: 'What translations are available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We offer multiple English translations including popular versions like Muhammad Asad, Abdullah Yusuf Ali, and others to help you understand the meaning of the Quran.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I bookmark verses?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, you can bookmark your favorite verses for easy access later. The bookmarks are saved locally on your device.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is there tafsir available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, we provide tafsir (commentary) for verses to help you understand the deeper meaning and context of the Quranic text.',
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />


      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 sm:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
