import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["officeparser", "pdf-parse", "word-extractor"],
};

export default nextConfig;

