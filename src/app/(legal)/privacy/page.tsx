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
.ps-legal table{width:100%;border-collapse:collapse;margin:12px 0}
.ps-legal th,.ps-legal td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--bd2);font-size:0.88rem;color:var(--t2)}
.ps-legal th{color:var(--t3);font-family:var(--mn);font-size:0.72rem;text-transform:uppercase;letter-spacing:0.06em;font-weight:600}
`

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--t4)', fontFamily: 'var(--mn)', marginBottom: 32 }}>Last updated: March 2026</p>

        <h2>1. Information We Collect</h2>
        <table>
          <thead>
            <tr><th>Data</th><th>Purpose</th><th>Stored By</th></tr>
          </thead>
          <tbody>
            <tr><td>Email address</td><td>Account identification, notifications</td><td>Clerk, Neon (PostgreSQL)</td></tr>
            <tr><td>Username</td><td>Display name in app</td><td>Clerk, Neon (PostgreSQL)</td></tr>
            <tr><td>Phone number (optional)</td><td>Two-factor authentication</td><td>Clerk, Neon (PostgreSQL)</td></tr>
            <tr><td>Payment information</td><td>Subscription billing</td><td>Stripe (we never see your card details)</td></tr>
            <tr><td>Notes, tasks, and content</td><td>Core product functionality</td><td>Neon (PostgreSQL)</td></tr>
          </tbody>
        </table>

        <h2>2. Third-Party Services</h2>
        <p>We use the following third-party services to operate Pulsar:</p>
        <ul>
          <li><strong>Clerk</strong> &mdash; Authentication and user management. Handles passwords, OAuth tokens, and session management.</li>
          <li><strong>Stripe</strong> &mdash; Payment processing. Card details are handled entirely by Stripe and never touch our servers.</li>
          <li><strong>Neon (PostgreSQL)</strong> &mdash; Primary database for user data, notes, and tasks.</li>
          <li><strong>Discord</strong> &mdash; In-app feedback submissions are sent to our team via Discord. Your name and email may be included with feedback.</li>
          <li><strong>Vercel</strong> &mdash; Application hosting and deployment.</li>
        </ul>

        <h2>3. How We Use Your Data</h2>
        <p>Your data is used exclusively to provide and improve the Pulsar service. We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>

        <h2>4. Data Security</h2>
        <p>We implement industry-standard security measures including encrypted connections (HTTPS/TLS), secure authentication via Clerk, and database access controls. However, no system is perfectly secure, and we cannot guarantee absolute data security.</p>

        <h2>5. Data Retention</h2>
        <p>Your data is retained as long as your account is active. Upon account deletion, your personal data will be removed from our systems within 30 days, with the exception of anonymized analytics data and data required for legal compliance.</p>

        <h2>6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access and export your personal data</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and data</li>
          <li>Withdraw consent for optional data processing</li>
        </ul>

        <h2>7. Cookies</h2>
        <p>We use essential cookies for authentication and session management. We do not use tracking or advertising cookies.</p>

        <h2>8. Changes to This Policy</h2>
        <p>We may update this privacy policy as the service evolves. Material changes will be communicated via email or in-app notification.</p>

        <h2>9. Contact</h2>
        <p>For privacy-related inquiries, use the in-app feedback form or visit our <a href="https://github.com/anthropics/claude-code/issues">support page</a>.</p>

        <div style={{ borderTop: '1px solid var(--bd2)', marginTop: 48, paddingTop: 24 }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--t4)' }}>This is a preliminary privacy policy for the Pulsar beta program. A comprehensive legal review is recommended before public launch.</p>
        </div>
      </div>
    </div>
  )
}
