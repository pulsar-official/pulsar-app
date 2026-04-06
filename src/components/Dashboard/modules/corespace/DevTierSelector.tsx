'use client'

import React from 'react'
import { useUserTier } from '@/hooks/useUserTier'
import { useUser } from '@/hooks/useSupabaseAuth'
import styles from './DevTierSelector.module.scss'

const DEV_EMAILS = ['yoshigar304@gmail.com']

type Tier = 'atom' | 'molecule' | 'neuron' | 'quantum'

const TIER_LABELS: Record<Tier, string> = {
  atom: 'A',
  molecule: 'M',
  neuron: 'N',
  quantum: 'Q',
}

const TIER_FULL: Record<Tier, string> = {
  atom: 'Atom',
  molecule: 'Molecule',
  neuron: 'Neuron',
  quantum: 'Quantum',
}

export default function DevTierSelector() {
  const { tier, setTier } = useUserTier()
  const { user } = useUser()

  const isDev =
    process.env.NODE_ENV === 'development' ||
    DEV_EMAILS.includes(user?.email ?? '')

  // Only show for dev users
  if (!isDev) return null

  const tierOrder: Tier[] = ['atom', 'molecule', 'neuron', 'quantum']

  return (
    <div className={styles.devSelectorContainer}>
      <div className={styles.devLabel}>Dev:</div>
      <div className={styles.tierButtons}>
        {tierOrder.map((t) => (
          <button
            key={t}
            className={`${styles.tierBtn} ${tier === t ? styles.tierBtnActive : ''}`}
            onClick={() => setTier(t)}
            title={`Switch to ${TIER_FULL[t]} tier`}
          >
            [{TIER_LABELS[t]}]
          </button>
        ))}
      </div>
    </div>
  )
}
