"use client"

import React, { useState, useMemo } from "react"
import styles from "./Habits.module.scss"

interface Habit {
  id: string; emoji: string; name: string; freq: "daily" | "weekdays" | "custom"
}

interface CheckMap { [habitId: string]: { [dateKey: string]: boolean } }

function makeId() { return Math.random().toString(36).slice(2) }

const EMOJIS = ["💧","🏃","📖","🧘","💊","🥗","😴","✍️","🎯","🔥","💡","🌱"]

const SAMPLE_HABITS: Habit[] = [
  { id: makeId(), emoji: "💧", name: "Drink 8 glasses", freq: "daily" },
  { id: makeId(), emoji: "🏃", name: "Exercise 30min", freq: "weekdays" },
  { id: makeId(), emoji: "📖", name: "Read 20 pages", freq: "daily" },
  { id: makeId(), emoji: "🧘", name: "Meditate", freq: "daily" },
  { id: makeId(), emoji: "💊", name: "Vitamins", freq: "daily" },
  { id: makeId(), emoji: "✍️", name: "Journal", freq: "daily" },
]
function getWeekStart(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  const mon = new Date(d)
  mon.setDate(d.getDate() - diff)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function getWeekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function dk(d: Date): string {
  return d.toISOString().split("T")[0]
}

function fmtWeek(start: Date, end: Date): string {
  const sM = start.toLocaleString("default", { month: "short" })
  const eM = end.toLocaleString("default", { month: "short" })
  if (sM === eM) return sM + " " + start.getDate() + " – " + end.getDate() + ", " + start.getFullYear()
  return sM + " " + start.getDate() + " – " + eM + " " + end.getDate() + ", " + end.getFullYear()
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

interface FormState { emoji: string; name: string; freq: "daily" | "weekdays" | "custom" }
const DFORM: FormState = { emoji: "💧", name: "", freq: "daily" }
const Habits: React.FC = () => {
  const today = useMemo(() => new Date(), [])
  const todayKey = dk(today)
  const [weekOffset, setWeekOffset] = useState(0)
  const [habits, setHabits] = useState<Habit[]>(SAMPLE_HABITS)
  const [checks, setChecks] = useState<CheckMap>(() => {
    const m: CheckMap = {}
    SAMPLE_HABITS.forEach(h => {
      m[h.id] = {}
      for (let i = -14; i <= 0; i++) {
        const d = new Date(today)
        d.setDate(today.getDate() + i)
        if (Math.random() > 0.35) m[h.id][dk(d)] = true
      }
    })
    return m
  })
  const [open, setOpen] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [form, setForm] = useState<FormState>(DFORM)

  const weekStart = useMemo(() => {
    const ws = getWeekStart(today)
    ws.setDate(ws.getDate() + weekOffset * 7)
    return ws
  }, [today, weekOffset])

  const days = useMemo(() => getWeekDays(weekStart), [weekStart])

  const toggle = (hid: string, dkey: string) => {
    setChecks(prev => {
      const hc = { ...prev[hid] }
      if (hc[dkey]) { delete hc[dkey] } else { hc[dkey] = true }
      return { ...prev, [hid]: hc }
    })
  }

  const getStreak = (hid: string): number => {
    let streak = 0
    const d = new Date(today)
    while (true) {
      const k = dk(d)
      if (checks[hid] && checks[hid][k]) { streak++; d.setDate(d.getDate() - 1) }
      else break
    }
    return streak
  }

  const openAdd = () => { setEditHabit(null); setForm(DFORM); setOpen(true) }
  const openEdit = (h: Habit) => {
    setEditHabit(h)
    setForm({ emoji: h.emoji, name: h.name, freq: h.freq })
    setOpen(true)
  }

  const save = () => {
    if (!form.name.trim()) return
    if (editHabit) {
      setHabits(hs => hs.map(h => h.id === editHabit.id ? { ...h, ...form } : h))
    } else {
      const id = makeId()
      setHabits(hs => [...hs, { id, ...form }])
      setChecks(prev => ({ ...prev, [id]: {} }))
    }
    setOpen(false)
  }

  const del = (id: string) => {
    setHabits(hs => hs.filter(h => h.id !== id))
    setChecks(prev => { const n = { ...prev }; delete n[id]; return n })
    setOpen(false)
  }

  const weekEnd = days[6]
  const weekLbl = fmtWeek(weekStart, weekEnd)
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.pageTitle}>Habits</div>
          <div className={styles.weekNav}>
            <button className={styles.weekNavBtn} onClick={() => setWeekOffset(w => w - 1)} aria-label="Previous week">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <div className={styles.weekLabel}>{weekLbl}</div>
            <button className={styles.weekNavBtn} onClick={() => setWeekOffset(w => w + 1)} aria-label="Next week">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 6 15 12 9 18" /></svg>
            </button>
          </div>
          <button className={styles.todayBtn} onClick={() => setWeekOffset(0)}>Today</button>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addBtn} onClick={openAdd}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add habit
          </button>
        </div>
      </div>
      <div className={styles.body}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.thCorner}>Habit</th>
              {days.map((d, i) => {
                const isToday = dk(d) === todayKey
                return (
                  <th key={i} className={[styles.thDay, isToday ? styles.thDayToday : ""].filter(Boolean).join(" ")}>
                    <span className={styles.thDayNum}>{d.getDate()}</span>
                    <span className={styles.thDayName}>{DAY_NAMES[i]}</span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {habits.map(h => {
              const streak = getStreak(h.id)
              return (
                <tr key={h.id} className={styles.habitRow}>
                  <td className={styles.habitName} onClick={() => openEdit(h)}>
                    <span className={styles.dragHandle}><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg></span><span className={styles.habitEmoji}>{h.emoji}</span>
                    <div>
                      <div className={styles.habitLabel}>{h.name}</div>
                      {streak > 0 && <div className={[styles.habitStreak, streak >= 7 ? styles.streakHot : ""].filter(Boolean).join(" ")}>{streak} day streak 🔥</div>}
                    </div>
                  </td>
                  {days.map((d, i) => {
                    const dkey = dk(d)
                    const done = !!(checks[h.id] && checks[h.id][dkey])
                    return (
                      <td key={i} className={styles.habitCell} onClick={() => toggle(h.id, dkey)}>
                        <div className={[styles.checkBox, done ? styles.checkDone : ""].filter(Boolean).join(" ")}>
                          {done && <span className={styles.checkMark}>✓</span>}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}            <tr className={styles.addRow}>
              <td className={styles.addRowCell} colSpan={8}>
                <button className={styles.addRowBtn} onClick={openAdd}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add a new habit
                </button>
              </td>
            </tr>
            <tr className={styles.summaryRow}>
              <td className={styles.summaryCorner}>Completion</td>
              {days.map((d, i) => {
                const dkey = dk(d)
                const total = habits.length
                const done = habits.filter(h => checks[h.id] && checks[h.id][dkey]).length
                const pct = total ? Math.round(done / total * 100) : 0
                const cls = pct >= 80 ? styles.pctGood : pct >= 50 ? styles.pctMed : styles.pctLow
                return (
                  <td key={i} className={styles.summaryCell}>
                    <span className={[styles.pctBadge, cls].join(" ")}>{pct}%</span>
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>{editHabit ? "Edit habit" : "New habit"}</div>
              <button className={styles.modalClose} onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.label}>Emoji</label>
                <div className={styles.emojiRow}>
                  {EMOJIS.map(e => (
                    <button key={e} className={[styles.emojiBtn, form.emoji === e ? styles.active : ""].filter(Boolean).join(" ")} onClick={() => setForm(f => ({ ...f, emoji: e }))}>{e}</button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Name</label>
                <input className={styles.input} value={form.name} placeholder="Habit name" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Frequency</label>
                <div className={styles.freqRow}>
                  {(["daily", "weekdays", "custom"] as const).map(fr => (
                    <button key={fr} className={[styles.freqBtn, form.freq === fr ? styles.active : ""].filter(Boolean).join(" ")} onClick={() => setForm(f => ({ ...f, freq: fr }))}>
                      {fr.charAt(0).toUpperCase() + fr.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              {editHabit && <button className={styles.deleteBtn} onClick={() => del(editHabit.id)}>Delete</button>}
              <button className={styles.cancelBtn} onClick={() => setOpen(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Habits