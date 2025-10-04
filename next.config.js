/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // World App WebView environment compatibility
  poweredByHeader: false,
  compress: true,
  // Configure for WebView
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;