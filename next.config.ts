import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Old launch-film URL (used in the deck and early posts) points to the current film.
  async redirects() {
    return [{ source: "/gaplens-launch.mp4", destination: "/gaplens-demo-1080.mp4", permanent: true }];
  },
};

export default nextConfig;
