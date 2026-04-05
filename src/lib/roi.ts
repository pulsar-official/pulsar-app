/* ── ROI Scoring Engine (v1 — heuristic) ──
 *
 * ROI = (impact × priority_weight + goal_boost) / effort_map[effort]
 *
 * Higher ROI = more value per minute of focus.
 * Future v2: replace with AI model trained on user completion patterns.
 */

import type { Task, EffortSize, Priority, Goal } from '@/types/productivity'

const EFFORT_MAP: Record<EffortSize, number> = { xs: 1, s: 2, m: 3, l: 4, xl: 5 }
const PRIORITY_WEIGHT: Record<Priority, number> = { high: 1.5, medium: 1.0, low: 0.7 }

export interface ScoredTask extends Task {
  roi: number
  roiLabel: string
}

/**
 * Compute ROI score for a single task.
 * @param task    The task to score
 * @param goals   Active goals (for goal_boost calculation)
 */
export function computeROI(task: Task, goals: Goal[]): number {
  const impact = task.impact ?? 3
  const effort = (task.effort ?? 'm') as EffortSize
  const priority = (task.priority ?? 'medium') as Priority

  let goalBoost = 0
  if (task.goalId) {
    const linkedGoal = goals.find(g => g.id === task.goalId && !g.done)
    if (linkedGoal) {
      goalBoost = linkedGoal.priority === 'high' ? 1.5 : 0.8
    }
  }

  return (impact * PRIORITY_WEIGHT[priority] + goalBoost) / EFFORT_MAP[effort]
}

/**
 * Human-readable reason for the ROI score.
 */
export function roiLabel(task: Task, goals: Goal[]): string {
  const impact = task.impact ?? 3
  const effort = (task.effort ?? 'm') as EffortSize
  const parts: string[] = []

  if (impact >= 4) parts.push('High value')
  else if (impact <= 2) parts.push('Low value')

  if (effort === 'xs' || effort === 's') parts.push('Quick win')
  else if (effort === 'l' || effort === 'xl') parts.push('Major effort')

  if (task.goalId) {
    const g = goals.find(g => g.id === task.goalId && !g.done)
    if (g) parts.push(`→ ${g.title}`)
  }

  return parts.length > 0 ? parts.join(' · ') : 'Standard'
}

/**
 * Score and rank all incomplete tasks by ROI (descending).
 */
export function rankTasksByROI(tasks: Task[], goals: Goal[]): ScoredTask[] {
  return tasks
    .filter(t => !t.completed && !t.isDeleted)
    .map(t => ({
      ...t,
      roi: computeROI(t, goals),
      roiLabel: roiLabel(t, goals),
    }))
    .sort((a, b) => b.roi - a.roi)
}
