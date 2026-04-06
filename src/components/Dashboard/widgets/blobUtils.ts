/**
 * Utility functions for blob system
 * Helpers for color management, validation, and calculations
 */

import {
  BLOB_COLOR_PRESETS,
  BLOB_INTENSITY_MAP,
  BlobIntensity,
  BlobColorPreset,
} from './blob.types'

/**
 * Validate OKLCH color format
 * @param color - Color string to validate (e.g., 'oklch(0.55 0.18 290)')
 * @returns true if valid, false otherwise
 */
export function isValidOklchColor(color: string): boolean {
  const oklchRegex = /^oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*\)$/i
  return oklchRegex.test(color)
}

/**
 * Parse OKLCH color string into components
 * @param color - OKLCH color string
 * @returns Object with lightness, chroma, hue values or null if invalid
 */
export function parseOklchColor(color: string): {
  lightness: number
  chroma: number
  hue: number
} | null {
  const match = color.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/i)

  if (!match) {
    return null
  }

  return {
    lightness: parseFloat(match[1]),
    chroma: parseFloat(match[2]),
    hue: parseFloat(match[3]),
  }
}

/**
 * Create OKLCH color string from components
 * @param lightness - Lightness value (0-1)
 * @param chroma - Chroma value (0-0.4)
 * @param hue - Hue value (0-360)
 * @returns OKLCH color string
 */
export function createOklchColor(
  lightness: number,
  chroma: number,
  hue: number
): string {
  return `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${hue.toFixed(0)})`
}

/**
 * Get blob color preset by key
 * @param presetKey - Key from BLOB_COLOR_PRESETS
 * @returns BlobColorPreset or null if not found
 */
export function getBlobColorPreset(presetKey: string): BlobColorPreset | null {
  return BLOB_COLOR_PRESETS[presetKey] || null
}

/**
 * Get all available color presets
 * @returns Array of available presets
 */
export function getAllBlobColorPresets(): BlobColorPreset[] {
  return Object.values(BLOB_COLOR_PRESETS)
}

/**
 * Get intensity opacity value
 * @param intensity - Intensity level
 * @returns Opacity value (0-1)
 */
export function getIntensityOpacity(intensity: BlobIntensity): number {
  return BLOB_INTENSITY_MAP[intensity] ?? BLOB_INTENSITY_MAP.med
}

/**
 * Calculate appropriate blob complexity based on container size
 * Larger containers can support higher complexity for more detail
 * @param width - Container width in pixels
 * @param height - Container height in pixels
 * @returns Suggested complexity value (6-12)
 */
export function calculateComplexityFromSize(width: number, height: number): number {
  const area = width * height
  const baseComplexity = 8

  // Adjust based on area
  if (area < 50000) {
    return Math.max(6, baseComplexity - 2)
  } else if (area > 200000) {
    return Math.min(12, baseComplexity + 2)
  }

  return baseComplexity
}

/**
 * Clamp complexity to valid range
 * @param complexity - Desired complexity
 * @returns Clamped value (6-12)
 */
export function clampComplexity(complexity: number): number {
  return Math.max(6, Math.min(12, complexity))
}

/**
 * Determine if blob should use high contrast text
 * Based on color lightness
 * @param oklchColor - OKLCH color string
 * @returns true if should use dark text, false for light text
 */
export function shouldUseDarkText(oklchColor: string): boolean {
  const parsed = parseOklchColor(oklchColor)
  if (!parsed) return false

  // If lightness > 0.6, use dark text
  return parsed.lightness > 0.6
}

/**
 * Get recommended text color based on blob color
 * @param oklchColor - OKLCH color string
 * @returns Text color (light or dark)
 */
export function getRecommendedTextColor(oklchColor: string): string {
  return shouldUseDarkText(oklchColor) ? 'oklch(0.2 0 0)' : 'oklch(0.95 0 0)'
}

/**
 * Calculate morph speed based on complexity
 * More complex blobs may benefit from slower morphing
 * @param complexity - Blob complexity (6-12)
 * @param baseSpeed - Base morph speed in ms (default: 3000)
 * @returns Adjusted morph speed in ms
 */
export function calculateMorphSpeed(complexity: number, baseSpeed: number = 3000): number {
  // Higher complexity = slightly slower morph for smoother appearance
  const speedMultiplier = 1 + (complexity - 8) * 0.05
  return Math.round(baseSpeed * speedMultiplier)
}

/**
 * Validate blob wrapper configuration
 * @param config - Configuration to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateBlobConfig(config: {
  width?: number
  height?: number
  complexity?: number
  morphSpeed?: number
  blobColor?: string
  intensity?: BlobIntensity
}): string[] {
  const errors: string[] = []

  if (config.width !== undefined && config.width <= 0) {
    errors.push('Width must be greater than 0')
  }

  if (config.height !== undefined && config.height <= 0) {
    errors.push('Height must be greater than 0')
  }

  if (config.complexity !== undefined) {
    if (config.complexity < 6 || config.complexity > 12) {
      errors.push('Complexity must be between 6 and 12')
    }
  }

  if (config.morphSpeed !== undefined && config.morphSpeed < 1000) {
    errors.push('Morph speed must be at least 1000ms')
  }

  if (config.blobColor !== undefined && !isValidOklchColor(config.blobColor)) {
    errors.push('Blob color must be valid OKLCH format')
  }

  if (config.intensity !== undefined) {
    if (!['low', 'med', 'high'].includes(config.intensity)) {
      errors.push('Intensity must be "low", "med", or "high"')
    }
  }

  return errors
}
