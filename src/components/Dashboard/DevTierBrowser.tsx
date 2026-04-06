'use client'

import React from 'react'
import { PILLARS } from '@/constants/pillars'
import { useUIStore } from '@/stores/uiStore'
import styles from './DevTierBrowser.module.scss'

export const DevTierBrowser: React.FC = () => {
  const { currentPage, setCurrentPage } = useUIStore()

  return (
    <div className={styles.devBrowser}>
      <div className={styles.header}>
        <h3>Dev Tier Browser</h3>
        <p className={styles.subtitle}>All Pillars</p>
      </div>

      <div className={styles.tiersList}>
        {PILLARS.map((pillar) => (
          <div key={pillar.id} className={styles.pillarGroup}>
            <div className={styles.pillarName}>{pillar.label}</div>

            {pillar.sections.map((section) => (
              <div key={section.title} className={styles.sectionGroup}>
                <div className={styles.sectionTitle}>{section.title}</div>
                <div className={styles.itemsList}>
                  {section.items.map((item) => (
                    <button
                      key={item.page}
                      className={`${styles.tierItem} ${
                        currentPage === item.page ? styles.active : ''
                      }`}
                      onClick={() => setCurrentPage(item.page)}
                      title={item.page}
                    >
                      <span className={styles.itemName}>{item.name}</span>
                      {item.badge && (
                        <span className={styles.badge}>{item.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
