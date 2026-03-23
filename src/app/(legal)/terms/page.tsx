'use client'
import { useEffect } from 'react'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
.ps-legal *{margin:0;padding:0;box-sizing:border-box}
.ps-legal{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--bd2:rgba(255,255,255,0.08);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--ac:#a78bfa;--ft:'Space Grotesk',system-ui,sans-serif;--mn:'JetBrains Mono',monospace;font-family:var(--ft);background:var(--bg);color:var(--t1);min-height:100vh;-webkit-font-smoothing:antialiased}
.ps-legal a{color:var(--ac);text-decoration:none}
.ps-legal a:hover{text-decoration:underline}
.ps-legal h2{font-size:1.2rem;font-weight:600;margin:32px 0 12px;letter-spacing:-0.02em}
.ps-legal p,.ps-legal li{font-size:0.92rem;color:var(--t2);line-height:1.7}
.ps-legal ul{padding-left:20px;margin:8px 0}
`

export default function TermsPage() {
  useEffect(() => {
    if (!document.getElementById('ps-legal-css')) {
      const s = document.createElement('style'); s.id = 'ps-legal-css'; s.textContent = CSS; document.head.appendChild(s)
    }
  }, [])

  return (
    <div className="ps-legal" style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
      <div style={{ maxWidth: 680, width: '100%' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 40, fontSize: '0.88rem', color: 'var(--t3)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>P</div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--t1)' }}>Pulsar</span>
        </a>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--t4)', fontFamily: 'var(--mn)', marginBottom: 32 }}>Last updated: March 2026</p>

        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using Pulsar, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.</p>

        <h2>2. Description of Service</h2>
        <p>Pulsar is a productivity platform currently in beta. Features, availability, and functionality may change without notice during the beta period.</p>

        <h2>3. Account Registration</h2>
        <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials and for all activity under your account.</p>

        <h2>4. Beta Disclaimer</h2>
        <p>Pulsar is provided as a beta service. While we strive for reliability, the service is provided &ldquo;as is&rdquo; without warranties of any kind. During the beta period:</p>
        <ul>
          <li>Features may be added, changed, or removed</li>
          <li>Data loss may occur, though we take reasonable precautions</li>
          <li>Service interruptions may happen without prior notice</li>
        </ul>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to misuse the service, including but not limited to:</p>
        <ul>
          <li>Attempting to access other users&apos; data</li>
          <li>Interfering with or disrupting the service</li>
          <li>Using the service for any unlawful purpose</li>
          <li>Reverse engineering or attempting to extract source code</li>
        </ul>

        <h2>6. Intellectual Property</h2>
        <p>You retain ownership of content you create. By using Pulsar, you grant us a limited license to store, process, and display your content as necessary to provide the service.</p>

        <h2>7. Termination</h2>
        <p>We may suspend or terminate your access at any time for violation of these terms. You may delete your account at any time.</p>

        <h2>8. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Pulsar shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>

        <h2>9. Changes to Terms</h2>
        <p>We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>

        <h2>10. Contact</h2>
        <p>For questions about these terms, contact us through the in-app feedback form or visit our <a href="https://github.com/anthropics/claude-code/issues">support page</a>.</p>

        <div style={{ borderTop: '1px solid var(--bd2)', marginTop: 48, paddingTop: 24 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--t4)' }}>This is a preliminary terms of service for the Pulsar beta program. A comprehensive legal review is recommended before public launch.</p>
        </div>
      </div>
    </div>
  )
}
