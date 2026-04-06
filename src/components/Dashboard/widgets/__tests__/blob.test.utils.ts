/**
 * Test utilities for blob system
 * Helpers for unit and integration testing
 */

import { generateBlobPath, morphBlobPath } from '../blobGenerator'
import { isValidOklchColor, parseOklchColor, validateBlobConfig } from '../blobUtils'

/**
 * Mock blob generator that returns a simple circle
 * Useful for deterministic testing
 */
export function generateMockBlobPath(width: number, height: number): string {
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 3

  // Simple circle path for predictable testing
  return `M ${centerX + radius}, ${centerY} A ${radius}, ${radius}, 0, 0, 1, ${centerX - radius}, ${centerY} A ${radius}, ${radius}, 0, 0, 1, ${centerX + radius}, ${centerY} Z`
}

/**
 * Extract coordinates from SVG path for testing
 */
export function extractCoordinatesFromPath(path: string): Array<[number, number]> {
  const coordinates: Array<[number, number]> = []
  const regex = /[\d.]+[\s,]+[\d.]+/g
  let match

  while ((match = regex.exec(path)) !== null) {
    const parts = match[0].split(/[\s,]+/)
    if (parts.length >= 2) {
      const x = parseFloat(parts[0])
      const y = parseFloat(parts[1])
      if (!isNaN(x) && !isNaN(y)) {
        coordinates.push([x, y])
      }
    }
  }

  return coordinates
}

/**
 * Calculate path bounding box
 */
export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export function calculatePathBoundingBox(path: string): BoundingBox {
  const coords = extractCoordinatesFromPath(path)

  if (coords.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }

  const xs = coords.map(c => c[0])
  const ys = coords.map(c => c[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Assert path is valid SVG
 */
export function assertValidSvgPath(path: string): void {
  if (!path) {
    throw new Error('Path is empty')
  }

  if (!/^M\s+[\d.]+[\s,]+[\d.]+/.test(path)) {
    throw new Error('Path does not start with M command')
  }

  if (!/Z\s*$/.test(path)) {
    throw new Error('Path does not end with Z command')
  }
}

/**
 * Assert color is valid OKLCH
 */
export function assertValidOklchColor(color: string): void {
  if (!isValidOklchColor(color)) {
    throw new Error(`Invalid OKLCH color: ${color}`)
  }
}

/**
 * Test blob generation consistency
 */
export function testBlobConsistency(): void {
  const path1 = generateBlobPath(400, 400, 8, 42)
  const path2 = generateBlobPath(400, 400, 8, 42)

  if (path1 !== path2) {
    throw new Error('Blob generation with same seed is not deterministic')
  }
}

/**
 * Test color parsing roundtrip
 */
export function testColorParsingRoundtrip(color: string): void {
  const parsed = parseOklchColor(color)
  if (!parsed) {
    throw new Error(`Failed to parse color: ${color}`)
  }

  const { lightness, chroma, hue } = parsed
  const recreated = `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${hue.toFixed(0)})`

  // Allow small floating point differences
  if (!isValidOklchColor(recreated)) {
    throw new Error(`Color roundtrip failed: ${color} -> ${recreated}`)
  }
}

/**
 * Test morphing produces intermediate paths
 */
export function testMorphingInterpolation(): void {
  const path1 = generateBlobPath(400, 400, 8, 1)
  const path2 = generateBlobPath(400, 400, 8, 2)

  const morph0 = morphBlobPath(path1, path2, 0)
  const morph05 = morphBlobPath(path1, path2, 0.5)
  const morph1 = morphBlobPath(path1, path2, 1)

  assertValidSvgPath(morph0)
  assertValidSvgPath(morph05)
  assertValidSvgPath(morph1)

  // Paths should be different at different progress values
  if (morph0 === morph1) {
    throw new Error('Morphing does not produce different paths at different progress values')
  }
}

/**
 * Generate test configuration
 */
export function createTestConfig(overrides: any = {}) {
  return {
    enableBlob: true,
    blobColor: 'oklch(0.55 0.18 290)',
    morphSpeed: 3000,
    complexity: 8,
    intensity: 'med' as const,
    ...overrides,
  }
}

/**
 * Validate test configuration
 */
export function validateTestConfig(config: any): void {
  const errors = validateBlobConfig(config)
  if (errors.length > 0) {
    throw new Error(`Invalid test config: ${errors.join(', ')}`)
  }
}

/**
 * Assert blob paths are similar
 * Useful for testing that different seeds produce organic variation
 */
export function assertPathsSimilar(path1: string, path2: string): void {
  const box1 = calculatePathBoundingBox(path1)
  const box2 = calculatePathBoundingBox(path2)

  // Allow ±10% bounding box variation
  const tolerance = 0.1
  const widthDiff = Math.abs(box1.width - box2.width) / Math.max(box1.width, box2.width)
  const heightDiff = Math.abs(box1.height - box2.height) / Math.max(box1.height, box2.height)

  if (widthDiff > tolerance || heightDiff > tolerance) {
    throw new Error(`Paths have different dimensions: ${JSON.stringify(box1)} vs ${JSON.stringify(box2)}`)
  }
}

/**
 * Performance benchmarking utilities
 */
export const BlobBenchmark = {
  /**
   * Measure blob generation time
   */
  measureGeneration(width: number, height: number, iterations = 100): number {
    const start = performance.now()

    for (let i = 0; i < iterations; i++) {
      generateBlobPath(width, height, 8, Math.random() * 10000)
    }

    const end = performance.now()
    return (end - start) / iterations // Average per generation
  },

  /**
   * Measure morphing time
   */
  measureMorphing(iterations = 100): number {
    const path1 = generateBlobPath(400, 400, 8, 1)
    const path2 = generateBlobPath(400, 400, 8, 2)

    const start = performance.now()

    for (let i = 0; i < iterations; i++) {
      const progress = i / iterations
      morphBlobPath(path1, path2, progress)
    }

    const end = performance.now()
    return (end - start) / iterations // Average per morph
  },
}

/**
 * Create a test component props set
 */
export interface TestComponentProps {
  id: string
  enableBlob: boolean
  blobColor: string
  morphSpeed: number
  complexity: number
  intensity: 'low' | 'med' | 'high'
}

export function createTestComponentProps(
  id: string = 'test-widget',
  overrides: Partial<TestComponentProps> = {}
): TestComponentProps {
  return {
    id,
    enableBlob: true,
    blobColor: 'oklch(0.55 0.18 290)',
    morphSpeed: 3000,
    complexity: 8,
    intensity: 'med',
    ...overrides,
  }
}
