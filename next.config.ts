import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongoose', 'ali-oss'],
  // 本机用 127.0.0.1:3001 打开时允许 HMR，不影响线上
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
