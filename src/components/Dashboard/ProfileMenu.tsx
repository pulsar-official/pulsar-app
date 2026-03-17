'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import styles from './ProfileMenu.module.scss'

interface ProfileMenuProps {
  onClose?: () => void
  streak?: number
  tasksToday?: number
  focusTimeToday?: number
  onSettingsClick?: () => void
  onShortcutsClick?: () => void
  onSignOut?: () => void
  onManagePlan?: () => void
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  onClose, streak = 0, tasksToday = 0, focusTimeToday = 0,
  onSettingsClick, onShortcutsClick, onSignOut, onManagePlan, triggerRef,
}) => {
  const { signOut } = useClerk()
  const { user } = useUser()
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const plan = (user?.publicMetadata?.plan as string) || 'Free'
  const planActive = plan !== 'Free'
  const displayName = user?.fullName || user?.firstName || 'User'
  const email = user?.emailAddresses[0]?.emailAddress || ''
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({ top: rect.bottom + 8, left: rect.left })
    }
  }, [triggerRef])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (triggerRef?.current && !triggerRef.current.contains(e.target as Node)) onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, triggerRef])

  const handleSignOut = async () => {
    onClose?.()
    await signOut({ redirectUrl: '/' })
  }

  return (
    <div ref={menuRef} className={styles.menu} style={{ top: position.top + 'px', left: position.left + 'px' }}>

      {/* User identity */}
      <div className={styles.planSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#a78bfa,#7c3aed)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#eeeef5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
            <div style={{ fontSize: '0.74rem', color: '#7878a0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
          </div>
        </div>
        <div className={styles.planContent}>
          <div className={styles.planName}>{plan === 'Free' ? 'Free plan' : plan + ' plan'}</div>
          <div className={styles.planBadge} style={{ background: planActive ? 'rgba(110,231,183,0.15)' : 'rgba(120,120,160,0.15)', color: planActive ? '#6ee7b7' : '#7878a0' }}>{planActive ? 'Active' : 'Free tier'}</div>
        </div>
        <button className={styles.planAction} onClick={() => { onManagePlan?.(); onClose?.() }}>
          {plan === 'Free' ? 'Upgrade' : 'Manage'}
        </button>
      </div>

      <div className={styles.divider} />

      {/* Workspace */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Workspace</div>
        <div className={styles.workspacesList}>
          <button className={styles.workspaceItem}>
            <div className={styles.workspaceIcon}>{initials.slice(0, 1)}</div>
            <div className={styles.workspaceDetails}>
              <div className={styles.workspaceName}>{displayName}&apos;s workspace</div>
            </div>
          </button>
        </div>
      </div>

      <div className={styles.divider} />

      <button className={styles.menuItem} onClick={() => { onSettingsClick?.(); onClose?.() }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        Settings
      </button>

      <button className={styles.menuItem} onClick={() => { onShortcutsClick?.(); onClose?.() }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2" /><line x1="6" y1="10" x2="6" y2="10" /><line x1="10" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="14" y2="10" /><line x1="18" y1="10" x2="18" y2="10" /><line x1="8" y1="14" x2="16" y2="14" /></svg>
        Shortcuts
      </button>

      <div className={styles.divider} />

      <button className={`${styles.menuItem} ${styles.signOut}`} onClick={handleSignOut}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
        Sign Out
      </button>
    </div>
  )
}

export default ProfileMenu
