'use client'

import React from 'react'
import styles from './NavItems.module.scss'
import { Icon } from '@/components/UI/Icon'
import type { IconName } from '@/types'

interface NavItem {
  id: string
  label: string
  icon: IconName
  badge?: string
}

interface NavItemsProps {
  items: NavItem[]
  collapsed?: boolean
  onNavigate?: (id: string) => void
  activeId?: string
  badgeOverrides?: Record<string, string>
}

export const NavItems: React.FC<NavItemsProps> = ({ items, collapsed = false, onNavigate, activeId, badgeOverrides }) => {
  return (
    <nav className={styles.nav}>
      {items.map((item) => {
        const badge = badgeOverrides?.[item.id] ?? item.badge
        return (
          <div
            key={item.id}
            className={`${styles.navItem} ${activeId === item.id ? styles.active : ''}`}
            onClick={() => onNavigate?.(item.id)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.navIcon}>
              <Icon name={item.icon} size={13} />
            </div>
            <span className={styles.navLabel}>{item.label}</span>
            {badge && (
              <span className={styles.badge}>{badge}</span>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default NavItems