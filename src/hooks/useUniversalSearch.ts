'use client'

import { useState, useEffect, useRef } from 'react'
import { useProductivityStore } from '@/stores/productivityStore'

export interface SearchResult {
  id: string
  type: 'task' | 'goal' | 'habit' | 'note' | 'event' | 'session'
  title: string
  subtitle?: string
  score: number
  matchedFields: string[]
}

const MAX_PER_TYPE = 5
const MAX_TOTAL = 20
const DEBOUNCE_MS = 200

function scoreText(text: string, query: string): { score: number; field: string } | null {
  const t = text.toLowerCase()
  const q = query.toLowerCase()
  if (t === q) return { score: 1.0, field: text }
  if (t.startsWith(q)) return { score: 0.9, field: text }
  if (t.includes(q)) return { score: 0.7, field: text }
  return null
}

function scoreItem(
  title: string,
  query: string,
  extras: { tags?: string[]; description?: string; content?: string }
): { score: number; matchedFields: string[] } | null {
  const matchedFields: string[] = []
  let bestScore = 0

  const titleMatch = scoreText(title, query)
  if (titleMatch) {
    bestScore = Math.max(bestScore, titleMatch.score)
    matchedFields.push('title')
  }

  if (extras.tags) {
    for (const tag of extras.tags) {
      const m = scoreText(tag, query)
      if (m) {
        bestScore = Math.max(bestScore, 0.6)
        matchedFields.push('tags')
        break
      }
    }
  }

  if (extras.description) {
    const m = scoreText(extras.description, query)
    if (m) {
      bestScore = Math.max(bestScore, 0.4)
      matchedFields.push('description')
    }
  }

  if (extras.content) {
    const m = scoreText(extras.content, query)
    if (m) {
      bestScore = Math.max(bestScore, 0.4)
      matchedFields.push('content')
    }
  }

  if (bestScore === 0) return null
  return { score: bestScore, matchedFields }
}

export function useUniversalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tasks = useProductivityStore((s) => s.tasks)
  const goals = useProductivityStore((s) => s.goals)
  const habits = useProductivityStore((s) => s.habits)
  const journalEntries = useProductivityStore((s) => s.journalEntries)
  const events = useProductivityStore((s) => s.events)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    const q = query.trim()
    if (!q) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    timerRef.current = setTimeout(() => {
      const allResults: SearchResult[] = []

      // Tasks
      const taskResults: SearchResult[] = []
      for (const t of tasks) {
        if (t.isDeleted) continue
        const m = scoreItem(t.title, q, { description: t.description, tags: [t.tag] })
        if (m) taskResults.push({ id: t.id, type: 'task', title: t.title, subtitle: t.status, score: m.score, matchedFields: m.matchedFields })
      }
      taskResults.sort((a, b) => b.score - a.score)
      allResults.push(...taskResults.slice(0, MAX_PER_TYPE))

      // Goals
      const goalResults: SearchResult[] = []
      for (const g of goals) {
        if (g.isDeleted) continue
        const m = scoreItem(g.title, q, { description: g.description, tags: [g.category] })
        if (m) goalResults.push({ id: g.id, type: 'goal', title: g.title, subtitle: g.category, score: m.score, matchedFields: m.matchedFields })
      }
      goalResults.sort((a, b) => b.score - a.score)
      allResults.push(...goalResults.slice(0, MAX_PER_TYPE))

      // Habits
      const habitResults: SearchResult[] = []
      for (const h of habits) {
        if (h.isDeleted) continue
        const m = scoreItem(h.name, q, {})
        if (m) habitResults.push({ id: h.id, type: 'habit', title: h.name, subtitle: h.emoji, score: m.score, matchedFields: m.matchedFields })
      }
      habitResults.sort((a, b) => b.score - a.score)
      allResults.push(...habitResults.slice(0, MAX_PER_TYPE))

      // Journal entries
      const journalResults: SearchResult[] = []
      for (const j of journalEntries) {
        if (j.isDeleted) continue
        const m = scoreItem(j.title, q, { content: j.content, tags: j.tags })
        if (m) journalResults.push({ id: j.id, type: 'note', title: j.title, subtitle: j.date, score: m.score, matchedFields: m.matchedFields })
      }
      journalResults.sort((a, b) => b.score - a.score)
      allResults.push(...journalResults.slice(0, MAX_PER_TYPE))

      // Events
      const eventResults: SearchResult[] = []
      for (const e of events) {
        if (e.isDeleted) continue
        const m = scoreItem(e.title, q, { tags: [e.tag] })
        if (m) eventResults.push({ id: e.id, type: 'event', title: e.title, subtitle: e.date, score: m.score, matchedFields: m.matchedFields })
      }
      eventResults.sort((a, b) => b.score - a.score)
      allResults.push(...eventResults.slice(0, MAX_PER_TYPE))

      // Final: sort overall by score, cap at MAX_TOTAL
      allResults.sort((a, b) => b.score - a.score)
      setResults(allResults.slice(0, MAX_TOTAL))
      setIsSearching(false)
    }, DEBOUNCE_MS)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, tasks, goals, habits, journalEntries, events])

  return {
    query,
    setQuery,
    results,
    isSearching,
    clearSearch: () => setQuery(''),
  }
}
