import withPWA from "next-pwa";

// Dev-only: a local backend (npm start in chowspace_backend, port 2005 by
// default) isn't on the production allowlist below, so without this the
// browser silently blocks every request to it under CSP and axios reports a
// bare "Network Error" with no useful detail. Never added outside development,
// so production keeps the tighter policy.
const devConnectSrc =
  process.env.NODE_ENV === "development"
    ? " http://localhost:* ws://localhost:*"
    : "";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: res.cloudinary.com via.placeholder.com chowspace.ng",
  "font-src 'self' data:",
  `connect-src 'self' https://chowspace-backend-1.onrender.com https://chowspace-backend.vercel.app wss://chowspace-backend-1.onrender.com wss://chowspace-backend.vercel.app *.vercel-insights.com *.vercel-scripts.com${devConnectSrc}`,
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactAwait: true,
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
      { protocol: "https", hostname: "chowspace.ng" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Unhashed public/ assets — fonts, the fallback logo, manifest — don't
      // change often but had no explicit cache policy, leaving repeat visits
      // to whatever the host's default happened to be.
      {
        source: "/font/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path(logo\\.jpg|manifest\\.json)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
