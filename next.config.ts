import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }] },
  async rewrites() {
    // Vercel routes /api/v1 to api/index.py (see vercel.json). Local Next dev mirrors
    // that single-project route by proxying to the FastAPI process on port 8000.
    if (process.env.VERCEL) return [];
    return [{ source: "/api/v1/:path*", destination: "http://localhost:8000/api/v1/:path*" }];
  },
};

export default nextConfig;
