// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  output: "standalone",
  experimental: { serverActions: { allowedOrigins: ["localhost:3000", "hoa-frontend-beryl.vercel.app"] } }
};
module.exports = nextConfig;
