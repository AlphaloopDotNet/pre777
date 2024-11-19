import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["avatar.vercel.sh"],
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
