/* ── Shared Productivity Types ── */

export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'todo' | 'inprogress' | 'done'
export type TaskTag = 'work' | 'personal' | 'urgent' | 'health'
export type GoalCategory = 'work' | 'personal' | 'health' | 'learning' | 'finance' | 'creative'

/** Sync metadata present on all syncable entities */
export interface SyncMeta {
  hlcTimestamp?: string | null
  syncVersion?: number | null
  isDeleted?: boolean | null
}

export type EffortSize = 'xs' | 's' | 'm' | 'l' | 'xl'

export interface Task extends SyncMeta {
  id: string
  orgId: string
  userId: string
  title: string
  description: string
  completed: boolean
  priority: Priority
  tag: TaskTag
  status: TaskStatus
  dueDate: string | null
  isPublic?: boolean
  impact?: number          // 1–5 (ROI field)
  effort?: EffortSize      // ROI field
  goalId?: string | null   // linked goal for ROI boost
  parentId?: string | null // subtask parent
  pinned?: boolean
  sortOrder?: number
}

export type HabitCategory = 'health' | 'work' | 'learning' | 'personal'
export type HabitFrequency = 'daily' | 'weekly'

export interface Habit extends SyncMeta {
  id: string
  orgId: string
  userId: string
  name: string
  emoji: string
  sortOrder: number
  isPublic?: boolean
  category?: HabitCategory
  archived?: boolean
  frequency?: HabitFrequency
}

export interface HabitCheck extends SyncMeta {
  id: string
  habitId: string
  date: string
  checked: boolean
}

export type HabitCheckMap = Record<string, Record<string, boolean>>

export interface SubGoal extends SyncMeta {
  id: string
  goalId: string
  text: string
  done: boolean
}

export interface Goal extends SyncMeta {
  id: string
  orgId: string
  userId: string
  title: string
  description: string
  category: GoalCategory
  priority: Priority
  deadline: string | null
  done: boolean
  progress: number
  subs: SubGoal[]
  isPublic?: boolean
  updatedAt?: string | null
}

export interface JournalEntry extends SyncMeta {
  id: string
  orgId: string
  userId: string
  title: string
  pinned?: boolean
  content: string
  date: string
  mood: string
  tags: string[]
  isPublic?: boolean
}

export interface JournalTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: 'reflection' | 'planning' | 'gratitude' | 'review' | 'creative'
  prompts: string[]
  defaultTags: string[]
}

export interface JournalPrompt {
  id: string
  text: string
  category: 'self-reflection' | 'gratitude' | 'goals' | 'creativity' | 'mindfulness' | 'growth'
}

export interface CalEvent extends SyncMeta {
  id: string
  orgId: string
  userId: string
  title: string
  date: string
  dateEnd: string | null
  startTime: string | null
  endTime: string | null
  tag: string
  recur: string | null
  isPublic?: boolean
}

export interface Board extends SyncMeta {
  id: string
  orgId: string
  userId: string
  name: string
  description: string
  color: string
  icon: string
  isPublic?: boolean
}

export interface BoardNode extends SyncMeta {
  id: string
  boardId: string
  type: string
  title: string
  body: string
  x: number
  y: number
  status: string
  priority: string
}

export interface BoardThread extends SyncMeta {
  id: string
  boardId: string
  fromNodeId: string
  toNodeId: string
  label: string
}

export interface FocusSession extends SyncMeta {
  id: string
  orgId: string
  userId: string
  date: string
  timerType: string
  totalCycles: number
  completedCycles: number
  workMinutes: number
  restMinutes: number
  longRestMinutes: number
  completedTasks: number
  totalFocusSeconds: number
  isPublic?: boolean
}

export interface UserPreference extends SyncMeta {
  id: string
  orgId: string
  userId: string
  key: string
  value: unknown
}

export interface Note extends SyncMeta {
  id: string
  orgId: string
  userId: string
  title: string
  content: string
  isPublic: boolean
  tags: string[]
}
