"use client"

import React, { useState, useMemo } from "react"
import styles from "./Journal.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import type { JournalEntry } from '@/types/productivity'

const MOODS = ["😊","😐","😔","😡","🤩","😴"]
const TAGS = ["gratitude","reflection","goals","ideas","personal","work"]
const MOOD_COLORS: Record<string,string> = {
  "😊":"oklch(0.65 0.18 150)","😐":"oklch(0.65 0.10 60)","😔":"oklch(0.55 0.15 260)",
  "😡":"oklch(0.55 0.18 20)","🤩":"oklch(0.70 0.18 60)","😴":"oklch(0.55 0.10 290)"
}

function fmtDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })
}

const today = new Date().toISOString().split("T")[0]
const Journal: React.FC = () => {
  const entries = useProductivityStore(s => s.journalEntries)
  const storeAddEntry = useProductivityStore(s => s.addJournalEntry)
  const storeUpdateEntry = useProductivityStore(s => s.updateJournalEntry)
  const storeDeleteEntry = useProductivityStore(s => s.deleteJournalEntry)

  const [selectedId, setSelectedId] = useState<number|null>(entries[0]?.id ?? null)

  const selected = useMemo(() => entries.find(e => e.id === selectedId) ?? null, [entries, selectedId])

  const addEntry = () => {
    const entry: Omit<JournalEntry, 'id' | 'orgId' | 'userId'> = { title:"", content:"", date:today, mood:"😊", tags:[] }
    storeAddEntry(entry)
    // Select the newly added entry (it will be at the front)
    setTimeout(() => {
      const latest = useProductivityStore.getState().journalEntries[0]
      if (latest) setSelectedId(latest.id)
    }, 0)
  }

  const updateEntry = (field: keyof JournalEntry, value: string | string[]) => {
    if (!selected) return
    storeUpdateEntry({ ...selected, [field]: value })
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
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.pageTitle}>Journal</div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addBtn} onClick={addEntry}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New entry
          </button>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Entries</div>
          {entries.map(e => (
            <div key={e.id} className={[styles.entryItem, selectedId===e.id?styles.active:""].filter(Boolean).join(" ")} onClick={() => setSelectedId(e.id)}>
              <div className={styles.entryDot} style={{background: MOOD_COLORS[e.mood] || "oklch(0.5 0 0)"}} />
              <div className={styles.entryItemInfo}>
                <div className={styles.entryItemTitle}>{e.title || "Untitled"}</div>
                <div className={styles.entryItemDate}>{fmtDate(e.date)}</div>
              </div>
            </div>
          ))}
        </div>        {selected ? (
          <div className={styles.editor}>
            <div className={styles.editorHeader}>
              <input className={styles.editorTitle} value={selected.title} placeholder="Entry title..." onChange={e => updateEntry("title", e.target.value)} />
              <div className={styles.editorMeta}>
                <div className={styles.moodRow}>
                  {MOODS.map(m => (
                    <button key={m} className={[styles.moodBtn, selected.mood===m?styles.active:""].filter(Boolean).join(" ")} onClick={() => updateEntry("mood", m)}>{m}</button>
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
                  <button key={t} className={[styles.tag, selected.tags.includes(t)?styles.tagActive:""].filter(Boolean).join(" ")} onClick={() => toggleTag(t)}>
                    #{t}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                <span className={styles.wordCount}>{wordCount} words</span>
                <button className={styles.deleteEntryBtn} onClick={deleteEntry}>Delete</button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.empty}>Select or create an entry to get started</div>
        )}
      </div>
    </div>
  )
}

export default Journal