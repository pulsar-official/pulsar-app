'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useUser, useSignOut, useOrganization, useOrganizationList } from '@/hooks/useSupabaseAuth'
import styles from './ProfileMenu.module.scss'

const MAX_WORKSPACES = 3

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
  const signOut = useSignOut()
  const { user } = useUser()
  const { organization: activeOrg } = useOrganization()
  const { memberships, isLoaded: orgsLoaded, setActive, createOrganization, deleteOrganization, renameOrganization } = useOrganizationList()
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const plan = (user?.appMetadata?.plan as string) || 'Free'
  const planActive = plan !== 'Free'
  const displayName = user?.fullName || user?.firstName || 'User'
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const orgList = memberships ?? []
  const workspaceCount = orgList.length
  const canCreateWorkspace = workspaceCount < MAX_WORKSPACES

  // Viewport-aware positioning
  const updatePosition = useCallback(() => {
    if (!triggerRef?.current || !menuRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 240
    const menuHeight = menuRef.current.scrollHeight || 400

    let top = rect.bottom + 8
    let left = rect.left

    if (left + menuWidth > window.innerWidth - 12) left = window.innerWidth - menuWidth - 12
    if (left < 12) left = 12
    if (top + menuHeight > window.innerHeight - 12) top = rect.top - menuHeight - 8
    if (top < 12) top = 12

    setPosition({ top, left })
  }, [triggerRef])

  useEffect(() => { updatePosition() }, [updatePosition])

  useEffect(() => {
    const handleResize = () => onClose?.()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

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
    await signOut()
  }

  const handleSwitchWorkspace = async (orgId: string) => {
    if (orgId === activeOrg?.id) return
    onClose?.()
    await setActive?.({ organization: orgId })
  }

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || !canCreateWorkspace || createLoading) return
    setCreateLoading(true)
    try {
      await createOrganization?.(newWorkspaceName.trim())
      setNewWorkspaceName('')
      setCreatingWorkspace(false)
      onClose?.()
    } catch {
      // silently handle
    } finally {
      setCreateLoading(false)
    }
  }

  const handleStartEdit = (org: { id: string; name: string }, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(org.id)
    setEditName(org.name)
    setDeletingId(null)
  }

  const handleSaveEdit = async (orgId: string) => {
    if (editName.trim() && editName.trim() !== orgList.find(o => o.id === orgId)?.name) {
      await renameOrganization?.(orgId, editName.trim())
    }
    setEditingId(null)
  }

  const handleDeleteConfirm = async (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (deletingId === orgId) {
      await deleteOrganization?.(orgId)
      setDeletingId(null)
      if (workspaceCount <= 1) onClose?.()
    } else {
      setDeletingId(orgId)
      setEditingId(null)
    }
  }

  return (
    <div ref={menuRef} className={styles.menu} style={{ top: position.top + 'px', left: position.left + 'px' }}>

      {/* Plan */}
      <div className={styles.planSection}>
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
          <div className={styles.sectionCount}>{workspaceCount}/{MAX_WORKSPACES}</div>
        </div>
        <div className={styles.workspacesList}>
          {orgsLoaded && orgList.map((org) => {
            const isActive = org.id === activeOrg?.id
            const isEditing = editingId === org.id
            const isDeleting = deletingId === org.id

            return (
              <div key={org.id} className={`${styles.workspaceItem} ${isActive ? styles.workspaceActive : ''}`}>
                {isEditing ? (
                  <input
                    className={styles.createWorkspaceInput}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(org.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onBlur={() => handleSaveEdit(org.id)}
                    autoFocus
                    style={{ flex: 1, margin: '0 4px' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <button
                    className={styles.workspaceItemBtn}
                    onClick={() => handleSwitchWorkspace(org.id)}
                  >
                    <div className={styles.workspaceIcon}>{org.name.charAt(0).toUpperCase()}</div>
                    <div className={styles.workspaceDetails}>
                      <div className={styles.workspaceName}>{org.name}</div>
                    </div>
                    {isActive && (
                      <div className={styles.activeIndicator}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                )}

                {/* Action icons */}
                {!isEditing && (
                  <div className={styles.workspaceActions}>
                    <button
                      className={styles.wsActionBtn}
                      onClick={(e) => handleStartEdit(org, e)}
                      title="Rename workspace"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    {workspaceCount > 1 && (
                      <button
                        className={`${styles.wsActionBtn} ${isDeleting ? styles.wsActionDanger : ''}`}
                        onClick={(e) => handleDeleteConfirm(org.id, e)}
                        title={isDeleting ? 'Click again to confirm delete' : 'Delete workspace'}
                      >
                        {isDeleting
                          ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        }
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Fallback if no orgs */}
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
              title={!canCreateWorkspace ? `Maximum ${MAX_WORKSPACES} workspaces allowed` : 'Create a new workspace'}
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
