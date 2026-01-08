import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/templates/:path*',
        headers: [
          {
            key: 'Content-Disposition',
            value: 'attachment',
          },
          {
            key: 'Content-Type',
            value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
