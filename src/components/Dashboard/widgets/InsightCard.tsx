'use client'

import React from 'react'
import styles from './InsightCard.module.scss'

export interface InsightCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  color?: 'purple' | 'green' | 'amber' | 'blue' | 'red'
  icon?: string
  children?: React.ReactNode
}

const TREND_ARROWS = { up: '↑', down: '↓', neutral: '→' } as const

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  color = 'purple',
  icon,
  children,
}) => {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.header}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.title}>{title}</span>
        {trend && trendValue && (
          <span className={`${styles.trend} ${styles[`trend_${trend}`]}`}>
            {TREND_ARROWS[trend]} {trendValue}
          </span>
        )}
      </div>
      <div className={styles.value}>{value}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      {children && <div className={styles.custom}>{children}</div>}
    </div>
  )
}

export default InsightCard
