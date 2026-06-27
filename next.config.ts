import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  // Keep native/PDF packages out of the bundle so their native bindings load correctly
  serverExternalPackages: ['@napi-rs/canvas', 'unpdf', 'pdfjs-dist'],
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
