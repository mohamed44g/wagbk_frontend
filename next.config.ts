import type { NextConfig } from "next";

const apiOrigin = process.env.HOMEWORK_API_ORIGIN ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['iceless-ardella-subpeltated.ngrok-free.dev'],
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
