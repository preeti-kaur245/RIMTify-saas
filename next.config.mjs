/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/RIMTify-saas',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
