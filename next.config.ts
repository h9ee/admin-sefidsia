import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit `.next/standalone` with a minimal server.js — the Docker runtime stage
  // only needs that folder plus public/ and .next/static, no node_modules install.
  output: "standalone",
};

export default nextConfig;
