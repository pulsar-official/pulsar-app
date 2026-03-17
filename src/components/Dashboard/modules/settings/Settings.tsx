'use client'

import React, { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import styles from './Settings.module.scss'

const SECTIONS = [
  { id: 'profile',    label: 'Profile',             icon: '👤' },
  { id: 'plan',       label: 'Plan & Billing',       icon: '✨' },
  { id: 'appearance', label: 'Appearance',           icon: '🎨' },
  { id: 'notifs',     label: 'Notifications',        icon: '🔔' },
  { id: 'shortcuts',  label: 'Keyboard Shortcuts',   icon: '⌨️' },
  { id: 'danger',     label: 'Danger Zone',          icon: '⚠️' },
]

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'],    desc: 'Open command palette' },
  { keys: ['Ctrl', 'N'],    desc: 'New note / quick capture' },
  { keys: ['Ctrl', '/'],    desc: 'Toggle sidebar' },
  { keys: ['Ctrl', 'F'],    desc: 'Search current module' },
  { keys: ['Ctrl', 'S'],    desc: 'Save / commit changes' },
  { keys: ['G', 'T'],       desc: 'Go to Tasks' },
  { keys: ['G', 'C'],       desc: 'Go to Calendar' },
  { keys: ['G', 'H'],       desc: 'Go to Habits' },
  { keys: ['G', 'G'],       desc: 'Go to Goals' },
  { keys: ['G', 'J'],       desc: 'Go to Journal' },
  { keys: ['G', 'F'],       desc: 'Go to Focus Sessions' },
  { keys: ['Esc'],          desc: 'Close panel / modal' },
  { keys: ['?'],            desc: 'Show this shortcut reference' },
]

export default function Settings() {
  const { user } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const [activeSection, setActiveSection] = useState('profile')
  const [notifPrefs, setNotifPrefs] = useState({
    inApp: true, emailDigest: true, goalReminders: true, focusAlerts: true, streakAlerts: true,
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const plan = (user?.publicMetadata?.plan as string) || 'Free'
  const planActive = plan !== 'Free'
  const displayName = user?.fullName || user?.firstName || 'User'
  const email = user?.emailAddresses[0]?.emailAddress || ''
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const toggleNotif = (key: keyof typeof notifPrefs) =>
    setNotifPrefs(p => ({ ...p, [key]: !p[key] }))

  return (
    <div className={styles.root}>
      {/* Sidebar nav */}
      <nav className={styles.nav}>
        <div className={styles.navTitle}>Settings</div>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            className={`${styles.navItem} ${activeSection === s.id ? styles.navActive : ''}`}
            onClick={() => setActiveSection(s.id)}
          >
            <span className={styles.navIcon}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className={styles.content}>

        {/* ── PROFILE ── */}
        {activeSection === 'profile' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Profile</h2>
            <p className={styles.sectionDesc}>Your identity across Pulsar. Managed via your Clerk account.</p>
            <div className={styles.profileCard}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>{displayName}</div>
                <div className={styles.profileEmail}>{email}</div>
                <div className={styles.profileMeta}>
                  <span className={`${styles.planBadge} ${planActive ? styles.planBadgePro : ''}`}>
                    {planActive ? plan : 'Free plan'}
                  </span>
                </div>
              </div>
            </div>
            <button className={styles.primaryBtn} onClick={() => openUserProfile()}>
              Edit Profile in Clerk ↗
            </button>
            <p className={styles.hint}>Name, avatar, connected accounts, and password are managed through Clerk.</p>
          </div>
        )}

        {/* ── PLAN ── */}
        {activeSection === 'plan' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Plan & Billing</h2>
            <p className={styles.sectionDesc}>Manage your subscription and payment details.</p>
            <div className={styles.planCard}>
              <div className={styles.planCardLeft}>
                <div className={styles.planCardName}>{plan}</div>
                <div className={styles.planCardStatus}>
                  {planActive ? '✅ Active subscription' : 'Free tier — limited features'}
                </div>
              </div>
              {!planActive && (
                <a href="/pricing" className={styles.upgradeBtn}>Upgrade →</a>
              )}
            </div>
            {planActive ? (
              <button className={styles.ghostBtn} onClick={() => window.location.href = '/pricing'}>
                Manage Subscription
              </button>
            ) : (
              <>
                <div className={styles.featureList}>
                  {['Unlimited AI assists', 'Focus session analytics', 'Advanced knowledge graph', 'Priority support'].map(f => (
                    <div key={f} className={styles.featureItem}><span className={styles.featureCheck}>✓</span>{f}</div>
                  ))}
                </div>
                <a href="/pricing" className={styles.primaryBtn} style={{ display: 'inline-block', textDecoration: 'none' }}>
                  View Plans →
                </a>
              </>
            )}
          </div>
        )}

        {/* ── APPEARANCE ── */}
        {activeSection === 'appearance' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Appearance</h2>
            <p className={styles.sectionDesc}>Customize how Pulsar looks and feels.</p>
            <div className={styles.settingRow}>
              <div className={styles.settingLabel}>
                <div className={styles.settingName}>Theme</div>
                <div className={styles.settingHint}>Light theme coming in v0.2</div>
              </div>
              <div className={styles.themePills}>
                <div className={`${styles.themePill} ${styles.themePillActive}`}>🌑 Dark</div>
                <div className={styles.themePill} style={{ opacity: 0.4, cursor: 'not-allowed' }}>☀️ Light</div>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.settingRow}>
              <div className={styles.settingLabel}>
                <div className={styles.settingName}>Sidebar density</div>
                <div className={styles.settingHint}>How compact the sidebar items appear</div>
              </div>
              <div className={styles.themePills}>
                {['Compact', 'Default', 'Relaxed'].map(d => (
                  <div key={d} className={`${styles.themePill} ${d === 'Default' ? styles.themePillActive : ''}`}>{d}</div>
                ))}
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.settingRow}>
              <div className={styles.settingLabel}>
                <div className={styles.settingName}>Reduce motion</div>
                <div className={styles.settingHint}>Limit animations for accessibility</div>
              </div>
              <div className={styles.toggle} />
            </div>
            <p className={styles.hint}>Full theming — accent colors, fonts, and custom CSS — is in the Theme Builder module.</p>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeSection === 'notifs' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Notifications</h2>
            <p className={styles.sectionDesc}>Choose what Pulsar alerts you about.</p>
            {([
              ['inApp',        'In-app notifications',    'Banners inside the dashboard'],
              ['emailDigest',  'Weekly email digest',     'Summary of your progress every Monday'],
              ['goalReminders','Goal reminders',          'Alerts when goal deadlines approach'],
              ['focusAlerts',  'Focus session alerts',    'Start/end of deep work sessions'],
              ['streakAlerts', 'Streak alerts',           'Daily streak milestones and warnings'],
            ] as const).map(([key, name, hint]) => (
              <div key={key} className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <div className={styles.settingName}>{name}</div>
                  <div className={styles.settingHint}>{hint}</div>
                </div>
                <button
                  className={`${styles.toggleBtn2} ${notifPrefs[key] ? styles.toggleOn : ''}`}
                  onClick={() => toggleNotif(key)}
                  aria-label={name}
                >
                  <div className={styles.toggleThumb} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ── SHORTCUTS ── */}
        {activeSection === 'shortcuts' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Keyboard Shortcuts</h2>
            <p className={styles.sectionDesc}>Master these to move at the speed of thought.</p>
            <div className={styles.shortcutTable}>
              {SHORTCUTS.map((s, i) => (
                <div key={i} className={styles.shortcutRow}>
                  <div className={styles.shortcutKeys}>
                    {s.keys.map((k, ki) => (
                      <React.Fragment key={ki}>
                        <kbd className={styles.kbd}>{k}</kbd>
                        {ki < s.keys.length - 1 && <span className={styles.kbdPlus}>+</span>}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className={styles.shortcutDesc}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DANGER ZONE ── */}
        {activeSection === 'danger' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Danger Zone</h2>
            <p className={styles.sectionDesc}>Irreversible actions. Proceed with caution.</p>
            <div className={styles.dangerCard}>
              <div className={styles.dangerInfo}>
                <div className={styles.dangerName}>Sign out all sessions</div>
                <div className={styles.dangerHint}>Logs you out on every device immediately.</div>
              </div>
              <button className={styles.dangerBtn} onClick={() => signOut({ redirectUrl: '/' })}>
                Sign Out Everywhere
              </button>
            </div>
            <div className={styles.divider} />
            <div className={styles.dangerCard}>
              <div className={styles.dangerInfo}>
                <div className={styles.dangerName}>Delete account</div>
                <div className={styles.dangerHint}>Permanently deletes your data. This cannot be undone.</div>
              </div>
              {confirmDelete ? (
                <div className={styles.dangerConfirm}>
                  <span className={styles.dangerConfirmText}>Are you sure?</span>
                  <button className={styles.dangerBtnReal} onClick={() => user?.delete()}>Yes, delete</button>
                  <button className={styles.ghostBtn} onClick={() => setConfirmDelete(false)}>Cancel</button>
                </div>
              ) : (
                <button className={styles.dangerBtn} onClick={() => setConfirmDelete(true)}>
                  Delete Account
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
