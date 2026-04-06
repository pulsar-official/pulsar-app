'use client'

import React from 'react'
import { useUserTier } from '@/hooks/useUserTier'
import { useEffect, useState } from 'react'
import styles from './DevTierSelector.module.scss'

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
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // In a real app, get email from auth context or localStorage
    // For now, check if yoshigar304@gmail.com is in a dev list or localStorage
    const isDevUser = localStorage.getItem('pulsar-dev-user') === 'true'
    if (isDevUser) {
      setUserEmail('yoshigar304@gmail.com')
    }
  }, [])

  // Only show for dev user
  if (!userEmail) return null

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
