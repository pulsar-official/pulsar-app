import type { Task, Goal, Habit, JournalEntry, CalEvent } from '@/types/productivity'
import type { Connection, ConnectionItem, ConnectionItemType } from '@/types/connections'

/* ── Stop words for keyword matching ── */
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'its', 'was', 'are', 'be',
  'has', 'had', 'do', 'did', 'my', 'i', 'me', 'we', 'our', 'you',
  'this', 'that', 'not', 'no', 'so', 'up', 'out', 'if', 'about',
  'just', 'some', 'all', 'new', 'need', 'today', 'day',
])

function tokenize(text: string): Set<string> {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
  return new Set(tokens)
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a)
  const db = new Date(b)
  return Math.abs(Math.round((da.getTime() - db.getTime()) / 86400000))
}

/* ── Tag/category alignment mapping ── */
const TAG_TO_CATEGORY: Record<string, string[]> = {
  work: ['work'],
  personal: ['personal', 'creative'],
  urgent: ['work'],
  health: ['health'],
}

/* ── Build ConnectionItem helpers ── */
function taskToItem(t: Task): ConnectionItem {
  return { id: t.id, type: 'task', title: t.title }
}
function goalToItem(g: Goal): ConnectionItem {
  return { id: g.id, type: 'goal', title: g.title }
}
function habitToItem(h: Habit): ConnectionItem {
  return { id: h.id, type: 'habit', title: h.name }
}
function journalToItem(j: JournalEntry): ConnectionItem {
  return { id: j.id, type: 'journal', title: j.title }
}
function eventToItem(e: CalEvent): ConnectionItem {
  return { id: e.id, type: 'event', title: e.title }
}

/* ── Pairwise matching functions ── */

function matchTaskGoal(task: Task, goal: Goal): { strength: number; reasons: string[] } {
  let strength = 0
  const reasons: string[] = []

  // Category alignment
  const mappedCats = TAG_TO_CATEGORY[task.tag] || []
  if (mappedCats.includes(goal.category)) {
    strength += 0.3
    reasons.push(`Shared category: ${goal.category}`)
  }

  // Keyword overlap
  const taskTokens = tokenize(task.title + ' ' + task.description)
  const goalTokens = tokenize(goal.title + ' ' + goal.description)
  const shared = [...taskTokens].filter(t => goalTokens.has(t))
  if (shared.length > 0) {
    const overlap = shared.length / Math.min(taskTokens.size || 1, goalTokens.size || 1)
    strength += Math.min(overlap * 0.6, 0.5)
    reasons.push(`Keywords: ${shared.slice(0, 3).join(', ')}`)
  }

  // Temporal proximity (due date vs deadline)
  if (task.dueDate && goal.deadline) {
    const days = daysBetween(task.dueDate, goal.deadline)
    if (days <= 7) {
      strength += days === 0 ? 0.3 : days <= 2 ? 0.2 : 0.1
      reasons.push(days === 0 ? 'Due same day' : `Due within ${days}d`)
    }
  }

  return { strength: Math.min(strength, 1), reasons }
}

function matchTaskJournal(task: Task, entry: JournalEntry): { strength: number; reasons: string[] } {
  let strength = 0
  const reasons: string[] = []

  // Tag match
  if (entry.tags.includes(task.tag)) {
    strength += 0.35
    reasons.push(`Shared tag: ${task.tag}`)
  }

  // Keyword overlap
  const taskTokens = tokenize(task.title + ' ' + task.description)
  const entryTokens = tokenize(entry.title + ' ' + entry.content)
  const shared = [...taskTokens].filter(t => entryTokens.has(t))
  if (shared.length > 0) {
    const overlap = shared.length / Math.min(taskTokens.size || 1, entryTokens.size || 1)
    strength += Math.min(overlap * 0.5, 0.4)
    reasons.push(`Keywords: ${shared.slice(0, 3).join(', ')}`)
  }

  // Temporal proximity
  if (task.dueDate && entry.date) {
    const days = daysBetween(task.dueDate, entry.date)
    if (days <= 3) {
      strength += days === 0 ? 0.25 : 0.1
      reasons.push(days === 0 ? 'Same day' : `Within ${days}d`)
    }
  }

  return { strength: Math.min(strength, 1), reasons }
}

function matchGoalJournal(goal: Goal, entry: JournalEntry): { strength: number; reasons: string[] } {
  let strength = 0
  const reasons: string[] = []

  // Tag-category alignment
  const catTags = Object.entries(TAG_TO_CATEGORY)
    .filter(([, cats]) => cats.includes(goal.category))
    .map(([tag]) => tag)
  const matchedTag = entry.tags.find(t => catTags.includes(t) || t === goal.category)
  if (matchedTag) {
    strength += 0.3
    reasons.push(`Category match: ${goal.category}`)
  }

  // Keyword overlap
  const goalTokens = tokenize(goal.title + ' ' + goal.description)
  const entryTokens = tokenize(entry.title + ' ' + entry.content)
  const shared = [...goalTokens].filter(t => entryTokens.has(t))
  if (shared.length > 0) {
    const overlap = shared.length / Math.min(goalTokens.size || 1, entryTokens.size || 1)
    strength += Math.min(overlap * 0.5, 0.45)
    reasons.push(`Keywords: ${shared.slice(0, 3).join(', ')}`)
  }

  return { strength: Math.min(strength, 1), reasons }
}

function matchHabitGoal(habit: Habit, goal: Goal): { strength: number; reasons: string[] } {
  let strength = 0
  const reasons: string[] = []

  // Keyword overlap between habit name and goal
  const habitTokens = tokenize(habit.name)
  const goalTokens = tokenize(goal.title + ' ' + goal.description)
  const shared = [...habitTokens].filter(t => goalTokens.has(t))
  if (shared.length > 0) {
    strength += 0.5
    reasons.push(`Keywords: ${shared.slice(0, 3).join(', ')}`)
  }

  // Health-related habit + health goal
  const healthWords = new Set(['workout', 'exercise', 'run', 'water', 'sleep', 'meditate', 'meditation', 'gym', 'walk', 'yoga'])
  const habitLower = habit.name.toLowerCase()
  const isHealthHabit = [...healthWords].some(w => habitLower.includes(w))
  if (isHealthHabit && goal.category === 'health') {
    strength += 0.4
    reasons.push('Health alignment')
  }

  return { strength: Math.min(strength, 1), reasons }
}

function matchTaskEvent(task: Task, event: CalEvent): { strength: number; reasons: string[] } {
  let strength = 0
  const reasons: string[] = []

  // Same tag
  if (task.tag === event.tag) {
    strength += 0.3
    reasons.push(`Shared tag: ${task.tag}`)
  }

  // Temporal proximity
  if (task.dueDate && event.date) {
    const days = daysBetween(task.dueDate, event.date)
    if (days <= 3) {
      strength += days === 0 ? 0.35 : days <= 1 ? 0.2 : 0.1
      reasons.push(days === 0 ? 'Same day' : `Within ${days}d`)
    }
  }

  // Keyword overlap
  const taskTokens = tokenize(task.title)
  const eventTokens = tokenize(event.title)
  const shared = [...taskTokens].filter(t => eventTokens.has(t))
  if (shared.length > 0) {
    strength += 0.35
    reasons.push(`Keywords: ${shared.slice(0, 3).join(', ')}`)
  }

  return { strength: Math.min(strength, 1), reasons }
}

function matchGoalEvent(goal: Goal, event: CalEvent): { strength: number; reasons: string[] } {
  let strength = 0
  const reasons: string[] = []

  // Category-tag alignment
  const mappedCats = TAG_TO_CATEGORY[event.tag] || []
  if (mappedCats.includes(goal.category)) {
    strength += 0.25
    reasons.push(`Category: ${goal.category}`)
  }

  // Keyword overlap
  const goalTokens = tokenize(goal.title + ' ' + goal.description)
  const eventTokens = tokenize(event.title)
  const shared = [...goalTokens].filter(t => eventTokens.has(t))
  if (shared.length > 0) {
    strength += 0.4
    reasons.push(`Keywords: ${shared.slice(0, 3).join(', ')}`)
  }

  return { strength: Math.min(strength, 1), reasons }
}

/* ── Main compute function ── */

export function computeConnections(
  tasks: Task[],
  goals: Goal[],
  habits: Habit[],
  journalEntries: JournalEntry[],
  events: CalEvent[],
): Connection[] {
  const connections: Connection[] = []

  // Task ↔ Goal
  for (const task of tasks) {
    for (const goal of goals) {
      const { strength, reasons } = matchTaskGoal(task, goal)
      if (strength >= 0.3) {
        connections.push({ source: taskToItem(task), target: goalToItem(goal), strength, reasons })
      }
    }
  }

  // Task ↔ Journal
  for (const task of tasks) {
    for (const entry of journalEntries) {
      const { strength, reasons } = matchTaskJournal(task, entry)
      if (strength >= 0.3) {
        connections.push({ source: taskToItem(task), target: journalToItem(entry), strength, reasons })
      }
    }
  }

  // Goal ↔ Journal
  for (const goal of goals) {
    for (const entry of journalEntries) {
      const { strength, reasons } = matchGoalJournal(goal, entry)
      if (strength >= 0.3) {
        connections.push({ source: goalToItem(goal), target: journalToItem(entry), strength, reasons })
      }
    }
  }

  // Habit ↔ Goal
  for (const habit of habits) {
    for (const goal of goals) {
      const { strength, reasons } = matchHabitGoal(habit, goal)
      if (strength >= 0.3) {
        connections.push({ source: habitToItem(habit), target: goalToItem(goal), strength, reasons })
      }
    }
  }

  // Task ↔ Event
  for (const task of tasks) {
    for (const event of events) {
      const { strength, reasons } = matchTaskEvent(task, event)
      if (strength >= 0.3) {
        connections.push({ source: taskToItem(task), target: eventToItem(event), strength, reasons })
      }
    }
  }

  // Goal ↔ Event
  for (const goal of goals) {
    for (const event of events) {
      const { strength, reasons } = matchGoalEvent(goal, event)
      if (strength >= 0.3) {
        connections.push({ source: goalToItem(goal), target: eventToItem(event), strength, reasons })
      }
    }
  }

  // Sort by strength descending, cap at 50
  connections.sort((a, b) => b.strength - a.strength)
  return connections.slice(0, 50)
}

/* ── Get connections for a specific item ── */

export function getConnectionsFor(
  itemType: ConnectionItemType,
  itemId: string,
  allConnections: Connection[],
): Connection[] {
  return allConnections.filter(
    c => (c.source.type === itemType && c.source.id === itemId) ||
         (c.target.type === itemType && c.target.id === itemId)
  )
}
