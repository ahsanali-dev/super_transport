import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ['lucide-react'],
  turbopack: {
    // Explicitly lock the workspace root to this directory to avoid global cache conflicts
    root: path.resolve(__dirname),
  }
};

export default nextConfig;
