/* ── Shared Productivity Types ── */

export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'todo' | 'inprogress' | 'done'
export type TaskTag = 'work' | 'personal' | 'urgent' | 'health'
export type GoalCategory = 'work' | 'personal' | 'health' | 'learning' | 'finance' | 'creative'

export interface Task {
  id: number
  orgId: string
  userId: string
  title: string
  description: string
  completed: boolean
  priority: Priority
  tag: TaskTag
  status: TaskStatus
  dueDate: string | null
}

export interface Habit {
  id: number
  orgId: string
  userId: string
  name: string
  emoji: string
  sortOrder: number
}

export interface HabitCheck {
  id: number
  habitId: number
  date: string
  checked: boolean
}

export type HabitCheckMap = Record<string, Record<string, boolean>>

export interface SubGoal {
  id: number
  goalId: number
  text: string
  done: boolean
}

export interface Goal {
  id: number
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
}

export interface JournalEntry {
  id: number
  orgId: string
  userId: string
  title: string
  content: string
  date: string
  mood: string
  tags: string[]
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

export interface CalEvent {
  id: number
  orgId: string
  userId: string
  title: string
  date: string
  dateEnd: string | null
  startTime: string | null
  endTime: string | null
  tag: string
  recur: string | null
}

export interface Board {
  id: number
  orgId: string
  userId: string
  name: string
  description: string
  color: string
  icon: string
}

export interface BoardNode {
  id: number
  boardId: number
  type: string
  title: string
  body: string
  x: number
  y: number
  status: string
  priority: string
}

export interface BoardThread {
  id: number
  boardId: number
  fromNodeId: number
  toNodeId: number
  label: string
}
