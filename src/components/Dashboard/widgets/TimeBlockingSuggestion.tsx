"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import styles from "./TimeBlockingSuggestion.module.scss"
import { useProductivityStore } from "@/stores/productivityStore"
import { suggestTimeBlocks } from "@/utils/timeBlockingUtils"
import type { TimeBlock } from "@/utils/timeBlockingUtils"

const DISMISS_KEY = "pulsar_timeblock_dismissed"
const DISMISS_HOURS = 24

function isDismissed(): boolean {
  if (typeof window === "undefined") return false
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const ts = parseInt(raw, 10)
  return Date.now() - ts < DISMISS_HOURS * 3_600_000
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  return d.toLocaleDateString(undefined, { weekday: "long" })
}

function formatTimeRange(start: string, end: string): string {
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    const ampm = h >= 12 ? "PM" : "AM"
    const hr = h % 12 || 12
    return `${hr}:${String(m).padStart(2, "0")} ${ampm}`
  }
  return `${fmt(start)} – ${fmt(end)}`
}

const TimeBlockingSuggestion: React.FC = () => {
  const tasks = useProductivityStore(s => s.tasks)
  const events = useProductivityStore(s => s.events)
  const addEvent = useProductivityStore(s => s.addEvent)

  const [suggestions, setSuggestions] = useState<TimeBlock[]>([])
  const [dismissed, setDismissed] = useState(true) // start hidden until we check
  const [accepted, setAccepted] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isDismissed()) {
      setDismissed(true)
      return
    }

    const activeTasks = tasks
      .filter(t => !t.isDeleted)
      .map(t => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        estimatedHours: undefined,
        completed: t.completed,
      }))

    const calEvents = (events ?? []).map(e => ({
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
    }))

    const results = suggestTimeBlocks(activeTasks, calEvents, 7)
    setSuggestions(results)
    setDismissed(results.length === 0)
  }, [tasks, events])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }

  const handleAccept = (block: TimeBlock) => {
    addEvent({
      title: `Work on: ${block.suggestedFor}`,
      date: block.date,
      dateEnd: null,
      startTime: block.startTime,
      endTime: block.endTime,
      tag: "work",
      recur: null,
      isPublic: false,
    })
    setAccepted(prev => new Set([...prev, block.taskId + block.date + block.startTime]))
  }

  const visibleSuggestions = suggestions.filter(
    b => !accepted.has(b.taskId + b.date + b.startTime)
  )

  if (dismissed || visibleSuggestions.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        className={styles.widget}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.25 }}
      >
        <div className={styles.header}>
          <span className={styles.headerIcon}>⏰</span>
          <span className={styles.headerTitle}>Time Block Suggestions</span>
          <button className={styles.dismissAll} onClick={handleDismiss} title="Dismiss for 24h">✕</button>
        </div>

        <div className={styles.cards}>
          {visibleSuggestions.map((block, i) => {
            const key = block.taskId + block.date + block.startTime
            return (
              <motion.div
                key={key}
                className={styles.card}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={styles.cardText}>
                  <span className={styles.dayChip}>{formatDay(block.date)}</span>
                  <span className={styles.time}>{formatTimeRange(block.startTime, block.endTime)}</span>
                  <span className={styles.taskName}>Block for &ldquo;{block.suggestedFor}&rdquo;</span>
                </div>
                <div className={styles.cardActions}>
                  <button className={styles.acceptBtn} onClick={() => handleAccept(block)}>
                    Add to Calendar
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TimeBlockingSuggestion
