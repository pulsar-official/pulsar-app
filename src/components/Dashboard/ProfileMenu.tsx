'use client'

import React, { useRef, useEffect, useState } from 'react'
import styles from './ProfileMenu.module.scss'

interface ProfileMenuProps {
  onClose?: () => void
  streak?: number
  tasksToday?: number
  focusTimeToday?: number
  onSettingsClick?: () => void
  onShortcutsClick?: () => void
  onSignOut?: () => void
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  onClose,
  streak = 0,
  tasksToday = 0,
  focusTimeToday = 0,
  onSettingsClick,
  onShortcutsClick,
  onSignOut,
  triggerRef,
}) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [popupPositions, setPopupPositions] = useState<Record<string, { top: number; left: number }>>({})
  const workspaceRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      })
    }
  }, [triggerRef])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        if (triggerRef?.current && !triggerRef.current.contains(e.target as Node)) {
          onClose?.()
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, triggerRef])

  const handleWorkspaceHover = (workspaceId: string, element: HTMLDivElement) => {
    const rect = element.getBoundingClientRect()
    setPopupPositions((prev) => ({
      ...prev,
      [workspaceId]: {
        top: rect.top + rect.height / 2 - 8,
        left: rect.right + 8,
      },
    }))
  }

  const handleClose = () => {
    onClose?.()
  }

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {/* Plan Card - Top */}
      <div className={styles.planSection}>
        <div className={styles.planContent}>
          <div className={styles.planName}>Pro plan</div>
          <div className={styles.planBadge}>Active</div>
        </div>
        <button className={styles.planAction}>Manage</button>
      </div>

      <div className={styles.divider} />

      {/* Workspaces */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Workspaces</div>
        <div className={styles.workspacesList}>
          <div 
            ref={(el) => { workspaceRefs.current['pulsar'] = el }}
            className={styles.workspaceItemWrapper}
            onMouseEnter={(e) => handleWorkspaceHover('pulsar', e.currentTarget)}
          >
            <button className={styles.workspaceItem}>
              <div className={styles.workspaceIcon}>P</div>
              <div className={styles.workspaceDetails}>
                <div className={styles.workspaceName}>Pulsar</div>
              </div>
            </button>
            <div 
              className={styles.memberPopup}
              style={{
                top: `${popupPositions['pulsar']?.top || 0}px`,
                left: `${popupPositions['pulsar']?.left || 0}px`,
              }}
            >
              1 member
            </div>
          </div>
          <div 
            ref={(el) => { workspaceRefs.current['biteright'] = el }}
            className={styles.workspaceItemWrapper}
            onMouseEnter={(e) => handleWorkspaceHover('biteright', e.currentTarget)}
          >
            <button className={styles.workspaceItem}>
              <div className={styles.workspaceIcon}>B</div>
              <div className={styles.workspaceDetails}>
                <div className={styles.workspaceName}>BiteRight</div>
              </div>
            </button>
            <div 
              className={styles.memberPopup}
              style={{
                top: `${popupPositions['biteright']?.top || 0}px`,
                left: `${popupPositions['biteright']?.left || 0}px`,
              }}
            >
              3 members
            </div>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      {/* Actions */}
      <button
        className={styles.menuItem}
        onClick={() => {
          onSettingsClick?.()
          handleClose()
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Settings
      </button>

      <button
        className={styles.menuItem}
        onClick={() => {
          onShortcutsClick?.()
          handleClose()
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <line x1="6" y1="10" x2="6" y2="10" />
          <line x1="10" y1="10" x2="10" y2="10" />
          <line x1="14" y1="10" x2="14" y2="10" />
          <line x1="18" y1="10" x2="18" y2="10" />
          <line x1="8" y1="14" x2="16" y2="14" />
        </svg>
        Shortcuts
      </button>

      <button
        className={styles.menuItem}
        onClick={() => {
          onShortcutsClick?.()
          handleClose()
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        Invite Team
      </button>

      <div className={styles.divider} />

      <button
        className={`${styles.menuItem} ${styles.signOut}`}
        onClick={() => {
          onSignOut?.()
          handleClose()
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
        Sign Out
      </button>
    </div>
  )
}

export default ProfileMenu