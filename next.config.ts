import type { NextConfig } from "next";

// Keep the development compiler output separate from production builds. This
// prevents `next build` (including `make build`) from replacing chunks used by
// an already-running `next dev` server.
const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
