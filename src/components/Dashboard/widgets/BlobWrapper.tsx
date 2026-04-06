'use client'

import React, { useEffect, useRef, useState, ReactNode } from 'react'
import anime from 'animejs'
import { generateBlobPath, morphBlobPath } from './blobGenerator'
import styles from './BlobWrapper.module.scss'

interface BlobWrapperProps {
  /** Content to wrap with blob styling */
  children: ReactNode

  /** Enable/disable blob styling */
  enableBlob?: boolean

  /** OKLCH color string for the blob (e.g., 'oklch(0.55 0.18 290)') */
  blobColor?: string

  /** Animation morph speed in milliseconds (default: 3000) */
  morphSpeed?: number

  /** CSS class name for additional styling */
  className?: string

  /** Blob complexity/number of control points (6-12, default: 8) */
  complexity?: number

  /** Blob intensity: 'low' | 'med' | 'high' (default: 'med') */
  intensity?: 'low' | 'med' | 'high'
}

/**
 * BlobWrapper - Applies organic blob styling to any widget
 * Animates blob morphing on a configurable interval
 */
export function BlobWrapper({
  children,
  enableBlob = false,
  blobColor = 'oklch(0.55 0.18 290)',
  morphSpeed = 3000,
  className = '',
  complexity = 8,
  intensity = 'med',
}: BlobWrapperProps) {
  const svgRef = useRef<SVGPathElement>(null)
  const animationRef = useRef<anime.AnimeInstance | null>(null)
  const currentPathRef = useRef<string>('')
  const morphTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const wrapperRef = useRef<HTMLDivElement>(null)

  // Initialize blob and set up morphing animation
  useEffect(() => {
    if (!enableBlob || !wrapperRef.current) return

    const width = wrapperRef.current.offsetWidth
    const height = wrapperRef.current.offsetHeight

    if (width <= 0 || height <= 0) return

    // Generate initial blob path
    currentPathRef.current = generateBlobPath(width, height, complexity)
    if (svgRef.current) {
      svgRef.current.setAttribute('d', currentPathRef.current)
    }

    // Function to morph to a new blob shape
    const morphBlob = () => {
      const nextPath = generateBlobPath(width, height, complexity)
      const startPath = currentPathRef.current

      // Cancel previous animation if still running
      if (animationRef.current) {
        animationRef.current.pause()
      }

      // Animate the morph
      animationRef.current = anime({
        targets: { progress: 0 },
        progress: 1,
        duration: morphSpeed,
        easing: 'easeInOutQuad',
        update: (anim: anime.AnimeInstance) => {
          if (svgRef.current && anim.progress !== undefined) {
            const morphedPath = morphBlobPath(
              startPath,
              nextPath,
              anim.progress as number
            )
            svgRef.current.setAttribute('d', morphedPath)
          }
        },
        complete: () => {
          currentPathRef.current = nextPath
        },
      })

      // Schedule next morph
      morphTimeoutRef.current = setTimeout(morphBlob, morphSpeed + 1000)
    }

    // Start morphing animation
    morphTimeoutRef.current = setTimeout(morphBlob, morphSpeed + 500)

    return () => {
      if (morphTimeoutRef.current) {
        clearTimeout(morphTimeoutRef.current)
      }
      if (animationRef.current) {
        animationRef.current.pause()
      }
    }
  }, [enableBlob, morphSpeed, complexity])

  // Handle window resize
  useEffect(() => {
    if (!enableBlob) return

    const handleResize = () => {
      if (wrapperRef.current) {
        const width = wrapperRef.current.offsetWidth
        const height = wrapperRef.current.offsetHeight

        if (width > 0 && height > 0) {
          // Regenerate blob with new dimensions
          const newPath = generateBlobPath(width, height, complexity)
          currentPathRef.current = newPath
          if (svgRef.current) {
            svgRef.current.setAttribute('d', newPath)
          }
        }
      }
    }

    const resizeObserver = new ResizeObserver(handleResize)
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [enableBlob, complexity])

  const intensityClass = `blobIntensity${intensity.charAt(0).toUpperCase() + intensity.slice(1)}`

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${enableBlob ? styles.blobEnabled : ''} ${className}`}
    >
      {enableBlob && (
        <div className={styles.blobContainer}>
          <svg
            className={`${styles.blobSvg} ${styles[intensityClass]}`}
            viewBox="0 0 400 400"
            preserveAspectRatio="xMidYMid slice"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="blobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={blobColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor={blobColor} stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Blob path with gradient fill */}
            <path
              ref={svgRef}
              fill="url(#blobGradient)"
              d=""
              style={{ filter: 'blur(1px)' }}
            />
          </svg>
        </div>
      )}

      {/* Content wrapper */}
      <div className={styles.contentWrapper}>{children}</div>
    </div>
  )
}

export default BlobWrapper
