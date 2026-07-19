import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@maithing/shared'],
  outputFileTracingRoot: process.cwd(),
};

export default config;
