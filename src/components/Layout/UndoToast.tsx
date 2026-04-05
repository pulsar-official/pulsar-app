'use client'

import React, { useEffect } from 'react'
import { useProductivityStore } from '@/stores/productivityStore'
import styles from './UndoToast.module.scss'

export const UndoToast: React.FC = () => {
  const undoToast = useProductivityStore(s => s.undoToast)
  const clearUndoToast = useProductivityStore(s => s.clearUndoToast)

  useEffect(() => {
    if (!undoToast) return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        undoToast.onUndo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undoToast])

  if (!undoToast) return null

  return (
    <div className={styles.toast}>
      <span className={styles.label}>{undoToast.label}</span>
      <button className={styles.undoBtn} onClick={undoToast.onUndo}>Undo</button>
      <button className={styles.closeBtn} onClick={clearUndoToast} aria-label="Dismiss">×</button>
    </div>
  )
}
