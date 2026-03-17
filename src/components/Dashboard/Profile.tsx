'use client'

import React, { useState, useRef } from 'react'
import styles from './Profile.module.scss'
import { ProfileMenu } from './ProfileMenu'

interface ProfileProps {
  initials: string
  name: string
  subtitle: string
  streak?: number
  tasksToday?: number
  focusTimeToday?: number
  onSettingsClick?: () => void
  onShortcutsClick?: () => void
  onSignOut?: () => void
}

export const Profile: React.FC<ProfileProps> = ({
  initials,
  name,
  subtitle,
  streak = 0,
  tasksToday = 0,
  focusTimeToday = 0,
  onSettingsClick,
  onShortcutsClick,
  onSignOut,
}) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <div className={styles.profileContainer}>
        <button
          ref={buttonRef}
          className={styles.profile}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Profile menu"
        >
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.info}>
            <div className={styles.name}>{name}</div>
            <div className={styles.subtitle}>{subtitle}</div>
          </div>
        </button>
      </div>

      {menuOpen && (
        <ProfileMenu
          streak={streak}
          tasksToday={tasksToday}
          focusTimeToday={focusTimeToday}
          onSettingsClick={onSettingsClick}
          onShortcutsClick={onShortcutsClick}
          onSignOut={onSignOut}
          onClose={() => setMenuOpen(false)}
          triggerRef={buttonRef}
        />
      )}
    </>
  )
}

export default Profile