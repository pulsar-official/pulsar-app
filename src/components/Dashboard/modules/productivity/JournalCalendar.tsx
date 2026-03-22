"use client"

import React, { useState, useMemo } from "react"
import styles from "./JournalCalendar.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import { MOOD_COLORS } from '@/constants/journal'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_HEADERS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function fmtDate(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString("default", { month: "short", day: "numeric" })
}

const today = new Date().toISOString().split("T")[0]

const JournalCalendar: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const entries = useProductivityStore(s => s.journalEntries)
  const storeAddEntry = useProductivityStore(s => s.addJournalEntry)
  const setSelectedEntryId = useProductivityStore(s => s.setSelectedJournalEntryId)

  const [viewMonth, setViewMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const entriesByDate = useMemo(() => {
    const map: Record<string, typeof entries> = {}
    for (const e of entries) {
      if (!map[e.date]) map[e.date] = []
      map[e.date].push(e)
    }
    return map
  }, [entries])

  const calendarDays = useMemo(() => {
    const y = viewMonth.getFullYear(), m = viewMonth.getMonth()
    const firstDay = new Date(y, m, 1).getDay()
    const lastDate = new Date(y, m + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= lastDate; d++) days.push(d)
    return days
  }, [viewMonth])

  const dateStr = (day: number) => {
    const y = viewMonth.getFullYear(), m = viewMonth.getMonth()
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const prevMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const selectedEntries = selectedDate ? (entriesByDate[selectedDate] || []) : []

  const openEntry = (id: number) => {
    setSelectedEntryId(id)
    onNavigate?.('journal')
  }

  const createEntry = () => {
    if (!selectedDate) return
    storeAddEntry({ title: '', content: '', date: selectedDate, mood: '😊', tags: [] })
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
        <div className={styles.monthNav}>
          <button className={styles.navBtn} onClick={prevMonth}>&#8249;</button>
          <span className={styles.monthLabel}>
            {MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </span>
          <button className={styles.navBtn} onClick={nextMonth}>&#8250;</button>
        </div>
        <div className={styles.pageTitle}>Journal Calendar</div>
      </div>

      <div className={styles.body}>
        <div className={styles.calendarWrap}>
          <div className={styles.dayHeaders}>
            {DAY_HEADERS.map(d => <div key={d} className={styles.dayHeader}>{d}</div>)}
          </div>
          <div className={styles.grid}>
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`e${i}`} className={styles.emptyCell} />
              const ds = dateStr(day)
              const dayEntries = entriesByDate[ds] || []
              const isToday = ds === today
              const isSelected = ds === selectedDate
              return (
                <div
                  key={ds}
                  className={[styles.dayCell, isToday ? styles.today : '', isSelected ? styles.selected : ''].filter(Boolean).join(' ')}
                  onClick={() => setSelectedDate(ds)}
                >
                  <span className={styles.dayNum}>{day}</span>
                  {dayEntries.length > 0 && (
                    <div className={styles.dayIndicators}>
                      <span className={styles.moodDot} style={{ background: MOOD_COLORS[dayEntries[0].mood] || 'oklch(0.5 0 0)' }} />
                      {dayEntries.length > 1 && <span className={styles.entryCount}>{dayEntries.length}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.detailPanel}>
          {selectedDate ? (
            <>
              <div className={styles.detailHeader}>
                <span className={styles.detailDate}>{fmtDate(selectedDate)}</span>
                <button className={styles.newBtn} onClick={createEntry}>+ New entry</button>
              </div>
              {selectedEntries.length === 0 ? (
                <div className={styles.noEntries}>No entries for this day</div>
              ) : (
                <div className={styles.entryList}>
                  {selectedEntries.map(e => (
                    <div key={e.id} className={styles.entryCard} onClick={() => openEntry(e.id)}>
                      <div className={styles.entryCardHeader}>
                        <span className={styles.entryMood}>{e.mood}</span>
                        <span className={styles.entryTitle}>{e.title || 'Untitled'}</span>
                      </div>
                      <div className={styles.entryPreview}>{e.content.slice(0, 80)}{e.content.length > 80 ? '...' : ''}</div>
                      {e.tags.length > 0 && (
                        <div className={styles.entryTags}>
                          {e.tags.map(t => <span key={t} className={styles.entryTag}>#{t}</span>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className={styles.noEntries}>Select a day to view entries</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JournalCalendar
