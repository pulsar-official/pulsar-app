'use client'

import React from 'react'
import styles from './AppLayout.module.scss'
import { useUIStore } from '@/stores/uiStore'
import { Sidebar } from '@/components/Dashboard/Sidebar'
import { Topbar } from '@/components/Dashboard/Topbar'
import { MainContent } from '@/components/Dashboard/MainContent'
import { PILLARS } from '@/constants/pillars'

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
  const { sidebarCollapsed, currentPage, mobileMenuOpen, closeMobileMenu } = useUIStore()

  const pillarLabel = PAGE_TO_PILLAR[currentPage]
  const pageLabel = PAGE_TITLES[currentPage] ?? currentPage
  const breadcrumbs = pillarLabel && pillarLabel !== pageLabel
    ? [{ label: pillarLabel }, { label: pageLabel }]
    : [{ label: pageLabel }]

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={closeMobileMenu} />
      )}
      <Sidebar />
      <Topbar breadcrumbs={breadcrumbs} />
      <MainContent />
    </div>
  )
}

export default AppLayout
