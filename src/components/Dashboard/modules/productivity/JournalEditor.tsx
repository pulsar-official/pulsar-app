"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import styles from "./JournalEditor.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import type { JournalEntry } from '@/types/productivity'
import { MOODS, MOOD_COLORS, TAGS, PROMPTS } from '@/constants/journal'
import RelatedItems from '../shared/RelatedItems'
import DeleteConfirmModal from '../shared/DeleteConfirmModal'
import PrivacyToggle from '../shared/PrivacyToggle'

function fmtDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })
}

const today = new Date().toISOString().split("T")[0]

/** Pick N random prompts from the pool */
function pickPrompts(n: number) {
  const shuffled = [...PROMPTS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}

const JournalEditor: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const entries = useProductivityStore(s => s.journalEntries)
  const storeAddEntry = useProductivityStore(s => s.addJournalEntry)
  const storeUpdateEntry = useProductivityStore(s => s.updateJournalEntry)
  const storeDeleteEntry = useProductivityStore(s => s.deleteJournalEntry)
  const selectedEntryId = useProductivityStore(s => s.selectedJournalEntryId)
  const setSelectedEntryId = useProductivityStore(s => s.setSelectedJournalEntryId)

  const [selectedId, setSelectedId] = useState<string | null>(selectedEntryId ?? entries[0]?.id ?? null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<'date' | 'title'>('date')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [distractionFree, setDistractionFree] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [randomPrompts, setRandomPrompts] = useState(() => pickPrompts(3))

  // Handle cross-component navigation
  useEffect(() => {
    if (selectedEntryId !== null) {
      setSelectedId(selectedEntryId)
      setSelectedEntryId(null)
    }
  }, [selectedEntryId, setSelectedEntryId])

  // Sort entries with pinned at top
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
      const sorted = [...filtered].sort((a, b) => (a.title || 'Untitled').localeCompare(b.title || 'Untitled'))
      // Float pinned to top
      const pinned = sorted.filter(e => e.pinned)
      const unpinned = sorted.filter(e => !e.pinned)
      return [...pinned, ...unpinned]
    }
    const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date))
    const pinned = sorted.filter(e => e.pinned)
    const unpinned = sorted.filter(e => !e.pinned)
    return [...pinned, ...unpinned]
  }, [entries, searchQuery, sortOrder])

  const selected = useMemo(() => entries.find(e => e.id === selectedId) ?? null, [entries, selectedId])

  const addEntry = () => {
    const entry: Omit<JournalEntry, 'id' | 'orgId' | 'userId'> = { title: "", content: "", date: today, mood: "😊", tags: [], pinned: false }
    storeAddEntry(entry)
    setTimeout(() => {
      const latest = useProductivityStore.getState().journalEntries
      const newest = latest[latest.length - 1]
      if (newest) setSelectedId(newest.id)
    }, 0)
  }

  const updateEntry = (field: keyof JournalEntry, value: string | string[] | boolean) => {
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

  const togglePin = useCallback(() => {
    if (!selected) return
    storeUpdateEntry({ ...selected, pinned: !selected.pinned })
  }, [selected, storeUpdateEntry])

  const togglePublic = (v: boolean) => {
    if (!selected) return
    storeUpdateEntry({ ...selected, isPublic: v })
  }

  const deleteEntry = () => {
    if (selectedId == null) return
    setConfirmDelete(true)
  }

  const confirmDeleteEntry = () => {
    if (selectedId == null) return
    storeDeleteEntry(selectedId)
    setSelectedId(entries.find(e => e.id !== selectedId)?.id ?? null)
    setConfirmDelete(false)
  }

  const refreshPrompts = () => {
    setRandomPrompts(pickPrompts(3))
  }

  const appendPrompt = (text: string) => {
    if (!selected) return
    const separator = selected.content.trim() ? '\n\n' : ''
    const newContent = selected.content + separator + text
    storeUpdateEntry({ ...selected, content: newContent })
    setShowPrompts(false)
  }

  const wordCount = selected ? selected.content.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = selected ? selected.content.length : 0
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div className={`${styles.wrap} ${distractionFree ? styles.wrapFocus : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.pageTitle}>Journal</div>
        </div>
        <div className={styles.headerRight}>
          {onNavigate && !distractionFree && (
            <>
              <button className={styles.navLink} onClick={() => onNavigate('journalentries')}>Past Entries</button>
              <button className={styles.navLink} onClick={() => onNavigate('journaltemplates')}>Templates</button>
            </>
          )}
          {distractionFree && (
            <button className={styles.exitFocusBtn} onClick={() => setDistractionFree(false)}>
              Exit focus
            </button>
          )}
          <button className={styles.addBtn} onClick={addEntry}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New entry
          </button>
        </div>
      </div>
      <div className={styles.body}>
        {!distractionFree && (
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
                    <div className={styles.entryItemTitle}>
                      {e.pinned && <span className={styles.pinBadge}>📌</span>}
                      {e.title || "Untitled"}
                    </div>
                    <div className={styles.entryItemMeta}>
                      <span>{fmtDate(e.date)}</span>
                      <span>{wc}w</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
            {/* Toolbar: pin, focus, prompts */}
            <div className={styles.toolbar}>
              <button
                className={`${styles.toolBtn} ${selected.pinned ? styles.toolBtnActive : ''}`}
                onClick={togglePin}
                title={selected.pinned ? 'Unpin entry' : 'Pin entry'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={selected.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 17v5"/>
                  <path d="M9 11V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6"/>
                  <path d="M5 17h14"/>
                  <path d="M7 11l-2 6h14l-2-6"/>
                </svg>
                Pin
              </button>
              <button
                className={`${styles.toolBtn} ${distractionFree ? styles.toolBtnActive : ''}`}
                onClick={() => setDistractionFree(!distractionFree)}
                title="Distraction-free writing"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12l2 2 4-4"/>
                </svg>
                Focus
              </button>
              <div className={styles.promptsWrap}>
                <button
                  className={`${styles.toolBtn} ${showPrompts ? styles.toolBtnActive : ''}`}
                  onClick={() => { setShowPrompts(!showPrompts); if (!showPrompts) refreshPrompts() }}
                  title="Writing prompts"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  Prompts
                </button>
                {showPrompts && (
                  <div className={styles.promptsPopover}>
                    <div className={styles.promptsHeader}>
                      <span className={styles.promptsTitle}>Writing Prompts</span>
                      <button className={styles.promptsRefresh} onClick={refreshPrompts} title="New prompts">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                      </button>
                    </div>
                    {randomPrompts.map(p => (
                      <button key={p.id} className={styles.promptItem} onClick={() => appendPrompt(p.text)}>
                        <span className={styles.promptCat}>{p.category}</span>
                        <span className={styles.promptText}>{p.text}</span>
                      </button>
                    ))}
                  </div>
                )}
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
                <PrivacyToggle isPublic={selected.isPublic ?? false} onChange={togglePublic} />
                <button className={styles.deleteEntryBtn} onClick={deleteEntry} title="Delete entry">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  Delete
                </button>
              </div>
            </div>
            {!distractionFree && <RelatedItems itemType="journal" itemId={selected.id} onNavigate={onNavigate} />}
          </div>
        ) : (
          <div className={styles.empty}>Select or create an entry to get started</div>
        )}
      </div>
      <DeleteConfirmModal
        isOpen={confirmDelete}
        title="Delete Entry"
        description="This will permanently remove this journal entry."
        itemName={selected?.title || 'Untitled'}
        onConfirm={confirmDeleteEntry}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

export default JournalEditor
