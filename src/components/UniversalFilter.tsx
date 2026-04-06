'use client'

import { useState } from 'react'
import styles from './UniversalFilter.module.scss'

export interface FilterState {
  priority?: 'low' | 'medium' | 'high'
  status?: 'todo' | 'in_progress' | 'done' | 'blocked'
  tags?: string[]
  dateRange?: { from: string; to: string }
  classContext?: string
}

interface UniversalFilterProps {
  value: FilterState
  onChange: (f: FilterState) => void
  availableTags?: string[]
  showClassContext?: boolean
}

type FilterKey = keyof FilterState

const PRIORITY_OPTIONS: Array<{ value: FilterState['priority']; label: string }> = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const STATUS_OPTIONS: Array<{ value: FilterState['status']; label: string }> = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
]

function priorityColor(p: string) {
  if (p === 'high') return 'oklch(0.62 0.18 20)'
  if (p === 'medium') return 'oklch(0.70 0.16 60)'
  return 'oklch(0.60 0.14 150)'
}

function statusColor(s: string) {
  if (s === 'done') return 'oklch(0.60 0.14 150)'
  if (s === 'blocked') return 'oklch(0.62 0.18 20)'
  if (s === 'in_progress') return 'oklch(0.65 0.16 220)'
  return 'oklch(0.55 0.06 260)'
}

export default function UniversalFilter({ value, onChange, availableTags = [], showClassContext = false }: UniversalFilterProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [addingDateRange, setAddingDateRange] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [classInput, setClassInput] = useState('')

  const hasAny = !!(value.priority || value.status || (value.tags && value.tags.length > 0) || value.dateRange || value.classContext)

  const clearAll = () => onChange({})

  const removePriority = () => onChange({ ...value, priority: undefined })
  const removeStatus = () => onChange({ ...value, status: undefined })
  const removeDateRange = () => onChange({ ...value, dateRange: undefined })
  const removeClassContext = () => onChange({ ...value, classContext: undefined })
  const removeTag = (tag: string) => onChange({ ...value, tags: value.tags?.filter((t) => t !== tag) })

  const applyPriority = (p: FilterState['priority']) => { onChange({ ...value, priority: p }); setDropdownOpen(false) }
  const applyStatus = (s: FilterState['status']) => { onChange({ ...value, status: s }); setDropdownOpen(false) }
  const applyTag = (tag: string) => {
    const tags = value.tags ?? []
    if (!tags.includes(tag)) onChange({ ...value, tags: [...tags, tag] })
    setDropdownOpen(false)
  }
  const applyDateRange = () => {
    if (dateFrom && dateTo) {
      onChange({ ...value, dateRange: { from: dateFrom, to: dateTo } })
      setAddingDateRange(false)
      setDropdownOpen(false)
    }
  }
  const applyClassContext = () => {
    if (classInput.trim()) {
      onChange({ ...value, classContext: classInput.trim() })
      setClassInput('')
      setDropdownOpen(false)
    }
  }

  return (
    <div className={styles.filterBar}>
      {/* Active filter pills */}
      {value.priority && (
        <span className={styles.pill} style={{ borderColor: priorityColor(value.priority), color: priorityColor(value.priority) }}>
          Priority: {value.priority}
          <button onClick={removePriority} className={styles.pillRemove} aria-label="Remove priority filter">✕</button>
        </span>
      )}
      {value.status && (
        <span className={styles.pill} style={{ borderColor: statusColor(value.status), color: statusColor(value.status) }}>
          Status: {value.status.replace('_', ' ')}
          <button onClick={removeStatus} className={styles.pillRemove} aria-label="Remove status filter">✕</button>
        </span>
      )}
      {value.tags?.map((tag) => (
        <span key={tag} className={styles.pill}>
          #{tag}
          <button onClick={() => removeTag(tag)} className={styles.pillRemove} aria-label={`Remove tag ${tag}`}>✕</button>
        </span>
      ))}
      {value.dateRange && (
        <span className={styles.pill}>
          {value.dateRange.from} – {value.dateRange.to}
          <button onClick={removeDateRange} className={styles.pillRemove} aria-label="Remove date range filter">✕</button>
        </span>
      )}
      {value.classContext && (
        <span className={styles.pill}>
          Class: {value.classContext}
          <button onClick={removeClassContext} className={styles.pillRemove} aria-label="Remove class filter">✕</button>
        </span>
      )}

      {/* Add filter dropdown */}
      <div className={styles.addWrap}>
        <button className={styles.addBtn} onClick={() => { setDropdownOpen((o) => !o); setAddingDateRange(false) }}>
          + Add filter
        </button>

        {dropdownOpen && (
          <div className={styles.dropdown}>
            {!value.priority && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Priority</div>
                {PRIORITY_OPTIONS.map((o) => (
                  <button key={o.value} className={styles.option} onClick={() => applyPriority(o.value)}>{o.label}</button>
                ))}
              </div>
            )}
            {!value.status && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Status</div>
                {STATUS_OPTIONS.map((o) => (
                  <button key={o.value} className={styles.option} onClick={() => applyStatus(o.value)}>{o.label}</button>
                ))}
              </div>
            )}
            {availableTags.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Tags</div>
                {availableTags.filter((t) => !value.tags?.includes(t)).map((tag) => (
                  <button key={tag} className={styles.option} onClick={() => applyTag(tag)}>#{tag}</button>
                ))}
              </div>
            )}
            {!value.dateRange && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Date Range</div>
                {!addingDateRange && (
                  <button className={styles.option} onClick={() => setAddingDateRange(true)}>Set date range…</button>
                )}
                {addingDateRange && (
                  <div className={styles.dateInputs}>
                    <input type="date" className={styles.dateInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <span className={styles.dateSep}>–</span>
                    <input type="date" className={styles.dateInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <button className={styles.applyBtn} onClick={applyDateRange}>Apply</button>
                  </div>
                )}
              </div>
            )}
            {showClassContext && !value.classContext && (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>Class / Course</div>
                <div className={styles.dateInputs}>
                  <input
                    type="text"
                    className={styles.dateInput}
                    placeholder="e.g. CS 61A"
                    value={classInput}
                    onChange={(e) => setClassInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyClassContext()}
                  />
                  <button className={styles.applyBtn} onClick={applyClassContext}>Apply</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Clear all */}
      {hasAny && (
        <button className={styles.clearAll} onClick={clearAll}>Clear all</button>
      )}
    </div>
  )
}
