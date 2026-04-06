'use client'

/**
 * Custom React hook for blob state and configuration management
 * Simplifies integration of blob system in components
 */

import { useState, useCallback, useMemo } from 'react'
import { BlobIntensity, BLOB_ANIMATION_DEFAULTS, BLOB_COLOR_PRESETS } from './blob.types'
import { calculateComplexityFromSize, clampComplexity, validateBlobConfig } from './blobUtils'

/**
 * Hook configuration options
 */
export interface UseBlobOptions {
  enableBlob?: boolean
  blobColor?: string
  morphSpeed?: number
  complexity?: number
  intensity?: BlobIntensity
  onError?: (errors: string[]) => void
}

/**
 * Hook return value
 */
export interface UseBlobReturn {
  // State
  enableBlob: boolean
  blobColor: string
  morphSpeed: number
  complexity: number
  intensity: BlobIntensity
  isValid: boolean
  errors: string[]

  // Actions
  setEnableBlob: (enabled: boolean) => void
  setBlobColor: (color: string) => void
  setMorphSpeed: (speed: number) => void
  setComplexity: (complexity: number) => void
  setIntensity: (intensity: BlobIntensity) => void
  reset: () => void

  // Utils
  applyPreset: (presetKey: string) => boolean
  updateFromContainerSize: (width: number, height: number) => void
}

/**
 * Default configuration for hook
 */
const DEFAULT_CONFIG: Required<Omit<UseBlobOptions, 'onError'>> = {
  enableBlob: false,
  blobColor: 'oklch(0.55 0.18 290)',
  morphSpeed: BLOB_ANIMATION_DEFAULTS.morphSpeed,
  complexity: BLOB_ANIMATION_DEFAULTS.complexity,
  intensity: 'med',
}

/**
 * useBlob - Hook for managing blob configuration and state
 *
 * @example
 * ```tsx
 * const {
 *   enableBlob,
 *   blobColor,
 *   setEnableBlob,
 *   applyPreset,
 * } = useBlob({
 *   enableBlob: true,
 *   blobColor: 'oklch(0.55 0.18 290)',
 * })
 *
 * return (
 *   <BlobWrapper
 *     enableBlob={enableBlob}
 *     blobColor={blobColor}
 *   >
 *     {/* content */}
 *   </BlobWrapper>
 * )
 * ```
 */
export function useBlob(options: UseBlobOptions = {}): UseBlobReturn {
  const [enableBlob, setEnableBlob] = useState(options.enableBlob ?? DEFAULT_CONFIG.enableBlob)
  const [blobColor, setBlobColor] = useState(options.blobColor ?? DEFAULT_CONFIG.blobColor)
  const [morphSpeed, setMorphSpeed] = useState(options.morphSpeed ?? DEFAULT_CONFIG.morphSpeed)
  const [complexity, setComplexity] = useState(options.complexity ?? DEFAULT_CONFIG.complexity)
  const [intensity, setIntensity] = useState<BlobIntensity>(
    options.intensity ?? DEFAULT_CONFIG.intensity
  )
  const [errors, setErrors] = useState<string[]>([])

  // Validate configuration
  const isValid = useMemo(() => {
    const validationErrors = validateBlobConfig({
      complexity,
      morphSpeed,
      blobColor,
      intensity,
    })

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      options.onError?.(validationErrors)
      return false
    }

    setErrors([])
    return true
  }, [complexity, morphSpeed, blobColor, intensity, options])

  // Apply color preset by key
  const applyPreset = useCallback((presetKey: string): boolean => {
    const preset = BLOB_COLOR_PRESETS[presetKey]
    if (preset) {
      setBlobColor(preset.value)
      return true
    }
    return false
  }, [])

  // Update complexity based on container dimensions
  const updateFromContainerSize = useCallback((width: number, height: number) => {
    const suggestedComplexity = calculateComplexityFromSize(width, height)
    setComplexity(clampComplexity(suggestedComplexity))
  }, [])

  // Reset to defaults
  const reset = useCallback(() => {
    setEnableBlob(DEFAULT_CONFIG.enableBlob)
    setBlobColor(DEFAULT_CONFIG.blobColor)
    setMorphSpeed(DEFAULT_CONFIG.morphSpeed)
    setComplexity(DEFAULT_CONFIG.complexity)
    setIntensity(DEFAULT_CONFIG.intensity)
    setErrors([])
  }, [])

  return {
    enableBlob,
    blobColor,
    morphSpeed,
    complexity,
    intensity,
    isValid,
    errors,
    setEnableBlob,
    setBlobColor,
    setMorphSpeed,
    setComplexity,
    setIntensity,
    reset,
    applyPreset,
    updateFromContainerSize,
  }
}

/**
 * useLocalBlobStorage - Hook for persisting blob configuration to localStorage
 *
 * @example
 * ```tsx
 * const blob = useBlob()
 * useLocalBlobStorage('my-widget-blob', blob)
 * ```
 */
export function useLocalBlobStorage(storageKey: string, blob: UseBlobReturn) {
  const saveToStorage = useCallback(() => {
    try {
      const config = {
        enableBlob: blob.enableBlob,
        blobColor: blob.blobColor,
        morphSpeed: blob.morphSpeed,
        complexity: blob.complexity,
        intensity: blob.intensity,
      }
      localStorage.setItem(storageKey, JSON.stringify(config))
    } catch (error) {
      console.warn(`Failed to save blob config to localStorage: ${storageKey}`, error)
    }
  }, [blob, storageKey])

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const config = JSON.parse(stored)
        blob.setBlobColor(config.blobColor ?? blob.blobColor)
        blob.setMorphSpeed(config.morphSpeed ?? blob.morphSpeed)
        blob.setComplexity(config.complexity ?? blob.complexity)
        blob.setIntensity(config.intensity ?? blob.intensity)
        blob.setEnableBlob(config.enableBlob ?? blob.enableBlob)
      }
    } catch (error) {
      console.warn(`Failed to load blob config from localStorage: ${storageKey}`, error)
    }
  }, [blob, storageKey])

  return { saveToStorage, loadFromStorage }
}
