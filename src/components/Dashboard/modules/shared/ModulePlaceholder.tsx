'use client'

import React from 'react'
import styles from './shared.module.scss'

interface ModulePlaceholderProps {
  title: string
  emoji: string
  hue: number
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ title, emoji, hue }) => {
  return (
    <div className={styles.placeholder}>
      <div className={styles.icon} style={{ background: `oklch(0.22 0.08 ${hue})` }}>
        {emoji}
      </div>
      <div className={styles.title}>{title}</div>
      <div className={styles.sub}>Module coming soon</div>
      <div className={styles.badge}>Skeleton</div>
    </div>
  )
}

export default ModulePlaceholder
