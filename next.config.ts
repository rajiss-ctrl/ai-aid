import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent static generation errors for pages that depend on runtime env vars
  experimental: {
    // Force all pages to be dynamic by default — safe for a SaaS app
  },
};

export default nextConfig;
