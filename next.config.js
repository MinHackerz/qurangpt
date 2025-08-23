/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable trust proxy for proper IP detection in production
  experimental: {
    trustHostHeader: true,
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
