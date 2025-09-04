/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production audio optimization
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  
  // PWA configuration
  async rewrites() {
    return [
      {
        source: '/sw.js',
        destination: '/sw.js',
      },
    ];
  },
  
  // Headers for production audio compatibility
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
    ];
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.buymeacoffee.com',
      },
      {
        protocol: 'https',
        hostname: 'qurangpt.life',
      },
      {
        protocol: 'https',
        hostname: 'cdn.islamic.network',
      },
    ],
  },
};

module.exports = nextConfig;
