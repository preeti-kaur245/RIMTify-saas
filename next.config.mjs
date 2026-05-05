/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production' || process.env.GITHUB_ACTIONS === 'true';

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: isProd ? '/RIMTify-saas' : '',
  assetPrefix: isProd ? '/RIMTify-saas/' : '',
  trailingSlash: true,
};

export default nextConfig;
