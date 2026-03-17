'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import styles from './Carousel.module.scss'
import { Dropdown } from './Dropdown'
import { useUIStore } from '@/stores/uiStore'

const PILLARS = [
  { id: 'extensions', label: 'Extensions', color: 20 },
  { id: 'collaboration', label: 'Collaboration', color: 330 },
  { id: 'customization', label: 'Customization', color: 290 },
  { id: 'insights', label: 'Insights', color: 200 },
  { id: 'productivity', label: 'Productivity', color: 60 },
  { id: 'knowledge', label: 'Knowledge', color: 150 },
  { id: 'corespace', label: 'Corespace', color: 260 },
]

interface CarouselProps {
  currentIndex?: number
  onOpenDropdown: () => void
  onCloseDropdown?: () => void
  onRotate?: (index: number) => void
  collapsed?: boolean
}

export const Carousel: React.FC<CarouselProps> = ({
  currentIndex = 6,
  onOpenDropdown,
  onCloseDropdown,
  onRotate,
  collapsed = false,
}) => {
  const { setCurrentPage } = useUIStore()
  const switcherRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])
  const busyRef = useRef(false)
  const currentRef = useRef(currentIndex)
  const [current, setCurrent] = useState(currentIndex)
  const [isOpen, setIsOpen] = useState(false)
  const [clickedIcon, setClickedIcon] = useState<number | null>(null)
  const [animatingClasses, setAnimatingClasses] = useState<{ [key: number]: string }>({})

  const DUR = 180

  // Rotate carousel
  const rotate = useCallback((dir: number) => {
    if (busyRef.current) return
    busyRef.current = true

    const fromIdx = currentRef.current
    const nextIndex = (currentRef.current + dir + PILLARS.length) % PILLARS.length

    console.log('🔄 Starting rotation:', PILLARS[fromIdx].label, '→', PILLARS[nextIndex].label)

    // Phase 1: Animate current item out
    const outClass = dir === -1 ? styles.slideUpOut : styles.slideDownOut
    setAnimatingClasses({ [fromIdx]: outClass })

    // Use requestAnimationFrame to sync pillar update with carousel animation start
    requestAnimationFrame(() => {
      currentRef.current = nextIndex
      setCurrent(nextIndex)
    })

    // After phase 1, switch to next item and animate in
    const phaseOneTimer = setTimeout(() => {
      console.log('✅ Phase 1 done, starting phase 2')

      // Clear previous animation and apply new one
      const inClass = dir === 1 ? styles.slideDownIn : styles.slideUpIn
      setAnimatingClasses({ [fromIdx]: '', [nextIndex]: inClass })

      // After phase 2
      const phaseTwoTimer = setTimeout(() => {
        console.log('✅ Animation complete')
        setAnimatingClasses({})
        busyRef.current = false
        onRotate?.(nextIndex)
      }, DUR)

      return () => clearTimeout(phaseTwoTimer)
    }, DUR)

    return () => clearTimeout(phaseOneTimer)
  }, [onRotate])

  // Handle wheel scroll
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      rotate(e.deltaY > 0 ? -1 : 1)
    }

    carousel.addEventListener('wheel', handleWheel, { passive: false })
    return () => carousel.removeEventListener('wheel', handleWheel)
  }, [rotate])

  // Handle prev/next buttons
  const handlePrevious = useCallback(() => {
    rotate(1)
  }, [rotate])

  const handleNext = useCallback(() => {
    rotate(-1)
  }, [rotate])

  // Handle carousel click
  const handleCarouselClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement
      const iconEl = target.closest(`.${styles.icon}`)
      const controlsEl = target.closest(`.${styles.carouselControls}`)

      if (controlsEl) return

      if (iconEl) {
        setClickedIcon(currentRef.current)
        setCurrentPage(PILLARS[currentRef.current].id + "-home")
      } else {
        if (isOpen) {
          setIsOpen(false)
          setClickedIcon(null)
          onCloseDropdown?.()
        } else {
          setIsOpen(true)
          onOpenDropdown()
        }
      }
    },
    [isOpen, onOpenDropdown, onCloseDropdown]
  )

  // Derive collapsed-aware values to avoid setState in effects
  const effectiveIsOpen = isOpen && !collapsed
  const effectiveClickedIcon = collapsed ? null : clickedIcon

  const switcherClasses = [
    styles.switcher,
    effectiveIsOpen ? styles.isOpen : ''
  ].filter(Boolean).join(' ')

  return (
    <div ref={switcherRef} className={switcherClasses}>
      <div
        ref={carouselRef}
        className={styles.carousel}
        onClick={handleCarouselClick}
      >
        {PILLARS.map((pillar, idx) => {
          const isCurrent = idx === current
          const animClass = animatingClasses[idx] || ''
          const isAnimating = Object.keys(animatingClasses).length > 0
          const itemClasses = [
            styles.carouselItem,
            (isCurrent && !isAnimating) ? styles.isCurrent : '',
            animClass
          ].filter(Boolean).join(' ')

          // Only render if current or animating
          if (!isCurrent && !animClass) return null

          return (
            <div
              key={pillar.id}
              ref={(el) => {
                itemsRef.current[idx] = el
              }}
              className={itemClasses}
              data-pillar={pillar.id}
            >
              <div
                className={`${styles.icon} ${effectiveClickedIcon === idx ? styles.iconClicked : ''}`}
                data-pillar-home={pillar.id}
                style={{
                  background: `oklch(0.28 0.10 ${pillar.color})`,
                  color: `oklch(0.72 0.14 ${pillar.color})`,
                }}
              >
                {pillar.label.charAt(0)}
              </div>
              <div className={styles.carouselLabel}>
                <span className={styles.labelName}>{pillar.label}</span>
              </div>
            </div>
          )
        })}

        {!collapsed && (
          <div className={styles.carouselControls}>
            <button
              className={styles.carouselBtn}
              onClick={(e) => {
                e.stopPropagation()
                handlePrevious()
              }}
              aria-label="Previous"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <button
              className={styles.carouselBtn}
              onClick={(e) => {
                e.stopPropagation()
                handleNext()
              }}
              aria-label="Next"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <Dropdown
        isOpen={effectiveIsOpen}
        currentPillarId={PILLARS[current].id}
        onClose={() => {
          setIsOpen(false)
          setClickedIcon(null)
          onCloseDropdown?.()
        }}
        onNavigate={(page) => {
          setCurrentPage(page)
        }}
        collapsed={collapsed}
      />
    </div>
  )
}

export default Carousel