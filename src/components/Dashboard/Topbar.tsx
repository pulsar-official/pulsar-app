'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import styles from './Topbar.module.scss'
import { useUIStore } from '@/stores/uiStore'
import UniversalSearch from '@/components/UniversalSearch'

interface TopbarProps {
  breadcrumbs: Array<{ label: string; onClick?: () => void }>
  currentPillar?: string
  notificationCount?: number
  onNotificationsClick?: () => void
  quickActions?: Array<{
    id: string
    label: string
    icon: React.ReactNode
    onClick: () => void
  }>
}

export const Topbar: React.FC<TopbarProps> = ({
  breadcrumbs,
  currentPillar,
  notificationCount = 0,
  onNotificationsClick,
  quickActions = [],
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const { toggleMobileMenu } = useUIStore()

  const isHabitsPage = pathname === '/dashboard/productivity/habits'

  return (
    <header className={styles.topbar}>
      <UniversalSearch />
      {/* Mobile hamburger */}
      <button className={styles.hamburger} onClick={toggleMobileMenu} aria-label="Open menu">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Left: Breadcrumb */}
      <nav className={styles.breadcrumb}>
        {breadcrumbs.map((crumb, idx) => {
          const isLast     = idx === breadcrumbs.length - 1
          const isEllipsis = crumb.label === '…'
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <span className={styles.separator}>/</span>}
              {isLast || isEllipsis ? (
                <span className={isEllipsis ? styles.ellipsis : styles.current}>
                  {crumb.label}
                </span>
              ) : (
                <button
                  className={styles.link}
                  onClick={crumb.onClick}
                >
                  {crumb.label}
                </button>
              )}
            </React.Fragment>
          )
        })}
      </nav>

      {/* Right: Quick Actions + Notifications */}
      <div className={styles.rightSection}>
        {/* Habits quick link */}
        <button
          className={styles.habitsBtn}
          style={{ zIndex: isHabitsPage ? 'auto' : -1, pointerEvents: isHabitsPage ? 'auto' : 'none' }}
          onClick={() => {
            if (isHabitsPage) {
              router.push('/dashboard/productivity/habits?modal=create')
            } else {
              router.push('/dashboard/productivity/habits?modal=create')
            }
          }}
          title="Create New Habit"
        >
          + New Habit
        </button>

        {/* Module Quick Actions */}
        {quickActions.length > 0 && (
          <div className={styles.quickActions}>
            {quickActions.map((action) => (
              <button
                key={action.id}
                className={styles.actionBtn}
                onClick={action.onClick}
                title={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}

        {/* Notifications */}
        <div className={styles.notificationContainer}>
          <button
            className={styles.notificationBtn}
            onClick={() => {
              setShowNotifications(!showNotifications)
              onNotificationsClick?.()
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {notificationCount > 0 && (
              <span className={styles.badge}>{notificationCount > 9 ? '9+' : notificationCount}</span>
            )}
          </button>

          {/* Notification Peek */}
          {showNotifications && notificationCount > 0 && (
            <div className={styles.notificationPeek}>
              <div className={styles.peekHeader}>
                <div className={styles.peekTitle}>Notifications</div>
                <button
                  className={styles.peekClose}
                  onClick={() => setShowNotifications(false)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.peekContent}>
                <div className={styles.peekItem}>
                  You have {notificationCount} {notificationCount === 1 ? 'notification' : 'notifications'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Topbar