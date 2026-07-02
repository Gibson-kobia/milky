const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/i,
      handler: 'NetworkOnly',
      method: 'GET',
    },
    {
      urlPattern: /^https:\/\/.*\.(?:png|jpe?g|webp|svg|gif|avif)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'image-assets',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@radix-ui/*'],
  },
};

module.exports = withPWA(nextConfig);
