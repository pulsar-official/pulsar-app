'use client'
import { useEffect } from 'react'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
.ps-legal *{margin:0;padding:0;box-sizing:border-box}
.ps-legal{--bg:#07070c;--s1:#0c0c14;--s2:#111119;--s3:#18182a;--bd2:rgba(255,255,255,0.08);--t1:#eeeef5;--t2:#a0a0b8;--t3:#65657a;--t4:#45455a;--ac:#a78bfa;--ft:'JetBrains Mono',monospace;--mn:'JetBrains Mono',monospace;font-family:var(--ft);background:var(--bg);color:var(--t1);min-height:100vh;-webkit-font-smoothing:antialiased}
.ps-legal a{color:var(--ac);text-decoration:none}
.ps-legal a:hover{text-decoration:underline}
.ps-legal h2{font-size:1.1rem;font-weight:600;margin:36px 0 12px;letter-spacing:-0.01em;color:var(--t1)}
.ps-legal p,.ps-legal li{font-size:0.88rem;color:var(--t2);line-height:1.75}
.ps-legal ul{padding-left:20px;margin:8px 0}
.ps-legal ul li{margin-bottom:6px}
.ps-legal table{width:100%;border-collapse:collapse;margin:14px 0}
.ps-legal th,.ps-legal td{text-align:left;padding:10px 14px;border-bottom:1px solid var(--bd2);font-size:0.85rem;color:var(--t2)}
.ps-legal th{color:var(--t3);font-family:var(--mn);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.06em;font-weight:600}
.ps-legal hr{border:none;border-top:1px solid var(--bd2);margin:40px 0}
`

export default function PrivacyPage() {
  useEffect(() => {
    if (!document.getElementById('ps-legal-css')) {
      const s = document.createElement('style'); s.id = 'ps-legal-css'; s.textContent = CSS; document.head.appendChild(s)
    }
  }, [])

  return (
    <div className="ps-legal" style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
      <div style={{ maxWidth: 720, width: '100%' }}>
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 48, fontSize: '0.88rem', color: 'var(--t3)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>P</div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--t1)' }}>Pulsar</span>
        </a>

        <h1 style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--t4)', fontFamily: 'var(--mn)', marginBottom: 8 }}>Effective date: March 1, 2026 &nbsp;·&nbsp; Last updated: March 24, 2026</p>
        <p style={{ fontSize: '0.88rem', color: 'var(--t2)', lineHeight: 1.75, marginBottom: 0 }}>
          This Privacy Policy describes how Pulsar (&ldquo;Pulsar,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and shares information about you when you use our services, including our web application, website, and related services (collectively, the &ldquo;Service&rdquo;). By using the Service, you agree to the collection and use of information in accordance with this policy.
        </p>

        <hr />

        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly, information generated through your use of the Service, and information from third-party services you connect.</p>

        <p style={{ marginTop: 16, marginBottom: 8 }}><strong style={{ color: 'var(--t1)', fontSize: '0.88rem' }}>Information you provide:</strong></p>
        <table>
          <thead>
            <tr><th>Data</th><th>Purpose</th><th>Stored By</th></tr>
          </thead>
          <tbody>
            <tr><td>Email address</td><td>Account identification and notifications</td><td>Clerk, Neon (PostgreSQL)</td></tr>
            <tr><td>Username and display name</td><td>Identity within the Service</td><td>Clerk, Neon (PostgreSQL)</td></tr>
            <tr><td>Phone number (optional)</td><td>Two-factor authentication</td><td>Clerk</td></tr>
            <tr><td>Payment information</td><td>Subscription billing</td><td>Stripe (we never receive or store card details)</td></tr>
            <tr><td>Notes, tasks, and user-generated content</td><td>Core product functionality</td><td>Neon (PostgreSQL)</td></tr>
            <tr><td>Feedback and support communications</td><td>Product improvement and support</td><td>Discord, internal systems</td></tr>
          </tbody>
        </table>

        <p style={{ marginTop: 16, marginBottom: 8 }}><strong style={{ color: 'var(--t1)', fontSize: '0.88rem' }}>Information collected automatically:</strong></p>
        <ul>
          <li>Usage data such as features accessed, session duration, and interaction patterns</li>
          <li>Device and browser information (type, operating system, screen resolution)</li>
          <li>IP address and approximate geographic location</li>
          <li>Crash reports and performance diagnostics</li>
        </ul>

        <h2>2. Third-Party Services</h2>
        <p>We rely on the following sub-processors to operate the Service. Each processes your data only as necessary to provide their respective function:</p>
        <ul>
          <li><strong>Clerk</strong> &mdash; Authentication, session management, and OAuth token handling. Clerk processes passwords, OAuth credentials, and multi-factor authentication data. Clerk&apos;s privacy practices are governed by their own privacy policy.</li>
          <li><strong>Stripe</strong> &mdash; Payment processing and subscription management. Card details are handled entirely by Stripe&apos;s PCI-DSS-compliant infrastructure and never transmitted to or stored on our servers.</li>
          <li><strong>Neon (PostgreSQL)</strong> &mdash; Primary database for all user-generated content, account data, notes, and tasks. Data is stored in an encrypted database with access controls.</li>
          <li><strong>Vercel</strong> &mdash; Application hosting, deployment infrastructure, and edge networking.</li>
          <li><strong>Discord</strong> &mdash; In-app feedback submissions are routed to our team via Discord webhooks. Submissions may include your name, email address, and the content of your feedback.</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service</li>
          <li>Authenticate your identity and manage your account</li>
          <li>Process transactions and send billing-related communications</li>
          <li>Respond to your questions, feedback, and support requests</li>
          <li>Send product updates, service notices, and administrative messages</li>
          <li>Monitor and analyze usage patterns to improve functionality and user experience</li>
          <li>Detect and prevent fraud, abuse, and security incidents</li>
          <li>Comply with applicable legal obligations</li>
        </ul>
        <p>We do not sell, rent, or license your personal information to third parties for marketing purposes.</p>

        <h2>4. Data Security</h2>
        <p>We implement technical and organizational measures designed to protect your information against unauthorized access, alteration, disclosure, or destruction. These include:</p>
        <ul>
          <li>Encrypted data transmission via TLS/HTTPS for all communications</li>
          <li>Encrypted data at rest within our database infrastructure</li>
          <li>Role-based access controls limiting which personnel can access user data</li>
          <li>Authentication security enforced through Clerk, including support for multi-factor authentication</li>
        </ul>
        <p>No method of transmission or storage is completely secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.</p>

        <h2>5. Data Retention</h2>
        <p>We retain your personal information for as long as your account remains active or as necessary to provide the Service. Upon account deletion:</p>
        <ul>
          <li>Your personal data and user-generated content will be permanently deleted from our systems within <strong>30 days</strong></li>
          <li>Anonymized, aggregated analytics data that cannot identify you may be retained indefinitely</li>
          <li>Data required for legal, tax, or compliance purposes may be retained for the period required by applicable law</li>
          <li>Backups are purged on a rolling schedule within <strong>90 days</strong> of deletion</li>
        </ul>

        <h2>6. Your Rights and Choices</h2>
        <p>Depending on your jurisdiction, you may have the following rights with respect to your personal information:</p>
        <ul>
          <li><strong>Access</strong> &mdash; Request a copy of the personal data we hold about you</li>
          <li><strong>Correction</strong> &mdash; Request correction of inaccurate or incomplete data</li>
          <li><strong>Deletion</strong> &mdash; Request deletion of your account and associated personal data</li>
          <li><strong>Portability</strong> &mdash; Request your data in a structured, machine-readable format</li>
          <li><strong>Restriction</strong> &mdash; Request that we restrict processing of your data in certain circumstances</li>
          <li><strong>Objection</strong> &mdash; Object to processing based on legitimate interests</li>
          <li><strong>Withdraw Consent</strong> &mdash; Where processing is based on consent, withdraw that consent at any time</li>
        </ul>
        <p>To exercise any of these rights, contact us at <a href="mailto:privacy@pulsar.app">privacy@pulsar.app</a>. We will respond within 30 days. We may need to verify your identity before processing your request.</p>

        <h2>7. Cookies and Tracking Technologies</h2>
        <p>We use cookies and similar technologies solely for the purpose of operating the Service:</p>
        <ul>
          <li><strong>Session cookies</strong> &mdash; Required for authentication and maintaining your logged-in state</li>
          <li><strong>Security cookies</strong> &mdash; Used to detect and prevent abuse and unauthorized access</li>
          <li><strong>Preference cookies</strong> &mdash; Used to remember settings you have applied</li>
        </ul>
        <p>We do not use advertising cookies, behavioral tracking cookies, or third-party analytics cookies. We do not participate in cross-site tracking.</p>

        <h2>8. Children&apos;s Privacy</h2>
        <p>The Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will delete that information promptly. If you believe a child under 13 has provided us personal information, contact us at <a href="mailto:privacy@pulsar.app">privacy@pulsar.app</a>.</p>

        <h2>9. International Data Transfers</h2>
        <p>Pulsar is operated from the United States. If you are accessing the Service from outside the United States, your information may be transferred to, stored, and processed in the United States or other countries where our service providers operate. By using the Service, you consent to the transfer of your information to countries that may have different data protection laws than your country of residence.</p>

        <h2>10. Governing Law</h2>
        <p>This Privacy Policy is governed by the laws of the State of Delaware, without regard to its conflict of law provisions. Any disputes arising under this policy shall be resolved in accordance with the dispute resolution provisions in our Terms of Service.</p>

        <h2>11. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by posting a notice within the Service prior to the change becoming effective. Your continued use of the Service after the effective date of the revised policy constitutes your acceptance of the changes. We encourage you to review this policy periodically.</p>

        <h2>12. Contact Us</h2>
        <p>If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:</p>
        <ul>
          <li>Email: <a href="mailto:privacy@pulsar.app">privacy@pulsar.app</a></li>
          <li>In-app: Use the feedback form within the Service</li>
        </ul>

        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--t4)' }}>&copy; 2026 Pulsar. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="/terms" style={{ fontSize: '0.78rem', color: 'var(--t4)' }}>Terms of Service</a>
            <a href="mailto:privacy@pulsar.app" style={{ fontSize: '0.78rem', color: 'var(--t4)' }}>privacy@pulsar.app</a>
          </div>
        </div>
      </div>
    </div>
  )
}
