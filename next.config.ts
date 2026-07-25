import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/Google-review-AYaniBDG",
        destination: "https://search.google.com/local/writereview?placeid=ChIJH5uTD8rnaC4RCu19m8E5CaU",
        permanent: true,
      },
      {
        source: "/Google-review-MTohaBDG",
        destination: "https://search.google.com/local/writereview?placeid=ChIJ21ycSfbpbgIRpt2ykvmVouw",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
