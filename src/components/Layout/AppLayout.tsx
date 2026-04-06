'use client'

import React, { useEffect } from 'react'
import styles from './AppLayout.module.scss'
import { useUIStore } from '@/stores/uiStore'
import { useUser } from '@/hooks/useSupabaseAuth'
import { Sidebar } from '@/components/Dashboard/Sidebar'
import { Topbar } from '@/components/Dashboard/Topbar'
import { MainContent } from '@/components/Dashboard/MainContent'
import { PILLARS } from '@/constants/pillars'
import { UndoToast } from './UndoToast'
import { FocusModeOverlay } from './FocusModeOverlay'

// Build flat lookups from pillars
const PAGE_TITLES: Record<string, string> = { dashboard: 'Dashboard' }
const PAGE_TO_PILLAR: Record<string, string> = {}
// Pillar home pages show as single-level breadcrumb
for (const pillar of PILLARS) {
  PAGE_TITLES[pillar.id + '-home'] = pillar.label
}
for (const pillar of PILLARS) {
  for (const section of pillar.sections) {
    for (const item of section.items) {
      PAGE_TITLES[item.page] = item.name
      PAGE_TO_PILLAR[item.page] = pillar.label
    }
  }
}

export const AppLayout: React.FC = () => {
  const { sidebarCollapsed, currentPage, mobileMenuOpen, closeMobileMenu, subBreadcrumb, focusModeActive, toggleFocusMode } = useUIStore()
  const { user } = useUser()

  // Keyboard shortcut: Shift+F toggles Focus Mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return
      if (e.shiftKey && e.key === 'F') {
        e.preventDefault()
        toggleFocusMode()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleFocusMode])

  const pillarLabel = PAGE_TO_PILLAR[currentPage]
  const pageLabel   = PAGE_TITLES[currentPage] ?? currentPage

  // Build full breadcrumb list
  const fullCrumbs: Array<{ label: string; onClick?: () => void }> = []
  if (pillarLabel && pillarLabel !== pageLabel) {
    fullCrumbs.push({ label: pillarLabel })
  }
  fullCrumbs.push({ label: pageLabel })
  if (subBreadcrumb) {
    fullCrumbs.push({ label: subBreadcrumb })
  }

  // Smart truncation: if breadcrumb gets long (>3 segments), collapse middle to "…"
  const breadcrumbs = fullCrumbs.length > 3
    ? [fullCrumbs[0], { label: '…' }, fullCrumbs[fullCrumbs.length - 1]]
    : fullCrumbs

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''} ${focusModeActive ? styles.focusModeActive : ''}`}>
      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={closeMobileMenu} />
      )}
      <Sidebar />
      <Topbar breadcrumbs={breadcrumbs} />
      <MainContent />
      <UndoToast />
      <FocusModeOverlay />
    </div>
  )
}

export default AppLayout
