'use client'

import React from 'react'
import styles from './Dashboard.module.scss'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useSupabaseAuth'
import { PILLARS } from '@/constants/pillars'

interface DashboardProps {
  onNavigate?: (page: string) => void
}

const STATS = [
  { title: 'Tasks Done', value: '24', trend: '↑ 12% this week', color: 60 },
  { title: 'Focus Time', value: '6.2h', trend: '↑ 3% this week', color: 200 },
  { title: 'Notes Created', value: '8', trend: '↑ 5% this week', color: 150 },
]

// Build page name lookup from PILLARS
const PAGE_LABELS: Record<string, string> = { dashboard: 'Dashboard' }
for (const pillar of PILLARS) {
  for (const section of pillar.sections) {
    for (const item of section.items) {
      PAGE_LABELS[item.page] = item.name
    }
  }
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { orgId } = useAuth()
  const lastVisited = useUIStore(s => s.lastVisited)

  const lastPage = orgId ? lastVisited[orgId] : null
  const showContinue = lastPage && lastPage !== 'dashboard'
  const lastPageLabel = lastPage ? (PAGE_LABELS[lastPage] ?? lastPage) : ''

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>Your personal command center</p>
      </div>

      {showContinue && (
        <div className={styles.section}>
          <h2>Continue where you left off</h2>
          <button className={styles.continueCard} onClick={() => onNavigate?.(lastPage!)}>
            <div className={styles.continueIcon}>↗</div>
            <div className={styles.continueText}>
              <div className={styles.continueName}>{lastPageLabel}</div>
              <div className={styles.continueHint}>Pick up right where you stopped</div>
            </div>
          </button>
        </div>
      )}

      <div className={styles.section}>
        <h2>Overview</h2>
        <div className={styles.cardGrid}>
          {STATS.map((card) => (
            <div key={card.title} className={styles.card}>
              <div
                className={styles.cardIcon}
                style={{
                  background: `oklch(0.22 0.08 ${card.color})`,
                  color: `oklch(0.75 0.14 ${card.color})`,
                }}
              >
                ↗
              </div>
              <div className={styles.cardTitle}>{card.title}</div>
              <div className={styles.cardValue}>{card.value}</div>
              <p className={styles.cardTrend} style={{ color: `oklch(0.65 0.14 ${card.color})` }}>
                {card.trend}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
