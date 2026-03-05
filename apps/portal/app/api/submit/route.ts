import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb, run } from "@/lib/db";
import { Octokit } from "@octokit/rest";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

interface SubmitRequest {
  request: string;
  paymentMethod: "stripe" | "solana";
}

// Create GitHub issue
async function createGitHubIssue(requestText: string, priority: string) {
  const githubToken = process.env.GITHUB_TOKEN;
  const githubOwner = process.env.GITHUB_OWNER;
  const githubRepo = process.env.GITHUB_REPO;
  if (!githubToken) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }
  if (!githubRepo) {
    throw new Error("GITHUB_REPO environment variable is required");
  }
  if (!githubOwner) {
    throw new Error("GITHUB_OWNER environment variable is required");
  }
  console.log(githubToken);
  const octokit = new Octokit({
    auth: githubToken,
  });
  return await octokit.rest.issues.create({
    owner: githubOwner,
    repo: githubRepo,
    title: requestText.split("\n")[0].slice(0, 16),
    body: requestText,
    labels: [],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmitRequest = await req.json();

    // Validate request
    if (!body.request || body.request.trim().length === 0) {
      return NextResponse.json(
        { error: "Request text is required" },
        { status: 400 },
      );
    }

    if (body.request.length > 120) {
      return NextResponse.json(
        { error: "Request must be 120 characters or less" },
        { status: 400 },
      );
    }

    // Validate payment method
    if (!["stripe", "solana"].includes(body.paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return NextResponse.json(
        { error: "STRIPE_PRICE_ID environment variable is required" },
        { status: 500 },
      );
    }

    if (!process.env.STRIPE_PRICE_AMOUNT_USD) {
      return NextResponse.json(
        { error: "STRIPE_PRICE_AMOUNT_USD environment variable is required" },
        { status: 500 },
      );
    }

    const amount = parseFloat(process.env.STRIPE_PRICE_AMOUNT_USD);

    const gh_issue = await createGitHubIssue(body.request, "standard");

    // Create pending entry in database
    const paymentId = `stripe_pending_${Date.now()}`;
    const issueId = gh_issue.data.number;

    const result = await run(
      `INSERT INTO payments (payment_id, amount, currency, payment_method, status, issue_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paymentId, amount, "usd", body.paymentMethod, "new", issueId],
    );
    await run(
      `INSERT INTO requests (issue_number, request_text, status) VALUES (?, ?, ?)`,
      [issueId, body.request, "new"],
    );

    const paymentDbId = result.lastInsertId;

    if (body.paymentMethod === "stripe") {
      // Create Stripe checkout session with pre-configured price
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount * 100,
              product: process.env.STRIPE_PRICE_ID,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}&issueId=${issueId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}?canceled=true`,
        metadata: {
          issueId: issueId,
          paymentDbId: paymentDbId.toString(),
          request: body.request,
        },
      });

      return NextResponse.json({
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      });
    } else {
      // Solana payment - return payment details
      return NextResponse.json({
        solanaAddress: process.env.SOLANA_WALLET_ADDRESS,
        amount: amount,
        currency: "usdc",
        paymentDbId: paymentDbId.toString(),
        issueId: issueId,
        instructions:
          "Send the specified amount of USDC to the provided Solana address",
      });
    }
  } catch (error) {
    console.error("Submit API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
