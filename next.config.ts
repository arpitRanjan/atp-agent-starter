import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind CSS runs through this loader. Removing it silently removes all styling.
  // (Ask your AI tool to CHANGE this file when you need a new setting, never to rewrite it.)
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
