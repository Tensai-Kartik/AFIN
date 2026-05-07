import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zklvoflyahjyxjzsqnjn.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/_/backend/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:5000/:path*'
          : '/_/backend/:path*',
      },
    ];
  },
};

export default nextConfig;
