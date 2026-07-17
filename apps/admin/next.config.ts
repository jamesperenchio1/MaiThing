import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@maithing/shared'],
  experimental: {
    typedRoutes: true,
  },
};

export default config;
