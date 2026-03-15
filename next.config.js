/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  // Mark server-only wagmi/web3 transitive deps as external (works with Turbopack)
  serverExternalPackages: ['pino-pretty', 'lokijs', 'encoding'],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://mainnet.base.org https://sepolia.base.org https://base-sepolia.publicnode.com wss://mainnet.base.org wss://sepolia.base.org",
              "frame-src 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
}

export default nextConfig
