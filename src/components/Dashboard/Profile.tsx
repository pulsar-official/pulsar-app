'use client'

import React, { useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import styles from './Profile.module.scss'
import { ProfileMenu } from './ProfileMenu'

interface ProfileProps {
  onSettingsClick?: () => void
  onShortcutsClick?: () => void
  onManagePlan?: () => void
}

export const Profile: React.FC<ProfileProps> = ({
  onSettingsClick,
  onShortcutsClick,
  onManagePlan,
}) => {
  const { user } = useUser()
  const displayName = user?.fullName || user?.firstName || 'User'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'
  const subtitle = user?.emailAddresses[0]?.emailAddress || 'Knowledge OS'
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
            <div className={styles.name}>{displayName}</div>
            <div className={styles.subtitle}>{subtitle}</div>
          </div>
        </button>
      </div>

      {menuOpen && (
        <ProfileMenu
          onSettingsClick={onSettingsClick}
          onShortcutsClick={onShortcutsClick}
          onManagePlan={onManagePlan}
          onClose={() => setMenuOpen(false)}
          triggerRef={buttonRef}
        />
      )}
    </>
  )
}

export default Profile