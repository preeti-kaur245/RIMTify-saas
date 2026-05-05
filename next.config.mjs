/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
};

if (isProd) {
  nextConfig.basePath = '/RIMTify-saas';
}

export default nextConfig;
