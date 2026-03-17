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
}

export const NavItems: React.FC<NavItemsProps> = ({ items, collapsed = false }) => {
  return (
    <nav className={styles.nav}>
      {items.map((item) => (
        <div key={item.id} className={styles.navItem}>
          <div className={styles.navIcon}>
            <Icon name={item.icon} size={13} />
          </div>
          <span className={styles.navLabel}>{item.label}</span>
          {item.badge && (
            <span className={styles.badge}>{item.badge}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

export default NavItems