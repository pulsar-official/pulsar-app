"use client"

import React, { useState, useMemo } from "react"
import styles from "./JournalEntries.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import { MOODS, MOOD_COLORS, MOOD_LABELS, TAGS } from '@/constants/journal'

function fmtDate(d: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(d)
  target.setHours(0, 0, 0, 0)
  const diff = Math.round((today.getTime() - target.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return target.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })
}

function fmtFullDate(d: string): string {
  return new Date(d).toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
}

const JournalEntries: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const entries = useProductivityStore(s => s.journalEntries)
  const storeDeleteEntry = useProductivityStore(s => s.deleteJournalEntry)
  const setSelectedEntryId = useProductivityStore(s => s.setSelectedJournalEntryId)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [moodFilter, setMoodFilter] = useState<string | null>(null)
  const [tagFilter, setTagFilter] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filtered = useMemo(() => {
    let list = [...entries]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.content.toLowerCase().includes(q) ||
        e.tags.some(t => t.includes(q))
      )
    }
    if (moodFilter) list = list.filter(e => e.mood === moodFilter)
    if (tagFilter) list = list.filter(e => e.tags.includes(tagFilter))
    if (dateFrom) list = list.filter(e => e.date >= dateFrom)
    if (dateTo) list = list.filter(e => e.date <= dateTo)
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [entries, searchQuery, moodFilter, tagFilter, dateFrom, dateTo])

  // Group by date
  const grouped = useMemo(() => {
    const map: { date: string; label: string; entries: typeof entries }[] = []
    let currentDate = ''
    for (const e of filtered) {
      if (e.date !== currentDate) {
        currentDate = e.date
        map.push({ date: e.date, label: fmtDate(e.date), entries: [e] })
      } else {
        map[map.length - 1].entries.push(e)
      }
    }
    return map
  }, [filtered])

  const selected = useMemo(() => entries.find(e => e.id === selectedId) ?? null, [entries, selectedId])

  const openInEditor = () => {
    if (!selected) return
    setSelectedEntryId(selected.id)
    onNavigate?.('journal')
  }

  const deleteEntry = () => {
    if (!selected) return
    storeDeleteEntry(selected.id)
    setSelectedId(null)
  }

  // Stats for visible entries
  const visibleStats = useMemo(() => {
    const moodCounts: Record<string, number> = {}
    for (const e of filtered) moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1
    const max = Math.max(...Object.values(moodCounts), 1)
    return { total: filtered.length, moodCounts, max }
  }, [filtered])

  const wordCount = selected ? selected.content.trim().split(/\s+/).filter(Boolean).length : 0
  const hasActiveFilters = !!searchQuery || !!moodFilter || !!tagFilter || !!dateFrom || !!dateTo

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.pageTitle}>Past Entries</div>
        <div className={styles.headerRight}>
          {onNavigate && (
            <button className={styles.backBtn} onClick={() => onNavigate('journal')}>Back to Journal</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input className={styles.searchInput} placeholder="Search entries..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <div className={styles.moodFilters}>
          {MOODS.map(m => (
            <button
              key={m}
              className={[styles.moodPill, moodFilter === m ? styles.moodPillActive : ''].filter(Boolean).join(' ')}
              onClick={() => setMoodFilter(moodFilter === m ? null : m)}
              title={MOOD_LABELS[m]}
            >
              {m}
            </button>
          ))}
        </div>
        <div className={styles.tagFilters}>
          {TAGS.map(t => (
            <button
              key={t}
              className={[styles.tagPill, tagFilter === t ? styles.tagPillActive : ''].filter(Boolean).join(' ')}
              onClick={() => setTagFilter(tagFilter === t ? null : t)}
            >
              #{t}
            </button>
          ))}
        </div>
        <div className={styles.dateFilters}>
          <input type="date" className={styles.dateInput} value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="From" />
          <span className={styles.dateSep}>to</span>
          <input type="date" className={styles.dateInput} value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="To" />
        </div>
        {hasActiveFilters && (
          <button className={styles.clearBtn} onClick={() => { setSearchQuery(""); setMoodFilter(null); setTagFilter(null); setDateFrom(""); setDateTo("") }}>
            Clear filters
          </button>
        )}
      </div>

      <div className={styles.body}>
        {/* Entry list */}
        <div className={styles.listPanel}>
          {grouped.length === 0 && <div className={styles.empty}>No entries match your filters</div>}
          {grouped.map(group => (
            <div key={group.date} className={styles.dateGroup}>
              <div className={styles.dateHeader}>{group.label}</div>
              {group.entries.map(e => {
                const wc = e.content.trim().split(/\s+/).filter(Boolean).length
                const isSelected = selectedId === e.id
                return (
                  <div key={e.id} className={[styles.entryRow, isSelected ? styles.entryRowActive : ''].filter(Boolean).join(' ')} onClick={() => setSelectedId(e.id)}>
                    <span className={styles.entryMoodDot} style={{ background: MOOD_COLORS[e.mood] || 'oklch(0.5 0 0)' }} />
                    <div className={styles.entryRowInfo}>
                      <div className={styles.entryRowTitle}>{e.title || 'Untitled'}</div>
                      <div className={styles.entryRowPreview}>{e.content.slice(0, 60)}{e.content.length > 60 ? '...' : ''}</div>
                    </div>
                    <div className={styles.entryRowRight}>
                      <span className={styles.entryRowMood}>{e.mood}</span>
                      <span className={styles.entryRowWc}>{wc}w</span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Preview panel */}
        <div className={styles.previewPanel}>
          {selected ? (
            <>
              <div className={styles.previewHeader}>
                <div className={styles.previewTitleRow}>
                  <span className={styles.previewMood}>{selected.mood}</span>
                  <h2 className={styles.previewTitle}>{selected.title || 'Untitled'}</h2>
                </div>
                <div className={styles.previewDate}>{fmtFullDate(selected.date)}</div>
              </div>
              <div className={styles.previewBody}>
                <div className={styles.previewContent}>{selected.content || 'No content'}</div>
              </div>
              {selected.tags.length > 0 && (
                <div className={styles.previewTags}>
                  {selected.tags.map(t => <span key={t} className={styles.previewTag}>#{t}</span>)}
                </div>
              )}
              <div className={styles.previewFooter}>
                <span className={styles.previewWc}>{wordCount} words</span>
                <div className={styles.previewActions}>
                  <button className={styles.openBtn} onClick={openInEditor}>Open in editor</button>
                  <button className={styles.delBtn} onClick={deleteEntry}>Delete</button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.empty}>Select an entry to preview</div>
          )}
        </div>
      </div>

      {/* Stats footer */}
      <div className={styles.footer}>
        <span className={styles.footerCount}>{visibleStats.total} entries</span>
        <div className={styles.footerMoodBars}>
          {MOODS.map(m => {
            const cnt = visibleStats.moodCounts[m] || 0
            if (cnt === 0) return null
            return (
              <div key={m} className={styles.footerMoodBar} title={`${MOOD_LABELS[m]}: ${cnt}`}>
                <div className={styles.footerMoodFill} style={{ height: `${(cnt / visibleStats.max) * 100}%`, background: MOOD_COLORS[m] }} />
                <span className={styles.footerMoodEmoji}>{m}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default JournalEntries
