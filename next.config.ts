import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75],
  },
  async redirects() {
    return [
      {
        source: "/que-es-estrella-galicia-bodega",
        destination: "/la-bodega/que-es-la-cerveza-de-bodega",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
