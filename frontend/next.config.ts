import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/cusoc',
        destination: 'https://cusoc.csquareclub.co.in/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
