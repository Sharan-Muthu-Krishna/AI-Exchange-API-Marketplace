import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For production deployment (Render, Vercel, etc.)
  output: 'standalone',
  
  // Optimize images
  images: {
    unoptimized: true,
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
};

export default nextConfig;
