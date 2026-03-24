import { create } from 'zustand'
import type {
  Task, Habit, HabitCheck, HabitCheckMap, Goal, SubGoal,
  JournalEntry, CalEvent, Board, FocusSession, UserPreference,
  TaskStatus,
} from '@/types/productivity'
import type { Connection } from '@/types/connections'
import { computeConnections } from '@/lib/connectionEngine'
import type { SyncManager, RemoteChange } from '@/lib/sync/syncManager'
import { saveAppStateCache, getAppStateCache, type AppStateSnapshot } from '@/lib/sync/syncStorage'

/* ── Store interface ── */
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
  loading: boolean
  initialized: boolean

  // Sync manager reference (set by useSync hook)
  _syncManager: SyncManager | null
  setSyncManager: (manager: SyncManager | null) => void

  // Fetch all data for an org (initial hydration)
  fetchAll: (orgId: string) => Promise<void>

  // Apply a remote change from sync
  applyRemoteChange: (change: RemoteChange) => void

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'orgId' | 'userId'>) => Promise<void>
  updateTask: (task: Task) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  toggleTask: (id: number) => void

  // Habit actions
  addHabit: (habit: { name: string; emoji: string }) => Promise<void>
  deleteHabit: (id: number) => Promise<void>
  toggleHabitCheck: (habitId: number, date: string) => Promise<void>

  // Goal actions
  addGoal: (goal: Omit<Goal, 'id' | 'orgId' | 'userId' | 'subs'>) => Promise<void>
  updateGoal: (goal: Goal) => Promise<void>
  deleteGoal: (id: number) => Promise<void>
  toggleSubGoal: (subId: number, done: boolean) => Promise<void>
  addSubGoal: (goalId: number, text: string) => Promise<void>

  // Journal actions
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'orgId' | 'userId'>) => Promise<void>
  updateJournalEntry: (entry: JournalEntry) => Promise<void>
  deleteJournalEntry: (id: number) => Promise<void>

  // Event actions
  addEvent: (event: Omit<CalEvent, 'id' | 'orgId' | 'userId'>) => Promise<void>
  updateEvent: (event: CalEvent) => Promise<void>
  deleteEvent: (id: number) => Promise<void>

  // Focus session actions
  addFocusSession: (session: Omit<FocusSession, 'id' | 'orgId' | 'userId'>) => Promise<void>
  updateFocusSession: (session: FocusSession) => Promise<void>

  // Preference actions
  setPreference: (key: string, value: unknown) => Promise<void>
  getPreference: (key: string) => unknown

  // Journal cross-component navigation
  selectedJournalEntryId: number | null
  setSelectedJournalEntryId: (id: number | null) => void

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

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      const errorText = await res.text()
      console.error(`[API ERROR] ${options?.method || 'GET'} ${url} - Status: ${res.status}`, errorText)
      return null
    }
    return res.json()
  } catch (error) {
    console.error(`[API FETCH ERROR] ${url}`, error)
    return null
  }
}

/**
 * Send a mutation through the sync manager, or fall back to direct HTTP.
 * Returns null when the op is queued (offline or via sync).
 */
async function syncMutate(
  manager: SyncManager | null,
  type: 'create' | 'update' | 'delete',
  entityType: Parameters<SyncManager['create']>[0],
  entityIdOrFields: number | Record<string, unknown>,
  fields?: Record<string, unknown>,
): Promise<{ tempId?: string } | null> {
  if (!manager) {
    // No sync manager — direct HTTP (shouldn't happen in normal flow)
    return null
  }

  if (type === 'create') {
    const result = await manager.create(entityType, entityIdOrFields as Record<string, unknown>)
    return { tempId: result.tempId }
  } else if (type === 'update') {
    await manager.update(entityType, entityIdOrFields as number, fields!)
    return null
  } else {
    await manager.delete(entityType, entityIdOrFields as number)
    return null
  }
}

export const useProductivityStore = create<ProductivityState>((set, get) => ({
  tasks: [],
  habits: [],
  habitChecks: [],
  goals: [],
  journalEntries: [],
  events: [],
  boards: [],
  focusSessions: [],
  preferences: [],
  orgId: null,
  loading: false,
  initialized: false,
  selectedJournalEntryId: null,
  setSelectedJournalEntryId: (id) => set({ selectedJournalEntryId: id }),

  _syncManager: null,
  setSyncManager: (manager) => set({ _syncManager: manager }),

  fetchAll: async (orgId: string) => {
    set({ loading: true, orgId })

    // Phase 1: Load cached snapshot from IndexedDB for instant UI (non-blocking)
    try {
      const cached = await getAppStateCache(orgId)
      if (cached && !get().initialized) {
        const c = cached as unknown as Record<string, unknown>
        set({
          tasks: (c.tasks ?? []) as Task[],
          habits: (c.habits ?? []) as Habit[],
          habitChecks: (c.habitChecks ?? []) as HabitCheck[],
          goals: (c.goals ?? []) as Goal[],
          journalEntries: (c.journalEntries ?? []) as JournalEntry[],
          events: (c.events ?? []) as CalEvent[],
          boards: (c.boards ?? []) as Board[],
          focusSessions: (c.focusSessions ?? []) as FocusSession[],
          preferences: (c.preferences ?? []) as UserPreference[],
        })
      }
    } catch {
      // Cache miss is fine — proceed to server fetch
    }

    // Phase 2: Fetch fresh data from server (initial hydration)
    const [tasksRes, habitsRes, goalsRes, journalRes, eventsRes, boardsRes, focusRes, prefsRes] = await Promise.all([
      apiFetch<Task[]>('/api/productivity/tasks'),
      apiFetch<{ habits: Habit[]; checks: HabitCheck[] }>('/api/productivity/habits'),
      apiFetch<Goal[]>('/api/productivity/goals'),
      apiFetch<JournalEntry[]>('/api/productivity/journal'),
      apiFetch<CalEvent[]>('/api/productivity/events'),
      apiFetch<Board[]>('/api/productivity/boards'),
      apiFetch<FocusSession[]>('/api/productivity/focus-sessions'),
      apiFetch<UserPreference[]>('/api/productivity/preferences'),
    ])

    const current = get()
    const freshState = {
      tasks: tasksRes ?? current.tasks,
      habits: habitsRes?.habits ?? current.habits,
      habitChecks: habitsRes?.checks ?? current.habitChecks,
      goals: goalsRes ?? current.goals,
      journalEntries: journalRes ?? current.journalEntries,
      events: eventsRes ?? current.events,
      boards: boardsRes ?? current.boards,
      focusSessions: focusRes ?? current.focusSessions,
      preferences: prefsRes ?? current.preferences,
    }

    set({
      ...freshState,
      loading: false,
      initialized: true,
    })

    // Phase 3: Persist fresh data to cache for next cold start
    saveAppStateCache({ orgId, ...freshState, cachedAt: Date.now() })
  },

  /* ── Apply remote changes from sync ── */
  applyRemoteChange: (change: RemoteChange) => {
    const { entityType, entityId, operation, fields } = change

    // Handle temp ID remapping
    if (fields._tempIdRemap) {
      const { from, to } = fields._tempIdRemap as { from: string; to: number }
      const tempNumericId = parseInt(from.replace('temp:', ''), 10) || Date.now()
      // Remap the temp ID in the appropriate collection
      switch (entityType) {
        case 'task':
          set(s => ({ tasks: s.tasks.map(t => t.id === tempNumericId ? { ...t, id: to } : t) }))
          break
        case 'habit':
          set(s => ({ habits: s.habits.map(h => h.id === tempNumericId ? { ...h, id: to } : h) }))
          break
        case 'goal':
          set(s => ({ goals: s.goals.map(g => g.id === tempNumericId ? { ...g, id: to } : g) }))
          break
        case 'journal':
          set(s => ({ journalEntries: s.journalEntries.map(e => e.id === tempNumericId ? { ...e, id: to } : e) }))
          break
        case 'event':
          set(s => ({ events: s.events.map(e => e.id === tempNumericId ? { ...e, id: to } : e) }))
          break
        case 'board':
          set(s => ({ boards: s.boards.map(b => b.id === tempNumericId ? { ...b, id: to } : b) }))
          break
        case 'focusSession':
          set(s => ({ focusSessions: s.focusSessions.map(f => f.id === tempNumericId ? { ...f, id: to } : f) }))
          break
        case 'userPreference':
          set(s => ({ preferences: s.preferences.map(p => p.id === tempNumericId ? { ...p, id: to } : p) }))
          break
      }
      return
    }

    if (operation === 'delete') {
      switch (entityType) {
        case 'task':
          set(s => ({ tasks: s.tasks.filter(t => t.id !== entityId) }))
          break
        case 'habit':
          set(s => ({
            habits: s.habits.filter(h => h.id !== entityId),
            habitChecks: s.habitChecks.filter(c => c.habitId !== entityId),
          }))
          break
        case 'habitCheck':
          set(s => ({ habitChecks: s.habitChecks.filter(c => c.id !== entityId) }))
          break
        case 'goal':
          set(s => ({ goals: s.goals.filter(g => g.id !== entityId) }))
          break
        case 'goalSub':
          set(s => ({
            goals: s.goals.map(g => ({
              ...g,
              subs: g.subs.filter(sub => sub.id !== entityId),
            })),
          }))
          break
        case 'journal':
          set(s => ({ journalEntries: s.journalEntries.filter(e => e.id !== entityId) }))
          break
        case 'event':
          set(s => ({ events: s.events.filter(e => e.id !== entityId) }))
          break
        case 'board':
          set(s => ({ boards: s.boards.filter(b => b.id !== entityId) }))
          break
        case 'focusSession':
          set(s => ({ focusSessions: s.focusSessions.filter(f => f.id !== entityId) }))
          break
        case 'userPreference':
          set(s => ({ preferences: s.preferences.filter(p => p.id !== entityId) }))
          break
      }
      return
    }

    if (operation === 'update') {
      switch (entityType) {
        case 'task':
          set(s => ({ tasks: s.tasks.map(t => t.id === entityId ? { ...t, ...fields } : t) }))
          break
        case 'habit':
          set(s => ({ habits: s.habits.map(h => h.id === entityId ? { ...h, ...fields } : h) }))
          break
        case 'goal':
          set(s => ({ goals: s.goals.map(g => g.id === entityId ? { ...g, ...fields } : g) }))
          break
        case 'goalSub':
          set(s => ({
            goals: s.goals.map(g => ({
              ...g,
              subs: g.subs.map(sub => sub.id === entityId ? { ...sub, ...fields } : sub),
            })),
          }))
          break
        case 'journal':
          set(s => ({ journalEntries: s.journalEntries.map(e => e.id === entityId ? { ...e, ...fields } : e) }))
          break
        case 'event':
          set(s => ({ events: s.events.map(e => e.id === entityId ? { ...e, ...fields } : e) }))
          break
        case 'board':
          set(s => ({ boards: s.boards.map(b => b.id === entityId ? { ...b, ...fields } : b) }))
          break
        case 'focusSession':
          set(s => ({ focusSessions: s.focusSessions.map(f => f.id === entityId ? { ...f, ...fields } : f) }))
          break
        case 'userPreference':
          set(s => ({ preferences: s.preferences.map(p => p.id === entityId ? { ...p, ...fields } : p) }))
          break
      }
      return
    }

    if (operation === 'create') {
      // Remote create — add to the collection if not already present
      switch (entityType) {
        case 'task':
          set(s => {
            if (s.tasks.some(t => t.id === entityId)) return s
            return { tasks: [...s.tasks, { id: entityId, orgId: s.orgId ?? '', userId: '', ...fields } as Task] }
          })
          break
        case 'habit':
          set(s => {
            if (s.habits.some(h => h.id === entityId)) return s
            return { habits: [...s.habits, { id: entityId, orgId: s.orgId ?? '', userId: '', ...fields } as Habit] }
          })
          break
        case 'goal':
          set(s => {
            if (s.goals.some(g => g.id === entityId)) return s
            return { goals: [...s.goals, { id: entityId, orgId: s.orgId ?? '', userId: '', title: '', description: '', category: 'work', priority: 'medium', deadline: null, done: false, progress: 0, subs: [], ...fields } as Goal] }
          })
          break
        case 'journal':
          set(s => {
            if (s.journalEntries.some(e => e.id === entityId)) return s
            return { journalEntries: [{ id: entityId, orgId: s.orgId ?? '', userId: '', ...fields } as JournalEntry, ...s.journalEntries] }
          })
          break
        case 'event':
          set(s => {
            if (s.events.some(e => e.id === entityId)) return s
            return { events: [...s.events, { id: entityId, orgId: s.orgId ?? '', userId: '', ...fields } as CalEvent] }
          })
          break
        case 'board':
          set(s => {
            if (s.boards.some(b => b.id === entityId)) return s
            return { boards: [...s.boards, { id: entityId, orgId: s.orgId ?? '', userId: '', ...fields } as Board] }
          })
          break
        case 'focusSession':
          set(s => {
            if (s.focusSessions.some(f => f.id === entityId)) return s
            return { focusSessions: [...s.focusSessions, { id: entityId, orgId: s.orgId ?? '', userId: '', ...fields } as FocusSession] }
          })
          break
        case 'userPreference':
          set(s => {
            if (s.preferences.some(p => p.id === entityId)) return s
            return { preferences: [...s.preferences, { id: entityId, orgId: s.orgId ?? '', userId: '', ...fields } as UserPreference] }
          })
          break
      }
    }
  },

  // ── Task actions ──
  addTask: async (task) => {
    const manager = get()._syncManager
    const tempId = Date.now()

    // Optimistic update
    set(s => ({ tasks: [...s.tasks, { ...task, id: tempId, orgId: s.orgId ?? '', userId: '' } as Task] }))

    if (manager) {
      syncMutate(manager, 'create', 'task', {
        title: task.title, description: task.description ?? '', completed: task.completed ?? false,
        priority: task.priority ?? 'medium', tag: task.tag ?? 'work', status: task.status ?? 'todo',
        dueDate: task.dueDate ?? null,
      })
    } else {
      // Fallback: direct HTTP
      const res = await apiFetch<Task>('/api/productivity/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (res) set(s => ({ tasks: s.tasks.map(t => t.id === tempId ? res : t) }))
    }
  },

  updateTask: async (task) => {
    set(s => ({ tasks: s.tasks.map(t => t.id === task.id ? task : t) }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'update', 'task', task.id, {
        title: task.title, description: task.description, completed: task.completed,
        priority: task.priority, tag: task.tag, status: task.status, dueDate: task.dueDate,
      })
    } else {
      await apiFetch('/api/productivity/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
    }
  },

  deleteTask: async (id) => {
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'delete', 'task', id)
    } else {
      await apiFetch('/api/productivity/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    }
  },

  toggleTask: (id) => {
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, completed: !t.completed, status: (!t.completed ? 'done' : 'todo') as TaskStatus } : t),
    }))
    const task = get().tasks.find(t => t.id === id)
    if (task) {
      const manager = get()._syncManager
      if (manager) {
        syncMutate(manager, 'update', 'task', id, { completed: task.completed, status: task.status })
      } else {
        apiFetch('/api/productivity/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        })
      }
    }
  },

  // ── Habit actions ──
  addHabit: async ({ name, emoji }) => {
    const tempId = Date.now()
    set(s => ({ habits: [...s.habits, { id: tempId, orgId: s.orgId ?? '', userId: '', name, emoji, sortOrder: s.habits.length }] }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'create', 'habit', { name, emoji, sortOrder: get().habits.length - 1 })
    } else {
      const res = await apiFetch<Habit>('/api/productivity/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji }),
      })
      if (res) set(s => ({ habits: s.habits.map(h => h.id === tempId ? res : h) }))
    }
  },

  deleteHabit: async (id) => {
    set(s => ({ habits: s.habits.filter(h => h.id !== id), habitChecks: s.habitChecks.filter(c => c.habitId !== id) }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'delete', 'habit', id)
    } else {
      await apiFetch('/api/productivity/habits', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    }
  },

  toggleHabitCheck: async (habitId, date) => {
    const existing = get().habitChecks.find(c => c.habitId === habitId && c.date === date)
    if (existing) {
      set(s => ({ habitChecks: s.habitChecks.filter(c => c.id !== existing.id) }))
      const manager = get()._syncManager
      if (manager) {
        syncMutate(manager, 'delete', 'habitCheck', existing.id)
      } else {
        await apiFetch('/api/productivity/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'toggle', habitId, date }),
        })
      }
    } else {
      const tempId = Date.now()
      set(s => ({ habitChecks: [...s.habitChecks, { id: tempId, habitId, date, checked: true }] }))
      const manager = get()._syncManager
      if (manager) {
        syncMutate(manager, 'create', 'habitCheck', { habitId, date, checked: true })
      } else {
        await apiFetch('/api/productivity/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'toggle', habitId, date }),
        })
      }
    }
  },

  // ── Goal actions ──
  addGoal: async (goal) => {
    const tempId = Date.now()
    set(s => ({ goals: [...s.goals, { ...goal, id: tempId, orgId: s.orgId ?? '', userId: '', subs: [] } as Goal] }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'create', 'goal', {
        title: goal.title, description: goal.description ?? '', category: goal.category ?? 'work',
        priority: goal.priority ?? 'medium', deadline: goal.deadline ?? null, done: goal.done ?? false,
        progress: goal.progress ?? 0,
      })
    } else {
      const res = await apiFetch<Goal>('/api/productivity/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      })
      if (res) set(s => ({ goals: s.goals.map(g => g.id === tempId ? { ...res, subs: [] } : g) }))
    }
  },

  updateGoal: async (goal) => {
    set(s => ({ goals: s.goals.map(g => g.id === goal.id ? goal : g) }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'update', 'goal', goal.id, {
        title: goal.title, description: goal.description, category: goal.category,
        priority: goal.priority, deadline: goal.deadline, done: goal.done, progress: goal.progress,
      })
    } else {
      await apiFetch('/api/productivity/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      })
    }
  },

  deleteGoal: async (id) => {
    set(s => ({ goals: s.goals.filter(g => g.id !== id) }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'delete', 'goal', id)
    } else {
      await apiFetch('/api/productivity/goals', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    }
  },

  toggleSubGoal: async (subId, done) => {
    set(s => ({
      goals: s.goals.map(g => ({
        ...g,
        subs: g.subs.map(sub => sub.id === subId ? { ...sub, done } : sub),
      })),
    }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'update', 'goalSub', subId, { done })
    } else {
      await apiFetch('/api/productivity/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggleSub', subId, done }),
      })
    }
  },

  addSubGoal: async (goalId, text) => {
    const tempId = Date.now()
    set(s => ({
      goals: s.goals.map(g => g.id === goalId ? { ...g, subs: [...g.subs, { id: tempId, goalId, text, done: false }] } : g),
    }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'create', 'goalSub', { goalId, text, done: false })
    } else {
      const res = await apiFetch<SubGoal>('/api/productivity/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addSub', goalId, text }),
      })
      if (res) {
        set(s => ({
          goals: s.goals.map(g => g.id === goalId
            ? { ...g, subs: g.subs.map(sub => sub.id === tempId ? res : sub) }
            : g
          ),
        }))
      }
    }
  },

  // ── Journal actions ──
  addJournalEntry: async (entry) => {
    const tempId = Date.now()
    set(s => ({ journalEntries: [{ ...entry, id: tempId, orgId: s.orgId ?? '', userId: '' } as JournalEntry, ...s.journalEntries] }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'create', 'journal', {
        title: entry.title, content: entry.content ?? '', date: entry.date,
        mood: entry.mood ?? '', tags: entry.tags ?? [],
      })
    } else {
      const res = await apiFetch<JournalEntry>('/api/productivity/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (res) set(s => ({ journalEntries: s.journalEntries.map(e => e.id === tempId ? res : e) }))
    }
  },

  updateJournalEntry: async (entry) => {
    set(s => ({ journalEntries: s.journalEntries.map(e => e.id === entry.id ? entry : e) }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'update', 'journal', entry.id, {
        title: entry.title, content: entry.content, date: entry.date,
        mood: entry.mood, tags: entry.tags,
      })
    } else {
      await apiFetch('/api/productivity/journal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
    }
  },

  deleteJournalEntry: async (id) => {
    set(s => ({ journalEntries: s.journalEntries.filter(e => e.id !== id) }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'delete', 'journal', id)
    } else {
      await apiFetch('/api/productivity/journal', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    }
  },

  // ── Event actions ──
  addEvent: async (event) => {
    const tempId = Date.now()
    set(s => ({ events: [...s.events, { ...event, id: tempId, orgId: s.orgId ?? '', userId: '' } as CalEvent] }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'create', 'event', {
        title: event.title, date: event.date, dateEnd: event.dateEnd ?? null,
        startTime: event.startTime ?? null, endTime: event.endTime ?? null,
        tag: event.tag ?? 'default', recur: event.recur ?? null,
      })
    } else {
      const res = await apiFetch<CalEvent>('/api/productivity/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
      if (res) set(s => ({ events: s.events.map(e => e.id === tempId ? res : e) }))
    }
  },

  updateEvent: async (event) => {
    set(s => ({ events: s.events.map(e => e.id === event.id ? event : e) }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'update', 'event', event.id, {
        title: event.title, date: event.date, dateEnd: event.dateEnd,
        startTime: event.startTime, endTime: event.endTime, tag: event.tag, recur: event.recur,
      })
    } else {
      await apiFetch('/api/productivity/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      })
    }
  },

  deleteEvent: async (id) => {
    set(s => ({ events: s.events.filter(e => e.id !== id) }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'delete', 'event', id)
    } else {
      await apiFetch('/api/productivity/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    }
  },

  // ── Focus session actions ──
  addFocusSession: async (session) => {
    const tempId = Date.now()
    set(s => ({ focusSessions: [...s.focusSessions, { ...session, id: tempId, orgId: s.orgId ?? '', userId: '' } as FocusSession] }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'create', 'focusSession', {
        date: session.date, timerType: session.timerType ?? 'pomodoro',
        totalCycles: session.totalCycles ?? 4, completedCycles: session.completedCycles ?? 0,
        workMinutes: session.workMinutes ?? 25, restMinutes: session.restMinutes ?? 5,
        longRestMinutes: session.longRestMinutes ?? 15, completedTasks: session.completedTasks ?? 0,
        totalFocusSeconds: session.totalFocusSeconds ?? 0,
      })
    } else {
      const res = await apiFetch<FocusSession>('/api/productivity/focus-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      })
      if (res) set(s => ({ focusSessions: s.focusSessions.map(f => f.id === tempId ? res : f) }))
    }
  },

  updateFocusSession: async (session) => {
    set(s => ({ focusSessions: s.focusSessions.map(f => f.id === session.id ? session : f) }))
    const manager = get()._syncManager
    if (manager) {
      syncMutate(manager, 'update', 'focusSession', session.id, {
        completedCycles: session.completedCycles, completedTasks: session.completedTasks,
        totalFocusSeconds: session.totalFocusSeconds,
      })
    } else {
      await apiFetch('/api/productivity/focus-sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      })
    }
  },

  // ── Preference actions ──
  setPreference: async (key, value) => {
    const existing = get().preferences.find(p => p.key === key)
    if (existing) {
      set(s => ({ preferences: s.preferences.map(p => p.key === key ? { ...p, value } : p) }))
      const manager = get()._syncManager
      if (manager) {
        syncMutate(manager, 'update', 'userPreference', existing.id, { value })
      } else {
        await apiFetch('/api/productivity/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existing.id, value }),
        })
      }
    } else {
      const tempId = Date.now()
      set(s => ({ preferences: [...s.preferences, { id: tempId, orgId: s.orgId ?? '', userId: '', key, value } as UserPreference] }))
      const manager = get()._syncManager
      if (manager) {
        syncMutate(manager, 'create', 'userPreference', { key, value })
      } else {
        const res = await apiFetch<UserPreference>('/api/productivity/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        })
        if (res) set(s => ({ preferences: s.preferences.map(p => p.id === tempId ? res : p) }))
      }
    }
  },

  getPreference: (key) => {
    return get().preferences.find(p => p.key === key)?.value ?? null
  },

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
