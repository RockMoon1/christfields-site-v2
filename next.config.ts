import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Treat .mdx files as page extensions so journal posts can sit anywhere in app/.
  // We still keep the actual posts in content/journal and import them, but this
  // keeps the door open for a route-based MDX file later if we want one.
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
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

const withMDX = createMDX({
  // MDX options happen later in mdx-components.tsx and lib/journal.ts.
  // We compile MDX through next-mdx-remote at runtime rather than as
  // dedicated page files, so this loader is essentially a no-op safety net.
});

export default withMDX(nextConfig);
