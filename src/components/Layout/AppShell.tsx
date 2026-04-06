'use client'
import { useAuth, useUser } from '@/hooks/useSupabaseAuth'
import { useAuthContext } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { usePowerSyncQuery } from '@powersync/react'
import AppLayout from './AppLayout'
import PulsarLanding from '@/components/Landing/PulsarLanding'
import { useProductivityStore } from '@/stores/productivityStore'
import { useServiceWorker } from '@/hooks/useServiceWorker'
import { PulsarPowerSyncProvider } from '@/providers/PowerSyncProvider'

const BETA_OPEN = process.env.NEXT_PUBLIC_BETA_OPEN === 'true'
const DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_BYPASS === 'true'
const DASHBOARD_ALLOWLIST = ['yoshigar304@gmail.com']

// ── Live reactivity bridge ────────────────────────────────────────────────────
// Subscribes to SQLite queries and pushes results into Zustand store.

function PowerSyncBridge({ orgId }: { orgId: string }) {
  const setTasks = useProductivityStore(s => s.setTasks)
  const setHabits = useProductivityStore(s => s.setHabits)
  const setHabitChecks = useProductivityStore(s => s.setHabitChecks)
  const setGoals = useProductivityStore(s => s.setGoals)
  const setJournalEntries = useProductivityStore(s => s.setJournalEntries)
  const setEvents = useProductivityStore(s => s.setEvents)
  const setBoards = useProductivityStore(s => s.setBoards)
  const setFocusSessions = useProductivityStore(s => s.setFocusSessions)
  const setPreferences = useProductivityStore(s => s.setPreferences)

  const notDeleted = '(is_deleted = 0 OR is_deleted IS NULL)'

  const taskRows = usePowerSyncQuery(`SELECT * FROM tasks WHERE org_id = ? AND ${notDeleted}`, [orgId])
  const habitRows = usePowerSyncQuery(`SELECT * FROM habits WHERE org_id = ? AND ${notDeleted}`, [orgId])
  const checkRows = usePowerSyncQuery(`SELECT hc.* FROM habit_checks hc JOIN habits h ON hc.habit_id = h.id WHERE h.org_id = ? AND (hc.is_deleted = 0 OR hc.is_deleted IS NULL)`, [orgId])
  const goalRows = usePowerSyncQuery(`SELECT * FROM goals WHERE org_id = ? AND ${notDeleted}`, [orgId])
  const subRows = usePowerSyncQuery(`SELECT gs.* FROM goal_subs gs JOIN goals g ON gs.goal_id = g.id WHERE g.org_id = ? AND (gs.is_deleted = 0 OR gs.is_deleted IS NULL)`, [orgId])
  const journalRows = usePowerSyncQuery(`SELECT * FROM journal_entries WHERE org_id = ? AND ${notDeleted}`, [orgId])
  const eventRows = usePowerSyncQuery(`SELECT * FROM cal_events WHERE org_id = ? AND ${notDeleted}`, [orgId])
  const boardRows = usePowerSyncQuery(`SELECT * FROM boards WHERE org_id = ? AND ${notDeleted}`, [orgId])
  const focusRows = usePowerSyncQuery(`SELECT * FROM focus_sessions WHERE org_id = ? AND ${notDeleted}`, [orgId])
  const prefRows = usePowerSyncQuery(`SELECT * FROM user_preferences WHERE org_id = ? AND ${notDeleted}`, [orgId])

  // ── Helpers (mirrored from store) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Row = Record<string, any>
  const toBool = (v: unknown) => v === 1 || v === true

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setTasks((taskRows as Row[]).map((r: Row) => ({
      id: r.id, orgId: r.org_id, userId: r.user_id,
      title: r.title, description: r.description ?? '',
      completed: toBool(r.completed), priority: r.priority ?? 'medium',
      tag: r.tag ?? 'work', status: r.status ?? 'todo',
      dueDate: r.due_date ?? null, isPublic: toBool(r.is_public),
      impact: r.impact ?? 3, effort: r.effort ?? 'm', goalId: r.goal_id ?? null,
      parentId: r.parent_id ?? null, pinned: toBool(r.pinned), sortOrder: r.sort_order ?? 0,
      isDeleted: toBool(r.is_deleted),
    })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskRows])

  useEffect(() => {
    setHabits((habitRows as Row[]).map((r: Row) => ({
      id: r.id, orgId: r.org_id, userId: r.user_id,
      name: r.name, emoji: r.emoji ?? '✅',
      sortOrder: r.sort_order ?? 0, isPublic: toBool(r.is_public),
      category: r.category ?? 'health', archived: toBool(r.archived),
      frequency: r.frequency ?? 'daily',
      isDeleted: toBool(r.is_deleted),
    })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habitRows])

  useEffect(() => {
    setHabitChecks((checkRows as Row[]).map((r: Row) => ({
      id: r.id, habitId: r.habit_id,
      date: r.date, checked: toBool(r.checked),
      isDeleted: toBool(r.is_deleted),
    })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkRows])

  useEffect(() => {
    const subsByGoal = new Map<string, ReturnType<typeof mapSub>[]>()
    for (const r of subRows as Row[]) {
      const sub = mapSub(r)
      const arr = subsByGoal.get(sub.goalId) ?? []
      arr.push(sub)
      subsByGoal.set(sub.goalId, arr)
    }
    setGoals((goalRows as Row[]).map((r: Row) => ({
      id: r.id, orgId: r.org_id, userId: r.user_id,
      title: r.title, description: r.description ?? '',
      category: r.category ?? 'work', priority: r.priority ?? 'medium',
      deadline: r.deadline ?? null, done: toBool(r.done),
      progress: r.progress ?? 0, isPublic: toBool(r.is_public),
      isDeleted: toBool(r.is_deleted),
      subs: subsByGoal.get(r.id) ?? [],
      updatedAt: r.updated_at ?? null,
    })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalRows, subRows])

  useEffect(() => {
    setJournalEntries((journalRows as Row[]).map((r: Row) => {
      let tags: string[] = []
      try { tags = JSON.parse(r.tags ?? '[]') } catch { tags = [] }
      return {
        id: r.id, orgId: r.org_id, userId: r.user_id,
        title: r.title, content: r.content ?? '',
        date: r.date, mood: r.mood ?? '', tags,
        pinned: toBool(r.pinned),
        isPublic: toBool(r.is_public), isDeleted: toBool(r.is_deleted),
      }
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalRows])

  useEffect(() => {
    setEvents((eventRows as Row[]).map((r: Row) => ({
      id: r.id, orgId: r.org_id, userId: r.user_id,
      title: r.title, date: r.date, dateEnd: r.date_end ?? null,
      startTime: r.start_time ?? null, endTime: r.end_time ?? null,
      tag: r.tag ?? 'default', recur: r.recur ?? null,
      isPublic: toBool(r.is_public), isDeleted: toBool(r.is_deleted),
    })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventRows])

  useEffect(() => {
    setBoards((boardRows as Row[]).map((r: Row) => ({
      id: r.id, orgId: r.org_id, userId: r.user_id,
      name: r.name, description: r.description ?? '',
      color: r.color ?? '', icon: r.icon ?? '',
      isPublic: toBool(r.is_public), isDeleted: toBool(r.is_deleted),
    })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardRows])

  useEffect(() => {
    setFocusSessions((focusRows as Row[]).map((r: Row) => ({
      id: r.id, orgId: r.org_id, userId: r.user_id,
      date: r.date, timerType: r.timer_type ?? 'pomodoro',
      totalCycles: r.total_cycles ?? 4, completedCycles: r.completed_cycles ?? 0,
      workMinutes: r.work_minutes ?? 25, restMinutes: r.rest_minutes ?? 5,
      longRestMinutes: r.long_rest_minutes ?? 15,
      completedTasks: r.completed_tasks ?? 0,
      totalFocusSeconds: r.total_focus_seconds ?? 0,
      isPublic: toBool(r.is_public), isDeleted: toBool(r.is_deleted),
    })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRows])

  useEffect(() => {
    setPreferences((prefRows as Row[]).map((r: Row) => {
      let value: unknown = r.value
      try { if (typeof r.value === 'string') value = JSON.parse(r.value) } catch { value = r.value }
      return { id: r.id, orgId: r.org_id, userId: r.user_id, key: r.key, value }
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefRows])

  return null
}

function mapSub(r: Record<string, unknown>) {
  return {
    id: r.id as string, goalId: r.goal_id as string,
    text: r.text as string, done: r.done === 1 || r.done === true,
  }
}

// ── AppShell ─────────────────────────────────────────────────────────────────

export default function AppShell() {
  const { isLoaded, userId, orgId } = useAuth()
  const { user } = useUser()
  const { isSwitchingWorkspace } = useAuthContext()
  const router = useRouter()
  const hydrateFromPowerSync = useProductivityStore(s => s.hydrateFromPowerSync)
  const storeOrgId = useProductivityStore(s => s.orgId)

  const isAdmin = user?.appMetadata?.role === 'admin'

  useServiceWorker()

  // Hydrate from local SQLite when org changes
  useEffect(() => {
    if (orgId && userId && orgId !== storeOrgId) {
      hydrateFromPowerSync(orgId, userId)
    }
  }, [orgId, userId, storeOrgId, hydrateFromPowerSync])

  // Dev bypass: skip auth entirely in local development
  if (DEV_BYPASS) {
    return <AppLayout />
  }

  if (!isLoaded) return null

  const isAllowed = BETA_OPEN || isAdmin || DASHBOARD_ALLOWLIST.includes(user?.email ?? '')

  if (userId && isAllowed) {
    return (
      <PulsarPowerSyncProvider>
        {isSwitchingWorkspace && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'oklch(0.08 0 0)',
            zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ color: 'oklch(0.5 0 0)', fontSize: '13px', letterSpacing: '0.04em' }}>
              Switching workspace…
            </div>
          </div>
        )}
        {orgId && <PowerSyncBridge orgId={orgId} />}
        <AppLayout />
      </PulsarPowerSyncProvider>
    )
  }

  return (
    <PulsarLanding
      onEnter={() => router.push(userId ? '/' : '/sign-up')}
      isAuthed={!!userId}
    />
  )
}
