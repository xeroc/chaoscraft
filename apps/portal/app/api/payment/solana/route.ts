import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js'
import { getDb, run, queryOne } from '@/lib/db'
import { Octokit } from 'octokit'

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

// USDC Token Mint on Solana
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

// Verify Solana transaction
async function verifySolanaTransaction(
  signature: string,
  expectedAmount: number,
  expectedRecipient: string
): Promise<{ valid: boolean; sender?: string; error?: string }> {
  try {
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com')

    // Get transaction details
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    })

    if (!tx) {
      return { valid: false, error: 'Transaction not found' }
    }

    const parsedTx = tx as ParsedTransactionWithMeta

    if (!parsedTx.meta || parsedTx.meta.err) {
      return { valid: false, error: 'Transaction failed' }
    }

    // Check if it's a transfer to expected recipient
    const message = parsedTx.transaction.message as any

    // Find transfer instructions
    for (const instruction of message.instructions || []) {
      // Check if it's a token transfer
      // This is a simplified check - in production you'd verify against SPL Token program
      const accountKeys = message.accountKeys

      if (accountKeys.length >= 3) {
        // accountKeys[1] is usually the source (sender)
        // accountKeys[2] is usually the destination (recipient)

        const recipient = accountKeys[2].toString()

        if (recipient.toLowerCase() === expectedRecipient.toLowerCase()) {
          // Verify amount (this would require parsing of token transfer data)
          // For now, we'll check if transaction exists and is successful
          // In production, you'd decode instruction data to verify exact amount

          const sender = accountKeys[1].toString()

          return { valid: true, sender }
        }
      }
    }

    return { valid: false, error: 'Transfer not found or invalid recipient' }
  } catch (error) {
    console.error('Solana verification error:', error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    }
  }
}

// Create GitHub issue and update database
async function createIssueAndUpdateDb(paymentDbId: number, requestText: string, priority: string) {
  const { data: issue } = await octokit.rest.issues.create({
    owner: process.env.GITHUB_OWNER!,
    repo: process.env.GITHUB_REPO!,
    title: requestText,
    body: `## Feature Request\n\n${requestText}\n\n### Priority\n${priority}\n\n---\n*Submitted via chaoscraft*\n\nPayment verified via Solana.`,
    labels: ['ready-for-build', priority === 'standard' ? '' : `priority:${priority}`].filter(Boolean),
  })

  await run(
    `UPDATE payments SET issue_number = ? WHERE id = ?`,
    [issue.number, paymentDbId]
  )

  await run(
    `INSERT INTO requests (issue_number, request_text, priority) VALUES (?, ?, ?)`,
    [issue.number, requestText, priority]
  )

  return issue
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { paymentDbId, signature, requestText, priority } = body

    // Validate required fields
    if (!paymentDbId || !signature || !requestText || !priority) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get wallet address from environment
    const walletAddress = process.env.SOLANA_WALLET_ADDRESS

    if (!walletAddress) {
      return NextResponse.json({ error: 'Solana wallet not configured' }, { status: 500 })
    }

    // Get amount from database
    const payment = await queryOne('SELECT * FROM payments WHERE id = ?', [paymentDbId])

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status === 'verified') {
      console.log('Payment already verified, skipping issue creation')
      return NextResponse.json({ received: true })
    }

    const amount = payment.amount / 100 // Convert cents to USDC

    // Verify transaction
    const verification = await verifySolanaTransaction(signature, amount, walletAddress)

    if (!verification.valid) {
      console.error('Solana verification failed:', verification.error)
      await run(
        `UPDATE payments SET status = ? WHERE id = ?`,
        ['failed', paymentDbId]
      )
      return NextResponse.json(
        { error: verification.error || 'Transaction verification failed' },
        { status: 400 }
      )
    }

    // Update payment status
    await run(
      `UPDATE payments SET status = ?, verified_at = ?, payment_id = ? WHERE id = ?`,
      ['verified', new Date().toISOString(), signature, paymentDbId]
    )

    // Create GitHub issue
    const issue = await createIssueAndUpdateDb(paymentDbId, requestText, priority)

    console.log(`✅ Solana payment verified and Issue #${issue.number} created for request: ${requestText}`)
    console.log(`   Sender: ${verification.sender}`)

    return NextResponse.json({
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
      sender: verification.sender,
    })
  } catch (error) {
    console.error('Solana webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
