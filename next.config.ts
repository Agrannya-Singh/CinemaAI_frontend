import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingRoot: __dirname, // Set the workspace root to current directory
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  env: {
    OMDB_API_KEY: process.env.OMDB_API_KEY,
  }
};

export default nextConfig;
