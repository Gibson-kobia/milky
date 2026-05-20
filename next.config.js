/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@radix-ui/*'],
  },
};

module.exports = nextConfig;
