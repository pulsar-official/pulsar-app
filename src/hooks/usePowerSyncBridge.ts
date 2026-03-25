'use client'

/**
 * usePowerSyncBridge
 *
 * Subscribes to PowerSync's native db.watch() API for each entity.
 * This fires reliably whenever SQLite changes — from local writes OR
 * from remote sync streamed in from other tabs/devices.
 *
 * Must be called inside a component wrapped by <PowerSyncProvider>.
 */

import { useEffect } from 'react'
import { usePowerSync } from '@powersync/react'
import { useProductivityStore } from '@/stores/productivityStore'
import type {
  Task, Habit, HabitCheck, Goal, SubGoal,
  JournalEntry, CalEvent, Board, FocusSession, UserPreference,
} from '@/types/productivity'

// SQLite stores booleans as 0/1 integers
const bool = (v: unknown): boolean => v === 1 || v === true

// SQLite stores JSON columns as TEXT
const parseJson = <T>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string') return fallback
  try { return JSON.parse(v) as T } catch { return fallback }
}

// PowerSync IDs come back as strings; our types expect numbers
const num = (v: unknown): number =>
  typeof v === 'string' ? parseInt(v, 10) : Number(v)

type Row = Record<string, unknown>

const mapTask = (r: Row): Task => ({
  id:          num(r.id),
  orgId:       r.org_id as string,
  userId:      r.user_id as string,
  title:       r.title as string,
  description: (r.description ?? '') as string,
  completed:   bool(r.completed),
  priority:    (r.priority ?? 'medium') as Task['priority'],
  tag:         (r.tag ?? 'work') as Task['tag'],
  status:      (r.status ?? 'todo') as Task['status'],
  dueDate:     (r.due_date ?? null) as string | null,
})

const mapHabit = (r: Row): Habit => ({
  id:        num(r.id),
  orgId:     r.org_id as string,
  userId:    r.user_id as string,
  name:      r.name as string,
  emoji:     (r.emoji ?? '✅') as string,
  sortOrder: num(r.sort_order),
})

const mapHabitCheck = (r: Row): HabitCheck => ({
  id:      num(r.id),
  habitId: num(r.habit_id),
  date:    r.date as string,
  checked: bool(r.checked),
})

const mapSub = (r: Row): SubGoal => ({
  id:     num(r.id),
  goalId: num(r.goal_id),
  text:   r.text as string,
  done:   bool(r.done),
})

const mapGoal = (r: Row, subs: SubGoal[]): Goal => ({
  id:          num(r.id),
  orgId:       r.org_id as string,
  userId:      r.user_id as string,
  title:       r.title as string,
  description: (r.description ?? '') as string,
  category:    (r.category ?? 'work') as Goal['category'],
  priority:    (r.priority ?? 'medium') as Goal['priority'],
  deadline:    (r.deadline ?? null) as string | null,
  done:        bool(r.done),
  progress:    Number(r.progress ?? 0),
  subs:        subs.filter(s => s.goalId === num(r.id)),
})

const mapJournal = (r: Row): JournalEntry => ({
  id:      num(r.id),
  orgId:   r.org_id as string,
  userId:  r.user_id as string,
  title:   r.title as string,
  content: (r.content ?? '') as string,
  date:    r.date as string,
  mood:    (r.mood ?? '') as string,
  tags:    parseJson<string[]>(r.tags, []),
})

const mapEvent = (r: Row): CalEvent => ({
  id:        num(r.id),
  orgId:     r.org_id as string,
  userId:    r.user_id as string,
  title:     r.title as string,
  date:      r.date as string,
  dateEnd:   (r.date_end ?? null) as string | null,
  startTime: (r.start_time ?? null) as string | null,
  endTime:   (r.end_time ?? null) as string | null,
  tag:       (r.tag ?? 'default') as string,
  recur:     (r.recur ?? null) as string | null,
})

const mapFocusSession = (r: Row): FocusSession => ({
  id:                num(r.id),
  orgId:             r.org_id as string,
  userId:            r.user_id as string,
  date:              r.date as string,
  timerType:         (r.timer_type ?? 'pomodoro') as string,
  totalCycles:       num(r.total_cycles),
  completedCycles:   num(r.completed_cycles),
  workMinutes:       num(r.work_minutes),
  restMinutes:       num(r.rest_minutes),
  longRestMinutes:   num(r.long_rest_minutes),
  completedTasks:    num(r.completed_tasks),
  totalFocusSeconds: num(r.total_focus_seconds),
})

const mapPreference = (r: Row): UserPreference => ({
  id:     num(r.id),
  orgId:  r.org_id as string,
  userId: r.user_id as string,
  key:    r.key as string,
  value:  parseJson(r.value, r.value),
})

export function usePowerSyncBridge() {
  const db = usePowerSync()
  const set = useProductivityStore.setState

  useEffect(() => {
    if (!db) return
    const ac = new AbortController()
    const sig = ac.signal

    // Each watch is an async generator — fires on every SQLite change
    // (local writes AND remote sync from other tabs/devices)

    async function watchTasks() {
      for await (const { rows } of db.watch(
        'SELECT * FROM tasks WHERE is_deleted = 0 ORDER BY created_at DESC', [], { signal: sig }
      )) {
        set({ tasks: (rows ?? []).map(mapTask), initialized: true })
      }
    }

    async function watchHabits() {
      for await (const { rows } of db.watch(
        'SELECT * FROM habits WHERE is_deleted = 0 ORDER BY sort_order ASC', [], { signal: sig }
      )) {
        set({ habits: (rows ?? []).map(mapHabit) })
      }
    }

    async function watchHabitChecks() {
      for await (const { rows } of db.watch(
        'SELECT * FROM habit_checks WHERE is_deleted = 0', [], { signal: sig }
      )) {
        set({ habitChecks: (rows ?? []).map(mapHabitCheck) })
      }
    }

    async function watchGoals() {
      // Watch both tables — fires whenever goals OR subs change
      for await (const { rows } of db.watch(
        `SELECT g.*,
          (SELECT json_group_array(json_object(
            'id', s.id, 'goalId', s.goal_id, 'text', s.text, 'done', s.done
          )) FROM goal_subs s WHERE s.goal_id = g.id AND s.is_deleted = 0) AS subs_json
         FROM goals g WHERE g.is_deleted = 0 ORDER BY g.created_at DESC`,
        [], { signal: sig }
      )) {
        const goals: Goal[] = (rows ?? []).map(r => {
          const rawSubs = parseJson<Row[]>(r.subs_json, [])
          const subs: SubGoal[] = rawSubs.map(s => ({
            id:     num(s.id),
            goalId: num(s.goalId ?? s.goal_id),
            text:   s.text as string,
            done:   bool(s.done),
          }))
          return mapGoal(r, subs)
        })
        set({ goals })
      }
    }

    async function watchJournal() {
      for await (const { rows } of db.watch(
        'SELECT * FROM journal_entries WHERE is_deleted = 0 ORDER BY date DESC', [], { signal: sig }
      )) {
        set({ journalEntries: (rows ?? []).map(mapJournal) })
      }
    }

    async function watchEvents() {
      for await (const { rows } of db.watch(
        'SELECT * FROM cal_events WHERE is_deleted = 0 ORDER BY date ASC', [], { signal: sig }
      )) {
        set({ events: (rows ?? []).map(mapEvent) })
      }
    }

    async function watchBoards() {
      for await (const { rows } of db.watch(
        'SELECT * FROM boards WHERE is_deleted = 0 ORDER BY created_at DESC', [], { signal: sig }
      )) {
        set({ boards: (rows ?? []).map(r => ({
          id:          num(r.id),
          orgId:       r.org_id as string,
          userId:      r.user_id as string,
          name:        r.name as string,
          description: (r.description ?? '') as string,
          color:       (r.color ?? '') as string,
          icon:        (r.icon ?? '') as string,
          nodes:       [],
          threads:     [],
        })) })
      }
    }

    async function watchFocusSessions() {
      for await (const { rows } of db.watch(
        'SELECT * FROM focus_sessions WHERE is_deleted = 0 ORDER BY date DESC', [], { signal: sig }
      )) {
        set({ focusSessions: (rows ?? []).map(mapFocusSession) })
      }
    }

    async function watchPreferences() {
      for await (const { rows } of db.watch(
        'SELECT * FROM user_preferences WHERE is_deleted = 0', [], { signal: sig }
      )) {
        set({ preferences: (rows ?? []).map(mapPreference) })
      }
    }

    // Start all watchers concurrently
    watchTasks()
    watchHabits()
    watchHabitChecks()
    watchGoals()
    watchJournal()
    watchEvents()
    watchBoards()
    watchFocusSessions()
    watchPreferences()

    return () => ac.abort()
  }, [db, set])
}
