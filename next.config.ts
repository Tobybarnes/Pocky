import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Tauri builds
  output: process.env.TAURI_BUILD ? 'export' : undefined,
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
