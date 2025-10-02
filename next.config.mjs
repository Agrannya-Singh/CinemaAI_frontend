/** @type {import('next').NextConfig} */

const nextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: true,
    // Use streaming SSR for better performance
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Optimize page loading
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@supabase/supabase-js',
    ],
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
    // Optimize image loading
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Add custom headers for caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=59'
          }
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=59'
          }
        ],
      }
    ]
  },
  // Optimize build output
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  env: {
    OMDB_API_KEY: process.env.OMDB_API_KEY,
  },
  // Configure webpack
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 70000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];
              return `vendor.${packageName.replace('@', '')}`;
            },
            priority: 20,
          },
          common: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      },
    };
    return config;
  },
}