import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit `.next/standalone` with a minimal server.js — the Docker runtime stage
  // only needs that folder plus public/ and .next/static, no node_modules install.
  output: "standalone",
  env: {
    BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? "",
    BASE_IMAGE_URL: process.env.NEXT_PUBLIC_BASE_IMAGE_URL ?? "",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Production / staging — any HTTPS host.
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
    ],
  },
};

export default nextConfig;
