import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Scheherazade_New, Amiri, Noto_Naskh_Arabic, Cairo } from 'next/font/google';
import { ThemeProvider } from './contexts/ThemeContext';
// AudioContextInitializer removed - audio functionality now handled in ResponseSection

const inter = Inter({ subsets: ['latin'] });
const scheherazade = Scheherazade_New({ 
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-scheherazade'
});
const amiri = Amiri({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-amiri'
});
const notoNaskh = Noto_Naskh_Arabic({ 
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-naskh'
});
const cairo = Cairo({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo'
});

export const metadata: Metadata = {
  title: 'QuranGPT - Get Guidance from the Holy Quran',
  description: 'QuranGPT is an AI-powered Islamic knowledge base that provides answers to your questions based on the Holy Quran. Get insightful and accurate responses supported by relevant verses and interpretations from the Quran.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QuranGPT',
  },
  openGraph: {
    title: 'QuranGPT',
    description: 'QuranGPT is an AI-powered Islamic knowledge base that provides answers to your questions based on the Holy Quran. It utilizes advanced language models to offer insightful and accurate responses, supported by relevant verses and interpretations from the Quran.',
    url: 'https://quran-gpt.netlify.app/',
    siteName: 'QuranGPT - Get the Guidance from the Holy Quran',
    images: ['https://quran-gpt.netlify.app/QuranGPT-Thumbnail.png'],
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#030712' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
        <meta name="google-site-verification" content="pjFBcUhiuE4esK2biRVNFKN4IEWJ8v0h1KRznI9HPJ0" />
        <meta name="msvalidate.01" content="5CC4429FDE08444C1CB98ECB946F1E2C" />
        
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f9fafb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="QuranGPT" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/icons/icon-192x192.png" as="image" />
        <link rel="preload" href="/icons/icon-512x512.png" as="image" />
      </head>
      <body className={`${inter.className} ${scheherazade.variable} ${amiri.variable} ${notoNaskh.variable} ${cairo.variable}`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}