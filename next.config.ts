import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NO usar output: "standalone" en Vercel.
  // Esa opción es para Docker / servidores propios y rompe el build de Vercel
  // porque omite generar .next/next-server.js.nft.json que Vercel necesita.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
