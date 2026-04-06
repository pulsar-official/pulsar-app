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
const TIER_CHANGE_EVENT = 'pulsar-tier-change'

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

    // Sync all instances when any instance calls setTier
    const handler = () => setTierState(readTierFromStorage())
    window.addEventListener(TIER_CHANGE_EVENT, handler)
    return () => window.removeEventListener(TIER_CHANGE_EVENT, handler)
  }, [])

  const setTier = useCallback((newTier: Tier) => {
    localStorage.setItem(STORAGE_KEY, newTier)
    setTierState(newTier)
    // Notify all other useUserTier instances to re-read
    window.dispatchEvent(new Event(TIER_CHANGE_EVENT))
  }, [])

  const canAccess = useCallback(
    (required: Tier): boolean => {
      return TIER_ORDER[tier] >= TIER_ORDER[required]
    },
    [tier]
  )

  return { tier, setTier, canAccess }
}
