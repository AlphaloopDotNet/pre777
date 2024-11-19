import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["avatar.vercel.sh"],
  },
  unoptimized: true,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
