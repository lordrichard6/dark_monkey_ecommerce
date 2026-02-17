import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'ehkwnyiktjsmegzxbpph.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'files.cdn.printful.com',
        pathname: '/**',
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Clickjacking protection
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Limit referrer info sent to third parties
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restrict browser feature access
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://js.stripe.com")',
          },
          // Content Security Policy
          // Notes:
          //   - 'unsafe-inline' for scripts is required by Stripe and Google Analytics
          //   - stripe.com, supabase, printful CDN, and GA are allowlisted
          //   - 'unsafe-eval' removed intentionally; add back only if a dependency requires it
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + GA + Stripe + Vercel analytics + service worker
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com https://va.vercel-scripts.com",
              // Styles: self + inline (Tailwind runtime)
              "style-src 'self' 'unsafe-inline'",
              // Images: self + Supabase + Printful CDN + placeholder services
              "img-src 'self' data: blob: https://ehkwnyiktjsmegzxbpph.supabase.co https://files.cdn.printful.com https://picsum.photos https://images.unsplash.com https://placehold.co https://www.google-analytics.com",
              // Fonts: self only (using system/Tailwind fonts)
              "font-src 'self'",
              // Connect: self + Supabase + Stripe + GA + Vercel + Sentry
              "connect-src 'self' https://ehkwnyiktjsmegzxbpph.supabase.co wss://ehkwnyiktjsmegzxbpph.supabase.co https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://vitals.vercel-insights.com https://o4510900578680832.ingest.de.sentry.io",
              // Frames: Stripe checkout iframes only
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              // Workers: self (service worker)
              "worker-src 'self' blob:",
              // Media: self only
              "media-src 'self'",
              // Object: none
              "object-src 'none'",
              // Base URI: self only
              "base-uri 'self'",
              // Form actions: self only
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  // Production optimizations
  poweredByHeader: false,
  compress: true,
};

// Bundle analyzer (run with: ANALYZE=true npm run build)
import bundleAnalyzer from '@next/bundle-analyzer';
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const sentryOptions = {
  // Suppress Sentry build output unless SENTRY_DEBUG=true
  silent: !process.env.SENTRY_DEBUG,
  // Sentry org and project
  org: 'darkmonkey',
  project: 'javascript-nextjs',
  // Disable source map upload if no auth token (local dev)
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Disable Sentry telemetry
  telemetry: false,
  // Don't tunnel Sentry requests through Next.js to avoid CSP issues
  tunnelRoute: undefined,
}

export default withSentryConfig(
  withBundleAnalyzer(withNextIntl(nextConfig)),
  sentryOptions
);
