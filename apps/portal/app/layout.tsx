import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'chaoscraft - Pay $1, Watch AI Build Chaos',
  description: 'The first crowd-sourced AI-powered codebase. Pay $1, submit a 120-character request, and watch as AI agents turn your idea into code that becomes a star in the galaxy.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
