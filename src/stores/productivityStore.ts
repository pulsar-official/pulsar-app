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
import {
  calculateStreak, getCompletionRateForDate, getLast30DaysData, getHabitsForToday,
} from '@/lib/habitHelpers'

// Fire-and-forget direct API sync — guarantees data reaches Supabase
// regardless of PowerSync cloud connection status. Idempotent via clientId.
function fire(url: string, method: string, body: Record<string, unknown>): void {
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(err => console.warn('[sync]', method, url, err))
}

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
    impact: r.impact ?? 3, effort: r.effort ?? 'm', goalId: r.goal_id ?? null,
    parentId: r.parent_id ?? null, pinned: toBool(r.pinned), sortOrder: r.sort_order ?? 0,
    isDeleted: toBool(r.is_deleted),
  }
}

function mapHabit(r: Row): Habit {
  return {
    id: r.id, orgId: r.org_id, userId: r.user_id,
    name: r.name, emoji: r.emoji ?? '✅',
    sortOrder: r.sort_order ?? 0, isPublic: toBool(r.is_public),
    category: r.category ?? 'health', archived: toBool(r.archived),
    frequency: r.frequency ?? 'daily',
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
    updatedAt: r.updated_at ?? null,
  }
}

function mapJournalEntry(r: Row): JournalEntry {
  let tags: string[] = []
  try { tags = JSON.parse(r.tags ?? '[]') } catch { tags = [] }
  return {
    id: r.id, orgId: r.org_id, userId: r.user_id,
    title: r.title, content: r.content ?? '',
    date: r.date, mood: r.mood ?? '',
    tags, pinned: toBool(r.pinned), isPublic: toBool(r.is_public),
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

  // Undo toast
  undoToast: { label: string; onUndo: () => void } | null
  clearUndoToast: () => void

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
  addHabit: (habit: { name: string; emoji: string; isPublic?: boolean; category?: string; frequency?: string }) => Promise<void>
  updateHabit: (habit: Habit) => Promise<void>
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

  // Habit selectors
  getTodayIncompleteHabits: () => Habit[]
  getHabitStreak: (habitId: string) => number
  get30DayCompletion: () => Array<{ date: Date; completionRate: number }>
  get7DayCompletion: () => Array<{ date: Date; completionRate: number }>
  getTodayCompletionRate: () => number
}

// ── Module-level undo timer ──────────────────────────────────────────────────
let undoTimer: ReturnType<typeof setTimeout> | null = null

// ── Store ────────────────────────────────────────────────────────────────────

export const useProductivityStore = create<ProductivityState>((set, get) => ({
  tasks: [], habits: [], habitChecks: [], goals: [],
  journalEntries: [], events: [], boards: [],
  focusSessions: [], preferences: [],
  orgId: null, userId: null,
  loading: false, initialized: false,
  undoToast: null,
  clearUndoToast: () => {
    if (undoTimer) { clearTimeout(undoTimer); undoTimer = null }
    set({ undoToast: null })
  },
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
      db.getAll(`SELECT hc.* FROM habit_checks hc JOIN habits h ON hc.habit_id = h.id WHERE h.org_id = ? AND (hc.is_deleted = 0 OR hc.is_deleted IS NULL)`, [orgId]),
      db.getAll(`SELECT * FROM goals WHERE org_id = ? AND ${notDeleted}`, [orgId]),
      db.getAll(`SELECT gs.* FROM goal_subs gs JOIN goals g ON gs.goal_id = g.id WHERE g.org_id = ? AND (gs.is_deleted = 0 OR gs.is_deleted IS NULL)`, [orgId]),
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

    // Background cross-device sync: fetch server data and merge items missing locally
    ;(async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const safe = (p: Promise<Response>) => p.then(r => r.ok ? r.json() : null).catch(() => null)
        const [serverTasks, habitsData, serverGoals, serverJournal, serverEvents] = await Promise.all([
          safe(fetch('/api/productivity/tasks')),
          safe(fetch('/api/productivity/habits')),
          safe(fetch('/api/productivity/goals')),
          safe(fetch('/api/productivity/journal')),
          safe(fetch('/api/productivity/events')),
        ])

        const s = get()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const taskList: any[] = Array.isArray(serverTasks) ? serverTasks : []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const habitList: any[] = Array.isArray(habitsData?.habits) ? habitsData.habits : []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const checkList: any[] = Array.isArray(habitsData?.checks) ? habitsData.checks : []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const goalList: any[] = Array.isArray(serverGoals) ? serverGoals : []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const journalList: any[] = Array.isArray(serverJournal) ? serverJournal : []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eventList: any[] = Array.isArray(serverEvents) ? serverEvents : []

        const localTaskIds = new Set(s.tasks.map(t => t.id))
        const localHabitIds = new Set(s.habits.map(h => h.id))
        const localCheckIds = new Set(s.habitChecks.map(c => c.id))
        const localGoalIds = new Set(s.goals.map(g => g.id))
        const localJournalIds = new Set(s.journalEntries.map(e => e.id))
        const localEventIds = new Set(s.events.map(e => e.id))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serverHabitIdToClientId = new Map<number, string>()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const h of habitList) { if (h.clientId) serverHabitIdToClientId.set(h.id, h.clientId) }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newTasks: Task[] = taskList.filter(t => !localTaskIds.has(t.clientId ?? String(t.id))).map((t: any) => ({
          id: t.clientId ?? String(t.id), orgId: t.orgId, userId: t.userId,
          title: t.title, description: t.description ?? '',
          completed: t.completed ?? false, priority: t.priority ?? 'medium',
          tag: t.tag ?? 'work', status: (t.status ?? 'todo') as TaskStatus,
          dueDate: t.dueDate ?? null, isPublic: t.isPublic ?? false, isDeleted: false,
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newHabits: Habit[] = habitList.filter(h => !localHabitIds.has(h.clientId ?? String(h.id))).map((h: any) => ({
          id: h.clientId ?? String(h.id), orgId: h.orgId, userId: h.userId,
          name: h.name, emoji: h.emoji ?? '✅', sortOrder: h.sortOrder ?? 0,
          isPublic: h.isPublic ?? false, isDeleted: false,
        }))

        const newChecks: HabitCheck[] = checkList
          .filter(c => !localCheckIds.has(c.clientId ?? String(c.id)))
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((c: any) => ({
            id: c.clientId ?? String(c.id),
            habitId: serverHabitIdToClientId.get(c.habitId) ?? String(c.habitId),
            date: c.date, checked: c.checked ?? true, isDeleted: false,
          }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newGoals: Goal[] = goalList.filter(g => !localGoalIds.has(g.clientId ?? String(g.id))).map((g: any) => ({
          id: g.clientId ?? String(g.id), orgId: g.orgId, userId: g.userId,
          title: g.title, description: g.description ?? '',
          category: g.category ?? 'work', priority: g.priority ?? 'medium',
          deadline: g.deadline ?? null, done: g.done ?? false,
          progress: g.progress ?? 0, isPublic: g.isPublic ?? false, isDeleted: false,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subs: (g.subs ?? []).map((s: any) => ({
            id: s.clientId ?? String(s.id), goalId: g.clientId ?? String(g.id),
            text: s.text, done: s.done ?? false, isDeleted: false,
          })),
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newJournalEntries: JournalEntry[] = journalList.filter(e => !localJournalIds.has(e.clientId ?? String(e.id))).map((e: any) => ({
          id: e.clientId ?? String(e.id), orgId: e.orgId, userId: e.userId,
          title: e.title, content: e.content ?? '', date: e.date,
          mood: e.mood ?? '', tags: Array.isArray(e.tags) ? e.tags : [],
          isPublic: e.isPublic ?? false, isDeleted: false,
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newEvents: CalEvent[] = eventList.filter(e => !localEventIds.has(e.clientId ?? String(e.id))).map((e: any) => ({
          id: e.clientId ?? String(e.id), orgId: e.orgId, userId: e.userId,
          title: e.title, date: e.date, dateEnd: e.dateEnd ?? null,
          startTime: e.startTime ?? null, endTime: e.endTime ?? null,
          tag: e.tag ?? 'default', recur: e.recur ?? null,
          isPublic: e.isPublic ?? false, isDeleted: false,
        }))

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updates: Partial<ProductivityState> = {}
        if (newTasks.length) updates.tasks = [...get().tasks, ...newTasks]
        if (newHabits.length) updates.habits = [...get().habits, ...newHabits]
        if (newChecks.length) updates.habitChecks = [...get().habitChecks, ...newChecks]
        if (newGoals.length) updates.goals = [...get().goals, ...newGoals]
        if (newJournalEntries.length) updates.journalEntries = [...get().journalEntries, ...newJournalEntries]
        if (newEvents.length) updates.events = [...get().events, ...newEvents]
        if (Object.keys(updates).length > 0) set(updates)
      } catch (err) {
        console.warn('[sync] cross-device sync failed', err)
      }
    })()
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
    const newTask: Task = {
      id, orgId, userId, title: task.title, description: task.description ?? '',
      completed: false, priority: task.priority ?? 'medium', tag: task.tag ?? 'work',
      status: (task.status ?? 'todo') as TaskStatus, dueDate: task.dueDate ?? null,
      isPublic: task.isPublic ?? false, isDeleted: false,
      impact: task.impact ?? 3, effort: task.effort ?? 'm', goalId: task.goalId ?? null,
      parentId: task.parentId ?? null, pinned: task.pinned ?? false, sortOrder: task.sortOrder ?? 0,
    }
    set(state => ({ tasks: [...state.tasks, newTask] }))
    db.execute(
      `INSERT INTO tasks (id, org_id, user_id, title, description, completed, priority, tag, status, due_date, is_public, impact, effort, goal_id, parent_id, pinned, sort_order, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, orgId, userId, task.title, task.description ?? '', task.priority ?? 'medium',
       task.tag ?? 'work', task.status ?? 'todo', task.dueDate ?? null,
       task.isPublic ? 1 : 0, task.impact ?? 3, task.effort ?? 'm', task.goalId ?? null,
       task.parentId ?? null, task.pinned ? 1 : 0, task.sortOrder ?? 0, now, now]
    ).catch(err => console.error('[db] addTask', err))
    fire('/api/productivity/tasks', 'POST', {
      clientId: id, title: task.title, description: task.description ?? '',
      completed: false, priority: task.priority ?? 'medium', tag: task.tag ?? 'work',
      status: task.status ?? 'todo', dueDate: task.dueDate ?? null, isPublic: task.isPublic ?? false,
      impact: task.impact ?? 3, effort: task.effort ?? 'm', goalId: task.goalId ?? null,
      parentId: task.parentId ?? null, pinned: task.pinned ?? false, sortOrder: task.sortOrder ?? 0,
    })
  },

  updateTask: async (task) => {
    set(state => ({ tasks: state.tasks.map(t => t.id === task.id ? { ...t, ...task } : t) }))
    db.execute(
      `UPDATE tasks SET title=?, description=?, completed=?, priority=?, tag=?, status=?, due_date=?, is_public=?, impact=?, effort=?, goal_id=?, parent_id=?, pinned=?, sort_order=?, updated_at=? WHERE id=?`,
      [task.title, task.description ?? '', task.completed ? 1 : 0, task.priority, task.tag,
       task.status, task.dueDate ?? null, task.isPublic ? 1 : 0,
       task.impact ?? 3, task.effort ?? 'm', task.goalId ?? null,
       task.parentId ?? null, task.pinned ? 1 : 0, task.sortOrder ?? 0,
       new Date().toISOString(), task.id]
    ).catch(err => console.error('[db] updateTask', err))
    fire('/api/productivity/tasks', 'POST', {
      clientId: task.id, title: task.title, description: task.description ?? '',
      completed: task.completed, priority: task.priority, tag: task.tag,
      status: task.status, dueDate: task.dueDate ?? null, isPublic: task.isPublic,
      impact: task.impact ?? 3, effort: task.effort ?? 'm', goalId: task.goalId ?? null,
      parentId: task.parentId ?? null, pinned: task.pinned ?? false, sortOrder: task.sortOrder ?? 0,
    })
  },

  deleteTask: async (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }))
    db.execute(`UPDATE tasks SET is_deleted=1, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
      .catch(err => console.error('[db] deleteTask', err))
    fire('/api/productivity/tasks', 'DELETE', { clientId: id })
    if (undoTimer) clearTimeout(undoTimer)
    set({
      undoToast: {
        label: `Deleted "${task.title}"`,
        onUndo: () => {
          set(state => ({ tasks: [...state.tasks, { ...task, isDeleted: false }], undoToast: null }))
          db.execute(`UPDATE tasks SET is_deleted=0, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
            .catch(err => console.error('[db] restoreTask', err))
          fire('/api/productivity/tasks', 'DELETE', { clientId: id, isDeleted: false })
        },
      },
    })
    undoTimer = setTimeout(() => { set({ undoToast: null }); undoTimer = null }, 5000)
  },

  toggleTask: async (id) => {
    const task = get().tasks.find(t => t.id === id)
    if (!task) return
    const newCompleted = !task.completed
    const newStatus: TaskStatus = newCompleted ? 'done' : 'todo'
    set(state => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, completed: newCompleted, status: newStatus } : t) }))
    db.execute(
      `UPDATE tasks SET completed=?, status=?, updated_at=? WHERE id=?`,
      [newCompleted ? 1 : 0, newStatus, new Date().toISOString(), id]
    ).catch(err => console.error('[db] toggleTask', err))
    fire('/api/productivity/tasks', 'POST', {
      clientId: id, title: task.title, description: task.description ?? '',
      completed: newCompleted, priority: task.priority, tag: task.tag,
      status: newStatus, dueDate: task.dueDate ?? null, isPublic: task.isPublic,
    })
  },

  // ── Habit actions ──
  addHabit: async ({ name, emoji, isPublic, category, frequency }) => {
    const { orgId, userId, habits } = get()
    if (!orgId || !userId) return
    const id = uuidv4()
    const now = new Date().toISOString()
    const newHabit: Habit = {
      id, orgId, userId, name, emoji, sortOrder: habits.length,
      isPublic: isPublic ?? false, isDeleted: false,
      category: (category ?? 'health') as Habit['category'],
      archived: false, frequency: (frequency ?? 'daily') as Habit['frequency'],
    }
    set(state => ({ habits: [...state.habits, newHabit] }))
    db.execute(
      `INSERT INTO habits (id, org_id, user_id, name, emoji, sort_order, is_public, category, archived, frequency, is_deleted, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?)`,
      [id, orgId, userId, name, emoji, habits.length, isPublic ? 1 : 0, category ?? 'health', frequency ?? 'daily', now]
    ).catch(err => console.error('[db] addHabit', err))
    fire('/api/productivity/habits', 'POST', {
      clientId: id, name, emoji, sortOrder: habits.length, isPublic: isPublic ?? false,
      category: category ?? 'health', archived: false, frequency: frequency ?? 'daily',
    })
  },

  updateHabit: async (habit) => {
    set(state => ({ habits: state.habits.map(h => h.id === habit.id ? { ...h, ...habit } : h) }))
    db.execute(
      `UPDATE habits SET name=?, emoji=?, sort_order=?, is_public=?, category=?, archived=?, frequency=? WHERE id=?`,
      [habit.name, habit.emoji, habit.sortOrder ?? 0, habit.isPublic ? 1 : 0,
       habit.category ?? 'health', habit.archived ? 1 : 0, habit.frequency ?? 'daily', habit.id]
    ).catch(err => console.error('[db] updateHabit', err))
    fire('/api/productivity/habits', 'POST', {
      clientId: habit.id, name: habit.name, emoji: habit.emoji,
      sortOrder: habit.sortOrder ?? 0, isPublic: habit.isPublic ?? false,
      category: habit.category ?? 'health', archived: habit.archived ?? false,
      frequency: habit.frequency ?? 'daily',
    })
  },

  deleteHabit: async (id) => {
    const habit = get().habits.find(h => h.id === id)
    if (!habit) return
    set(state => ({ habits: state.habits.filter(h => h.id !== id) }))
    db.execute(`UPDATE habits SET is_deleted=1 WHERE id=?`, [id])
      .catch(err => console.error('[db] deleteHabit', err))
    fire('/api/productivity/habits', 'DELETE', { clientId: id })
    if (undoTimer) clearTimeout(undoTimer)
    set({
      undoToast: {
        label: `Deleted "${habit.name}"`,
        onUndo: () => {
          set(state => ({ habits: [...state.habits, { ...habit, isDeleted: false }], undoToast: null }))
          db.execute(`UPDATE habits SET is_deleted=0 WHERE id=?`, [id])
            .catch(err => console.error('[db] restoreHabit', err))
          fire('/api/productivity/habits', 'DELETE', { clientId: id, isDeleted: false })
        },
      },
    })
    undoTimer = setTimeout(() => { set({ undoToast: null }); undoTimer = null }, 5000)
  },

  toggleHabitCheck: async (habitId, date) => {
    const existing = get().habitChecks.find(c => c.habitId === habitId && c.date === date)
    if (existing) {
      set(state => ({ habitChecks: state.habitChecks.filter(c => c.id !== existing.id) }))
      db.execute(`DELETE FROM habit_checks WHERE id=?`, [existing.id])
        .catch(err => console.error('[db] toggleHabitCheck delete', err))
      fire('/api/productivity/habits', 'POST', { action: 'deleteCheck', clientId: existing.id })
    } else {
      const id = uuidv4()
      const now = new Date().toISOString()
      const newCheck: HabitCheck = { id, habitId, date, checked: true, isDeleted: false }
      set(state => ({ habitChecks: [...state.habitChecks, newCheck] }))
      db.execute(
        `INSERT INTO habit_checks (id, habit_id, date, checked, is_deleted, created_at) VALUES (?, ?, ?, 1, 0, ?)`,
        [id, habitId, date, now]
      ).catch(err => console.error('[db] toggleHabitCheck insert', err))
      fire('/api/productivity/habits', 'POST', {
        action: 'insertCheck', clientId: id, habitClientId: habitId, date, checked: true,
      })
    }
  },

  // ── Goal actions ──
  addGoal: async (goal) => {
    const { orgId, userId } = get()
    if (!orgId || !userId) return
    const id = uuidv4()
    const now = new Date().toISOString()
    const newGoal: Goal = {
      id, orgId, userId, title: goal.title, description: goal.description ?? '',
      category: goal.category ?? 'work', priority: goal.priority ?? 'medium',
      deadline: goal.deadline ?? null, done: false, progress: goal.progress ?? 0,
      isPublic: goal.isPublic ?? false, isDeleted: false, subs: [],
    }
    set(state => ({ goals: [...state.goals, newGoal] }))
    db.execute(
      `INSERT INTO goals (id, org_id, user_id, title, description, category, priority, deadline, done, progress, is_public, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?)`,
      [id, orgId, userId, goal.title, goal.description ?? '', goal.category ?? 'work',
       goal.priority ?? 'medium', goal.deadline ?? null, goal.progress ?? 0,
       goal.isPublic ? 1 : 0, now, now]
    ).catch(err => console.error('[db] addGoal', err))
    fire('/api/productivity/goals', 'POST', {
      clientId: id, title: goal.title, description: goal.description ?? '',
      category: goal.category ?? 'work', priority: goal.priority ?? 'medium',
      deadline: goal.deadline ?? null, done: false, progress: goal.progress ?? 0,
      isPublic: goal.isPublic ?? false,
    })
  },

  updateGoal: async (goal) => {
    set(state => ({ goals: state.goals.map(g => g.id === goal.id ? { ...g, ...goal } : g) }))
    db.execute(
      `UPDATE goals SET title=?, description=?, category=?, priority=?, deadline=?, done=?, progress=?, is_public=?, updated_at=? WHERE id=?`,
      [goal.title, goal.description ?? '', goal.category, goal.priority,
       goal.deadline ?? null, goal.done ? 1 : 0, goal.progress,
       goal.isPublic ? 1 : 0, new Date().toISOString(), goal.id]
    ).catch(err => console.error('[db] updateGoal', err))
    fire('/api/productivity/goals', 'POST', {
      clientId: goal.id, title: goal.title, description: goal.description ?? '',
      category: goal.category, priority: goal.priority, deadline: goal.deadline ?? null,
      done: goal.done, progress: goal.progress, isPublic: goal.isPublic,
    })
  },

  deleteGoal: async (id) => {
    const goal = get().goals.find(g => g.id === id)
    if (!goal) return
    set(state => ({ goals: state.goals.filter(g => g.id !== id) }))
    db.execute(`UPDATE goals SET is_deleted=1, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
      .catch(err => console.error('[db] deleteGoal', err))
    fire('/api/productivity/goals', 'DELETE', { clientId: id })
    if (undoTimer) clearTimeout(undoTimer)
    set({
      undoToast: {
        label: `Deleted "${goal.title}"`,
        onUndo: () => {
          set(state => ({ goals: [...state.goals, { ...goal, isDeleted: false }], undoToast: null }))
          db.execute(`UPDATE goals SET is_deleted=0, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
            .catch(err => console.error('[db] restoreGoal', err))
          fire('/api/productivity/goals', 'DELETE', { clientId: id, isDeleted: false })
        },
      },
    })
    undoTimer = setTimeout(() => { set({ undoToast: null }); undoTimer = null }, 5000)
  },

  toggleSubGoal: async (subId, done) => {
    set(state => ({
      goals: state.goals.map(g => ({
        ...g,
        subs: g.subs.map(s => s.id === subId ? { ...s, done } : s),
      })),
    }))
    db.execute(`UPDATE goal_subs SET done=? WHERE id=?`, [done ? 1 : 0, subId])
      .catch(err => console.error('[db] toggleSubGoal', err))
    fire('/api/productivity/goals', 'POST', { action: 'toggleSub', clientId: subId, done })
  },

  addSubGoal: async (goalId, text) => {
    const id = uuidv4()
    const newSub: SubGoal = { id, goalId, text, done: false, isDeleted: false }
    set(state => ({
      goals: state.goals.map(g => g.id === goalId ? { ...g, subs: [...g.subs, newSub] } : g),
    }))
    db.execute(
      `INSERT INTO goal_subs (id, goal_id, text, done, is_deleted) VALUES (?, ?, ?, 0, 0)`,
      [id, goalId, text]
    ).catch(err => console.error('[db] addSubGoal', err))
    fire('/api/productivity/goals', 'POST', {
      action: 'addSub', clientId: id, goalClientId: goalId, text, done: false,
    })
  },

  deleteSubGoal: async (subId) => {
    set(state => ({
      goals: state.goals.map(g => ({ ...g, subs: g.subs.filter(s => s.id !== subId) })),
    }))
    db.execute(`UPDATE goal_subs SET is_deleted=1 WHERE id=?`, [subId])
      .catch(err => console.error('[db] deleteSubGoal', err))
    fire('/api/productivity/goals', 'POST', { action: 'deleteSub', clientId: subId })
  },

  // ── Journal actions ──
  addJournalEntry: async (entry) => {
    const { orgId, userId } = get()
    if (!orgId || !userId) return
    const id = uuidv4()
    const now = new Date().toISOString()
    const newEntry: JournalEntry = {
      id, orgId, userId, title: entry.title, content: entry.content ?? '',
      date: entry.date, mood: entry.mood ?? '', tags: entry.tags ?? [],
      pinned: entry.pinned ?? false,
      isPublic: entry.isPublic ?? false, isDeleted: false,
    }
    set(state => ({ journalEntries: [...state.journalEntries, newEntry] }))
    db.execute(
      `INSERT INTO journal_entries (id, org_id, user_id, title, content, date, mood, tags, pinned, is_public, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, orgId, userId, entry.title, entry.content ?? '', entry.date,
       entry.mood ?? '', JSON.stringify(entry.tags ?? []),
       entry.pinned ? 1 : 0, entry.isPublic ? 1 : 0, now, now]
    ).catch(err => console.error('[db] addJournalEntry', err))
    fire('/api/productivity/journal', 'POST', {
      clientId: id, title: entry.title, content: entry.content ?? '',
      date: entry.date, mood: entry.mood ?? '', tags: entry.tags ?? [],
      pinned: entry.pinned ?? false, isPublic: entry.isPublic ?? false,
    })
  },

  updateJournalEntry: async (entry) => {
    set(state => ({ journalEntries: state.journalEntries.map(e => e.id === entry.id ? { ...e, ...entry } : e) }))
    db.execute(
      `UPDATE journal_entries SET title=?, content=?, date=?, mood=?, tags=?, pinned=?, is_public=?, updated_at=? WHERE id=?`,
      [entry.title, entry.content ?? '', entry.date, entry.mood ?? '',
       JSON.stringify(entry.tags ?? []), entry.pinned ? 1 : 0,
       entry.isPublic ? 1 : 0, new Date().toISOString(), entry.id]
    ).catch(err => console.error('[db] updateJournalEntry', err))
    fire('/api/productivity/journal', 'POST', {
      clientId: entry.id, title: entry.title, content: entry.content ?? '',
      date: entry.date, mood: entry.mood ?? '', tags: entry.tags ?? [],
      pinned: entry.pinned ?? false, isPublic: entry.isPublic ?? false,
    })
  },

  deleteJournalEntry: async (id) => {
    const entry = get().journalEntries.find(e => e.id === id)
    if (!entry) return
    set(state => ({ journalEntries: state.journalEntries.filter(e => e.id !== id) }))
    db.execute(`UPDATE journal_entries SET is_deleted=1, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
      .catch(err => console.error('[db] deleteJournalEntry', err))
    fire('/api/productivity/journal', 'DELETE', { clientId: id })
    if (undoTimer) clearTimeout(undoTimer)
    set({
      undoToast: {
        label: `Deleted "${entry.title}"`,
        onUndo: () => {
          set(state => ({ journalEntries: [...state.journalEntries, { ...entry, isDeleted: false }], undoToast: null }))
          db.execute(`UPDATE journal_entries SET is_deleted=0, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
            .catch(err => console.error('[db] restoreJournalEntry', err))
          fire('/api/productivity/journal', 'DELETE', { clientId: id, isDeleted: false })
        },
      },
    })
    undoTimer = setTimeout(() => { set({ undoToast: null }); undoTimer = null }, 5000)
  },

  // ── Event actions ──
  addEvent: async (event) => {
    const { orgId, userId } = get()
    if (!orgId || !userId) return
    const id = uuidv4()
    const now = new Date().toISOString()
    const newEvent: CalEvent = {
      id, orgId, userId, title: event.title, date: event.date,
      dateEnd: event.dateEnd ?? null, startTime: event.startTime ?? null,
      endTime: event.endTime ?? null, tag: event.tag ?? 'default',
      recur: event.recur ?? null, isPublic: event.isPublic ?? false, isDeleted: false,
    }
    set(state => ({ events: [...state.events, newEvent] }))
    db.execute(
      `INSERT INTO cal_events (id, org_id, user_id, title, date, date_end, start_time, end_time, tag, recur, is_public, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, orgId, userId, event.title, event.date, event.dateEnd ?? null,
       event.startTime ?? null, event.endTime ?? null, event.tag ?? 'default',
       event.recur ?? null, event.isPublic ? 1 : 0, now, now]
    ).catch(err => console.error('[db] addEvent', err))
    fire('/api/productivity/events', 'POST', {
      clientId: id, title: event.title, date: event.date, dateEnd: event.dateEnd ?? null,
      startTime: event.startTime ?? null, endTime: event.endTime ?? null,
      tag: event.tag ?? 'default', recur: event.recur ?? null, isPublic: event.isPublic ?? false,
    })
  },

  updateEvent: async (event) => {
    set(state => ({ events: state.events.map(e => e.id === event.id ? { ...e, ...event } : e) }))
    db.execute(
      `UPDATE cal_events SET title=?, date=?, date_end=?, start_time=?, end_time=?, tag=?, recur=?, is_public=?, updated_at=? WHERE id=?`,
      [event.title, event.date, event.dateEnd ?? null, event.startTime ?? null,
       event.endTime ?? null, event.tag, event.recur ?? null,
       event.isPublic ? 1 : 0, new Date().toISOString(), event.id]
    ).catch(err => console.error('[db] updateEvent', err))
    fire('/api/productivity/events', 'POST', {
      clientId: event.id, title: event.title, date: event.date, dateEnd: event.dateEnd ?? null,
      startTime: event.startTime ?? null, endTime: event.endTime ?? null,
      tag: event.tag, recur: event.recur ?? null, isPublic: event.isPublic ?? false,
    })
  },

  deleteEvent: async (id) => {
    const event = get().events.find(e => e.id === id)
    if (!event) return
    set(state => ({ events: state.events.filter(e => e.id !== id) }))
    db.execute(`UPDATE cal_events SET is_deleted=1, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
      .catch(err => console.error('[db] deleteEvent', err))
    fire('/api/productivity/events', 'DELETE', { clientId: id })
    if (undoTimer) clearTimeout(undoTimer)
    set({
      undoToast: {
        label: `Deleted "${event.title}"`,
        onUndo: () => {
          set(state => ({ events: [...state.events, { ...event, isDeleted: false }], undoToast: null }))
          db.execute(`UPDATE cal_events SET is_deleted=0, updated_at=? WHERE id=?`, [new Date().toISOString(), id])
            .catch(err => console.error('[db] restoreEvent', err))
          fire('/api/productivity/events', 'DELETE', { clientId: id, isDeleted: false })
        },
      },
    })
    undoTimer = setTimeout(() => { set({ undoToast: null }); undoTimer = null }, 5000)
  },

  // ── Focus session actions ──
  addFocusSession: async (session) => {
    const { orgId, userId } = get()
    if (!orgId || !userId) return
    const id = uuidv4()
    const now = new Date().toISOString()
    const newSession: FocusSession = {
      id, orgId, userId, date: session.date, timerType: session.timerType ?? 'pomodoro',
      totalCycles: session.totalCycles ?? 4, completedCycles: session.completedCycles ?? 0,
      workMinutes: session.workMinutes ?? 25, restMinutes: session.restMinutes ?? 5,
      longRestMinutes: session.longRestMinutes ?? 15, completedTasks: session.completedTasks ?? 0,
      totalFocusSeconds: session.totalFocusSeconds ?? 0, isPublic: session.isPublic ?? false, isDeleted: false,
    }
    set(state => ({ focusSessions: [...state.focusSessions, newSession] }))
    db.execute(
      `INSERT INTO focus_sessions (id, org_id, user_id, date, timer_type, total_cycles, completed_cycles, work_minutes, rest_minutes, long_rest_minutes, completed_tasks, total_focus_seconds, is_public, is_deleted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, orgId, userId, session.date, session.timerType ?? 'pomodoro',
       session.totalCycles ?? 4, session.completedCycles ?? 0,
       session.workMinutes ?? 25, session.restMinutes ?? 5,
       session.longRestMinutes ?? 15, session.completedTasks ?? 0,
       session.totalFocusSeconds ?? 0, session.isPublic ? 1 : 0, now, now]
    ).catch(err => console.error('[db] addFocusSession', err))
    fire('/api/productivity/focus-sessions', 'POST', {
      clientId: id, date: session.date, timerType: session.timerType ?? 'pomodoro',
      totalCycles: session.totalCycles ?? 4, completedCycles: session.completedCycles ?? 0,
      workMinutes: session.workMinutes ?? 25, restMinutes: session.restMinutes ?? 5,
      longRestMinutes: session.longRestMinutes ?? 15, completedTasks: session.completedTasks ?? 0,
      totalFocusSeconds: session.totalFocusSeconds ?? 0, isPublic: session.isPublic ?? false,
    })
  },

  updateFocusSession: async (session) => {
    set(state => ({ focusSessions: state.focusSessions.map(s => s.id === session.id ? { ...s, ...session } : s) }))
    db.execute(
      `UPDATE focus_sessions SET completed_cycles=?, completed_tasks=?, total_focus_seconds=?, is_public=?, updated_at=? WHERE id=?`,
      [session.completedCycles, session.completedTasks, session.totalFocusSeconds,
       session.isPublic ? 1 : 0, new Date().toISOString(), session.id]
    ).catch(err => console.error('[db] updateFocusSession', err))
    fire('/api/productivity/focus-sessions', 'POST', {
      clientId: session.id, date: session.date, timerType: session.timerType,
      totalCycles: session.totalCycles, completedCycles: session.completedCycles,
      workMinutes: session.workMinutes, restMinutes: session.restMinutes,
      longRestMinutes: session.longRestMinutes, completedTasks: session.completedTasks,
      totalFocusSeconds: session.totalFocusSeconds, isPublic: session.isPublic ?? false,
    })
  },

  // ── Preference actions ──
  setPreference: async (key, value) => {
    const { orgId, userId, preferences } = get()
    if (!orgId || !userId) return
    const existing = preferences.find(p => p.key === key)
    const now = new Date().toISOString()
    if (existing) {
      set(state => ({ preferences: state.preferences.map(p => p.key === key ? { ...p, value } : p) }))
      db.execute(
        `UPDATE user_preferences SET value=?, updated_at=? WHERE id=?`,
        [JSON.stringify(value), now, existing.id]
      ).catch(err => console.error('[db] setPreference update', err))
      fire('/api/productivity/preferences', 'POST', { clientId: existing.id, key, value })
    } else {
      const id = uuidv4()
      const newPref: UserPreference = { id, orgId, userId, key, value, isDeleted: false }
      set(state => ({ preferences: [...state.preferences, newPref] }))
      db.execute(
        `INSERT INTO user_preferences (id, org_id, user_id, key, value, is_deleted, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?)`,
        [id, orgId, userId, key, JSON.stringify(value), now]
      ).catch(err => console.error('[db] setPreference insert', err))
      fire('/api/productivity/preferences', 'POST', { clientId: id, key, value })
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

  // ── Habit selectors ──

  getTodayIncompleteHabits: () => {
    const habitsForToday = getHabitsForToday(get().habits, get().habitChecks)
    return habitsForToday.filter(h => !h.isCheckedToday)
  },

  getHabitStreak: (habitId: string) => {
    return calculateStreak(habitId, get().habitChecks)
  },

  get30DayCompletion: () => {
    return getLast30DaysData(get().habits, get().habitChecks)
  },

  get7DayCompletion: () => {
    const today = new Date()
    const result: Array<{ date: Date; completionRate: number }> = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const completionRate = getCompletionRateForDate(date, get().habits, get().habitChecks)
      result.push({ date, completionRate })
    }

    return result
  },

  getTodayCompletionRate: () => {
    const today = new Date()
    return getCompletionRateForDate(today, get().habits, get().habitChecks)
  },
}))
