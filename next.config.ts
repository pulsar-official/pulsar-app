import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        // Required for PowerSync SharedWorker + SQLite WASM
        // 'credentialless' keeps Vercel Analytics and Clerk working (vs 'require-corp')
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
      ],
    }]
  },

  // Turbopack (Next.js 16 default) handles WASM natively — empty config silences
  // the "webpack config present but no turbopack config" hard error
  turbopack: {},

  // Kept for local webpack builds / CI that explicitly use --webpack
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    }
    return config
  },
};

export default nextConfig;
