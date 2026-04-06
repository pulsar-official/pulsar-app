'use client'

import { useCallback, useEffect, useState } from 'react'

type Tier = 'atom' | 'molecule' | 'neuron' | 'quantum'

const TIER_ORDER: Record<Tier, number> = {
  atom: 0,
  molecule: 1,
  neuron: 2,
  quantum: 3,
}

const STORAGE_KEY = 'pulsar-user-tier'

function readTierFromStorage(): Tier {
  if (typeof window === 'undefined') return 'atom'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && stored in TIER_ORDER) return stored as Tier
  return 'atom'
}

export function useUserTier() {
  const [tier, setTierState] = useState<Tier>('atom')

  useEffect(() => {
    setTierState(readTierFromStorage())
  }, [])

  const setTier = useCallback((newTier: Tier) => {
    localStorage.setItem(STORAGE_KEY, newTier)
    setTierState(newTier)
  }, [])

  const canAccess = useCallback(
    (required: Tier): boolean => {
      return TIER_ORDER[tier] >= TIER_ORDER[required]
    },
    [tier]
  )

  return { tier, setTier, canAccess }
}
