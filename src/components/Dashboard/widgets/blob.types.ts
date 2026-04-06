/**
 * Type definitions for the Blob Mode System
 * Provides TypeScript support for blob generation and animation
 */

/**
 * Configuration for blob generation
 */
export interface BlobGenerationConfig {
  /** Bounding box width in pixels */
  width: number

  /** Bounding box height in pixels */
  height: number

  /** Number of control points for blob shape (6-12) */
  complexity?: number

  /** Seed for deterministic generation */
  seed?: number
}

/**
 * Configuration for blob morphing animation
 */
export interface BlobMorphConfig {
  /** Starting SVG path string */
  startPath: string

  /** Ending SVG path string */
  endPath: string

  /** Animation progress (0-1) */
  progress: number
}

/**
 * Blob animation state
 */
export interface BlobAnimationState {
  /** Current blob path */
  currentPath: string

  /** Next target blob path */
  nextPath: string

  /** Current animation progress (0-1) */
  progress: number

  /** Is animation currently running */
  isAnimating: boolean

  /** Next morph scheduled time */
  nextMorphTime: number
}

/**
 * Blob wrapper component configuration
 */
export interface BlobWrapperConfig {
  /** Enable/disable blob effect */
  enableBlob: boolean

  /** OKLCH color string for blob */
  blobColor: string

  /** Morph animation duration in milliseconds */
  morphSpeed: number

  /** Blob shape complexity (6-12 control points) */
  complexity: number

  /** Blob opacity intensity level */
  intensity: BlobIntensity

  /** Additional CSS classes */
  className?: string
}

/**
 * Blob intensity levels
 */
export type BlobIntensity = 'low' | 'med' | 'high'

/**
 * Color preset definitions
 */
export interface BlobColorPreset {
  name: string
  value: string
  description: string
  use: string
}

/**
 * Predefined blob color system
 */
export const BLOB_COLOR_PRESETS: Record<string, BlobColorPreset> = {
  purple: {
    name: 'Purple',
    value: 'oklch(0.55 0.18 290)',
    description: 'Primary action color',
    use: 'Goals, Habits, Tasks',
  },
  amber: {
    name: 'Amber',
    value: 'oklch(0.62 0.16 80)',
    description: 'Warm, reflective color',
    use: 'Journal, Notes',
  },
  green: {
    name: 'Green',
    value: 'oklch(0.65 0.14 150)',
    description: 'Success and completion',
    use: 'Done states, Success indicators',
  },
  red: {
    name: 'Red',
    value: 'oklch(0.65 0.15 20)',
    description: 'Danger and deletion',
    use: 'Delete buttons, Warnings',
  },
  blue: {
    name: 'Blue',
    value: 'oklch(0.6 0.15 260)',
    description: 'Secondary accent',
    use: 'General accents, Information',
  },
}

/**
 * Intensity opacity values
 */
export const BLOB_INTENSITY_MAP: Record<BlobIntensity, number> = {
  low: 0.4,
  med: 0.65,
  high: 1.0,
}

/**
 * Default animation timings
 */
export const BLOB_ANIMATION_DEFAULTS = {
  /** Default morph duration */
  morphSpeed: 3000,

  /** Delay before first morph */
  initialDelay: 500,

  /** Delay between morphs */
  morphInterval: 1000,

  /** Default complexity */
  complexity: 8,

  /** Min complexity for organic look */
  minComplexity: 6,

  /** Max complexity for performance */
  maxComplexity: 12,

  /** Easing function */
  easing: 'easeInOutQuad' as const,
}

/**
 * Performance configuration
 */
export const BLOB_PERFORMANCE = {
  /** Use ResizeObserver for responsive blobs */
  useResizeObserver: true,

  /** Enable GPU acceleration via filters */
  useGPUAcceleration: true,

  /** Blur filter for smoother appearance */
  blurAmount: '1px',

  /** Will-change hint for performance */
  willChange: 'd' as const,
}
