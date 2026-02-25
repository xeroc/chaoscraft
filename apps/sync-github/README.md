# Sync GitHub Issues to AntFarm

This script polls GitHub for paid issues that haven't been claimed yet and sends them to AntFarm for processing.

## How it works

1. Fetches all open GitHub issues with the `paid` label
2. Filters out issues that already have the `in-antfarm` label
3. For each unclaimed paid issue:
   - Runs `antfarm workflow run feature-dev --issue <issue-id>`
   - Adds the `in-antfarm` label to mark it as claimed

## Setup

### 1. Install dependencies

```bash
cd apps/sync-github
pnpm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx  # GitHub Personal Access Token with repo scope
GITHUB_REPO=owner/repo                 # Your GitHub repository (e.g., snarktank/repo-fun)
```

### 3. Build the script

```bash
pnpm run build
```

### 4. Run manually (to test)

```bash
pnpm start
```

## Running as a cronjob

Add this to your crontab to run every 5 minutes:

```bash
crontab -e
```

Add:

```cron
*/5 * * * * cd /path/to/chaoscraft/apps/sync-github && pnpm start >> /var/log/sync-github.log 2>&1
```

## Labels

- `paid`: Added by the payment system when a user pays for a feature request
- `in-antfarm`: Added by this script when the issue has been claimed and sent to AntFarm

## AntFarm CLI

This script requires the `antfarm` CLI to be installed on the machine:

```bash
curl -fsSL https://raw.githubusercontent.com/snarktank/antfarm/v0.5.1/scripts/install.sh | bash
antfarm workflow install feature-dev
```

## Troubleshooting

### "antfarm: command not found"

Make sure AntFarm CLI is installed and available in your PATH:

```bash
which antfarm
```

If not found, add it to your PATH or use the full path in the script.

### GitHub rate limits

The script uses GitHub's REST API which has rate limits. If you encounter rate limit errors, consider:

- Using a fine-grained personal access token with higher rate limits
- Running the cronjob less frequently (e.g., every 10 minutes instead of 5)

### Failed AntFarm workflow

If an issue fails to send to AntFarm, the script will log the error but won't add the `in-antfarm` label. This allows the next cron run to retry it.

## Development

Run with ts-node for development (auto-reloads on changes):

```bash
pnpm run dev
```
