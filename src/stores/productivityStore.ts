import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  Task, Habit, HabitCheck, HabitCheckMap, Goal, SubGoal,
  JournalEntry, CalEvent, Board, FocusSession, UserPreference,
  TaskStatus,
} from '@/types/productivity'
import type { Connection } from '@/types/connections'
import { computeConnections } from '@/lib/connectionEngine'
import { db } from '@/lib/powersync/db'

// ── Row mappers (SQLite snake_case + int booleans → TS types) ────────────────

function toBool(v: unknown): boolean { return v === 1 || v === true }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

function mapTask(r: Row): Task {
  return {
    id: r.id, orgId: r.org_id, userId: r.user_id,
    title: r.title, description: r.description ?? '',
    completed: toBool(r.completed), priority: r.priority ?? 'medium',
    tag: r.tag ?? 'work', status: r.status ?? 'todo',
    dueDate: r.due_date ?? null, isPublic: toBool(r.is_public),
    isDeleted: toBool(r.is_deleted),
  }
}

function mapHabit(r: Row): Habit {
  return {
    id: r.id, orgId: r.org_id, userId: r.user_id,
    name: r.name, emoji: r.emoji ?? '✅',
    sortOrder: r.sort_order ?? 0, isPublic: toBool(r.is_public),
    isDeleted: toBool(r.is_deleted),
  }
}

function mapHabitCheck(r: Row): HabitCheck {
  return {
    id: r.id, habitId: r.habit_id,
    date: r.date, checked: toBool(r.checked),
    isDeleted: toBool(r.is_deleted),
  }
}

function mapSubGoal(r: Row): SubGoal {
  return {
    id: r.id, goalId: r.goal_id,
    text: r.text, done: toBool(r.done),
    isDeleted: toBool(r.is_deleted),
  }
}

function mapGoal(r: Row, subs: SubGoal[]): Goal {
  return {
    id: r.id, orgId: r.org_id, userId: r.user_id,
    title: r.title, description: r.description ?? '',
    category: r.category ?? 'work', priority: r.priority ?? 'medium',
    deadline: r.deadline ?? null, done: toBool(r.done),
    progress: r.progress ?? 0, isPublic: toBool(r.is_public),
    isDeleted: toBool(r.is_deleted), subs,
  }
}

function mapJournalEntry(r: Row): JournalEntry {
  let tags: string[] = []
  try { tags = JSON.parse(r.tags ?? '[]') } catch { tags = [] }
  return {
    id: r.id, orgId: r.org_id, userId: r.user_id,
    title: r.title, content: r.content ?? '',
    date: r.date, mood: r.mood ?? '',
    tags, isPublic: toBool(r.is_public),
    isDeleted: toBool(r.is_deleted),
  }
}

function mapCalEvent(r: Row): CalEvent {
  return {
    id: r.id, orgId: r.org_id, userId: r.user_id,
    title: r.title, date: r.date,
    dateEnd: r.date_end ?? null, startTime: r.start_time ?? null,
    endTime: r.end_time ?? null, tag: r.tag ?? 'default',
    recur: r.recur ?? null, isPublic: toBool(r.is_public),
    isDeleted: toBool(r.is_deleted),
  }
}

function mapBoard(r: Row): Board {
  return {
    id: r.id, orgId: r.org_id, userId: r.user_id,
    name: r.name, description: r.description ?? '',
    color: r.color ?? '', icon: r.icon ?? '',
    isPublic: toBool(r.is_public), isDeleted: toBool(r.is_deleted),
  }
}

function mapFocusSession(r: Row): FocusSession {
  return {
    id: r.id, orgId: r.org_id, userId: r.user_id,
    date: r.date, timerType: r.timer_type ?? 'pomodoro',
    totalCycles: r.total_cycles ?? 4, completedCycles: r.completed_cycles ?? 0,
    workMinutes: r.work_minutes ?? 25, restMinutes: r.rest_minutes ?? 5,
    longRestMinutes: r.long_rest_minutes ?? 15,
    completedTasks: r.completed_tasks ?? 0,
    totalFocusSeconds: r.total_focus_seconds ?? 0,
    isPublic: toBool(r.is_public), isDeleted: toBool(r.is_deleted),
  }
}

function mapPreference(r: Row): UserPreference {
  let value: unknown = r.value
  try { if (typeof r.value === 'string') value = JSON.parse(r.value) } catch { value = r.value }
  return {
    id: r.id, orgId: r.org_id, userId: r.user_id,
    key: r.key, value, isDeleted: toBool(r.is_deleted),
  }
}

// ── Store interface ──────────────────────────────────────────────────────────

interface ProductivityState {
  // Data
  tasks: Task[]
  habits: Habit[]
  habitChecks: HabitCheck[]
  goals: Goal[]
  journalEntries: JournalEntry[]
  events: CalEvent[]
  boards: Board[]
  focusSessions: FocusSession[]
  preferences: UserPreference[]

  // Meta
  orgId: string | null
  userId: string | null
  loading: boolean
  initialized: boolean

  // Initial hydration from local SQLite (called once on mount)
  hydrateFromPowerSync: (orgId: string, userId: string) => Promise<void>

  // Bulk setters used by PowerSyncBridge for live reactivity
  setTasks: (tasks: Task[]) => void
  setHabits: (habits: Habit[]) => void
  setHabitChecks: (checks: HabitCheck[]) => void
  setGoals: (goals: Goal[]) => void
  setJournalEntries: (entries: JournalEntry[]) => void
  setEvents: (events: CalEvent[]) => void
  setBoards: (boards: Board[]) => void
  setFocusSessions: (sessions: FocusSession[]) => void
  setPreferences: (prefs: UserPreference[]) => void

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'orgId' | 'userId'>) => Promise<void>
  updateTask: (task: Task) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  toggleTask: (id: string) => Promise<void>

  // Habit actions
  addHabit: (habit: { name: string; emoji: string; isPublic?: boolean }) => Promise<void>
  deleteHabit: (id: string) => Promise<void>
  toggleHabitCheck: (habitId: string, date: string) => Promise<void>

  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'orgId' | 'userId' | 'subs'>) => Promise<void>
  updateGoal: (goal: Goal) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  toggleSubGoal: (subId: string, done: boolean) => Promise<void>
  addSubGoal: (goalId: string, text: string) => Promise<void>
  deleteSubGoal: (subId: string) => Promise<void>

  // Journal actions
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'orgId' | 'userId'>) => Promise<void>
  updateJournalEntry: (entry: JournalEntry) => Promise<void>
  deleteJournalEntry: (id: string) => Promise<void>

  // Event actions
  addEvent: (event: Omit<CalEvent, 'id' | 'orgId' | 'userId'>) => Promise<void>
  updateEvent: (event: CalEvent) => Promise<void>
  deleteEvent: (id: string) => Promise<void>

  // Focus session actions
  addFocusSession: (session: Omit<FocusSession, 'id' | 'orgId' | 'userId'>) => Promise<void>
  updateFocusSession: (session: FocusSession) => Promise<void>

  // Preference actions
  setPreference: (key: string, value: unknown) => Promise<void>
  getPreference: (key: string) => unknown

  // Journal cross-component navigation
  selectedJournalEntryId: string | null
  setSelectedJournalEntryId: (id: string | null) => void

  // Selectors
  getHabitCheckMap: () => HabitCheckMap
  getTodaysTasks: () => Task[]
  getOverdueTasks: () => Task[]
  getActiveGoals: () => Goal[]
  getJournalEntriesByDate: (date: string) => JournalEntry[]
  getJournalMoodDistribution: () => Record<string, number>
  getJournalStreak: () => { current: number; longest: number; totalDays: number; dates: Set<string> }
  getSmartConnections: () => Connection[]
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useProductivityStore = create<ProductivityState>((set, get) => ({
  tasks: [], habits: [], habitChecks: [], goals: [],
  journalEntries: [], events: [], boards: [],
  focusSessions: [], preferences: [],
  orgId: null, userId: null,
  loading: false, initialized: false,
  selectedJournalEntryId: null,
  setSelectedJournalEntryId: (id) => set({ selectedJournalEntryId: id }),

  // ── Hydration ──
  hydrateFromPowerSync: async (orgId, userId) => {
    set({ loading: true, orgId, userId })
    const notDeleted = '(is_deleted = 0 OR is_deleted IS NULL)'

    const [taskRows, habitRows, checkRows, goalRows, subRows,
      journalRows, eventRows, boardRows, focusRows, prefRows] = await Promise.all([
      db.getAll(`SELECT * FROM tasks WHERE org_id = ? AND ${notDeleted}`, [orgId]),
      db.getAll(`SELECT * FROM habits WHERE org_id = ? AND ${notDeleted}`, [orgId]),
      db.getAll(`SELECT hc.* FROM habit_checks hc JOIN habits h ON hc.habit_id = h.id WHERE h.org_id = ? AND ${notDeleted}`, [orgId]),
      db.getAll(`SELECT * FROM goals WHERE org_id = ? AND ${notDeleted}`, [orgId]),
      db.getAll(`SELECT gs.* FROM goal_subs gs JOIN goals g ON gs.goal_id = g.id WHERE g.org_id = ? AND ${notDeleted}`, [orgId]),
      db.getAll(`SELECT * FROM journal_entries WHERE org_id = ? AND ${notDeleted}`, [orgId]),
      db.getAll(`SELECT * FROM cal_events WHERE org_id = ? AND ${notDeleted}`, [orgId]),
      db.getAll(`SELECT * FROM boards WHERE org_id = ? AND ${notDeleted}`, [orgId]),
      db.getAll(`SELECT * FROM focus_sessions WHERE org_id = ? AND ${notDeleted}`, [orgId]),
      db.getAll(`SELECT * FROM user_preferences WHERE org_id = ? AND ${notDeleted}`, [orgId]),
    ])

    const subsByGoal = new Map<string, SubGoal[]>()
    for (const r of subRows) {
      const mapped = mapSubGoal(r as Row)
      const arr = subsByGoal.get(mapped.goalId) ?? []
      arr.push(mapped)
      subsByGoal.set(mapped.goalId, arr)
    }

    set({
      tasks: (taskRows as Row[]).map(mapTask),
      habits: (habitRows as Row[]).map(mapHabit),
      habitChecks: (checkRows as Row[]).map(mapHabitCheck),
      goals: (goalRows as Row[]).map(r => mapGoal(r as Row, subsByGoal.get((r as Row).id) ?? [])),
      journalEntries: (journalRows as Row[]).map(mapJournalEntry),
      events: (eventRows as Row[]).map(mapCalEvent),
      boards: (boardRows as Row[]).map(mapBoard),
      focusSessions: (focusRows as Row[]).map(mapFocusSession),
      preferences: (prefRows as Row[]).map(mapPreference),
      loading: false, initialized: true,
    })
  },

  // ── Bulk setters (used by PowerSyncBridge) ──
  setTasks: (tasks) => set({ tasks }),
  setHabits: (habits) => set({ habits }),
  setHabitChecks: (habitChecks) => set({ habitChecks }),
  setGoals: (goals) => set({ goals }),
  setJournalEntries: (journalEntries) => set({ journalEntries }),
  setEvents: (events) => set({ events }),
  setBoards: (boards) => set({ boards }),
  setFocusSessions: (focusSessions) => set({ focusSessions }),
  setPreferences: (preferences) => set({ preferences }),

  // ── Task actions ──
  addTask: async (task) => {
    const { orgId, userId } = get()
    if (!orgId || !userId) return
    const id = uuidv4()
    const now = new Date().toISOString()
    await db.execute(
      `INSERT INTO tasks (id, org_id, user_id, title, description, completed, priority, tag, status, due_date, is_public, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, orgId, userId, task.title, task.description ?? '', task.priority ?? 'medium',
       task.tag ?? 'work', task.status ?? 'todo', task.dueDate ?? null,
       task.isPublic ? 1 : 0, now, now]
    )
  },

  updateTask: async (task) => {
    await db.execute(
      `UPDATE tasks SET title=?, description=?, completed=?, priority=?, tag=?, status=?, due_date=?, is_public=?, updated_at=? WHERE id=?`,
      [task.title, task.description ?? '', task.completed ? 1 : 0, task.priority, task.tag,
       task.status, task.dueDate ?? null, task.isPublic ? 1 : 0, new Date().toISOString(), task.id]
    )
  },

  deleteTask: async (id) => {
    await db.execute(`UPDATE tasks SET is_deleted=1, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
  },

  toggleTask: async (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return
    const newCompleted = !task.completed
    const newStatus = newCompleted ? 'done' : 'todo'
    await db.execute(
      `UPDATE tasks SET completed=?, status=?, updated_at=? WHERE id=?`,
      [newCompleted ? 1 : 0, newStatus, new Date().toISOString(), id]
    )
  },

  // ── Habit actions ──
  addHabit: async ({ name, emoji, isPublic }) => {
    const { orgId, userId, habits } = get()
    if (!orgId || !userId) return
    const id = uuidv4()
    const now = new Date().toISOString()
    await db.execute(
      `INSERT INTO habits (id, org_id, user_id, name, emoji, sort_order, is_public, is_deleted, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [id, orgId, userId, name, emoji, habits.length, isPublic ? 1 : 0, now]
    )
  },

  deleteHabit: async (id) => {
    await db.execute(`UPDATE habits SET is_deleted=1 WHERE id=?`, [id])
  },

  toggleHabitCheck: async (habitId, date) => {
    const existing = get().habitChecks.find(c => c.habitId === habitId && c.date === date)
    if (existing) {
      await db.execute(`DELETE FROM habit_checks WHERE id=?`, [existing.id])
    } else {
      const id = uuidv4()
      const now = new Date().toISOString()
      await db.execute(
        `INSERT INTO habit_checks (id, habit_id, date, checked, is_deleted, created_at) VALUES (?, ?, ?, 1, 0, ?)`,
        [id, habitId, date, now]
      )
    }
  },

  // ── Goal actions ──
  addGoal: async (goal) => {
    const { orgId, userId } = get()
    if (!orgId || !userId) return
    const id = uuidv4()
    const now = new Date().toISOString()
    await db.execute(
      `INSERT INTO goals (id, org_id, user_id, title, description, category, priority, deadline, done, progress, is_public, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?)`,
      [id, orgId, userId, goal.title, goal.description ?? '', goal.category ?? 'work',
       goal.priority ?? 'medium', goal.deadline ?? null, goal.progress ?? 0,
       goal.isPublic ? 1 : 0, now, now]
    )
  },

  updateGoal: async (goal) => {
    await db.execute(
      `UPDATE goals SET title=?, description=?, category=?, priority=?, deadline=?, done=?, progress=?, is_public=?, updated_at=? WHERE id=?`,
      [goal.title, goal.description ?? '', goal.category, goal.priority,
       goal.deadline ?? null, goal.done ? 1 : 0, goal.progress,
       goal.isPublic ? 1 : 0, new Date().toISOString(), goal.id]
    )
  },

  deleteGoal: async (id) => {
    await db.execute(`UPDATE goals SET is_deleted=1, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
  },

  toggleSubGoal: async (subId, done) => {
    await db.execute(`UPDATE goal_subs SET done=? WHERE id=?`, [done ? 1 : 0, subId])
  },

  addSubGoal: async (goalId, text) => {
    const id = uuidv4()
    await db.execute(
      `INSERT INTO goal_subs (id, goal_id, text, done, is_deleted) VALUES (?, ?, ?, 0, 0)`,
      [id, goalId, text]
    )
  },

  deleteSubGoal: async (subId) => {
    await db.execute(`UPDATE goal_subs SET is_deleted=1 WHERE id=?`, [subId])
  },

  // ── Journal actions ──
  addJournalEntry: async (entry) => {
    const { orgId, userId } = get()
    if (!orgId || !userId) return
    const id = uuidv4()
    const now = new Date().toISOString()
    await db.execute(
      `INSERT INTO journal_entries (id, org_id, user_id, title, content, date, mood, tags, is_public, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, orgId, userId, entry.title, entry.content ?? '', entry.date,
       entry.mood ?? '', JSON.stringify(entry.tags ?? []),
       entry.isPublic ? 1 : 0, now, now]
    )
  },

  updateJournalEntry: async (entry) => {
    await db.execute(
      `UPDATE journal_entries SET title=?, content=?, date=?, mood=?, tags=?, is_public=?, updated_at=? WHERE id=?`,
      [entry.title, entry.content ?? '', entry.date, entry.mood ?? '',
       JSON.stringify(entry.tags ?? []), entry.isPublic ? 1 : 0,
       new Date().toISOString(), entry.id]
    )
  },

  deleteJournalEntry: async (id) => {
    await db.execute(`UPDATE journal_entries SET is_deleted=1, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
  },

  // ── Event actions ──
  addEvent: async (event) => {
    const { orgId, userId } = get()
    if (!orgId || !userId) return
    const id = uuidv4()
    const now = new Date().toISOString()
    await db.execute(
      `INSERT INTO cal_events (id, org_id, user_id, title, date, date_end, start_time, end_time, tag, recur, is_public, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, orgId, userId, event.title, event.date, event.dateEnd ?? null,
       event.startTime ?? null, event.endTime ?? null, event.tag ?? 'default',
       event.recur ?? null, event.isPublic ? 1 : 0, now, now]
    )
  },

  updateEvent: async (event) => {
    await db.execute(
      `UPDATE cal_events SET title=?, date=?, date_end=?, start_time=?, end_time=?, tag=?, recur=?, is_public=?, updated_at=? WHERE id=?`,
      [event.title, event.date, event.dateEnd ?? null, event.startTime ?? null,
       event.endTime ?? null, event.tag, event.recur ?? null,
       event.isPublic ? 1 : 0, new Date().toISOString(), event.id]
    )
  },

  deleteEvent: async (id) => {
    await db.execute(`UPDATE cal_events SET is_deleted=1, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
  },

  // ── Focus session actions ──
  addFocusSession: async (session) => {
    const { orgId, userId } = get()
    if (!orgId || !userId) return
    const id = uuidv4()
    const now = new Date().toISOString()
    await db.execute(
      `INSERT INTO focus_sessions (id, org_id, user_id, date, timer_type, total_cycles, completed_cycles, work_minutes, rest_minutes, long_rest_minutes, completed_tasks, total_focus_seconds, is_public, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, orgId, userId, session.date, session.timerType ?? 'pomodoro',
       session.totalCycles ?? 4, session.completedCycles ?? 0,
       session.workMinutes ?? 25, session.restMinutes ?? 5,
       session.longRestMinutes ?? 15, session.completedTasks ?? 0,
       session.totalFocusSeconds ?? 0, session.isPublic ? 1 : 0, now, now]
    )
  },

  updateFocusSession: async (session) => {
    await db.execute(
      `UPDATE focus_sessions SET completed_cycles=?, completed_tasks=?, total_focus_seconds=?, is_public=?, updated_at=? WHERE id=?`,
      [session.completedCycles, session.completedTasks, session.totalFocusSeconds,
       session.isPublic ? 1 : 0, new Date().toISOString(), session.id]
    )
  },

  // ── Preference actions ──
  setPreference: async (key, value) => {
    const { orgId, userId, preferences } = get()
    if (!orgId || !userId) return
    const existing = preferences.find(p => p.key === key)
    const now = new Date().toISOString()
    if (existing) {
      await db.execute(
        `UPDATE user_preferences SET value=?, updated_at=? WHERE id=?`,
        [JSON.stringify(value), now, existing.id]
      )
    } else {
      const id = uuidv4()
      await db.execute(
        `INSERT INTO user_preferences (id, org_id, user_id, key, value, is_deleted, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [id, orgId, userId, key, JSON.stringify(value), now]
      )
    }
  },

  getPreference: (key) => get().preferences.find(p => p.key === key)?.value ?? null,

  // ── Selectors ──
  getHabitCheckMap: () => {
    const map: HabitCheckMap = {}
    for (const check of get().habitChecks) {
      const hid = String(check.habitId)
      if (!map[hid]) map[hid] = {}
      map[hid][check.date] = check.checked
    }
    return map
  },

  getTodaysTasks: () => {
    const todayStr = new Date().toISOString().split('T')[0]
    return get().tasks.filter(t => t.dueDate === todayStr && !t.completed)
  },

  getOverdueTasks: () => {
    const todayStr = new Date().toISOString().split('T')[0]
    return get().tasks.filter(t => t.dueDate && t.dueDate < todayStr && !t.completed)
  },

  getActiveGoals: () => get().goals.filter(g => !g.done),

  getJournalEntriesByDate: (date: string) =>
    get().journalEntries.filter(e => e.date === date),

  getJournalMoodDistribution: () => {
    const dist: Record<string, number> = {}
    for (const e of get().journalEntries) {
      dist[e.mood] = (dist[e.mood] || 0) + 1
    }
    return dist
  },

  getJournalStreak: () => {
    const entries = get().journalEntries
    const dates = new Set(entries.map(e => e.date))

    let current = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().split('T')[0]
      if (dates.has(ds)) { current++; d.setDate(d.getDate() - 1) }
      else break
    }

    const sorted = [...dates].sort()
    let longest = 0, run = 1
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1])
      const curr = new Date(sorted[i])
      const diff = (curr.getTime() - prev.getTime()) / 86400000
      if (diff === 1) { run++; if (run > longest) longest = run }
      else run = 1
    }
    if (sorted.length > 0 && longest === 0) longest = 1
    if (run > longest) longest = run

    return { current, longest, totalDays: dates.size, dates }
  },

  getSmartConnections: () => {
    const { tasks, goals, habits, journalEntries, events } = get()
    return computeConnections(tasks, goals, habits, journalEntries, events)
  },
}))
