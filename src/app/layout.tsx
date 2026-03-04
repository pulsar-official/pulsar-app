import type { Metadata } from 'next'
import '@/styles/globals.scss'
import { AppLayout } from '@/components/Layout/AppLayout'

export const metadata: Metadata = {
  title: 'Pulsar - Knowledge Intelligence OS',
  description: 'AI-powered knowledge management and productivity platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, width: '100%', height: '100%' }}>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  )
}