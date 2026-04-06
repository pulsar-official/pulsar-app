/**
 * Blob SVG path generation utilities
 * Creates organic, smooth blob shapes using Perlin noise and spline interpolation
 */

import { createNoise2D } from 'simplex-noise'
import { Spline } from '@georgedoescode/spline'

/**
 * Generate a random organic blob SVG path
 * @param width - Blob bounding box width
 * @param height - Blob bounding box height
 * @param complexity - Number of control points (6-12 for organic look)
 * @param seed - Optional seed for reproducibility
 * @returns SVG path string
 */
export function generateBlobPath(
  width: number,
  height: number,
  complexity: number = 8,
  seed?: number
): string {
  // Create noise generator (seed ensures reproducibility)
  const seedValue = seed ?? Math.random() * 10000
  const noise = createNoise2D(() => seedValue)

  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.min(width, height) / 2.5

  // Generate control points using noise
  const points: Array<[number, number]> = []
  const pointCount = Math.max(6, Math.min(12, complexity))

  for (let i = 0; i < pointCount; i++) {
    const angle = (i / pointCount) * Math.PI * 2

    // Use simplex noise for organic variation
    const noiseValue = noise(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5)
    const radiusVariation = (noiseValue + 1) / 2 // Normalize to 0-1
    const radius = maxRadius * (0.7 + radiusVariation * 0.6)

    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius

    points.push([x, y])
  }

  // Use spline to create smooth curves through points
  const spline = new Spline(points)
  const smoothPoints = spline.getPoints(Math.max(100, pointCount * 20))

  // Build SVG path from smooth points
  if (smoothPoints.length === 0) {
    return ''
  }

  let pathData = `M ${smoothPoints[0][0]}, ${smoothPoints[0][1]}`

  for (let i = 1; i < smoothPoints.length; i++) {
    pathData += ` L ${smoothPoints[i][0]}, ${smoothPoints[i][1]}`
  }

  // Close the path
  pathData += ' Z'

  return pathData
}

/**
 * Interpolate between two blob paths smoothly
 * Both paths should have same number of points for proper morphing
 * @param startPath - Starting SVG path string
 * @param endPath - Ending SVG path string
 * @param progress - Animation progress (0-1)
 * @returns Intermediate SVG path string
 */
export function morphBlobPath(
  startPath: string,
  endPath: string,
  progress: number
): string {
  // Extract coordinates from both paths
  const startPoints = extractPathPoints(startPath)
  const endPoints = extractPathPoints(endPath)

  // If point counts don't match, regenerate end path with same complexity
  if (startPoints.length !== endPoints.length) {
    return progress < 0.5 ? startPath : endPath
  }

  // Interpolate each point
  const morphedPoints: Array<[number, number]> = startPoints.map((start, i) => {
    const end = endPoints[i]
    const x = start[0] + (end[0] - start[0]) * progress
    const y = start[1] + (end[1] - start[1]) * progress
    return [x, y]
  })

  // Rebuild path from morphed points
  if (morphedPoints.length === 0) {
    return startPath
  }

  let pathData = `M ${morphedPoints[0][0]}, ${morphedPoints[0][1]}`

  for (let i = 1; i < morphedPoints.length; i++) {
    pathData += ` L ${morphedPoints[i][0]}, ${morphedPoints[i][1]}`
  }

  pathData += ' Z'

  return pathData
}

/**
 * Extract coordinate points from an SVG path string
 * Handles M (move) and L (line) commands
 * @param pathData - SVG path string
 * @returns Array of [x, y] coordinates
 */
function extractPathPoints(pathData: string): Array<[number, number]> {
  const points: Array<[number, number]> = []

  // Match all M and L commands with coordinates
  const commandRegex = /[ML]\s*([\d.]+)\s*,\s*([\d.]+)/g
  let match

  while ((match = commandRegex.exec(pathData)) !== null) {
    const x = parseFloat(match[1])
    const y = parseFloat(match[2])
    if (!isNaN(x) && !isNaN(y)) {
      points.push([x, y])
    }
  }

  return points
}
