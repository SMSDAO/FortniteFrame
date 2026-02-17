/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Optimize for production
  swcMinify: true,
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Exclude heavy dependencies from client bundle
    // These are server-only or cause bundling issues in the browser:
    // - pino-pretty: Pretty printing for logs (server-only)
    // - lokijs: In-memory database (not needed in browser)
    // - encoding: Text encoding utilities (node-specific)
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['github.com', 'user-attachments.githubusercontent.com'],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig
