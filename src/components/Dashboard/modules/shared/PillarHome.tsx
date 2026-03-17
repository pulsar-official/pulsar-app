'use client'

import React from 'react'
import styles from './PillarHome.module.scss'
import { useUIStore } from '@/stores/uiStore'
import { PILLARS } from '@/constants/pillars'

interface PillarHomeProps {
  pillarId: string
}

export const PillarHome: React.FC<PillarHomeProps> = ({ pillarId }) => {
  const { setCurrentPage } = useUIStore()
  const pillar = PILLARS.find(p => p.id === pillarId)
  if (!pillar) return null

  const hue = pillar.color
  const iconBg = 'oklch(0.22 0.08 ' + hue + ')'
  const iconFg = 'oklch(0.75 0.18 ' + hue + ')'
  const iconRing = '0 0 0 1px oklch(0.35 0.10 ' + hue + ')'
  const badgeBg = 'oklch(0.22 0.07 ' + hue + ')'
  const badgeFg = 'oklch(0.78 0.16 ' + hue + ')'
  const cardHover = 'oklch(0.24 0.04 ' + hue + ')'

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div
          className={styles.headerIcon}
          style={{ background: iconBg, color: iconFg, boxShadow: iconRing }}
        >
          {pillar.label.charAt(0)}
        </div>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{pillar.label}</h1>
          <p className={styles.subtitle}>
            {pillar.sections.reduce((n, s) => n + s.items.length, 0)} modules
          </p>
        </div>
      </div>

      <div className={styles.sections}>
        {pillar.sections.map(section => (
          <div key={section.title} className={styles.section}>
            <div className={styles.sectionTitle}>{section.title}</div>
            <div className={styles.cards}>
              {section.items.map(item => (
                <button
                  key={item.page}
                  className={styles.card}
                  onClick={() => setCurrentPage(item.page)}
                  style={{ '--card-hover': cardHover } as React.CSSProperties}
                >
                  <div className={styles.cardName}>{item.name}</div>
                  {item.badge && (
                    <span className={styles.badge} style={{ background: badgeBg, color: badgeFg }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PillarHome
