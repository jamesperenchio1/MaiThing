import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@maithing/shared'],
  typedRoutes: true,
};

export default config;
