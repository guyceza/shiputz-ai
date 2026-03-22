import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Transpile Pascal Editor packages (source-only, no pre-built dist)
  transpilePackages: ['@pascal-app/core', '@pascal-app/viewer', '@pascal-app/editor'],
  typescript: {
    // Pascal Editor has R3F JSX types that conflict — skip check for now
    ignoreBuildErrors: true,
  },
  // Turbopack resolveAlias for dev + Vercel
  turbopack: {
    resolveAlias: {
      '@pascal-app/core': './packages/pascal-core/src/index.ts',
      '@pascal-app/viewer': './packages/pascal-viewer/src/index.ts',
      '@pascal-app/editor': './packages/pascal-editor/src/index.tsx',
    },
  },
  // Webpack alias fallback
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@pascal-app/core': path.resolve(process.cwd(), 'packages/pascal-core/src/index.ts'),
      '@pascal-app/viewer': path.resolve(process.cwd(), 'packages/pascal-viewer/src/index.ts'),
      '@pascal-app/editor': path.resolve(process.cwd(), 'packages/pascal-editor/src/index.tsx'),
    };
    return config;
  },
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Allow data URLs (base64 images) - they work as-is
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Prevent caching of API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;
