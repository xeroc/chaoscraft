# Sync GitHub Issues to AntFarm

## What was created

Created `apps/sync-github/` - a standalone TypeScript CLI application that syncs paid GitHub issues to AntFarm for processing.

## Files created

```
apps/sync-github/
├── package.json          # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── .env.example         # Environment variables template
├── .gitignore          # Ignores dist, .env, logs
├── README.md           # Full documentation
└── src/
    └── sync-github-issues.ts  # Main script
```

## How it works

1. Fetches open GitHub issues labeled `paid` but without the `in-antfarm` label
2. For each unclaimed issue:
   - Runs: `antfarm workflow run feature-dev --issue <issue-id>`
   - Adds `in-antfarm` label to mark as claimed
3. Logs success/failure for each issue

## Usage

### Build

```bash
pnpm sync:build
# or
cd apps/sync-github && pnpm run build
```

### Run (manual)

```bash
pnpm sync:start
# or
cd apps/sync-github && pnpm start
```

### Run (dev mode with ts-node)

```bash
pnpm sync:dev
# or
cd apps/sync-github && pnpm run dev
```

## Setup

1. Copy `.env.example` to `.env` and configure:

   ```env
   GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
   GITHUB_REPO=owner/repo
   ```

2. Ensure AntFarm CLI is installed:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/snarktank/antfarm/v0.5.1/scripts/install.sh | bash
   antfarm workflow install feature-dev
   ```

3. Build the script:
   ```bash
   pnpm sync:build
   ```

## Cronjob

Add to crontab to run every 5 minutes:

```cron
*/5 * * * * cd /path/to/chaoscraft/apps/sync-github && pnpm start >> /var/log/sync-github.log 2>&1
```

## Labels

- **paid**: Added by payment system when user pays
- **in-antfarm**: Added by this script when issue is sent to AntFarm

## Error handling

- If AntFarm fails to start for an issue, the `in-antfarm` label is NOT added
- Next cron run will retry failed issues
- All errors are logged for debugging
