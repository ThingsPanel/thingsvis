/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Uploads allow model files up to 1000MB; leave room for multipart form overhead.
    middlewareClientMaxBodySize: '1000mb',
    serverActions: {
      bodySizeLimit: '2mb',
      allowedDevOrigins: process.env.ALLOWED_ORIGINS === '*' ? [] : (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : []),
    },
  },
};

module.exports = nextConfig;
