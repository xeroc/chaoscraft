# repo.fun - ChaosCraft: The First Crowd-Sourced AI-Powered Codebase

Pay $1, submit a 120-character request, and watch as AI agents turn your idea into code that becomes a star in the growing galaxy.

## 🌌 The Vision

Imagine if 1,000 people each paid $1 to tell an AI to build whatever they wanted into a shared codebase. What would emerge? A masterpiece? A disaster? The next Twitter? A chaotic symphony of features nobody asked for?

**Nobody knows. That's the point.**

ChaosCraft is an experiment in collective creation. You pay $1, submit a 120-character request, and watch as AI agents turn your idea into code that becomes part of a living, evolving project.

## 🏗️ Architecture

### The Two-Site Architecture

1. **repo.fun Portal** - Where you pay and submit requests (Next.js on Vercel)
2. **The Galaxy** - The site everyone builds (static site on GitHub Pages)

Both are hosted on the same domain via iframe integration.

### System Components

```
User → Next.js Portal → GitHub Issues
                        ↓
                   SQLite DB
                        ↓
                AntFarm (Pi) → GitHub PRs
                        ↓
                GitHub Actions → GitHub Pages
                        ↓
                Galaxy Updates
```

### Tech Stack

**Portal (repo.fun):**
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Stripe API (payments)
- Solana Web3.js (crypto payments)
- GitHub API (issue creation)
- SQLite (payment tracking)

**Galaxy (galaxy.repo.fun):**
- Three.js (3D visualization)
- Static HTML/JS/CSS
- GitHub Pages (hosting)
- GitHub Actions (CI/CD)

**AI Agent Orchestration:**
- AntFarm CLI (workflow orchestration)
- OpenClaw (agent runtime)
- feature-dev workflow (7 specialized agents)
- GitHub CLI (git operations)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- GitHub account with PAT
- Stripe account (for payments)
- Solana wallet (optional)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/repofun/repofun.git
   cd repofun
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**

   **Portal (`portal/.env`):**
   ```bash
   # GitHub
   GITHUB_OWNER=repofun
   GITHUB_REPO=repofun
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

   # Stripe
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

   # Solana
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   SOLANA_WALLET_ADDRESS=7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU

   # App
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   ```

4. **Run the portal:**
   ```bash
   pnpm dev
   ```

5. **Run the galaxy (separate terminal):**
   ```bash
   pnpm --filter @repofun/galaxy serve
   ```

## 📦 Monorepo Structure

```
repofun/
├── portal/              # Next.js portal app
│   ├── app/           # Next.js app directory
│   │   ├── api/       # API routes
│   │   │   ├── submit/
│   │   │   ├── payment/
│   │   │   ├── queue/
│   │   │   └── live-terminal/
│   │   ├── components/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/           # Shared utilities
│   ├── data/          # SQLite database
│   └── package.json
│
├── galaxy/             # Static galaxy site
│   ├── features/      # Individual feature pages
│   ├── js/            # Three.js and star data
│   ├── css/           # Styles
│   ├── assets/        # Images, etc.
│   ├── index.html
│   └── package.json
│
├── packages/           # Shared packages (future)
│   └── shared/
│
├── .github/
│   └── workflows/
│       └── deploy-galaxy.yml
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## 🎯 Phase 1 Implementation

### ✅ Completed

1. **GitHub Repository**
   - Public repo structure
   - GitHub Actions workflow for deployment

2. **Next.js Portal**
   - Request submission form (120 char limit)
   - Stripe integration (checkout + webhook)
   - Solana integration (transaction verification)
   - API routes for payment verification
   - SQLite DB schema (payment tracking)

3. **Galaxy Static Site**
   - Three.js galaxy visualization
   - Star rendering (position, color, size, brightness, pulse)
   - Camera controls (zoom, rotate, pan)
   - Click interaction (inspect feature details)

4. **GitHub Actions CI/CD**
   - Auto-deploy to GitHub Pages on PR merge
   - Star data generation from PR metadata

### 🚧 Next Steps

1. **AntFarm Setup**
   - Install OpenClaw on server
   - Install AntFarm CLI
   - Configure feature-dev workflow
   - Set up GitHub credentials
   - Configure cron job for polling

2. **GitHub Bot Account**
   - Create separate bot account
   - Generate PAT with repo permissions
   - Configure webhook endpoint

3. **Domain Configuration**
   - Configure repo.fun on Vercel
   - Configure galaxy.repo.fun on GitHub Pages
   - Set up DNS records

## 🔧 API Reference

### POST /api/submit

Submit a feature request.

**Request:**
```json
{
  "request": "Add a dancing robot that tells random jokes",
  "paymentMethod": "stripe",
  "priority": "standard"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

### POST /api/payment/stripe-webhook

Stripe webhook handler for payment verification.

### POST /api/payment/solana

Solana payment verification endpoint.

**Request:**
```json
{
  "paymentDbId": 1,
  "signature": "5K7...",
  "requestText": "Add a dancing robot",
  "priority": "standard"
}
```

### GET /api/queue

Get current build queue.

**Response:**
```json
{
  "items": [
    {
      "id": 142,
      "title": "Add a dancing robot",
      "position": 24,
      "status": "queued",
      "priority": "standard",
      "createdAt": "2024-02-19T10:30:00Z",
      "eta": "~2 hours"
    }
  ],
  "total": 23,
  "queued": 20,
  "building": 3
}
```

### GET /api/live-terminal

Server-Sent Events endpoint for streaming build output.

## 🤖 The AI Agents

ChaosCraft uses **AntFarm's feature-dev workflow** with 7 specialized agents:

1. **Planner** - Decomposes tasks into 3-20 user stories
2. **Setup** - Creates branch, establishes baseline
3. **Developer** - Implements features (loops per story)
4. **Verifier** - Checks each story against acceptance criteria
5. **Tester** - Integration and E2E testing
6. **Developer (PR)** - Creates pull request
7. **Reviewer** - Code review and approval

### How It Works

1. User submits request → GitHub Issue created
2. Issue labeled "ready-for-build"
3. AntFarm picks up issue via cron poll
4. feature-dev workflow runs (7 agents)
5. PR created and approved
6. GitHub Actions deploys to galaxy
7. User sees new star in galaxy

## 💰 Revenue Model

- **Standard**: $1 per feature (FIFO)
- **Priority**: $5 per feature (skip 10 items)
- **Express**: $10 per feature (skip 50 items)

### Potential Revenue

| Requests/Day | Revenue/Day | Revenue/Month |
| ------------ | ----------- | ------------- |
| 10           | $30         | $900          |
| 50           | $150        | $4,500        |
| 100          | $300        | $9,000        |
| 500          | $1,500      | $45,000       |

## 📊 Success Metrics

### MVP (Day 15)
- 50+ features built
- 10+ unique contributors
- Zero critical failures
- $100+ revenue

### 30 Days
- 500+ features built
- 50+ unique contributors
- $3,000+ revenue

### 90 Days
- 2,000+ features built
- 200+ unique contributors
- $10,000+ revenue

## 🛠️ Development Commands

```bash
# Install dependencies
pnpm install

# Run portal
pnpm dev

# Run galaxy
pnpm --filter @repofun/galaxy serve

# Build portal
pnpm build:portal

# Build galaxy
pnpm build:galaxy

# Lint
pnpm lint

# Typecheck
pnpm typecheck
```

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This is an experiment in crowd-sourced AI development. To contribute:

1. Pay $1 (or more) at repo.fun
2. Submit a 120-character request
3. Watch the AI agents build it
4. See your star in the galaxy!

## 🌟 Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Three.js](https://threejs.org/)
- [AntFarm](https://antfarm.cool)
- [OpenClaw](https://github.com/snarktank/openclaw)
- [Stripe](https://stripe.com/)
- [Solana](https://solana.com/)

---

**ChaosCraft: The first AI-powered, crowd-sourced codebase. What will we become together?** 🌌
