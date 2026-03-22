"use client"

import React, { useState } from "react"
import styles from "./JournalTemplates.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import { TEMPLATES } from '@/constants/journal'
import type { JournalTemplate } from '@/types/productivity'

const CATEGORIES = ['all', 'reflection', 'planning', 'gratitude', 'review', 'creative'] as const

const today = new Date().toISOString().split("T")[0]

const JournalTemplates: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const storeAddEntry = useProductivityStore(s => s.addJournalEntry)
  const setSelectedEntryId = useProductivityStore(s => s.setSelectedJournalEntryId)

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = selectedCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === selectedCategory)

  const useTemplate = (template: JournalTemplate) => {
    storeAddEntry({
      title: template.name,
      content: template.prompts.join('\n'),
      date: today,
      mood: '😊',
      tags: template.defaultTags,
    })
    setTimeout(() => {
      const latest = useProductivityStore.getState().journalEntries[0]
      if (latest) {
        setSelectedEntryId(latest.id)
        onNavigate?.('journal')
      }
    }, 0)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.pageTitle}>Templates</div>
        {onNavigate && (
          <button className={styles.backBtn} onClick={() => onNavigate('journal')}>Back to Journal</button>
        )}
      </div>

      <div className={styles.filters}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={[styles.filterPill, selectedCategory === c ? styles.active : ''].filter(Boolean).join(' ')}
            onClick={() => setSelectedCategory(c)}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filtered.map(t => {
          const isExpanded = expandedId === t.id
          return (
            <div
              key={t.id}
              className={[styles.card, isExpanded ? styles.cardExpanded : ''].filter(Boolean).join(' ')}
              onClick={() => setExpandedId(isExpanded ? null : t.id)}
            >
              <div className={styles.cardIcon}>{t.icon}</div>
              <div className={styles.cardName}>{t.name}</div>
              <div className={styles.cardDesc}>{t.description}</div>
              <span className={styles.categoryPill}>{t.category}</span>
              {isExpanded && (
                <div className={styles.cardPreview}>
                  <div className={styles.previewTitle}>Template structure:</div>
                  {t.prompts.filter(p => p.trim()).map((p, i) => (
                    <div key={i} className={styles.previewLine}>{p}</div>
                  ))}
                </div>
              )}
              <button
                className={styles.useBtn}
                onClick={(e) => { e.stopPropagation(); useTemplate(t) }}
              >
                Use template
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default JournalTemplates
