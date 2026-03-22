'use client'
import React from 'react'
import styles from './DeleteConfirmModal.module.scss'

interface DeleteConfirmModalProps {
  isOpen: boolean
  title: string
  description: string
  itemName: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  title,
  description,
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmIcon}>🗑️</div>
        <h3 className={styles.confirmTitle}>{title}</h3>
        <p className={styles.confirmDesc}>{description}</p>
        <div className={styles.confirmActions}>
          <button
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={styles.deleteBtn}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
