import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
    };
    return config;
  },
  
  // Ensure proper handling of external scripts in production
  experimental: {
    optimizePackageImports: ["@openai/chatkit-react"],
  },
  
  // Improve production build stability
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
