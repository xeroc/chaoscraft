import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb, run, queryOne } from "@/lib/db";
import { Octokit } from "octokit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Verify Stripe webhook signature
function verifyStripeSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  try {
    stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return true;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return false;
  }
}

// Create GitHub issue and update database
async function updateIssueDb(
  paymentDbId: number,
  issueId: number,
  requestText: string,
) {
  // Create GitHub issue
  const { data: issue } = await octokit.rest.issues.createComment({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    issue_number: issueId,
    body: `*Payment verified via Stripe.*`,
  });

  // flag it as paid
  await octokit.rest.issues.update({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    issue_number: issueId,
    labels: ["paid"],
  });

  // Update payment with issue number
  await run(`UPDATE payments SET issue_number = $1 WHERE id = $2`, [
    issueId,
    paymentDbId,
  ]);

  // Insert request record
  await run(`UPDATE requests SET status = $1 WHERE issue_number = $2`, [
    "paid",
    issueId,
  ]);

  return issue;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature")!;

    // Verify webhook signature
    if (!verifyStripeSignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;

        if (session.payment_status === "paid") {
          const paymentDbId = parseInt(session.metadata?.paymentDbId || "0");
          const issueId = parseInt(session.metadata?.issueId || "0");
          const requestText = session.metadata?.request || "";

          // Check if payment already processed
          const existingPayment = await queryOne(
            "SELECT * FROM payments WHERE id = $1",
            [paymentDbId],
          );

          if (!existingPayment) {
            console.error("Payment not found in database:", paymentDbId);
            return NextResponse.json(
              { error: "Payment not found" },
              { status: 404 },
            );
          }

          if (existingPayment.status === "verified") {
            console.log("Payment already verified, skipping issue creation");
            return NextResponse.json({ received: true });
          }

          // Update payment status
          await run(
            `UPDATE payments SET status = $1, verified_at = $2 WHERE id = $3`,
            ["verified", new Date().toISOString(), paymentDbId],
          );

          // Create GitHub issue
          await updateIssueDb(paymentDbId, issueId, requestText);

          console.log(
            `✅ Payment verified and Issue # created for request: ${requestText}`,
          );
        }

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as any;

        const paymentDbId = parseInt(session.metadata?.paymentDbId || "0");

        // Mark payment as expired
        if (paymentDbId > 0) {
          await run(`UPDATE payments SET status = $1 WHERE id = $2`, [
            "expired",
            paymentDbId,
          ]);
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as any;

        // Find payment by payment_id (which contains session ID)
        const payment = await queryOne(
          "SELECT * FROM payments WHERE payment_id LIKE $1",
          [`%${paymentIntent.id}%`],
        );

        if (payment) {
          await run(`UPDATE payments SET status = $1 WHERE id = $2`, [
            "failed",
            payment.id,
          ]);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
