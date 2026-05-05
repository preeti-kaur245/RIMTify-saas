/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS || false;

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

if (isGithubActions) {
  nextConfig.basePath = '/RIMTify-saas';
  nextConfig.assetPrefix = '/RIMTify-saas/';
}

export default nextConfig;
