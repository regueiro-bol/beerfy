import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las tarjetas para compartir leen fuentes e imágenes del disco
  outputFileTracingIncludes: {
    '/api/card/**': ['./assets/fonts/**', './public/images/hero.jpg', './public/venues/**'],
    '/[ciudad]/[venue]/*': ['./assets/fonts/**', './public/images/hero.jpg', './public/venues/**'],
  },
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
