import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/collection.html", destination: "/collections/drop-001", permanent: true },
      { source: "/product-red.html", destination: "/products/final-ringer-red", permanent: true },
      { source: "/product-black.html", destination: "/products/final-ringer-black", permanent: true },
      { source: "/product%20red%20ringer.html", destination: "/products/final-ringer-red", permanent: true },
      { source: "/product%20black%20ringer.html", destination: "/products/final-ringer-black", permanent: true },
      { source: "/cart.html", destination: "/cart", permanent: true }
    ];
  },
};

export default nextConfig;
