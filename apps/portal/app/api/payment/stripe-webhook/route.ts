import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getDb, run, queryOne } from '@/lib/db'
import { Octokit } from 'octokit'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

// Verify Stripe webhook signature
function verifyStripeSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  try {
    stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    return true
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return false
  }
}

// Create GitHub issue and update database
async function createIssueAndUpdateDb(paymentDbId: number, requestText: string, priority: string) {
  // Create GitHub issue
  const { data: issue } = await octokit.rest.issues.create({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    title: requestText,
    body: `## Feature Request\n\n${requestText}\n\n### Priority\n${priority}\n\n---\n*Submitted via chaoscraft*\n\nPayment verified via Stripe.`,
    labels: ['ready-for-build', priority === 'standard' ? '' : `priority:${priority}`].filter(Boolean),
  })

  // Update payment with issue number
  await run(
    `UPDATE payments SET issue_number = ? WHERE id = ?`,
    [issue.number, paymentDbId]
  )

  // Insert request record
  await run(
    `INSERT INTO requests (issue_number, request_text, priority) VALUES (?, ?, ?)`,
    [issue.number, requestText, priority]
  )

  return issue
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text()
    const signature = req.headers.get('stripe-signature')!

    // Verify webhook signature
    if (!verifyStripeSignature(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any

        if (session.payment_status === 'paid') {
          const paymentDbId = parseInt(session.metadata?.paymentDbId || '0')
          const requestText = session.metadata?.request || ''
          const priority = session.metadata?.priority || 'standard'

          // Check if payment already processed
          const existingPayment = await queryOne('SELECT * FROM payments WHERE id = ?', [paymentDbId])

          if (!existingPayment) {
            console.error('Payment not found in database:', paymentDbId)
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
          }

          if (existingPayment.status === 'verified') {
            console.log('Payment already verified, skipping issue creation')
            return NextResponse.json({ received: true })
          }

          // Update payment status
          await run(
            `UPDATE payments SET status = ?, verified_at = ? WHERE id = ?`,
            ['verified', new Date().toISOString(), paymentDbId]
          )

          // Create GitHub issue
          await createIssueAndUpdateDb(paymentDbId, requestText, priority)

          console.log(`✅ Payment verified and Issue # created for request: ${requestText}`)
        }

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as any

        const paymentDbId = parseInt(session.metadata?.paymentDbId || '0')

        // Mark payment as expired
        if (paymentDbId > 0) {
          await run(
            `UPDATE payments SET status = ? WHERE id = ?`,
            ['expired', paymentDbId]
          )
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any

        // Find payment by payment_id (which contains session ID)
        const payment = await queryOne('SELECT * FROM payments WHERE payment_id LIKE ?', [`%${paymentIntent.id}%`])

        if (payment) {
          await run(
            `UPDATE payments SET status = ? WHERE id = ?`,
            ['failed', payment.id]
          )
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
