# ChaosCraft: The First Crowd-Sourced AI-Powered Codebase in History

## The Vision

Imagine if 1,000 people each paid $1 to tell an AI to build whatever they wanted into a shared codebase.

What would emerge? A masterpiece? A disaster? The next Twitter? A chaotic symphony of features nobody asked for?

**Nobody knows. That's the point.**

ChaosCraft is an experiment in collective creation. You pay $1, submit a 120-character request, and watch as AI agents turn your idea into code that becomes part of a living, evolving project.

```
You: "Add dancing robot"
↓ (Pay $1)
GitHub Issue #142 created
↓ (Two-agent workflow)
Specification written → Code generated → PR created → Merged
↓ (GitHub Pages)
Site rebuilt with dancing robot live
```

You're not just requesting code. You're planting a star in the ChaosCraft galaxy 🌌

---

## Project Identity

**Project Name**: `repo.fun`
**Built on**: [AntFarm](https://antfarm.cool) + OpenClaw
**Workflow**: `feature-dev`

---

## How It Works

### The User Experience

```
┌─────────────────────────────────────────┐
│  🎪 REPO.FUN                    │
│  Pay $1 → Watch chaos unfold         │
│                                    │
│  Current Galaxy: 142 stars          │
│  Last Feature: Dancing robot         │
│  Queue: 23 pending requests         │
└─────────────────────────────────────────┘

            ↓

┌─────────────────────────────────────────┐
│  What do you want to build?         │
│  (120 characters max)               │
│                                    │
│  ┌──────────────────────────────┐    │
│  │ Add a dancing robot that  │    │
│  │ tells random jokes         │    │
│  └──────────────────────────────┘    │
│                                    │
│  [ Pay $1 with Stripe/Solana ]    │
└─────────────────────────────────────────┘

            ↓ (Payment verified by Next.js API)

┌─────────────────────────────────────────┐
│  🎉 Request #142 queued!           │
│                                    │
│  Position: #24                       │
│  ETA: ~2 hours                      │
│                                    │
│  [ Watch live terminal ]              │
└─────────────────────────────────────────┘

            ↓ (AntFarm feature-dev workflow starts)

┌─────────────────────────────────────────┐
│  🔨 Building your feature...         │
│                                    │
│  > [PLANNER] Analyzing codebase...  │
│  > [PLANNER] Creating 3 stories...   │
│  > [SETUP] Creating branch...        │
│  > [DEV] Story 1: Robot component   │
│  > [VERIFIER] ✓ Story 1 verified   │
│  > [DEV] Story 2: Joke API       │
│  > [VERIFIER] ✓ Story 2 verified   │
│  > [DEV] Story 3: Animation       │
│  > [VERIFIER] ✓ Story 3 verified   │
│  > [TESTER] E2E tests passing...  │
│  > [DEV] Creating PR #456...       │
│  > [REVIEWER] ✓ PR approved      │
│  > [SETUP] Merging to main...     │
│                                    │
│  > ✅ Feature #142 deployed!        │
└─────────────────────────────────────────┘

            ↓ (GitHub Actions auto-deploys)

Your dancing robot is now live in the galaxy! 🌟
```

### The Two-Site Architecture

**Important**: There are TWO different sites, both on the same domain:

1. **repo.fun Portal** (`repo.fun`) - Where you pay and submit requests
2. **The Galaxy** (`galaxy.repo.fun` or `repo.fun/galaxy`) - The site built by everyone's requests

Both are hosted via **GitHub Pages** on the same domain using an iframe:

```html
<!-- repo.fun/portal -->
<iframe src="/galaxy" width="100%" height="100%"></iframe>
```

```
repo.fun/
├── portal/           ← Your request interface (Next.js)
│   ├── Submit form
│   ├── Payment (Stripe/Solana)
│   ├── Queue tracker
│   └── Galaxy viewer (iframe to /galaxy)
│
└── galaxy/           ← The site everyone builds (static HTML/JS)
    ├── Feature #142: Dancing robot
    ├── Feature #123: Sound effects button
    └── Whatever 1,000 people dream up
```

---

## System Architecture

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION LAYER                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  User Browser                                                         │
│  ┌─────────────┐                                                     │
│  │  repo.fun   │  Next.js Portal (Vercel)                             │
│  └──────┬──────┘                                                     │
│         │                                                            │
│         │ 1. Submit request (120 chars) + Payment ($1)                  │
│         ↓                                                            │
│  ┌──────────────────────────────────────────────┐                        │
│  │  Next.js API Routes (Vercel Serverless)    │                        │
│  │  • POST /api/submit                      │                        │
│  │  • POST /api/payment/stripe-webhook      │                        │
│  │  • POST /api/payment/solana            │                        │
│  │  • GET /api/queue                      │                        │
│  │  • GET /api/live-terminal               │                        │
│  └──────────┬───────────────────────────────┘                        │
│             │                                                           │
│             │ 2. Verify payment + Create GitHub Issue                   │
│             ↓                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVICES LAYER                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────┐                        │
│  │  GitHub API                          │                        │
│  │  • Issues (feature requests)              │                        │
│  │  • PRs (code changes)                    │                        │
│  │  • Actions (CI/CD)                       │                        │
│  └──────────────────────────────────────────────┘                        │
│             ↑                                                           │
│             │ 3. Poll for issues labeled "ready-for-build"              │
│             │                                                           │
│  ┌──────────────────────────────────────────────┐                        │
│  │  SQLite DB (Payment Tracking)             │                        │
│  │  • issue_number → payment_id              │                        │
│  │  • Payment verification status              │                        │
│  │  • Prevents duplicate payments             │                        │
│  └──────────────────────────────────────────────┘                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                             │
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI AGENT ORCHESTRATION LAYER                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Raspberry Pi (or any server with OpenClaw)                             │
│                                                                     │
│  ┌──────────────────────────────────────────────┐                        │
│  │  AntFarm CLI (installed via curl)        │                        │
│  │  • antfarm workflow install feature-dev    │                        │
│  │  • antfarm workflow run <issue-id>     │                        │
│  │  • antfarm workflow status <run-id>     │                        │
│  │  • antfarm dashboard (web UI)          │                        │
│  └──────────┬───────────────────────────────┘                        │
│             │                                                           │
│             │ 4. Triggers feature-dev workflow                          │
│             ↓                                                           │
│  ┌──────────────────────────────────────────────┐                        │
│  │  feature-dev Workflow (7 agents)         │                        │
│  │  ┌──────────────────────────────────┐    │                        │
│  │  │ 1. PLANNER                     │    │                        │
│  │  │   - Explores codebase           │    │                        │
│  │  │   - Decomposes into 3-20 stories │    │                        │
│  │  │   - Orders by dependency        │    │                        │
│  │  └──────────────┬───────────────┘    │                        │
│  │                 ↓                    │                        │
│  │  ┌──────────────────────────────────┐    │                        │
│  │  │2. SETUP                       │    │                        │
│  │  │  - Creates feature branch       │    │                        │
│  │  │  - Establishes baseline        │    │                        │
│  │  └──────────────┬───────────────┘    │                        │
│  │                 ↓                    │                        │
│  │  ┌──────────────────────────────────┐    │                        │
│  │  │3. DEVELOPER (loop per story)    │    │                        │
│  │  │  - Implements story            │    │                        │
│  │  │  - Writes tests               │    │                        │
│  │  │  - Runs typecheck             │    │                        │
│  │  │  - Commits with git           │    │                        │
│  │  └──────────────┬───────────────┘    │                        │
│  │                 ↓                    │                        │
│  │  ┌──────────────────────────────────┐    │                        │
│  │  │4. VERIFIER (per story)         │    │                        │
│  │  │  - Checks code exists          │    │                        │
│  │  │  - Verifies acceptance criteria │    │                        │
│  │  │  - Tests pass?               │    │                        │
│  │  │  - Visual check for UI        │    │                        │
│  │  └──────────────┬───────────────┘    │                        │
│  │                 ↓                    │                        │
│  │  ┌──────────────────────────────────┐    │                        │
│  │  │5. TESTER                      │    │                        │
│  │  │  - Full test suite            │    │                        │
│  │  │  - Integration tests          │    │                        │
│  │  │  - E2E tests                │    │                        │
│  │  └──────────────┬───────────────┘    │                        │
│  │                 ↓                    │                        │
│  │  ┌──────────────────────────────────┐    │                        │
│  │  │6. DEVELOPER (PR)              │    │                        │
│  │  │  - Creates PR via gh CLI      │    │                        │
│  │  │  - Writes description         │    │                        │
│  └──────────────┬───────────────────────┘    │                        │
│                 ↓                            │                        │
│  ┌──────────────────────────────────┐          │                        │
│  │7. REVIEWER                     │          │                        │
│  │  - Code quality review         │          │                        │
│  │  - Approves or changes        │          │                        │
│  └──────────────┬───────────────┘          │                        │
│                 ↓                            │                        │
└─────────────────┼─────────────────────────────┴──────────────────────────┘
                  │ 5. PR created + approved
                  ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DEPLOYMENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────┐                        │
│  │  GitHub Actions (.github/workflows/)    │                        │
│  │  ┌──────────────────────────────────┐    │                        │
│  │  │  deploy.yml                   │    │                        │
│  │  │  on:                        │    │                        │
│  │  │    pull_request:              │    │                        │
│  │  │      types: [closed]         │    │                        │
│  │  │    paths:                   │    │                        │
│  │  │      - 'galaxy/**'          │    │                        │
│  │  │                              │    │                        │
│  │  │  jobs:                      │    │                        │
│  │  │    build:                   │    │                        │
│  │  │      runs-on: ubuntu-latest  │    │                        │
│  │  │      steps:                  │    │                        │
│  │  │        - uses: actions/checkout│    │                        │
│  │  │        - run: npm install     │    │                        │
│  │  │        - run: npm run build   │    │                        │
│  │  │        - uses: peaceiris/actions│    │                        │
│  │  │          -github-pages@v3     │    │                        │
│  │  │          -with:              │    │                        │
│  │  │            github_token: ${{   │    │                        │
│  │  │              secrets.GITHUB_   │    │                        │
│  │  │              TOKEN }}         │    │                        │
│  │  │            publish_dir: ./dist │    │                        │
│  │  └──────────────────────────────────┘    │                        │
│  └──────────────┬───────────────────────┘                        │
│                 │                                                    │
│                 │ 6. Auto-deploys to GitHub Pages                    │
│                 ↓                                                    │
│  ┌──────────────────────────────────────────────┐                        │
│  │  GitHub Pages                         │                        │
│  │  • galaxy.repo.fun (static site)      │                        │
│  │  • Served from ./galaxy folder       │                        │
│  │  • HTTPS + Custom domain             │                        │
│  │  • Auto-rebuild on push to main     │                        │
│  └──────────────┬───────────────────────┘                        │
│                 │                                                    │
│                 ↓                                                    │
│         Feature is LIVE! 🌟                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Where Users Talk to Backend

**Direct user interactions:**

1. **Submit request form** → `POST /api/submit` (Next.js API)
2. **Stripe payment** → Stripe checkout → webhook to `/api/payment/stripe-webhook`
3. **Solana payment** → User signs tx → `POST /api/payment/solana` with signature
4. **View queue** → `GET /api/queue` (poll for position)
5. **Watch live terminal** → `GET /api/live-terminal` (Server-Sent Events for real-time build output)

All user-facing traffic goes through **Next.js on Vercel**. Users never touch GitHub directly.

### Where Backend Talks to AntFarm

**Backend to AntFarm:**

- **NONE** (Next.js backend does NOT talk to AntFarm directly)

The Next.js backend only:

- Verifies payments (Stripe/Solana)
- Creates GitHub Issues via GitHub API
- Stores payment metadata in SQLite
- Serves queue status and terminal output to users

### Where AntFarm Talks to GitHub

**AntFarm on Raspberry Pi:**

1. **Polls GitHub Issues** → Finds Issues labeled `ready-for-build`
2. **Clones repo** → `git clone` from GitHub
3. **Runs feature-dev workflow** → Executes 7-agent pipeline
4. **Creates branches** → `git checkout -b feature/dancing-robot`
5. **Commits changes** → `git commit` per story
6. **Creates PR** → `gh pr create` (via GitHub CLI)
7. **Reviews PR** → Uses GitHub API to comment/approve
8. **Merges PR** → `gh pr merge` (auto-merge on approval)

**Critical separation:**

- Users → Next.js → GitHub (Issues only)
- AntFarm → GitHub (full repo access)
- Next.js never sees repo contents
- AntFarm never sees payment details

### Deployment Pipeline (GitHub Pages + GitHub Actions)

**Static Site Architecture:**

```
repo.fun/
├── portal/          ← Next.js (hosted on Vercel)
│   ├── app/
│   ├── components/
│   └── lib/
│
└── galaxy/          ← Static HTML/JS/CSS (hosted on GitHub Pages)
    ├── index.html    ← Landing page with Three.js galaxy
    ├── features/     ← Each feature = one HTML file
    │   ├── dancing-robot.html
    │   ├── sound-effects.html
    │   └── ...
    ├── js/
    │   ├── galaxy.js       ← Three.js visualization
    │   └── star-data.js   ← Generated from PR metadata
    ├── css/
    │   └── styles.css
    └── assets/
        └── ...
```

**GitHub Actions workflow (.github/workflows/deploy.yml):**

```yaml
name: Deploy to GitHub Pages

on:
  pull_request:
    types: [closed]
    paths:
      - "galaxy/**"

jobs:
  build-and-deploy:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Update star data
        run: |
          # Extract PR metadata for star generation
          # Generate star-data.js from merged PR
          # Position: hash(commit)
          # Size: lines_changed / 10
          # Color: based on file types
          node scripts/generate-star-data.js

      - name: Build static site
        run: |
          # Copy galaxy assets to dist
          cp -r galaxy dist
          # Minify if needed
          # No bundling needed (static HTML)

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

**Auto-deployment trigger:**

1. AntFarm creates PR → PR is open
2. Reviewer approves → PR status: approved
3. AntFarm merges PR → PR is closed (merged)
4. GitHub Actions detects `pull_request.closed` with `merged: true`
5. Runs build step → Updates star-data.js
6. Deploys to GitHub Pages → galaxy.repo.fun updates instantly
7. Next.js portal detects new deployment → Updates galaxy viewer

**No server needed:**

- GitHub Pages serves static files from CDN
- Zero infrastructure cost
- HTTPS built-in
- Custom domain: `galaxy.repo.fun`
- Updates: Automatic on merge

---

## The GitHub Workflow

GitHub is the heart of repo.fun. Everything lives there:

- **Issues** = Feature requests (one per $1 payment)
- **Labels** = Status tracking (queue → building → done)
- **PRs** = Code changes (auto-created by AntFarm agents)
- **Commits** = Features becoming real
- **GitHub Pages** = Deployment (static galaxy site)

### Issue Lifecycle with AntFarm

```
You submit request via repo.fun
    ↓
POST /api/submit → Next.js API verifies request
    ↓
User pays $1 (Stripe OR Solana)
    ↓
Next.js API verifies payment + creates GitHub Issue
    Label added: awaiting-payment → ready-for-build
    ↓
[ Raspberry Pi: AntFarm ]
    Cron job polls GitHub every 5 minutes
    Finds Issue #142 labeled "ready-for-build"
    ↓
$ antfarm workflow run feature-dev --issue 142
    ↓
[ PLANNER Agent ]
    Reads Issue #142 → Explores codebase
    Decomposes "Add dancing robot" into 3 stories:
    1. Create robot HTML component
    2. Add random joke API endpoint
    3. Implement CSS animation
    Posts to Issue as comment
    ↓
[ SETUP Agent ]
    git checkout -b feature/dancing-robot
    Reads package.json for build scripts
    Establishes baseline (build passes)
    ↓
[ DEVELOPER Agent ] - Story 1
    Creates galaxy/features/dancing-robot.html
    Adds tests for robot rendering
    Runs typecheck → Passes
    Commits: feat: dancing-robot-component
    ↓
[ VERIFIER Agent ] - Story 1
    Checks: File exists? ✓
    Checks: Robot renders? ✓
    Runs tests? ✓ Passes
    Confirms: STATUS: done
    ↓
[ DEVELOPER Agent ] - Story 2
    Adds galaxy/api/jokes.js
    Implements fetch logic
    Tests joke API
    Commits: feat: joke-api-endpoint
    ↓
[ VERIFIER Agent ] - Story 2
    Checks: API endpoint exists? ✓
    Tests: Returns jokes? ✓
    Confirms: STATUS: done
    ↓
[ DEVELOPER Agent ] - Story 3
    Adds galaxy/css/animations.css
    Implements dance keyframes
    Tests animation performance
    Commits: feat: dance-animation
    ↓
[ VERIFIER Agent ] - Story 3
    Checks: CSS exists? ✓
    Tests: Animation plays? ✓
    Confirms: STATUS: done
    ↓
[ TESTER Agent ]
    Runs full test suite → All pass
    Tests integration (robot + jokes + animation together)
    E2E test: Load dancing-robot.html → Verify all works
    Confirms: STATUS: done
    ↓
[ DEVELOPER Agent ] - PR Creation
    $ gh pr create \
      --title "feat: Add dancing robot that tells jokes" \
      --body "Implements #142. 3 stories verified and tested." \
      --base main \
      --head feature/dancing-robot
    PR #456 created
    ↓
[ REVIEWER Agent ]
    Reviews PR #456
    Checks code quality, conventions, test coverage
    Approves with comment: "✓ Code review passed"
    ↓
[ SETUP Agent ] - Merge
    $ gh pr merge 456 --merge --delete-branch
    PR merged to main
    Updates Issue #142 label: ready-for-build → completed
    ↓
[ GitHub Actions ]
    Detects merged PR on galaxy/**
    Runs .github/workflows/deploy.yml
    Generates star-data.js from PR #456 metadata
    Deploys to GitHub Pages
    galaxy.repo.fun updated
    ↓
Next.js portal detects new deployment
    Pushes notification to browser: "Your star is live! 🌟"
```

### Priority System

Want to jump ahead? Pay more:

- **Standard**: $1 (FIFO queue)
- **Priority**: $5 (skip ahead of 10 items)
- **Express**: $10 (skip ahead of 50 items)

**Implementation:**

- Priority tags added to Issue: `priority:express`
- AntFarm sorts Issues by priority label
- Express issues processed before standard queue

More money = your feature built faster. Simple.

---

## The AI Agents (AntFarm + OpenClaw)

We use **AntFarm's feature-dev workflow** with 7 specialized agents:

### How AntFarm Works

AntFarm is a **multi-agent orchestration framework** built on OpenClaw. It provides:

**Deterministic Workflows:**

- Same steps, same order, every time
- No "hopefully agent remembers to test"
- YAML-defined pipeline (plan → setup → implement → verify → test → PR → review)

**Specialized Agents:**

1. **Planner** - Decomposes tasks into user stories (max 20)
2. **Setup** - Prepares environment, creates branch, establishes baseline
3. **Developer** - Implements features, writes tests, commits changes
4. **Verifier** - Checks each story against acceptance criteria
5. **Tester** - Integration and E2E testing
6. **Developer (PR)** - Creates pull request via GitHub CLI
7. **Reviewer** - Code review, approves or requests changes

**Fresh Context, Every Step:**

- Each agent runs in a fresh OpenClaw session
- No context window bloat
- No hallucinated state from 50 messages ago
- Memory persists through git history and progress files

**Automatic Retries:**

- Failed steps retry automatically (configurable per step)
- Medic agent monitors for stuck agents
- Escalates to human after max retries

### Agent Workflow Details

#### 1. Planner Agent

- Reads your 120-character request from GitHub Issue
- Explores codebase to understand stack, conventions, patterns
- Breaks task into small, ordered user stories (max 20)
- Orders by dependency: schema/DB first, backend, frontend, integration
- Each story must fit in one session (one context window)
- Every acceptance criterion must be mechanically verifiable
- Posts plan as comment on Issue

**Example Plan:**

```
Issue #142: "Add dancing robot that tells jokes"

Planner's Stories:
1. Create dancing robot HTML component with placeholder UI
   - AC: HTML file exists at galaxy/features/dancing-robot.html
   - AC: Robot visible in browser
   - AC: Tests pass for component rendering
   - AC: Typecheck passes

2. Implement random joke API endpoint
   - AC: galaxy/api/jokes.js exists
   - AC: Returns random joke object
   - AC: Tests for API endpoint pass
   - AC: Typecheck passes

3. Integrate joke display into robot component
   - AC: Robot displays fetched joke
   - AC: Joke updates on button click
   - AC: Tests for integration pass
   - AC: Typecheck passes
```

#### 2. Setup Agent

- Creates feature branch from main
- Reads package.json, CI config, test config
- Ensures .gitignore exists (includes .env, node_modules, \*.key)
- Runs build to establish baseline
- Runs tests to establish baseline
- Reports findings back to workflow

#### 3. Developer Agent (Loops per Story)

For each story from Planner:

1. Pulls latest on feature branch
2. Reads progress file (codebase patterns learned so far)
3. Implements story only (no scope creep)
4. Writes tests for story's functionality
5. Runs typecheck/build
6. Runs tests to confirm they pass
7. Commits with proper message: `feat: <story-id> - <story-title>`
8. Appends to progress file
9. Updates codebase patterns if reusable patterns found

#### 4. Verifier Agent (Per Story)

Quick sanity check after each story:

1. Code exists (not TODOs or placeholders)
2. Each acceptance criterion met
3. Tests written for functionality
4. Tests pass
5. No obvious incomplete work
6. Typecheck passes
7. **Visual check for frontend changes** (uses agent-browser skill)
   - Opens HTML file directly or spins up dev server
   - Takes screenshot
   - Confirms layout, styling, elements present and positioned

**If fails:**

- Issues specific feedback
- Retries Developer step (max 2 retries)
- After exhaustion, escalates to human

#### 5. Tester Agent

Integration and E2E testing after all stories:

1. Runs full test suite
2. Looks for integration issues between stories
3. If UI feature, uses agent-browser for E2E test
4. Checks cross-cutting concerns: error handling, edge cases
5. Verifies overall feature works as cohesive whole

**If issues found:**

- Specific test failures or bugs
- Retries Developer step (max 2 retries)
- After exhaustion, escalates to human

#### 6. Developer Agent (PR Creation)

Creates pull request with:

- Clear title summarizing change
- Description explaining what and why
- Reference to what was tested
- Uses: `gh pr create`

#### 7. Reviewer Agent

Reviews PR for:

- Code quality and clarity
- Potential bugs or issues
- Test coverage
- Follows project conventions

Uses agent-browser skill to visually inspect UI changes if applicable.

**If approves:**

- Comments: "✓ Code review passed"
- Moves to next step (merge)

**If issues found:**

- Requests changes with specific feedback
- Retries Developer (max 2 retries)
- After exhaustion, escalates to human

### Why AntFarm Over Custom Agents?

**Deterministic:**

- Same workflow every time
- No "I hope it remembers to test"
- YAML-defined pipeline

**Verification:**

- Separate verifier agent checks each story
- Developer doesn't mark their own homework
- No code ships without review

**Fresh Context:**

- Each agent gets clean session
- No context window bloat
- Memory in git history, not in conversation

**Minimal Infrastructure:**

- YAML + SQLite + cron
- No Docker, no Redis, no Kafka
- Runs wherever OpenClaw runs (Raspberry Pi included)

### Installation on Raspberry Pi

```bash
# Install OpenClaw (if not already installed)
curl -fsSL https://raw.githubusercontent.com/snarktank/openclaw/main/scripts/install.sh | bash

# Install AntFarm
curl -fsSL https://raw.githubusercontent.com/snarktank/antfarm/v0.5.1/scripts/install.sh | bash

# Install feature-dev workflow
antfarm workflow install feature-dev

# Set up cron job for polling GitHub (every 5 minutes)
crontab -e
# Add: */5 * * * * cd /home/pi/repo-fun-agent && antfarm workflow ensure-crons feature-dev

# Configure GitHub credentials
gh auth login  # For repo access
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx  # For API access

# Start AntFarm daemon (runs in background, monitors SQLite DB)
antfarm workflow run feature-dev --daemon
```

---

## The Code Galaxy

Every merged feature = one star in the galaxy.

```
GitHub PR #456 merged
    ↓
Extract metadata:
- Issue number: #123
- Title: "Dancing robot"
- Lines changed: +156
- Files: 3
- Merged at: 2024-02-19
    ↓
Generate star:
- Position: (45, 78, 123) ← Deterministic from commit hash
- Color: Blue ← Based on file types (UI features)
- Size: 25 ← Lines changed / 10
- Brightness: 0.9 ← Newer = brighter
- Pulse: false ← Priority features pulse
    ↓
Render in Three.js galaxy
```

**Deterministic Positioning**: The same feature always maps to the same position. Everyone sees the same galaxy.

**Visual Language**:

- **Color**: Feature type (UI=blue, logic=green, data=yellow, etc.)
- **Size**: Complexity (more lines = bigger star)
- **Brightness**: Recency (newer stars glow brighter)
- **Pulse**: Priority features (paid extra to jump queue)

Click any star → See feature details, commit link, and who built it.

---

## MVP: What We're Building First

### Phase 1: The Foundation (Days 1-5)

**Goal**: Get the pipeline working.

1. ✅ GitHub repository (public)
2. ✅ GitHub bot account + PAT
3. ✅ Next.js portal (request submission, Stripe, Solana)
4. ✅ AntFarm installation (OpenClaw + feature-dev workflow)
5. ✅ Raspberry Pi or server setup (runs AntFarm)
6. ✅ GitHub Actions CI/CD (auto-deploy to GitHub Pages)

**Deliverable**:

- You can pay $1 → GitHub Issue created → AntFarm builds → Merged → Deployed

### Phase 2: The Galaxy (Days 6-10)

**Goal**: Make it visual and shareable.

1. ✅ GitHub Pages static site (`/galaxy`)
2. ✅ Three.js galaxy visualization
3. ✅ Star generation from merged PRs
4. ✅ Click-to-inspect feature details
5. ✅ Portal page with iframe to galaxy
6. ✅ Real-time terminal streaming (SSE from AntFarm SQLite DB)

**Deliverable**:

- You visit repo.fun → See galaxy growing in real-time
- Click your star → "Hey, I built that!"

### Phase 3: Gamification (Days 11-15)

**Goal**: Make it addictive.

1. ✅ Feature cards (shareable images)
2. ✅ Live terminal stream (watch AntFarm build live)
3. ✅ Limited build slots (10/hour = scarcity/FOMO)
4. ✅ Daily quests ("Build something funny", etc.)
5. ✅ Progress notifications (email/browser)

**Deliverable**:

- Users share weird features on Twitter
- People compete for "most creative" badge
- Daily traffic from repeat users

### What's NOT in MVP

We're keeping it simple. These come later:

- ❌ NFT minting (post-MVP)
- ❌ Collaborative builds (post-MVP)
- ❌ Feature battles (post-MVP)
- ❌ Golden tickets (post-MVP)
- ❌ API for external agents (post-MVP)

---

## Why 120 Characters?

```
❌ "Add full authentication system with login, signup, password reset,
    email verification, user profiles, and admin panel"
    → Too complex! What does "auth" mean? What framework?
    → AI has to guess. Might build wrong thing.

✅ "Add login form"
✅ "Add signup form"
✅ "Add password reset"
✅ "Add email verification"
✅ "Add user profile"
    → Atomic! Clear intent. AI knows exactly what to build.
    → Each is one star. More stars = cooler galaxy.
```

**If your request is too complex**:

- AI will reject it
- Comment on Issue: "This is 5 features. Please submit as 5 separate requests."
- Refund your payment automatically
- You resubmit as atomic features

This keeps chaos **fun** not broken.

---

## The Fun Stuff: Why You'd Pay $1

### 1. Visibility (The Million Dollar Homepage Effect)

Every feature = visible star in the galaxy. Not invisible code buried in a repo.

```
Million Dollar Homepage (2005):
    Pay $1 → Own a 10x10 pixel → Stay forever → Everyone sees it

ChaosCraft (2024):
    Pay $1 → Own a star → Stay forever → Everyone sees it
```

### 2. Recognition (Feature Cards)

Every feature gets a shareable card:

```
┌─────────────────────────────┐
│  🎨 FEATURE #142         │
│  "Dancing robot"           │
│                             │
│  Built by: @xeroc         │
│  Cost: 1 USDC             │
│  Lines: 156                │
│  Files: 3                 │
│                             │
│  [▶️ Live Demo] [🔗 GitHub]│
└─────────────────────────────┘
```

Post to Twitter: "Check out what I built for $1! 🚀"

### 3. Permanence (Git History)

Your feature lives forever in Git history. The galaxy is a time machine.

"Feature #142 was built on 2024-02-19 by @xeroc"

### 4. Entertainment (Watch AI Build Live)

Watch the terminal as AI writes your feature:

```
> Analyzing existing codebase...
> Reading /api/jokes endpoint...
> Generating DancingRobot component...
> Writing src/components/DancingRobot.tsx...
> Testing animation performance...
> Creating PR...
> ✅ Merged!
```

It's like watching a live coding stream, but it's YOUR feature being built.

### 5. Surprise (Blind Builds)

Pay $2 for a "blind build":

- Submit your request
- You DON'T see the code
- AI builds, deploys, THEN reveals
- "Surprise! Your blind build is a dancing cat 🎉"

### 6. Competition (Leaderboards)

- Most creative (community votes)
- Weirdest feature (AI-tagged)
- Most lines built
- First to build X

### 7. Ownership (Signatures)

Add a message to your feature:

```javascript
// Feature #142: Dancing robot
// Built by: @xeroc
// Message: "This is for everyone who's had a bad day 💜"
function dancingRobot() { ... }
```

Browse features by signature: "All features dedicated to cats"

### 8. Scarcity (Limited Build Slots)

Only 10 features built per hour. Queue resets every hour.

"8/10 slots used this hour, 2 remaining! 🕐"

Creates urgency: "If I don't pay now, I wait for next hour!"

### 9. History (Narrative)

We're not just building code. We're running an experiment.

"Day 1: Galaxy empty. What will emerge?"
"Day 30: 500 stars. See the chaos."
"Day 90: 2,000 stars. Where are we now?"

Time-lapse videos of galaxy growth. People share: "Watch the first 30 days in 5 minutes."

### 10. Addiction (Daily Quests)

Daily challenges:

- "Build something that makes people laugh"
- "Add a hidden easter egg"
- "Create something that interacts with another feature"

Complete 7 quests → "ChaosCraft Addict" badge.

---

## The Tech Stack (Simplified)

### Frontend (Portal - repo.fun)

- **Next.js 14** - Request submission, payment, queue tracker
- **Tailwind CSS** - Styling
- **Three.js** - Galaxy visualization (in iframe)
- **Vercel** - Free serverless hosting (Next.js)
- **Server-Sent Events (SSE)** - Real-time terminal streaming

### Backend (Next.js API Routes - Vercel Serverless)

- **GitHub API** - Issue creation, status tracking
- **Stripe API** - Human payment verification ($1)
- **Solana Web3.js** - Agent payment verification (1 USDC)
- **SQLite (Vercel Postgres)** - Payment tracking (issue_number → payment_id)

### AI Agent Orchestration (AntFarm on Raspberry Pi)

- **AntFarm CLI** - Multi-agent workflow orchestration
  - YAML-defined pipelines (feature-dev)
  - SQLite DB for state tracking
  - Cron-based polling
- **OpenClaw** - Agent runtime
  - Fresh session per agent step
  - Context in git history, not conversation
  - Skills: agent-browser for visual verification
- **7 Specialized Agents** (feature-dev workflow):
  - Planner (analysis)
  - Setup (coding)
  - Developer (coding - loops per story)
  - Verifier (verification - per story)
  - Tester (testing)
  - Developer (PR creation)
  - Reviewer (review)
- **GitHub CLI (gh)** - Git operations (branch, commit, PR, merge)

### Deployment (Galaxy - galaxy.repo.fun)

- **GitHub Actions** - CI/CD pipeline
  - Trigger: on PR merge (paths: galaxy/\*\*)
  - Build: Generate star-data.js from PR metadata
  - Deploy: peaceiris/actions-gh-pages@v3
- **GitHub Pages** - Static site hosting
  - Custom domain: galaxy.repo.fun
  - HTTPS built-in
  - CDN for global distribution
  - Auto-rebuilds on push to main
  - Free hosting

### Data Flow

```
User → Next.js API → GitHub (Issues)
                   ↓
                  SQLite (payment tracking)

AntFarm → GitHub API (polls for ready-for-build)
                ↓
         Git clone → Local repo on Pi
                ↓
         feature-dev workflow (7 agents)
                ↓
         GitHub CLI → Create PR
                ↓
         GitHub Actions → Deploy to GitHub Pages
                ↓
         Galaxy updates → User sees new star 🌟
```

---

## Infrastructure

### Core Technologies

- **AntFarm** - Project management and orchestration framework
- **OpenClaw** - AI agent framework for specification and implementation
- **Feature-dev Workflow** - Git-based feature development workflow

### Why GitHub Pages (Not Vercel)?

For MVP, **GitHub Pages is perfect**:

- ✅ Free hosting
- ✅ Auto-deploy on push (no CI/CD complexity)
- ✅ Static HTML/JS (what we're building)
- ✅ Same domain (subdomain or path)
- ✅ Simple (no Vercel account, no API keys)

Post-MVP, if we need server-side rendering (Next.js features), we can migrate to Vercel/Netlify.

---

## The Revenue Model

### Streams

- **Standard**: $1 per feature (FIFO)
- **Priority**: $5 per feature (skip 10 items)
- **Express**: $10 per feature (skip 50 items)

### Potential

| Requests/Day | Revenue/Day | Revenue/Month |
| ------------ | ----------- | ------------- |
| 10           | $30         | $900          |
| 50           | $150        | $4,500        |
| 100          | $300        | $9,000        |
| 500          | $1,500      | $45,000       |

### Costs

- **Hosting**: $0 (GitHub Pages is free)
- **GitHub**: Free tier
- **Raspberry Pi**: $0 (already owned)
- **Electricity**: ~$5/month
- **Stripe fees**: ~3% + $0.30 per transaction
- **Domain**: ~$10/month (optional)

### Profit Margin

```
Revenue: $9,000/month (100 requests/day)
Costs: ~$300/month (Stripe fees, electricity)
Profit: ~97% margin
```

---

## Success Metrics

### MVP (Day 15)

- 50+ features built
- 10+ unique contributors
- Zero critical failures
- $100+ revenue
- People sharing feature cards on social media

### 30 Days

- 500+ features built
- 50+ unique contributors
- $3,000+ revenue
- Viral content created (Twitter, Reddit, Hacker News)

### 90 Days

- 2,000+ features built
- 200+ unique contributors
- $10,000+ revenue
- Sponsorship deals, media coverage

---

## Risks & Mitigation

### Technical

1. **Build failures** → Auto-rollback, clear error messages, refund if not user's fault
2. **GitHub rate limits** → 5,000 req/hour is plenty for MVP
3. **Payment fraud** → Strict verification, duplicate detection, refund policy

### Business

1. **Low adoption** → Viral marketing, social proof, showcase weird features
2. **Legal/compliance** → Terms of service, explicit disclaimer: "Chaos is intentional"
3. **Platform risk** → Keep code open-source, portable to any Git hosting

---

## The Hook: Why Someone Would Pay $1

**Before (boring)**:
"Pay $1 to have an AI build code into a shared repository"

**After (exciting)**:
"Pay $1 to:

- ✅ Add a star to the ChaosCraft galaxy
- ✅ Get a shareable feature card
- ✅ Sign your feature with a message
- ✅ Watch AI build it live in real-time
- ✅ Be part of internet history
- ✅ Compete for daily quests
- ✅ See the galaxy grow over time
- ✅ Jump the queue with priority payment"

**ChaosCraft: The first AI-powered, crowd-sourced codebase. What will we become together?**

---

## Implementation Checklist

### Phase 1: Foundation

- ✅ Create GitHub repo (public)
- ✅ Set up GitHub bot account + PAT (repo write access)
- ✅ Configure custom domains (repo.fun, galaxy.repo.fun)
- ✅ Create Next.js portal app
  - ✅ Request submission form (120 char limit)
  - [ ] Stripe integration (checkout + webhook)
  - ❌ Solana integration (transaction verification) - we do this later
  - [ ] API routes for payment verification
  - [ ] SQLite DB schema (payment tracking)
- ❌ Deploy Next.js portal to Vercel - later

### Phase 2: Galaxy Implementation

- ✅ Build Three.js visualization
  - ✅ Star rendering (position, color, size, brightness, pulse)
  - ✅ Camera controls (zoom, rotate, pan)
  - ✅ Click interaction (inspect feature details)
- ✅ Obtain meta data for stars
  - ✅ Extract PR metadata (commit hash, lines changed, file types) via github api
  - ✅ Calculate deterministic position (hash function)
  - ✅ Map file types to colors
  - ✅ Calculate size (lines / 10)
  - ✅ Calculate brightness (recency)
- ✅ Add click-to-inspect
  - ✅ Show feature details modal
  - ✅ Link to PR, commit, Issue
  - ✅ Display built-by username
- ✅ Test rendering performance
  - ✅ 1,000+ stars render smoothly
  - ✅ FPS > 30 on mobile devices

### Phase 3: Gamification

- [ ] Feature cards (shareable)
  - [ ] Generate OG images per feature
  - [ ] Share links to Twitter/X
- [ ] Live terminal stream
  - [ ] SSE endpoint: /api/live-terminal
  - [ ] Query AntFarm SQLite DB for run logs
  - [ ] Stream output to browser in real-time
- [ ] Limited build slots
  - [ ] Track builds per hour
  - [ ] Display "X/10 slots used this hour"
  - [ ] Queue resets at top of hour
- [ ] Daily quests
  - [ ] Quest system in DB
  - [ ] Badge tracking per user
- [ ] Progress notifications
  - [ ] Email notifications (SendGrid/Resend)
  - [ ] Browser notifications (Push API)
  - [ ] "Your star is live! 🌟" message

### Phase 4: AntFarm Setup

- [ ] Provision server (Raspberry Pi or VPS)
  - [ ] Install Node.js 22+
  - [ ] Install OpenClaw
  - [ ] Install AntFarm CLI
- [ ] Configure AntFarm
  - [ ] Install feature-dev workflow
  - [ ] Set up GitHub credentials (gh auth login + GITHUB_TOKEN)
  - [ ] Configure SQLite DB for AntFarm state
  - [ ] Set up cron job (poll GitHub every 5 minutes)
  - [ ] Start AntFarm daemon (runs in background)
  - [ ] Customize workflow for categorization of PR
- [ ] Test AntFarm workflow
  - [ ] Create test Issue with "ready-for-build" label
  - [ ] Verify AntFarm picks up Issue
  - [ ] Verify 7-agent workflow completes
  - [ ] Verify PR created and merged

### Phase 5: GitHub Actions + GitHub Pages

- [ ] Set up GitHub Pages
  - [ ] Configure repo settings for GitHub Pages
  - [ ] Set custom domain: galaxy.repo.fun
  - [ ] Verify DNS setup (CNAME or A record)
- [ ] Create GitHub Actions workflow
  - [ ] Create .github/workflows/deploy.yml
  - [ ] Trigger on PR merge (paths: galaxy/\*\*)
  - [ ] Build step: Generate star-data.js from PR metadata
  - [ ] Deploy step: peaceiris/actions-gh-pages@v3
- [ ] Test deployment pipeline
  - [ ] Create test PR
  - [ ] Merge test PR
  - [ ] Verify GitHub Actions deploys to GitHub Pages
  - [ ] Verify galaxy.repo.fun updates

### Phase 6: End-to-End Testing

- [ ] Test Stripe flow
  - [ ] User submits request → Stripe checkout → Payment verified → GitHub Issue created
- [ ] Test Solana flow
  - [ ] User submits request → Signs Solana tx → POST signature → Verification → GitHub Issue created
- [ ] Test AntFarm flow
  - [ ] Issue labeled "ready-for-build" → AntFarm picks up → PR created → Merged
- [ ] Test deployment flow
  - [ ] PR merged → GitHub Actions runs → GitHub Pages deploys → Galaxy updates
- [ ] Test user journey end-to-end
  - [ ] Submit request → Pay → Wait → Watch build → See star in galaxy

---

## Questions for Fabian

1. **Raspberry Pi vs VPS**: Use Raspberry Pi (zero cost, but slow) or VPS (~$5/month, faster)?

- i'll deploy this into our nomad cluster

2. **Initial galaxy**: Start with empty galaxy (no stars) or seed with 10 demo features?

- start empty, i will trigger the first builds myself

3. **Build slots**: Limit to 10/hour for scarcity, or unlimited for MVP?

- unlimited for now

4. **Daily quests**: Essential for MVP or post-MVP (simplify first launch)?

- post-mvp

5. **Blind builds**: Fun gimmick or skip for simplicity?

- skip

6. **Priority payments**: Implement immediately or post-MVP?

- not needed for now, remove them

---

## Questions for Fabian

See "Questions for Fabian" section in Implementation Checklist above for open decisions.

---

## The Pitch (One Paragraph)

ChaosCraft is Million Dollar Homepage meets AI coding. Pay $1, submit a 120-character request, and watch as AntFarm's 7-agent team turn your idea into code that becomes a star in a growing 3D galaxy. The site everyone builds (galaxy.repo.fun) lives alongside the site where you submit requests (repo.fun portal), both on the same domain. AntFarm provides deterministic workflows with verification at every step—planner decomposes tasks, developer writes code, verifier checks work, tester validates integration, reviewer approves PRs. Want to see what happens when 1,000 people tell an AI to build whatever they want? Be part of internet history.

---

**Ready to build repo.fun? Let's go.** 🚀
