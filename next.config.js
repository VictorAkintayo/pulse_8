/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Exclude services directory from Next.js build (separate Node service)
  // This prevents Next.js from trying to compile the ws-gateway service
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  webpack: (config, { isServer }) => {
    // Exclude services directory from webpack compilation
    if (isServer) {
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      // Don't try to resolve services directory
    }
    return config;
  },
}

module.exports = nextConfig

