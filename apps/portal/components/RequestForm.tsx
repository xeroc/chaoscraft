'use client'

import { useState, FormEvent } from 'react'
import { CreditCard, Zap } from 'lucide-react'

export default function RequestForm() {
  const [request, setRequest] = useState('')
  const [charCount, setCharCount] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'solana'>('stripe')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (request.trim().length === 0) {
      setError('Please enter a request')
      return
    }

    if (request.length > 120) {
      setError('Request must be 120 characters or less')
      return
    }

    setIsSubmitting(true)

    try {
      if (paymentMethod === 'stripe') {
        // Initiate Stripe checkout
        const response = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            request: request.trim(),
            paymentMethod: 'stripe',
            priority: 'standard',
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to initiate checkout')
        }

        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl
      } else {
        // Solana payment - show QR code and instructions
        setSuccess(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  if (success && paymentMethod === 'solana') {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
        <Zap className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Pay 1 USDC</h3>
        <p className="text-blue-200/70 mb-6">Scan or send 1 USDC to complete your request</p>

        <div className="bg-white rounded-lg p-4 inline-block mb-4">
          {/* QR Code placeholder - would be generated with a QR code library */}
          <div className="w-48 h-48 flex items-center justify-center bg-gray-200 text-gray-600">
            [QR Code]
          </div>
        </div>

        <div className="space-y-2 text-sm text-blue-200/70">
          <p>Wallet Address:</p>
          <code className="block bg-black/30 px-4 py-2 rounded font-mono text-white break-all">
            7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
          </code>
          <p className="text-xs mt-2">Send exactly 1 USDC (SPL token)</p>
        </div>

        <button
          onClick={() => {
            // In a real app, this would verify the transaction via /api/payment/solana
            setSuccess(false)
          }}
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all"
        >
          I've sent the payment
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Input */}
        <div>
          <label htmlFor="request" className="block text-sm font-medium text-blue-200 mb-2">
            Your Request
          </label>
          <textarea
            id="request"
            value={request}
            onChange={(e) => {
              setRequest(e.target.value)
              setCharCount(e.target.value.length)
            }}
            placeholder="Add a dancing robot that tells random jokes..."
            className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
            rows={3}
            maxLength={120}
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-sm ${charCount > 120 ? 'text-red-400' : 'text-blue-300/70'}`}>
              {charCount}/120 characters
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-3">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setPaymentMethod('stripe')}
              className={`p-4 rounded-lg border transition-all ${
                paymentMethod === 'stripe'
                  ? 'bg-blue-500/20 border-blue-400 text-white'
                  : 'bg-white/5 border-white/20 text-white/60 hover:border-white/40'
              }`}
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-semibold">$1 USD</div>
              <div className="text-xs text-white/50">Credit Card</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('solana')}
              className={`p-4 rounded-lg border transition-all ${
                paymentMethod === 'solana'
                  ? 'bg-purple-500/20 border-purple-400 text-white'
                  : 'bg-white/5 border-white/20 text-white/60 hover:border-white/40'
              }`}
            >
              <Zap className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-semibold">1 USDC</div>
              <div className="text-xs text-white/50">Solana</div>
            </button>
          </div>
        </div>

        {/* Priority Options */}
        <div>
          <label className="block text-sm font-medium text-blue-200 mb-3">
            Build Priority
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/20 hover:border-white/40 cursor-pointer transition-all bg-white/5">
              <input
                type="radio"
                name="priority"
                value="standard"
                defaultChecked
                className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-white/10 border-white/20"
              />
              <div className="flex-1">
                <div className="font-semibold text-white">Standard</div>
                <div className="text-xs text-blue-300/70">First come, first served</div>
              </div>
              <div className="text-lg font-bold text-white">$1</div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/20 hover:border-white/40 cursor-pointer transition-all bg-white/5">
              <input
                type="radio"
                name="priority"
                value="priority"
                className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-white/10 border-white/20"
              />
              <div className="flex-1">
                <div className="font-semibold text-white">Priority</div>
                <div className="text-xs text-blue-300/70">Skip ahead of 10 items</div>
              </div>
              <div className="text-lg font-bold text-white">$5</div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg border border-white/20 hover:border-white/40 cursor-pointer transition-all bg-white/5">
              <input
                type="radio"
                name="priority"
                value="express"
                className="w-4 h-4 text-blue-500 focus:ring-blue-500 bg-white/10 border-white/20"
              />
              <div className="flex-1">
                <div className="font-semibold text-white">Express</div>
                <div className="text-xs text-blue-300/70">Skip ahead of 50 items</div>
              </div>
              <div className="text-lg font-bold text-white">$10</div>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || request.trim().length === 0}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Processing...
            </>
          ) : (
            <>
              {paymentMethod === 'stripe' ? <CreditCard className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              Pay {paymentMethod === 'stripe' ? '$1' : '1 USDC'} to Submit
            </>
          )}
        </button>
      </form>
    </div>
  )
}
