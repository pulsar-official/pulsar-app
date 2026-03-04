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

  const handlePrevious = () => {
    setCurrentPillarIndex((prev) => (prev - 1 + 7) % 7)
  }

  const handleNext = () => {
    setCurrentPillarIndex((prev) => (prev + 1) % 7)
  }

  if (sidebarCollapsed && dropdownOpen) {
    setDropdownOpen(false)
  }

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
    <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <Profile initials="P" name="Pulsar" subtitle="Knowledge OS" />
      
      <Search />
      
      <Carousel
        currentIndex={currentPillarIndex}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onOpenDropdown={() => setDropdownOpen(!dropdownOpen)}
        dropdownOpen={dropdownOpen}
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