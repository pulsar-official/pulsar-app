"use client"

import React, { useState, useMemo } from "react"
import styles from "./Journal.module.scss"

interface Entry {
  id: string; title: string; content: string; date: string; mood: string; tags: string[]
}

function makeId() { return Math.random().toString(36).slice(2) }

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

const SAMPLE: Entry[] = [
  { id:makeId(), title:"Morning reflections", content:"Today I woke up feeling refreshed and motivated. The sunrise was beautiful and I spent 10 minutes just watching it from my window. I want to focus on being more present today.", date:today, mood:"😊", tags:["gratitude","reflection"] },
  { id:makeId(), title:"Project ideas", content:"Had some great ideas during the team meeting. We should explore: 1. AI-powered search 2. Real-time collaboration 3. Custom dashboards", date:"2025-06-04", mood:"🤩", tags:["ideas","work"] },
  { id:makeId(), title:"Rough day", content:"Not the best day. Had some conflicts at work and felt drained by the end. Tomorrow will be better.", date:"2025-06-03", mood:"😔", tags:["reflection","personal"] },
]
const Journal: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>(SAMPLE)
  const [selectedId, setSelectedId] = useState<string|null>(SAMPLE[0]?.id ?? null)

  const selected = useMemo(() => entries.find(e => e.id === selectedId) ?? null, [entries, selectedId])

  const addEntry = () => {
    const id = makeId()
    const entry: Entry = { id, title:"", content:"", date:today, mood:"😊", tags:[] }
    setEntries(es => [entry, ...es])
    setSelectedId(id)
  }

  const updateEntry = (field: keyof Entry, value: any) => {
    if (!selectedId) return
    setEntries(es => es.map(e => e.id === selectedId ? { ...e, [field]: value } : e))
  }

  const toggleTag = (tag: string) => {
    if (!selected) return
    const tags = selected.tags.includes(tag) ? selected.tags.filter(t => t !== tag) : [...selected.tags, tag]
    updateEntry("tags", tags)
  }

  const deleteEntry = () => {
    if (!selectedId) return
    setEntries(es => es.filter(e => e.id !== selectedId))
    setSelectedId(entries.find(e => e.id !== selectedId)?.id ?? null)
  }

  const wordCount = selected ? selected.content.trim().split(/s+/).filter(Boolean).length : 0
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