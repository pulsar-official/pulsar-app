// Gantt chart utility functions

/**
 * Position a task bar on the Gantt timeline.
 * Returns left offset and width as pixel values within totalWidth.
 */
export function getTaskBarPosition(
  task: { startDate?: string; dueDate?: string },
  timelineStart: Date,
  timelineEnd: Date,
  totalWidth: number
): { left: number; width: number } {
  const timelineMs = timelineEnd.getTime() - timelineStart.getTime()

  const rawStart = task.startDate ? new Date(task.startDate) : null
  const rawEnd = task.dueDate ? new Date(task.dueDate) : null

  // Default to single-day bar starting today if no dates
  const barStart = rawStart ?? rawEnd ?? new Date()
  const barEnd = rawEnd ?? barStart

  // Clamp to timeline boundaries
  const clampedStart = Math.max(barStart.getTime(), timelineStart.getTime())
  const clampedEnd = Math.min(barEnd.getTime() + 86_400_000, timelineEnd.getTime())

  const left = ((clampedStart - timelineStart.getTime()) / timelineMs) * totalWidth
  const width = Math.max(((clampedEnd - clampedStart) / timelineMs) * totalWidth, 8)

  return { left: Math.round(left), width: Math.round(width) }
}

/**
 * Group tasks by their tag field (swimlane grouping).
 * Falls back to "Untagged" when no tag present.
 */
export function groupTasksBySwimlane(tasks: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {}
  for (const task of tasks) {
    const lane: string = task.tag ?? task.classContext ?? 'Untagged'
    if (!groups[lane]) groups[lane] = []
    groups[lane].push(task)
  }
  return groups
}

/**
 * Generate an SVG cubic bezier path from the right edge of fromBar
 * to the left edge of toBar, accounting for vertical positions.
 */
export function getDependencyPath(
  fromBar: { left: number; width: number; top: number },
  toBar: { left: number; width: number; top: number }
): string {
  const x1 = fromBar.left + fromBar.width
  const y1 = fromBar.top + 12 // mid-height of bar (assume 24px bars)
  const x2 = toBar.left
  const y2 = toBar.top + 12

  const cpOffset = Math.abs(x2 - x1) * 0.5
  return `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`
}
