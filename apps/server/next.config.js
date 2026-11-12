/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';

const nextConfig = {
  ...(isProduction ? { output: 'standalone' } : {}),
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "sandbox; default-src 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
  experimental: {
    // Cap buffering before route-level streaming validation (include multipart overhead).
    middlewareClientMaxBodySize: `${Math.max(Number(process.env.UPLOAD_IMAGE_MAX_BYTES || 10485760), Number(process.env.UPLOAD_MODEL_MAX_BYTES || 52428800)) + 1048576}b`,
    serverActions: {
      bodySizeLimit: '2mb',
      allowedDevOrigins:
        process.env.ALLOWED_ORIGINS === '*'
          ? []
          : process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
            : [],
    },
  },
};

module.exports = nextConfig;
