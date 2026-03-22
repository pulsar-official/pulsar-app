"use client"

import React, { useState, useMemo, useEffect } from "react"
import styles from "./JournalEditor.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import type { JournalEntry } from '@/types/productivity'
import { MOODS, MOOD_COLORS, TAGS } from '@/constants/journal'
import RelatedItems from '../shared/RelatedItems'

function fmtDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })
}

const today = new Date().toISOString().split("T")[0]

const JournalEditor: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const entries = useProductivityStore(s => s.journalEntries)
  const storeAddEntry = useProductivityStore(s => s.addJournalEntry)
  const storeUpdateEntry = useProductivityStore(s => s.updateJournalEntry)
  const storeDeleteEntry = useProductivityStore(s => s.deleteJournalEntry)
  const selectedEntryId = useProductivityStore(s => s.selectedJournalEntryId)
  const setSelectedEntryId = useProductivityStore(s => s.setSelectedJournalEntryId)

  const [selectedId, setSelectedId] = useState<number | null>(selectedEntryId ?? entries[0]?.id ?? null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<'date' | 'title'>('date')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')

  // Handle cross-component navigation
  useEffect(() => {
    if (selectedEntryId !== null) {
      setSelectedId(selectedEntryId)
      setSelectedEntryId(null)
    }
  }, [selectedEntryId, setSelectedEntryId])

  const filteredEntries = useMemo(() => {
    let filtered = entries
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.tags.some(t => t.includes(q))
      )
    }
    if (sortOrder === 'title') {
      return [...filtered].sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'))
    }
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date))
  }, [entries, searchQuery, sortOrder])

  const selected = useMemo(() => entries.find(e => e.id === selectedId) ?? null, [entries, selectedId])

  const addEntry = () => {
    const entry: Omit<JournalEntry, 'id' | 'orgId' | 'userId'> = { title: "", content: "", date: today, mood: "😊", tags: [] }
    storeAddEntry(entry)
    setTimeout(() => {
      const latest = useProductivityStore.getState().journalEntries[0]
      if (latest) setSelectedId(latest.id)
    }, 0)
  }

  const updateEntry = (field: keyof JournalEntry, value: string | string[]) => {
    if (!selected) return
    setSaveStatus('saving')
    storeUpdateEntry({ ...selected, [field]: value })
    setTimeout(() => setSaveStatus('saved'), 300)
  }

  const toggleTag = (tag: string) => {
    if (!selected) return
    const tags = selected.tags.includes(tag) ? selected.tags.filter(t => t !== tag) : [...selected.tags, tag]
    updateEntry("tags", tags)
  }

  const deleteEntry = () => {
    if (selectedId == null) return
    storeDeleteEntry(selectedId)
    setSelectedId(entries.find(e => e.id !== selectedId)?.id ?? null)
  }

  const wordCount = selected ? selected.content.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = selected ? selected.content.length : 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.pageTitle}>Journal</div>
        </div>
        <div className={styles.headerRight}>
          {onNavigate && (
            <>
              <button className={styles.navLink} onClick={() => onNavigate('journalentries')}>Past Entries</button>
              <button className={styles.navLink} onClick={() => onNavigate('journaltemplates')}>Templates</button>
            </>
          )}
          <button className={styles.addBtn} onClick={addEntry}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New entry
          </button>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarControls}>
            <input
              className={styles.searchInput}
              placeholder="Search entries..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button
              className={styles.sortBtn}
              onClick={() => setSortOrder(s => s === 'date' ? 'title' : 'date')}
              title={`Sort by ${sortOrder === 'date' ? 'title' : 'date'}`}
            >
              {sortOrder === 'date' ? '↕ Date' : '↕ Title'}
            </button>
          </div>
          <div className={styles.sidebarTitle}>Entries ({filteredEntries.length})</div>
          {filteredEntries.map(e => {
            const wc = e.content.trim().split(/\s+/).filter(Boolean).length
            return (
              <div key={e.id} className={[styles.entryItem, selectedId === e.id ? styles.active : ""].filter(Boolean).join(" ")} onClick={() => setSelectedId(e.id)}>
                <div className={styles.entryDot} style={{ background: MOOD_COLORS[e.mood] || "oklch(0.5 0 0)" }} />
                <div className={styles.entryItemInfo}>
                  <div className={styles.entryItemTitle}>{e.title || "Untitled"}</div>
                  <div className={styles.entryItemMeta}>
                    <span>{fmtDate(e.date)}</span>
                    <span>{wc}w</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {selected ? (
          <div className={styles.editor}>
            <div className={styles.editorHeader}>
              <input className={styles.editorTitle} value={selected.title} placeholder="Entry title..." onChange={e => updateEntry("title", e.target.value)} />
              <div className={styles.editorMeta}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={selected.date}
                  onChange={e => updateEntry("date", e.target.value)}
                />
                <div className={styles.moodRow}>
                  {MOODS.map(m => (
                    <button key={m} className={[styles.moodBtn, selected.mood === m ? styles.active : ""].filter(Boolean).join(" ")} onClick={() => updateEntry("mood", m)}>{m}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.editorBody}>
              <textarea className={styles.editorTextarea} value={selected.content} placeholder="Write your thoughts..." onChange={e => updateEntry("content", e.target.value)} />
            </div>
            <div className={styles.editorFooter}>
              <div className={styles.tagRow}>
                {TAGS.map(t => (
                  <button key={t} className={[styles.tag, selected.tags.includes(t) ? styles.tagActive : ""].filter(Boolean).join(" ")} onClick={() => toggleTag(t)}>
                    #{t}
                  </button>
                ))}
              </div>
              <div className={styles.footerRight}>
                <span className={styles.saveIndicator}>{saveStatus === 'saving' ? 'Saving...' : 'Saved'}</span>
                <span className={styles.wordCount}>{wordCount}w · {charCount}c · {readTime} min read</span>
                <button className={styles.deleteEntryBtn} onClick={deleteEntry}>Delete</button>
              </div>
            </div>
            <RelatedItems itemType="journal" itemId={selected.id} onNavigate={onNavigate} />
          </div>
        ) : (
          <div className={styles.empty}>Select or create an entry to get started</div>
        )}
      </div>
    </div>
  )
}

export default JournalEditor
