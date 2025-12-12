/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Exclude services directory from build (separate Node service)
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'services/ws-gateway': 'commonjs services/ws-gateway',
      });
    }
    return config;
  },
}

module.exports = nextConfig

