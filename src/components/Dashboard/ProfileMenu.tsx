'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useClerk, useUser, useOrganization, useOrganizationList } from '@clerk/nextjs'
import styles from './ProfileMenu.module.scss'

const WORKSPACE_LIMITS: Record<string, number> = {
  Free: 1,
  Atom: 1,
  Molecule: 3,
  Neuron: Infinity,
  Quantum: Infinity,
}

interface ProfileMenuProps {
  onClose?: () => void
  onSettingsClick?: () => void
  onShortcutsClick?: () => void
  onSignOut?: () => void
  onManagePlan?: () => void
  triggerRef?: React.RefObject<HTMLButtonElement | null>
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  onClose,
  onSettingsClick, onShortcutsClick, onSignOut, onManagePlan, triggerRef,
}) => {
  const { signOut } = useClerk()
  const { user } = useUser()
  const { organization: activeOrg } = useOrganization()
  const { userMemberships, isLoaded: orgsLoaded, setActive, createOrganization } = useOrganizationList({
    userMemberships: { infinite: true },
  })
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const plan = (user?.publicMetadata?.plan as string) || 'Free'
  const planActive = plan !== 'Free'
  const displayName = user?.fullName || user?.firstName || 'User'
  const email = user?.emailAddresses[0]?.emailAddress || ''
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  const avatarUrl = user?.imageUrl || null

  const workspaceLimit = WORKSPACE_LIMITS[plan] ?? 1
  const orgList = userMemberships?.data ?? []
  const workspaceCount = orgList.length
  const canCreateWorkspace = workspaceCount < workspaceLimit

  // Viewport-aware positioning
  const updatePosition = useCallback(() => {
    if (!triggerRef?.current || !menuRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 240
    const menuHeight = menuRef.current.scrollHeight || 400

    let top = rect.bottom + 8
    let left = rect.left

    // Right edge overflow
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12
    }
    // Left edge overflow
    if (left < 12) left = 12

    // Bottom edge overflow — position above trigger
    if (top + menuHeight > window.innerHeight - 12) {
      top = rect.top - menuHeight - 8
    }
    // Top edge overflow (if flipped above)
    if (top < 12) top = 12

    setPosition({ top, left })
  }, [triggerRef])

  useEffect(() => {
    updatePosition()
  }, [updatePosition])

  // Close on resize
  useEffect(() => {
    const handleResize = () => onClose?.()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [onClose])

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Click outside
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

  const handleSwitchWorkspace = async (orgId: string) => {
    if (orgId === activeOrg?.id) return
    await setActive?.({ organization: orgId })
  }

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || !canCreateWorkspace || createLoading) return
    setCreateLoading(true)
    try {
      const org = await createOrganization?.({ name: newWorkspaceName.trim() })
      if (org) await setActive?.({ organization: org.id })
      setNewWorkspaceName('')
      setCreatingWorkspace(false)
    } catch {
      // silently handle
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div ref={menuRef} className={styles.menu} style={{ top: position.top + 'px', left: position.left + 'px' }}>

      {/* User identity */}
      <div className={styles.planSection}>
        <div className={styles.userIdentity}>
          <div className={styles.avatar}>
            {avatarUrl
              ? <img src={avatarUrl} alt={displayName} className={styles.avatarImg} />
              : <span>{initials}</span>
            }
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{displayName}</div>
            <div className={styles.userEmail}>{email}</div>
          </div>
        </div>
        <div className={styles.planContent}>
          <div className={styles.planName}>{plan === 'Free' ? 'Free plan' : plan + ' plan'}</div>
          <div className={styles.planBadge} style={{ background: planActive ? 'rgba(110,231,183,0.15)' : undefined, color: planActive ? '#6ee7b7' : undefined }}>{planActive ? 'Active' : 'Free tier'}</div>
        </div>
        <button className={styles.planAction} onClick={() => { onManagePlan?.(); onClose?.() }}>
          {plan === 'Free' ? 'Upgrade' : 'Manage'}
        </button>
      </div>

      <div className={styles.divider} />

      {/* Workspace */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel}>Workspace</div>
          <div className={styles.sectionCount}>
            {workspaceLimit === Infinity ? workspaceCount : `${workspaceCount}/${workspaceLimit}`}
          </div>
        </div>
        <div className={styles.workspacesList}>
          {orgsLoaded && orgList.map((mem) => {
            const org = mem.organization
            const isActive = org.id === activeOrg?.id
            return (
              <button
                key={org.id}
                className={`${styles.workspaceItem} ${isActive ? styles.workspaceActive : ''}`}
                onClick={() => handleSwitchWorkspace(org.id)}
              >
                <div className={styles.workspaceIcon}>
                  {org.imageUrl
                    ? <img src={org.imageUrl} alt={org.name} className={styles.workspaceIconImg} />
                    : org.name.charAt(0).toUpperCase()
                  }
                </div>
                <div className={styles.workspaceDetails}>
                  <div className={styles.workspaceName}>{org.name}</div>
                </div>
                {isActive && (
                  <div className={styles.activeIndicator}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
            )
          })}

          {/* Fallback if no orgs loaded or empty */}
          {orgsLoaded && orgList.length === 0 && (
            <button className={styles.workspaceItem}>
              <div className={styles.workspaceIcon}>{initials.slice(0, 1)}</div>
              <div className={styles.workspaceDetails}>
                <div className={styles.workspaceName}>{displayName}&apos;s workspace</div>
              </div>
            </button>
          )}

          {/* Create workspace */}
          {creatingWorkspace ? (
            <div className={styles.createWorkspaceForm}>
              <input
                className={styles.createWorkspaceInput}
                type="text"
                placeholder="Workspace name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateWorkspace(); if (e.key === 'Escape') setCreatingWorkspace(false) }}
                autoFocus
                disabled={createLoading}
              />
              <div className={styles.createWorkspaceActions}>
                <button className={styles.createWorkspaceConfirm} onClick={handleCreateWorkspace} disabled={!newWorkspaceName.trim() || createLoading}>
                  {createLoading ? '...' : 'Create'}
                </button>
                <button className={styles.createWorkspaceCancel} onClick={() => { setCreatingWorkspace(false); setNewWorkspaceName('') }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className={`${styles.workspaceItem} ${styles.addWorkspace}`}
              onClick={() => setCreatingWorkspace(true)}
              disabled={!canCreateWorkspace}
              title={!canCreateWorkspace ? `Upgrade your plan to add more workspaces (${plan} plan: ${workspaceLimit === Infinity ? 'unlimited' : workspaceLimit})` : 'Create a new workspace'}
            >
              <div className={styles.workspaceIcon}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
              <div className={styles.workspaceDetails}>
                <div className={styles.workspaceName}>New workspace</div>
              </div>
            </button>
          )}
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
