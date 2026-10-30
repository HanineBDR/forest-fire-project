/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents Leaflet multiple initialization issues
  experimental: {
    serverComponentsExternalPackages: ["@neondatabase/serverless", "@aws-sdk/client-s3", "jspdf", "jspdf-autotable"],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000",
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvg: false,
    };
    return config;
  },
};

export default nextConfig;
