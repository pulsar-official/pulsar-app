import type { Metadata } from 'next'
import '@/styles/globals.scss'
import { ClerkProvider } from '@clerk/nextjs'

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
        <style dangerouslySetInnerHTML={{ __html: `
          #mobile-block {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: #07070d;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            padding: 40px 32px;
            text-align: center;
            font-family: system-ui, sans-serif;
          }
          @media (max-width: 767px) {
            #mobile-block { display: flex; }
            body > * { display: none; }
            #mobile-block { display: flex !important; }
          }
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, width: '100%', height: '100%' }}>
        <div id="mobile-block">
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'oklch(0.55 0.18 290)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>⚡</div>
          <div>
            <div style={{ color: '#eeeef5', fontSize: '1.3rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>Pulsar</div>
            <div style={{ color: '#eeeef5', fontSize: '1.1rem', fontWeight: 600, marginBottom: 12 }}>Desktop only for now</div>
            <div style={{ color: '#7878a0', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Pulsar is optimized for PC and laptop.<br />
              Mobile support is coming soon.
            </div>
          </div>
          <div style={{ marginTop: 8, padding: '8px 20px', borderRadius: 20, border: '1px solid #1a1a26', color: '#7878a0', fontSize: '0.78rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Mobile coming soon
          </div>
        </div>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  )
}
