import type { Metadata } from 'next'
import '@/styles/globals.scss'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Pulsar - Knowledge Intelligence OS',
  description: 'AI-powered knowledge management and productivity platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, width: '100%', height: '100%' }}>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}
