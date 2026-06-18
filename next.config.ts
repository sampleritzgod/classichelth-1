import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework/version in responses.
  poweredByHeader: false,
  // Pin the workspace root so Turbopack doesn't get confused by stray
  // lockfiles higher up the filesystem.
  turbopack: {
    root: projectRoot,
  },
  // Enable the built-in Image Optimization (WebP/AVIF, resizing, responsive
  // srcset). Remote backend-hosted uploads are allowed via remotePatterns.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Production backend (Render) static uploads
      {
        protocol: "https",
        hostname: "u-1st-creation.onrender.com",
        pathname: "/uploads/**",
      },
      // Local backend during development
      {
        protocol: "http",
        hostname: "localhost",
        port: "5005",
        pathname: "/uploads/**",
      },
      // Cloudinary remote storage
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Vercel Blob remote storage
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
  // Drop console.* in production bundles (keep warn/error for diagnostics).
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  // Baseline security headers for all routes.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
