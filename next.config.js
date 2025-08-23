/** @type {import('next').NextConfig} */
const nextConfig = {
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
