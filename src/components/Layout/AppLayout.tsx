'use client'

import React, { useState } from 'react'
import styles from './AppLayout.module.scss'
import { useUIStore } from '@/stores/uiStore'
import { Sidebar } from '@/components/Dashboard/Sidebar'
import { Topbar } from '@/components/Dashboard/Topbar'
import { MainContent } from '@/components/Dashboard/MainContent'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface AppLayoutProps {
  children: React.ReactNode
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { sidebarCollapsed } = useUIStore()
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { label: 'Dashboard' }
  ])

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <Sidebar />
      <Topbar breadcrumbs={breadcrumbs} />
      <MainContent>
        {children}
      </MainContent>
    </div>
  )
}

export default AppLayout