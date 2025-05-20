import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    BASE_URL: process.env.BASE_URL,
  },
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;
