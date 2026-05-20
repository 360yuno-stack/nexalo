import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    config.externals.push(
      'pino-pretty', 
      'lokijs', 
      'encoding', 
      'accounts'
    );
    return config;
  },
  turbopack: {
    resolveAlias: {
      'accounts': './src/lib/accounts-stub.js',
      'pino-pretty': './src/lib/accounts-stub.js',
      'lokijs': './src/lib/accounts-stub.js',
      'encoding': './src/lib/accounts-stub.js',
    }
  }
};

export default nextConfig;
