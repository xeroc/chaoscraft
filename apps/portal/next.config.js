/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['repofun.com', 'repo.fun', 'localhost:3000'],
    },
  },
  env: {
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
  },
}

module.exports = nextConfig
