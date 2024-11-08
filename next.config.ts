import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: "/api/train",
        destination: "http://127.0.0.1:5959/api/train",
      },
      {
        source: "/api/predict",
        destination: "http://127.0.0.1:5959/api/predict",
      },
      {
        source: "/extract_text",
        destination: "http://127.0.0.1:5959/extract_text",
      },
    ];
  },
};

export default nextConfig;
