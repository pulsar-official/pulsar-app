'use client'
import React, { useState, useEffect } from 'react'
import styles from './HabitCreateModal.module.scss'

interface HabitCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (habit: { name: string; emoji: string }) => void | Promise<void>
}

const EMOJI_OPTIONS = [
  '💪', '🧘', '📚', '🎯', '💤', '🚴', '📝', '🏃', '🍎', '🧠',
  '📱', '🌙', '⛹️', '🏊', '🤸', '🧗', '🚶', '💆', '🧘‍♀️', '🥗',
  '📖', '✍️', '🎨', '🎭', '🎪', '🎬', '📺', '🎮', '🎵', '🎸',
]

export default function HabitCreateModal({
  isOpen,
  onClose,
  onCreate,
}: HabitCreateModalProps) {
  const [name, setName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJI_OPTIONS[0])
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setSelectedEmoji(EMOJI_OPTIONS[0])
    }
  }, [isOpen])

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const isNameValid = name.trim().length > 0

  const handleCreate = async () => {
    if (!isNameValid) return

    setIsLoading(true)
    try {
      await onCreate({ name: name.trim(), emoji: selectedEmoji })
      onClose()
    } catch (error) {
      console.error('Error creating habit:', error)
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Add Habit</h2>

        <div className={styles.formGroup}>
          <label className={styles.label}>Habit Name</label>
          <input
            type="text"
            className={styles.input}
            placeholder="Habit name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
            autoFocus
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Choose Emoji</label>
          <div className={styles.emojiGrid}>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                className={`${styles.emojiButton} ${
                  selectedEmoji === emoji ? styles.selected : ''
                }`}
                onClick={() => setSelectedEmoji(emoji)}
                disabled={isLoading}
                type="button"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={styles.createBtn}
            onClick={handleCreate}
            disabled={!isNameValid || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
