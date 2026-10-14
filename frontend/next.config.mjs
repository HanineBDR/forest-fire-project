/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents Leaflet multiple initialization issues
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  },
};

export default nextConfig;
