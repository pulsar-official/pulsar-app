"use client"

import React, { useState, useMemo } from "react"
import styles from "./JournalPrompts.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import { PROMPTS } from '@/constants/journal'

const CATEGORIES = ['all', 'self-reflection', 'gratitude', 'goals', 'creativity', 'mindfulness', 'growth'] as const
const CATEGORY_LABELS: Record<string, string> = {
  'all': 'All',
  'self-reflection': 'Self-reflection',
  'gratitude': 'Gratitude',
  'goals': 'Goals',
  'creativity': 'Creativity',
  'mindfulness': 'Mindfulness',
  'growth': 'Growth',
}

const today = new Date().toISOString().split("T")[0]

const JournalPrompts: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const storeAddEntry = useProductivityStore(s => s.addJournalEntry)
  const setSelectedEntryId = useProductivityStore(s => s.setSelectedJournalEntryId)

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (selectedCategory === 'all') return PROMPTS
    return PROMPTS.filter(p => p.category === selectedCategory)
  }, [selectedCategory])

  const usePrompt = (text: string) => {
    storeAddEntry({
      title: text.slice(0, 40) + (text.length > 40 ? '...' : ''),
      content: text + '\n\n',
      date: today,
      mood: '😊',
      tags: [],
    })
    setTimeout(() => {
      const latest = useProductivityStore.getState().journalEntries[0]
      if (latest) {
        setSelectedEntryId(latest.id)
        onNavigate?.('journal')
      }
    }, 0)
  }

  const shufflePrompt = () => {
    const pool = filtered
    if (pool.length === 0) return
    const random = pool[Math.floor(Math.random() * pool.length)]
    setHighlightedId(random.id)
    document.getElementById(`prompt-${random.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.pageTitle}>Writing Prompts</div>
        <div className={styles.headerRight}>
          <button className={styles.shuffleBtn} onClick={shufflePrompt}>Shuffle</button>
          {onNavigate && (
            <button className={styles.backBtn} onClick={() => onNavigate('journal')}>Back to Journal</button>
          )}
        </div>
      </div>

      <div className={styles.tabs}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={[styles.tab, selectedCategory === c ? styles.active : ''].filter(Boolean).join(' ')}
            onClick={() => setSelectedCategory(c)}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className={styles.promptList}>
        {filtered.map(p => (
          <div
            key={p.id}
            id={`prompt-${p.id}`}
            className={[styles.promptCard, highlightedId === p.id ? styles.highlighted : ''].filter(Boolean).join(' ')}
          >
            <div className={styles.promptText}>{p.text}</div>
            <div className={styles.promptFooter}>
              <span className={styles.promptCategory}>{CATEGORY_LABELS[p.category] || p.category}</span>
              <button className={styles.useBtn} onClick={() => usePrompt(p.text)}>Use this prompt</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default JournalPrompts
