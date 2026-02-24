import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getDb, run } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

interface SubmitRequest {
  request: string
  paymentMethod: 'stripe' | 'solana'
  priority: 'standard' | 'priority' | 'express'
}

interface CreateIssueResponse {
  id: number
  html_url: string
  number: number
}

// Get pricing based on priority
function getPricing(priority: 'standard' | 'priority' | 'express'): number {
  switch (priority) {
    case 'express':
      return 1000 // $10
    case 'priority':
      return 500 // $5
    default:
      return 100 // $1
  }
}

// Create GitHub issue
async function createGitHubIssue(requestText: string, priority: string): Promise<CreateIssueResponse> {
  const response = await fetch(`https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: requestText,
      body: `## Feature Request\n\n${requestText}\n\n### Priority\n${priority}\n\n---\n*Submitted via repo.fun*`,
      labels: ['awaiting-payment'],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GitHub API error: ${error}`)
  }

  return response.json()
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmitRequest = await req.json()

    // Validate request
    if (!body.request || body.request.trim().length === 0) {
      return NextResponse.json({ error: 'Request text is required' }, { status: 400 })
    }

    if (body.request.length > 120) {
      return NextResponse.json({ error: 'Request must be 120 characters or less' }, { status: 400 })
    }

    // Validate priority
    if (!['standard', 'priority', 'express'].includes(body.priority)) {
      return NextResponse.json({ error: 'Invalid priority' }, { status: 400 })
    }

    // Validate payment method
    if (!['stripe', 'solana'].includes(body.paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    // Get pricing
    const amount = getPricing(body.priority)
    const amountInCents = amount * 100 // Stripe uses cents

    // Create pending entry in database
    const paymentId = `stripe_pending_${Date.now()}`

    const result = await run(
      `INSERT INTO payments (payment_id, amount, currency, payment_method, priority, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [paymentId, amountInCents, 'usd', body.paymentMethod, body.priority]
    )

    const paymentDbId = result.lastInsertRowid

    if (body.paymentMethod === 'stripe') {
      // Create Stripe checkout session
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'ChaosCraft Feature Request',
                description: `Priority: ${body.priority}\nRequest: ${body.request}`,
                images: ['https://repo.fun/og-image.png'],
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}?canceled=true`,
        metadata: {
          paymentDbId: paymentDbId.toString(),
          request: body.request,
          priority: body.priority,
        },
        customer_email: undefined, // Can collect email if needed
      })

      return NextResponse.json({
        checkoutUrl: checkoutSession.url,
        sessionId: checkoutSession.id,
      })
    } else {
      // Solana payment - return payment details
      return NextResponse.json({
        solanaAddress: process.env.SOLANA_WALLET_ADDRESS,
        amount: amount,
        currency: 'usdc',
        paymentDbId: paymentDbId.toString(),
        instructions: 'Send the specified amount of USDC to the provided Solana address',
      })
    }
  } catch (error) {
    console.error('Submit API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
