'use client'

import React, { useState } from 'react'
import { PILLARS } from '@/constants/pillars'
import { useUIStore } from '@/stores/uiStore'
import styles from './DevTierBrowser.module.scss'

const TIERS = [
  {
    name: 'Atom',
    price: 'Free',
    desc: 'Students & casual users',
    pillars: ['corespace', 'knowledge'],
    maxCollaborators: 2,
    maxWorkspaces: 1,
  },
  {
    name: 'Molecule',
    price: '$12/mo',
    desc: 'Students & solo learners',
    pillars: ['corespace', 'knowledge', 'productivity'],
    maxCollaborators: 5,
    maxWorkspaces: 3,
  },
  {
    name: 'Neuron',
    price: '$20/mo',
    desc: 'Advanced learners & teams',
    pillars: ['corespace', 'knowledge', 'productivity', 'insights', 'customization'],
    maxCollaborators: 25,
    maxWorkspaces: 999,
  },
  {
    name: 'Quantum',
    price: '$30/mo',
    desc: 'Teams, researchers & pros',
    pillars: ['corespace', 'knowledge', 'productivity', 'insights', 'customization', 'collaboration', 'extensions'],
    maxCollaborators: 999,
    maxWorkspaces: 999,
  },
]

export const DevTierBrowser: React.FC = () => {
  const { currentPage, setCurrentPage } = useUIStore()
  const [selectedTier, setSelectedTier] = useState(0)
  const tier = TIERS[selectedTier]
  const availablePillars = PILLARS.filter(p => tier.pillars.includes(p.id))

  return (
    <div className={styles.devBrowser}>
      <div className={styles.header}>
        <h3>Dev Tier Browser</h3>
        <p className={styles.subtitle}>Test Each Plan</p>
      </div>

      {/* Tier Selector */}
      <div className={styles.tierSelector}>
        {TIERS.map((t, idx) => (
          <button
            key={t.name}
            className={`${styles.tierBtn} ${idx === selectedTier ? styles.active : ''}`}
            onClick={() => setSelectedTier(idx)}
            title={t.desc}
          >
            <div className={styles.tierName}>{t.name}</div>
            <div className={styles.tierPrice}>{t.price}</div>
          </button>
        ))}
      </div>

      {/* Tier Info */}
      <div className={styles.tierInfo}>
        <div className={styles.tierDesc}>{tier.desc}</div>
        <div className={styles.tierStats}>
          <div className={styles.stat}>
            <span className={styles.label}>Pillars:</span>
            <span className={styles.value}>{tier.pillars.length}/7</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Collaborators:</span>
            <span className={styles.value}>{tier.maxCollaborators === 999 ? '∞' : tier.maxCollaborators}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.label}>Workspaces:</span>
            <span className={styles.value}>{tier.maxWorkspaces === 999 ? '∞' : tier.maxWorkspaces}</span>
          </div>
        </div>
      </div>

      <div className={styles.tiersList}>
        {availablePillars.map((pillar) => (
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
