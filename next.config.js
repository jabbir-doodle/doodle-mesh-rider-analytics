/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove the 'output: export' line to enable API routes
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  images: {
    domains: ['localhost'],
    unoptimized: true, // Add this for deployments that need image support without Image Optimization API
  },
};

module.exports = nextConfig;