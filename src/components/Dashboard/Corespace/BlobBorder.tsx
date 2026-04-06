'use client'

import React, { useMemo } from 'react'

interface BlobBorderProps {
  mode: 'simple' | 'auto' | 'manual'
  width: number
  height: number
  color?: string
  opacity?: number
  seed?: number
  children?: React.ReactNode
}

function seededRandom(seed: number, i: number): number {
  const x = Math.sin(seed + i) * 10000
  return x - Math.floor(x)
}

function catmullRomToBezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): { cp1: { x: number; y: number }; cp2: { x: number; y: number } } {
  const tension = 0.5
  return {
    cp1: {
      x: p1.x + (p2.x - p0.x) * tension / 3,
      y: p1.y + (p2.y - p0.y) * tension / 3,
    },
    cp2: {
      x: p2.x - (p3.x - p1.x) * tension / 3,
      y: p2.y - (p3.y - p1.y) * tension / 3,
    },
  }
}

function generateBlobPath(
  w: number,
  h: number,
  points: number,
  seed: number,
  minR: number,
  maxR: number
): string {
  const cx = w / 2
  const cy = h / 2
  const rx = w * 0.45
  const ry = h * 0.45
  const angleStep = (Math.PI * 2) / points

  const pts = Array.from({ length: points }, (_, i) => {
    const angle = i * angleStep - Math.PI / 2
    const r = minR + seededRandom(seed, i) * (maxR - minR)
    return {
      x: cx + Math.cos(angle) * rx * r,
      y: cy + Math.sin(angle) * ry * r,
    }
  })

  // Build smooth cubic bezier path using catmull-rom conversion
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`

  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[(i - 1 + pts.length) % pts.length]
    const p1 = pts[i]
    const p2 = pts[(i + 1) % pts.length]
    const p3 = pts[(i + 2) % pts.length]
    const { cp1, cp2 } = catmullRomToBezier(p0, p1, p2, p3)
    d += ` C ${cp1.x.toFixed(2)} ${cp1.y.toFixed(2)}, ${cp2.x.toFixed(2)} ${cp2.y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }

  d += ' Z'
  return d
}

export default function BlobBorder({
  mode,
  width,
  height,
  color = 'oklch(0.6 0.12 290)',
  opacity = 0.3,
  seed = 42,
  children,
}: BlobBorderProps) {
  const blobPath = useMemo(() => {
    if (mode === 'auto') {
      return generateBlobPath(width, height, 8, seed, 0.75, 1.0)
    }
    if (mode === 'manual') {
      return generateBlobPath(width, height, 12, seed, 0.60, 1.0)
    }
    return null
  }, [mode, width, height, seed])

  const animationStyle: React.CSSProperties = {
    animation: mode !== 'simple' ? 'blobFloat 8s ease-in-out infinite' : undefined,
    transformOrigin: 'center',
  }

  return (
    <div style={{ position: 'relative', width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          overflow: 'visible',
          ...animationStyle,
        }}
        aria-hidden="true"
      >
        {mode === 'simple' && (
          <rect
            x={1}
            y={1}
            width={width - 2}
            height={height - 2}
            rx={12}
            ry={12}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            opacity={opacity}
          />
        )}
        {(mode === 'auto' || mode === 'manual') && blobPath && (
          <path
            d={blobPath}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            opacity={opacity}
            strokeLinejoin="round"
          />
        )}
      </svg>
      {children}
    </div>
  )
}
