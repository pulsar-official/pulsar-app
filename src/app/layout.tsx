import type { Metadata, Viewport } from 'next'
import '@/styles/globals.scss'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Pulsar — AI Productivity Workspace for Notes, Tasks & Goals',
  description: 'Pulsar is an all-in-one productivity app. Capture notes, manage tasks, track habits and goals — all in one intelligent workspace powered by AI.',
  metadataBase: new URL('https://pulsar.zone'),
  alternates: { canonical: 'https://pulsar.zone' },
  keywords: ['productivity app', 'AI workspace', 'note taking app', 'task manager', 'habit tracker', 'goal tracking', 'productivity workspace', 'Pulsar app'],
  openGraph: {
    title: 'Pulsar — AI Productivity Workspace for Notes, Tasks & Goals',
    description: 'Pulsar is an all-in-one productivity app. Capture notes, manage tasks, track habits and goals — all in one intelligent workspace powered by AI.',
    url: 'https://pulsar.zone',
    siteName: 'Pulsar',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pulsar — AI Productivity Workspace',
    description: 'Capture notes, manage tasks, track habits and goals — all in one intelligent workspace.',
    site: '@pulsar_zone',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Pulsar',
            url: 'https://pulsar.zone',
            applicationCategory: 'ProductivityApplication',
            operatingSystem: 'Web',
            description: 'All-in-one AI productivity workspace for notes, tasks, habits, and goals.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          }) }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, width: '100%', height: '100%' }}>
        <ClerkProvider>{children}</ClerkProvider>
        <Analytics />
      </body>
    </html>
  )
}
