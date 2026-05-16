import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  webpack: (config, { dev }) => {
    // The B: drive on Windows blocks webpack from renaming its filesystem
    // cache packs, which produces noisy EPERM warnings during dev. Use an
    // in-memory cache in dev mode to avoid that. Production builds still
    // use the default fast filesystem cache.
    if (dev) {
      config.cache = { type: 'memory' };
    }
    return config;
  },
};

export default nextConfig;
