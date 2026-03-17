'use client'

import React from 'react'
import styles from './Dashboard.module.scss'

interface DashboardProps {
  onNavigate?: (page: string) => void
}

const STATS = [
  { title: 'Tasks Done', value: '24', trend: '↑ 12% this week', color: 60 },
  { title: 'Focus Time', value: '6.2h', trend: '↑ 3% this week', color: 200 },
  { title: 'Notes Created', value: '8', trend: '↑ 5% this week', color: 150 },
]

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <p>Your personal command center</p>
      </div>

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
