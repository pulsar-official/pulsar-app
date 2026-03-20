import type { Metadata } from 'next'
import '@/styles/globals.scss'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Pulsar - Knowledge Intelligence OS',
  description: 'AI-powered knowledge management and productivity platform',
  metadataBase: new URL('https://pulsar.zone'),
  alternates: { canonical: 'https://pulsar.zone' },
  openGraph: {
    title: 'Pulsar - Knowledge Intelligence OS',
    description: 'AI-powered knowledge management and productivity platform',
    url: 'https://pulsar.zone',
    siteName: 'Pulsar',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
