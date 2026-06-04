/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'img.clerk.com'],
  },
  serverExternalPackages: ['inngest', 'assemblyai'],
};

export default nextConfig;
