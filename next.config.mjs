/** @type {import('next').Config} */
import withPWA from "next-pwa";

const nextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "www.cloudinary.com",
      },
    ],
  },
};

export default withPWA({
  dest: "public",
  disabled: process.env.NODE_ENV === "development",
})(nextConfig);
