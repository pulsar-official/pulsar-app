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
.ps-legal hr{border:none;border-top:1px solid var(--bd2);margin:40px 0}
`

export default function TermsPage() {
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

        <h1 style={{ fontSize: '1.9rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--t4)', fontFamily: 'var(--mn)', marginBottom: 8 }}>Effective date: March 1, 2026 &nbsp;·&nbsp; Last updated: March 24, 2026</p>
        <p style={{ fontSize: '0.88rem', color: 'var(--t2)', lineHeight: 1.75, marginBottom: 0 }}>
          Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using Pulsar. These Terms constitute a legally binding agreement between you and Pulsar (&ldquo;Pulsar,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) governing your access to and use of our web application, website, and related services (collectively, the &ldquo;Service&rdquo;).
        </p>

        <hr />

        <h2>1. Acceptance of Terms</h2>
        <p>By creating an account or otherwise accessing or using the Service, you represent that you are at least 13 years of age, have read and understood these Terms, and agree to be legally bound by them. If you are using the Service on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.</p>
        <p style={{ marginTop: 12 }}>If you do not agree to these Terms, you must not access or use the Service.</p>

        <h2>2. Description of Service</h2>
        <p>Pulsar is a productivity platform that provides tools for note-taking, task management, and knowledge organization. The Service is currently offered as a beta product. While we work to provide a reliable experience, features, availability, and functionality may be modified at any time as the product evolves.</p>

        <h2>3. Account Registration and Security</h2>
        <p>To access most features of the Service, you must create an account. You agree to:</p>
        <ul>
          <li>Provide accurate, current, and complete information during registration</li>
          <li>Maintain and promptly update your account information to keep it accurate</li>
          <li>Maintain the security and confidentiality of your login credentials</li>
          <li>Notify us immediately at <a href="mailto:security@pulsar.app">security@pulsar.app</a> if you suspect unauthorized access to your account</li>
          <li>Accept responsibility for all activity that occurs under your account</li>
        </ul>
        <p>We reserve the right to disable accounts that we determine, in our sole discretion, have violated these Terms or pose a security risk.</p>

        <h2>4. Beta Service Disclaimer</h2>
        <p>The Service is provided in its current beta state. During the beta period, you acknowledge and agree that:</p>
        <ul>
          <li>Features may be added, substantially changed, or permanently removed without prior notice</li>
          <li>Service availability is not guaranteed and interruptions may occur</li>
          <li>While we take reasonable precautions, data loss may occur; we encourage you to maintain your own backups of critical information</li>
          <li>Beta pricing and feature availability may change when the Service exits beta</li>
        </ul>

        <h2>5. Acceptable Use</h2>
        <p>You may use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
        <ul>
          <li>Access or attempt to access the accounts, systems, or data of any other user without authorization</li>
          <li>Interfere with or disrupt the integrity, performance, or availability of the Service</li>
          <li>Use the Service to transmit or store any content that is unlawful, harmful, harassing, defamatory, or otherwise objectionable</li>
          <li>Attempt to reverse engineer, decompile, or extract source code from the Service</li>
          <li>Use automated means (bots, scrapers, crawlers) to access the Service without our express written permission</li>
          <li>Use the Service to send unsolicited communications or spam</li>
          <li>Resell or sublicense access to the Service without our written consent</li>
        </ul>
        <p>Violation of these acceptable use provisions may result in immediate termination of your account.</p>

        <h2>6. Your Content</h2>
        <p>You retain full ownership of all notes, tasks, and other content you create within the Service (&ldquo;Your Content&rdquo;). By using the Service, you grant Pulsar a limited, non-exclusive, worldwide, royalty-free license to store, process, transmit, and display Your Content solely as necessary to provide and operate the Service for you.</p>
        <p style={{ marginTop: 12 }}>You represent and warrant that you have all rights necessary to grant this license and that Your Content does not violate any applicable law or third-party rights.</p>

        <h2>7. Intellectual Property</h2>
        <p>The Service, including its design, code, features, and all content created by Pulsar (excluding Your Content), is owned by Pulsar and protected by copyright, trademark, and other applicable intellectual property laws. You are granted a limited, revocable, non-exclusive, non-transferable license to access and use the Service solely for your personal, non-commercial use in accordance with these Terms.</p>

        <h2>8. Fees and Payment</h2>
        <p>Certain features of the Service require a paid subscription. By subscribing, you authorize us to charge your payment method on a recurring basis at the applicable subscription rate. All fees are stated in US dollars and are exclusive of taxes. Subscriptions automatically renew unless cancelled prior to the renewal date. Refunds are issued at our discretion and in accordance with our refund policy. We reserve the right to change pricing with 30 days&apos; advance notice.</p>

        <h2>9. Termination</h2>
        <p>Either party may terminate your access to the Service at any time. You may terminate by deleting your account within the Service settings. We may suspend or terminate your access immediately and without prior notice if we believe you have violated these Terms, engaged in fraudulent activity, or pose a risk to the security or integrity of the Service. Upon termination, your right to use the Service ceases immediately and your data will be handled as described in our Privacy Policy.</p>

        <h2>10. Disclaimer of Warranties</h2>
        <p>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED OR ERROR-FREE OPERATION. PULSAR DOES NOT WARRANT THAT THE SERVICE WILL MEET YOUR REQUIREMENTS OR THAT ANY DEFECTS WILL BE CORRECTED.</p>

        <h2>11. Limitation of Liability</h2>
        <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PULSAR AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, LOSS OF PROFITS, OR BUSINESS INTERRUPTION, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF PULSAR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN NO EVENT SHALL PULSAR&apos;S TOTAL LIABILITY EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID TO PULSAR IN THE 12 MONTHS PRECEDING THE CLAIM OR (B) ONE HUNDRED US DOLLARS (USD $100).</p>

        <h2>12. Indemnification</h2>
        <p>You agree to indemnify, defend, and hold harmless Pulsar and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from your use of the Service, Your Content, your violation of these Terms, or your violation of any third-party rights.</p>

        <h2>13. Dispute Resolution</h2>
        <p>Any dispute arising out of or relating to these Terms or the Service that cannot be resolved informally shall be submitted to binding arbitration administered under the rules of the American Arbitration Association, with proceedings conducted in English in the State of Delaware. Each party waives its right to a jury trial. This clause does not prevent either party from seeking injunctive or other equitable relief from a court of competent jurisdiction to prevent irreparable harm.</p>

        <h2>14. Governing Law</h2>
        <p>These Terms are governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law principles. To the extent arbitration does not apply, you consent to the exclusive jurisdiction of the state and federal courts located in Delaware.</p>

        <h2>15. Changes to Terms</h2>
        <p>We reserve the right to modify these Terms at any time. When we make material changes, we will notify you via email or a prominent notice within the Service at least 14 days before the changes take effect. Your continued use of the Service after the effective date constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you must stop using the Service and may delete your account.</p>

        <h2>16. Entire Agreement</h2>
        <p>These Terms, together with our Privacy Policy and any additional terms you have agreed to in connection with specific features of the Service, constitute the entire agreement between you and Pulsar regarding the Service and supersede all prior agreements and understandings, whether written or oral, relating to the subject matter herein.</p>

        <h2>17. Contact Us</h2>
        <p>For questions or concerns about these Terms, please contact us:</p>
        <ul>
          <li>Email: <a href="mailto:legal@pulsar.app">legal@pulsar.app</a></li>
          <li>In-app: Use the feedback form within the Service</li>
        </ul>

        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--t4)' }}>&copy; 2026 Pulsar. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="/privacy" style={{ fontSize: '0.78rem', color: 'var(--t4)' }}>Privacy Policy</a>
            <a href="mailto:legal@pulsar.app" style={{ fontSize: '0.78rem', color: 'var(--t4)' }}>legal@pulsar.app</a>
          </div>
        </div>
      </div>
    </div>
  )
}
