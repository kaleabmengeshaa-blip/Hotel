import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The guest menu lives at "/". Older printed QR codes pointed to /m/<slug>
  // (e.g. /m/linen-lace), so keep those working by forwarding them to the live menu.
  async redirects() {
    return [
      { source: '/m', destination: '/', permanent: true },
      { source: '/m/:path*', destination: '/', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
