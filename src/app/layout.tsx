import { ClerkProvider } from '@clerk/nextjs'
import type { Metadata } from 'next'
import '@/styles/globals.scss'

export const metadata: Metadata = {
  title: 'Pulsar - AI Knowledge Intelligence Engine',
  description: 'Transform notes into connected, actionable systems',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}