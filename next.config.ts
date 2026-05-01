import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"
import type { NextConfig } from "next"

initOpenNextCloudflareForDev()

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    webpackBuildWorker: false,
  },

  turbopack: {},

  webpack: (config) => {
    config.cache = false
    return config
  },

  images: {
    unoptimized: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
