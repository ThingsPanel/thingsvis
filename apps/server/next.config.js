/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    allowedDevOrigins: ['http://localhost:5002'],
  },
};

module.exports = nextConfig;
