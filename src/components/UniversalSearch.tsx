'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useUniversalSearch, SearchResult } from '@/hooks/useUniversalSearch'
import { useUIStore } from '@/stores/uiStore'
import styles from './UniversalSearch.module.scss'

const TYPE_ICONS: Record<string, string> = {
  task: '📋',
  goal: '🎯',
  habit: '🔥',
  note: '📖',
  event: '📅',
  session: '⏱',
}

const TYPE_PAGES: Record<string, string> = {
  task: 'tasks',
  goal: 'goals',
  habit: 'habits',
  note: 'journal',
  event: 'calendar',
  session: 'focus',
}

const TYPE_LABELS: Record<string, string> = {
  task: 'Tasks',
  goal: 'Goals',
  habit: 'Habits',
  note: 'Journal',
  event: 'Events',
  session: 'Sessions',
}

export default function UniversalSearch() {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const { query, setQuery, results, isSearching, clearSearch } = useUniversalSearch()
  const setCurrentPage = useUIStore((s) => s.setCurrentPage)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cmd/Ctrl+K to open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setActiveIndex(0)
    } else {
      clearSearch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Reset active index on results change
  useEffect(() => { setActiveIndex(0) }, [results])

  const close = useCallback(() => setOpen(false), [])

  const navigate = useCallback((result: SearchResult) => {
    const page = TYPE_PAGES[result.type] ?? result.type
    setCurrentPage(page)
    close()
  }, [setCurrentPage, close])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { close(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[activeIndex]) navigate(results[activeIndex])
  }

  if (!open) return null

  // Group results by type (preserving order)
  const groups: Record<string, SearchResult[]> = {}
  for (const r of results) {
    if (!groups[r.type]) groups[r.type] = []
    groups[r.type].push(r)
  }

  // Flat list for keyboard nav indexing
  const flat = results

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Universal Search">
        <div className={styles.inputWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search tasks, goals, habits, journal, events…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Search"
          />
          {query && (
            <button className={styles.clearBtn} onClick={() => { clearSearch(); inputRef.current?.focus() }} aria-label="Clear">✕</button>
          )}
          <kbd className={styles.escHint}>ESC</kbd>
        </div>

        <div className={styles.results}>
          {isSearching && <div className={styles.searching}>Searching…</div>}

          {!isSearching && query.trim() && results.length === 0 && (
            <div className={styles.empty}>No results for &ldquo;{query}&rdquo;</div>
          )}

          {!isSearching && results.length > 0 && Object.entries(groups).map(([type, items]) => {
            return (
              <div key={type} className={styles.group}>
                <div className={styles.groupLabel}>{TYPE_ICONS[type]} {TYPE_LABELS[type]}</div>
                {items.map((item) => {
                  const flatIdx = flat.indexOf(item)
                  const isActive = flatIdx === activeIndex
                  return (
                    <button
                      key={item.id}
                      className={`${styles.resultItem} ${isActive ? styles.active : ''}`}
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setActiveIndex(flatIdx)}
                    >
                      <span className={styles.resultTitle}>{item.title}</span>
                      {item.subtitle && <span className={styles.resultSub}>{item.subtitle}</span>}
                    </button>
                  )
                })}
              </div>
            )
          })}

          {!query.trim() && (
            <div className={styles.hint}>
              <p>Type to search across all your productivity data.</p>
              <p className={styles.hintSub}>Press <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to open.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
