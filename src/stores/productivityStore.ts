import { create } from 'zustand'
import type {
  Task, Habit, HabitCheck, HabitCheckMap, Goal, SubGoal,
  JournalEntry, CalEvent, Board, BoardNode, BoardThread,
  TaskStatus, Priority, TaskTag, GoalCategory,
} from '@/types/productivity'
import type { Connection } from '@/types/connections'
import { computeConnections } from '@/lib/connectionEngine'

/* ── Sample fallback data (used when API unavailable) ── */
const SAMPLE_TASKS: Task[] = [
  { id: 1, orgId: '', userId: '', title: 'Design new dashboard layout', description: '', completed: false, priority: 'high', tag: 'work', status: 'inprogress', dueDate: '2025-06-10' },
  { id: 2, orgId: '', userId: '', title: 'Review pull requests', description: '', completed: false, priority: 'medium', tag: 'work', status: 'todo', dueDate: '2025-06-08' },
  { id: 3, orgId: '', userId: '', title: 'Write unit tests for auth module', description: '', completed: false, priority: 'high', tag: 'work', status: 'todo', dueDate: '2025-06-12' },
  { id: 4, orgId: '', userId: '', title: 'Schedule dentist appointment', description: '', completed: false, priority: 'low', tag: 'personal', status: 'todo', dueDate: '2025-06-15' },
  { id: 5, orgId: '', userId: '', title: 'Prepare sprint presentation', description: '', completed: true, priority: 'medium', tag: 'work', status: 'done', dueDate: '2025-06-05' },
  { id: 6, orgId: '', userId: '', title: 'Morning run - 5km', description: '', completed: false, priority: 'medium', tag: 'health', status: 'todo', dueDate: '' },
  { id: 7, orgId: '', userId: '', title: 'Fix critical login bug', description: '', completed: false, priority: 'high', tag: 'urgent', status: 'inprogress', dueDate: '2025-06-07' },
]

const SAMPLE_HABITS: Habit[] = [
  { id: 1, orgId: '', userId: '', name: 'Morning workout', emoji: '🏋️', sortOrder: 0 },
  { id: 2, orgId: '', userId: '', name: 'Read 30 min', emoji: '📖', sortOrder: 1 },
  { id: 3, orgId: '', userId: '', name: 'Meditate', emoji: '🧘', sortOrder: 2 },
  { id: 4, orgId: '', userId: '', name: 'Drink 2L water', emoji: '💧', sortOrder: 3 },
  { id: 5, orgId: '', userId: '', name: 'No social media', emoji: '📵', sortOrder: 4 },
  { id: 6, orgId: '', userId: '', name: 'Sleep by 11pm', emoji: '😴', sortOrder: 5 },
  { id: 7, orgId: '', userId: '', name: 'Journal entry', emoji: '✍️', sortOrder: 6 },
]

const SAMPLE_GOALS: Goal[] = [
  { id: 1, orgId: '', userId: '', title: 'Ship v2.0', description: 'Complete the major product release', category: 'work', priority: 'high', deadline: '2025-06-01', done: false, progress: 65, subs: [{ id: 1, goalId: 1, text: 'Design review', done: true }, { id: 2, goalId: 1, text: 'Beta testing', done: true }, { id: 3, goalId: 1, text: 'Launch prep', done: false }] },
  { id: 2, orgId: '', userId: '', title: 'Read 24 books', description: 'One book every two weeks', category: 'learning', priority: 'medium', deadline: '2025-12-31', done: false, progress: 25, subs: [] },
  { id: 3, orgId: '', userId: '', title: 'Run half marathon', description: 'Train and complete 21km', category: 'health', priority: 'medium', deadline: '2025-09-15', done: false, progress: 40, subs: [] },
]

const today = new Date().toISOString().split('T')[0]
function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}
const SAMPLE_JOURNAL: JournalEntry[] = [
  { id: 1, orgId: '', userId: '', title: 'Morning reflections', content: 'Today I woke up feeling refreshed and motivated. The sun was out and I had a great coffee.', date: today, mood: '😊', tags: ['gratitude', 'reflection'] },
  { id: 2, orgId: '', userId: '', title: 'Project ideas', content: 'Had some great ideas during the team meeting. We discussed new UI components and architecture patterns.', date: daysAgo(1), mood: '🤩', tags: ['ideas', 'work'] },
  { id: 3, orgId: '', userId: '', title: 'Challenging day', content: 'Today was tough. Multiple deadlines converging and I felt overwhelmed. Need to prioritize better.', date: daysAgo(2), mood: '😔', tags: ['reflection', 'work'] },
  { id: 4, orgId: '', userId: '', title: 'Gratitude practice', content: 'Thankful for my health, my team, and the progress we have made this quarter.', date: daysAgo(3), mood: '😊', tags: ['gratitude'] },
  { id: 5, orgId: '', userId: '', title: 'Weekend plans', content: 'Looking forward to hiking this weekend. Need to prepare gear and check the weather.', date: daysAgo(4), mood: '🤩', tags: ['personal'] },
  { id: 6, orgId: '', userId: '', title: 'Book notes', content: 'Finished reading Atomic Habits. Key takeaway: focus on systems, not goals.', date: daysAgo(5), mood: '😊', tags: ['ideas', 'personal'] },
  { id: 7, orgId: '', userId: '', title: 'Work frustrations', content: 'Deployment failed again. Spent 3 hours debugging infrastructure issues.', date: daysAgo(6), mood: '😡', tags: ['work'] },
  { id: 8, orgId: '', userId: '', title: 'Meditation session', content: 'Did a 20-minute guided meditation. Feeling much calmer and centered now.', date: daysAgo(7), mood: '😊', tags: ['personal', 'reflection'] },
  { id: 9, orgId: '', userId: '', title: 'Goal review', content: 'Reviewed my quarterly goals. On track for most, need to push harder on fitness.', date: daysAgo(8), mood: '😐', tags: ['goals', 'reflection'] },
  { id: 10, orgId: '', userId: '', title: 'Creative writing', content: 'Wrote a short story draft. The words flowed easily today.', date: daysAgo(10), mood: '🤩', tags: ['personal', 'ideas'] },
  { id: 11, orgId: '', userId: '', title: 'Tired day', content: 'Did not sleep well last night. Low energy all day. Going to bed early tonight.', date: daysAgo(12), mood: '😴', tags: ['personal'] },
  { id: 12, orgId: '', userId: '', title: 'Team celebration', content: 'We shipped the feature! Team lunch to celebrate. Feeling proud of everyone.', date: daysAgo(14), mood: '🤩', tags: ['work', 'gratitude'] },
  { id: 13, orgId: '', userId: '', title: 'Quiet Sunday', content: 'Spent the day reading and cooking. Sometimes doing less is more.', date: daysAgo(16), mood: '😊', tags: ['personal', 'reflection'] },
  { id: 14, orgId: '', userId: '', title: 'Learning new things', content: 'Started learning Rust. The ownership model is challenging but elegant.', date: daysAgo(18), mood: '😐', tags: ['ideas', 'goals'] },
  { id: 15, orgId: '', userId: '', title: 'Stressful meeting', content: 'Difficult stakeholder meeting. Need to improve communication skills.', date: daysAgo(20), mood: '😡', tags: ['work', 'reflection'] },
  { id: 16, orgId: '', userId: '', title: 'Morning run', content: 'Ran 5km in the park. Personal best time! The consistency is paying off.', date: daysAgo(22), mood: '🤩', tags: ['personal', 'goals'] },
  { id: 17, orgId: '', userId: '', title: 'Lazy afternoon', content: 'Took a long nap after lunch. Sometimes rest is productive too.', date: daysAgo(25), mood: '😴', tags: ['personal'] },
  { id: 18, orgId: '', userId: '', title: 'Planning ahead', content: 'Mapped out the next sprint. Feeling organized and prepared.', date: daysAgo(28), mood: '😊', tags: ['work', 'goals'] },
]

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

  // Meta
  orgId: string | null
  loading: boolean
  initialized: boolean

  // Fetch all data for an org
  fetchAll: (orgId: string) => Promise<void>

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
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export const useProductivityStore = create<ProductivityState>((set, get) => ({
  tasks: SAMPLE_TASKS,
  habits: SAMPLE_HABITS,
  habitChecks: [],
  goals: SAMPLE_GOALS,
  journalEntries: SAMPLE_JOURNAL,
  events: [],
  boards: [],
  orgId: null,
  loading: false,
  initialized: false,
  selectedJournalEntryId: null,
  setSelectedJournalEntryId: (id) => set({ selectedJournalEntryId: id }),

  fetchAll: async (orgId: string) => {
    set({ loading: true, orgId })
    const [tasksRes, habitsRes, goalsRes, journalRes, eventsRes, boardsRes] = await Promise.all([
      apiFetch<Task[]>('/api/productivity/tasks'),
      apiFetch<{ habits: Habit[]; checks: HabitCheck[] }>('/api/productivity/habits'),
      apiFetch<Goal[]>('/api/productivity/goals'),
      apiFetch<JournalEntry[]>('/api/productivity/journal'),
      apiFetch<CalEvent[]>('/api/productivity/events'),
      apiFetch<Board[]>('/api/productivity/boards'),
    ])
    set({
      tasks: tasksRes ?? SAMPLE_TASKS,
      habits: habitsRes?.habits ?? SAMPLE_HABITS,
      habitChecks: habitsRes?.checks ?? [],
      goals: goalsRes ?? SAMPLE_GOALS,
      journalEntries: journalRes ?? SAMPLE_JOURNAL,
      events: eventsRes ?? [],
      boards: boardsRes ?? [],
      loading: false,
      initialized: true,
    })
  },

  // ── Task actions ──
  addTask: async (task) => {
    const res = await apiFetch<Task>('/api/productivity/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
    if (res) set(s => ({ tasks: [...s.tasks, res] }))
    else {
      const id = Date.now()
      set(s => ({ tasks: [...s.tasks, { ...task, id, orgId: s.orgId ?? '', userId: '' } as Task] }))
    }
  },

  updateTask: async (task) => {
    set(s => ({ tasks: s.tasks.map(t => t.id === task.id ? task : t) }))
    await apiFetch('/api/productivity/tasks', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    })
  },

  deleteTask: async (id) => {
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
    await apiFetch('/api/productivity/tasks', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },

  toggleTask: (id) => {
    set(s => ({
      tasks: s.tasks.map(t => t.id === id ? { ...t, completed: !t.completed, status: (!t.completed ? 'done' : 'todo') as TaskStatus } : t),
    }))
    const task = get().tasks.find(t => t.id === id)
    if (task) {
      apiFetch('/api/productivity/tasks', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
    }
  },

  // ── Habit actions ──
  addHabit: async ({ name, emoji }) => {
    const res = await apiFetch<Habit>('/api/productivity/habits', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji }),
    })
    if (res) set(s => ({ habits: [...s.habits, res] }))
    else {
      const id = Date.now()
      set(s => ({ habits: [...s.habits, { id, orgId: s.orgId ?? '', userId: '', name, emoji, sortOrder: s.habits.length }] }))
    }
  },

  deleteHabit: async (id) => {
    set(s => ({ habits: s.habits.filter(h => h.id !== id), habitChecks: s.habitChecks.filter(c => c.habitId !== id) }))
    await apiFetch('/api/productivity/habits', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },

  toggleHabitCheck: async (habitId, date) => {
    const existing = get().habitChecks.find(c => c.habitId === habitId && c.date === date)
    if (existing) {
      set(s => ({ habitChecks: s.habitChecks.filter(c => c.id !== existing.id) }))
    } else {
      const tempId = Date.now()
      set(s => ({ habitChecks: [...s.habitChecks, { id: tempId, habitId, date, checked: true }] }))
    }
    await apiFetch('/api/productivity/habits', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', habitId, date }),
    })
  },

  // ── Goal actions ──
  addGoal: async (goal) => {
    const res = await apiFetch<Goal>('/api/productivity/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    })
    if (res) set(s => ({ goals: [...s.goals, { ...res, subs: [] }] }))
    else {
      const id = Date.now()
      set(s => ({ goals: [...s.goals, { ...goal, id, orgId: s.orgId ?? '', userId: '', subs: [] } as Goal] }))
    }
  },

  updateGoal: async (goal) => {
    set(s => ({ goals: s.goals.map(g => g.id === goal.id ? goal : g) }))
    await apiFetch('/api/productivity/goals', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    })
  },

  deleteGoal: async (id) => {
    set(s => ({ goals: s.goals.filter(g => g.id !== id) }))
    await apiFetch('/api/productivity/goals', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },

  toggleSubGoal: async (subId, done) => {
    set(s => ({
      goals: s.goals.map(g => ({
        ...g,
        subs: g.subs.map(sub => sub.id === subId ? { ...sub, done } : sub),
      })),
    }))
    await apiFetch('/api/productivity/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggleSub', subId, done }),
    })
  },

  addSubGoal: async (goalId, text) => {
    const res = await apiFetch<SubGoal>('/api/productivity/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addSub', goalId, text }),
    })
    const newSub = res ?? { id: Date.now(), goalId, text, done: false }
    set(s => ({
      goals: s.goals.map(g => g.id === goalId ? { ...g, subs: [...g.subs, newSub] } : g),
    }))
  },

  // ── Journal actions ──
  addJournalEntry: async (entry) => {
    const res = await apiFetch<JournalEntry>('/api/productivity/journal', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    if (res) set(s => ({ journalEntries: [res, ...s.journalEntries] }))
    else {
      const id = Date.now()
      set(s => ({ journalEntries: [{ ...entry, id, orgId: s.orgId ?? '', userId: '' } as JournalEntry, ...s.journalEntries] }))
    }
  },

  updateJournalEntry: async (entry) => {
    set(s => ({ journalEntries: s.journalEntries.map(e => e.id === entry.id ? entry : e) }))
    await apiFetch('/api/productivity/journal', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
  },

  deleteJournalEntry: async (id) => {
    set(s => ({ journalEntries: s.journalEntries.filter(e => e.id !== id) }))
    await apiFetch('/api/productivity/journal', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },

  // ── Event actions ──
  addEvent: async (event) => {
    const res = await apiFetch<CalEvent>('/api/productivity/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
    if (res) set(s => ({ events: [...s.events, res] }))
    else {
      const id = Date.now()
      set(s => ({ events: [...s.events, { ...event, id, orgId: s.orgId ?? '', userId: '' } as CalEvent] }))
    }
  },

  updateEvent: async (event) => {
    set(s => ({ events: s.events.map(e => e.id === event.id ? event : e) }))
    await apiFetch('/api/productivity/events', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
  },

  deleteEvent: async (id) => {
    set(s => ({ events: s.events.filter(e => e.id !== id) }))
    await apiFetch('/api/productivity/events', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
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
    const todayStr = new Date().toISOString().split('T')[0]

    // Current streak: count consecutive days backwards from today
    let current = 0
    const d = new Date()
    while (true) {
      const ds = d.toISOString().split('T')[0]
      if (dates.has(ds)) { current++; d.setDate(d.getDate() - 1) }
      else break
    }

    // Longest streak: walk all sorted dates
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
