import { Octokit } from "@octokit/rest";
import { spawn } from "child_process";
import * as dotenv from "dotenv";

dotenv.config();

interface Issue {
  number: number;
  title: string;
  labels: { name: string }[];
  body: string;
}

const PAID_LABEL = "paid";
const CLAIMED_LABEL = "queued";

async function runAntfarmWorkflow(
  issueNumber: number,
  issueBody: string,
): Promise<{ success: boolean; runId?: string; error?: string }> {
  return new Promise((resolve) => {
    console.log(`Running: antfarm workflow run feature-dev "${issueBody}"`);

    let stdout = "";
    let stderr = "";

    const child = spawn(
      "antfarm",
      ["workflow", "run", "feature-dev", issueBody],
      {
        timeout: 30000,
      },
    );

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      const output = stdout + stderr;
      const runIdMatch = output.match(/Run:\s+([a-f0-9]+)/i);
      const runId = runIdMatch ? runIdMatch[1] : undefined;

      console.log(
        `AntFarm started for issue #${issueNumber}. Run ID: ${runId || "unknown"}`,
      );
      console.log(`Output: ${output}`);

      if (code === 0) {
        resolve({ success: true, runId });
      } else {
        resolve({ success: false, error: `Exit code: ${code}` });
      }
    });

    child.on("error", (error) => {
      console.error(
        `Error running AntFarm for issue #${issueNumber}:`,
        error.message,
      );
      resolve({ success: false, error: error.message });
    });
  });
}

async function addClaimedLabel(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<void> {
  try {
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: issueNumber,
      labels: [CLAIMED_LABEL],
    });
    console.log(`Added "${CLAIMED_LABEL}" label to issue #${issueNumber}`);
  } catch (error: any) {
    console.error(
      `Failed to add label to issue #${issueNumber}:`,
      error.message,
    );
  }
}

async function fetchPaidUnclaimedIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<Issue[]> {
  const issues: Issue[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const response = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      state: "open",
      labels: PAID_LABEL,
      per_page: perPage,
      page,
    });

    if (response.data.length === 0) break;

    for (const issue of response.data) {
      const labelNames = issue.labels.map((l: any) => l.name);

      if (!labelNames.includes(CLAIMED_LABEL)) {
        issues.push({
          number: issue.number,
          body: issue.body ?? "",
          title: issue.title,
          labels: issue.labels.map((l: any) => ({ name: l.name })),
        });
      }
    }

    if (response.data.length < perPage) break;
    page++;
  }

  return issues;
}

async function main(): Promise<void> {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;

  if (!githubToken) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  if (!githubRepo) {
    throw new Error(
      "GITHUB_REPO environment variable is required (format: owner/repo)",
    );
  }

  const [owner, repo] = githubRepo.split("/");

  if (!owner || !repo) {
    throw new Error("GITHUB_REPO must be in format: owner/repo");
  }

  console.log(`Starting sync for ${owner}/${repo}...`);
  console.log(
    `Looking for issues with label "${PAID_LABEL}" and without "${CLAIMED_LABEL}"...`,
  );

  const octokit = new Octokit({
    auth: githubToken,
  });

  const issues = await fetchPaidUnclaimedIssues(octokit, owner, repo);

  console.log(`Found ${issues.length} unclaimed paid issues`);

  for (const issue of issues) {
    console.log(`\nProcessing issue #${issue.number}: "${issue.title}"`);

    const result = await runAntfarmWorkflow(issue.number, issue.body);

    if (result.success) {
      await addClaimedLabel(octokit, owner, repo, issue.number);
      console.log(`✅ Issue #${issue.number} claimed and sent to AntFarm`);
    } else {
      console.error(
        `❌ Failed to send issue #${issue.number} to AntFarm: ${result.error}`,
      );
    }
  }

  console.log("\nSync complete");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
