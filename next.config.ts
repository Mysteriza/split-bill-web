import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // output: 'export', // Removed to support Next.js API routes (CORS proxy for Tabscanner)
};

export default withPWA(nextConfig);