'use client'

import React, { useState, useEffect } from 'react'
import styles from './Sidebar.module.scss'
import { useUIStore } from '@/stores/uiStore'
import { BOTTOM_NAV, BOTTOM_NAV_RIGHT } from '@/constants/pillars'
import { Profile } from './Profile'
import { Search } from './Search'
import { Carousel } from './Carousel'
import { NavItems } from './NavItems'

interface SidebarProps {
  onNavigate?: (page: string, pillarIndex: number) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const [currentPillarIndex, setCurrentPillarIndex] = useState(6)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isCollapsing, setIsCollapsing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!sidebarCollapsed) {
        setIsCollapsing(true)
        const collapseTimer = setTimeout(() => setIsCollapsing(false), 400)
        return () => clearTimeout(collapseTimer)
      } else {
        setIsCollapsing(false)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [sidebarCollapsed])

  // Force close dropdown when sidebar collapses
  useEffect(() => {
    if (sidebarCollapsed) {
      setDropdownOpen(false)
    }
  }, [sidebarCollapsed])

  // Guard: if dropdown tries to open while collapsed, close it
  useEffect(() => {
    if (sidebarCollapsed && dropdownOpen) {
      setDropdownOpen(false)
    }
  }, [sidebarCollapsed, dropdownOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dropdownOpen) {
        setDropdownOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dropdownOpen])

  return (
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${isCollapsing ? styles.collapsing : ''}`}>
      <Profile
        initials="P"
        name="Pulsar"
        subtitle="Knowledge OS"
        streak={14}
        tasksToday={7}
        focusTimeToday={2.4}
        onSettingsClick={() => console.log('Settings clicked')}
        onShortcutsClick={() => console.log('Shortcuts clicked')}
        onSignOut={() => console.log('Sign out clicked')}
      />
      
      <Search />
      
      <Carousel
        currentIndex={currentPillarIndex}
        onOpenDropdown={() => {
          if (!sidebarCollapsed) {
            setDropdownOpen(true)
          }
        }}
        onCloseDropdown={() => setDropdownOpen(false)}
        onRotate={setCurrentPillarIndex}
        collapsed={sidebarCollapsed}
      />
      
      <NavItems items={BOTTOM_NAV} collapsed={sidebarCollapsed} />
      
      <div className={styles.spacer} />
      
      <NavItems items={BOTTOM_NAV_RIGHT} collapsed={sidebarCollapsed} />
      
      <button
        className={styles.toggleBtn}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {sidebarCollapsed ? '▶' : '◀'}
      </button>
    </aside>
  )
}

export default Sidebar