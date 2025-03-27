/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  trailingSlash: true,
};

module.exports = nextConfig;