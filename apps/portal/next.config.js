/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ["chaoscraft.dev", "localhost:3000"],
    },
  },
  ...(process.env.DOCKER_BUILD === "true"
    ? {
        turbopack: {
          root: "/app",
        },
      }
    : {}),
  env: {
    GITHUB_REPO: process.env.GITHUB_REPO,
    GITHUB_OWNER: process.env.GITHUB_OWNER,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
    STRIPE_PRICE_AMOUNT_USD: process.env.STRIPE_PRICE_AMOUNT_USD,
    SOLANA_RPC_URL: process.env.SOLANA_RPC_URL,
    SOLANA_WALLET_ADDRESS: process.env.SOLANA_WALLET_ADDRESS,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_GITHUB_OWNER: process.env.NEXT_PUBLIC_GITHUB_OWNER,
    NEXT_PUBLIC_GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
};

module.exports = nextConfig;
