/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      https: false
    };
    return config;
  },
  images: {
    domains: ['localhost'],
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  output: 'export',
  trailingSlash: true
};

module.exports = nextConfig;