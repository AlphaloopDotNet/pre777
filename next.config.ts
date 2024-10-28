import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // rewrites: async () => {
  //   return [
  //     {
  //       source: "/api/train",
  //       destination: "http://127.0.0.1:5959/api/train", // Replace with your Flask server URL
  //     },
  //     {
  //       source: "/api/predict",
  //       destination: "http://127.0.0.1:5959/api/predict", // Replace with your Flask server URL
  //     },
  //   ];
  // },
};

export default nextConfig;
