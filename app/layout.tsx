import './globals.css';
import type { Metadata } from 'next';
import { Inter, Scheherazade_New, Amiri, Noto_Naskh_Arabic, Cairo } from 'next/font/google';

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
  openGraph: {
    title: 'QuranGPT',
    description: 'QuranGPT is an AI-powered Islamic knowledge base that provides answers to your questions based on the Holy Quran. It utilizes advanced language models to offer insightful and accurate responses, supported by relevant verses and interpretations from the Quran.',
    url: 'https://quran-gpt.netlify.app/',
    siteName: 'QuranGPT - Get the Guidance from the Holy Quran',
    images: ['https://dqy38fnwh4fqs.cloudfront.net/project/PRJH6A8OEAAERGE7JHOGG787JP9LGO.png'],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="https://qurangpt.life/wp-content/uploads/2023/04/Quran-GPT-Favicon.png" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />
        <meta name="google-site-verification" content="NGBfty7J9MyQwQ5DT-wvArocgpJC72IXOrH4M1IIJAs" />
        <meta name="msvalidate.01" content="5CC4429FDE08444C1CB98ECB946F1E2C" />
      </head>
      <body className={`${inter.className} ${scheherazade.variable} ${amiri.variable} ${notoNaskh.variable} ${cairo.variable}`}>{children}</body>
    </html>
  );
}