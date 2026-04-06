// Time-blocking utility functions for procrastination prevention

export interface TimeBlock {
  date: string        // YYYY-MM-DD
  startTime: string   // HH:MM
  endTime: string     // HH:MM
  suggestedFor: string // task title
  taskId: string
}

/**
 * Check if a time slot is free given a list of calendar events.
 */
export function isSlotFree(
  date: string,
  startTime: string,
  endTime: string,
  events: Array<{ date: string; startTime: string | null; endTime: string | null }>
): boolean {
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }
  const slotStart = toMins(startTime)
  const slotEnd = toMins(endTime)

  return !events.some(e => {
    if (e.date !== date) return false
    if (!e.startTime || !e.endTime) return false
    const evStart = toMins(e.startTime)
    const evEnd = toMins(e.endTime)
    // Overlap if not (slot ends before event or slot starts after event)
    return !(slotEnd <= evStart || slotStart >= evEnd)
  })
}

/**
 * Suggest free time blocks for tasks with upcoming deadlines.
 *
 * Strategy:
 *  - Only consider tasks due within `daysAhead` days (default 7).
 *  - For each qualifying task estimate work duration (estimatedHours ?? 1).
 *  - Scan candidate slots each day (09:00–12:00 and 14:00–18:00) in
 *    30-minute increments until enough time is found or we run out of window.
 *  - Returns at most 3 suggestions total.
 */
export function suggestTimeBlocks(
  tasks: Array<{
    id: string
    title: string
    dueDate: string | null
    estimatedHours?: number
    completed: boolean
  }>,
  events: Array<{ date: string; startTime: string | null; endTime: string | null }>,
  daysAhead = 7
): TimeBlock[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + daysAhead)

  const padded = (n: number) => String(n).padStart(2, '0')
  const toDateStr = (d: Date) =>
    `${d.getFullYear()}-${padded(d.getMonth() + 1)}-${padded(d.getDate())}`

  // Candidate slot windows (start, end) in minutes from midnight
  const WINDOWS = [
    [9 * 60, 12 * 60],   // 09:00–12:00
    [14 * 60, 18 * 60],  // 14:00–18:00
  ]
  const SLOT_MINS = 60 // suggest 1-hour blocks

  const toTimeStr = (mins: number) =>
    `${padded(Math.floor(mins / 60))}:${padded(mins % 60)}`

  const qualified = tasks.filter(t => {
    if (t.completed) return false
    if (!t.dueDate) return false
    const due = new Date(t.dueDate)
    due.setHours(0, 0, 0, 0)
    return due >= today && due <= cutoff
  })

  // Sort by due date ascending (most urgent first)
  qualified.sort((a, b) => {
    if (!a.dueDate || !b.dueDate) return 0
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })

  const suggestions: TimeBlock[] = []

  outer: for (const task of qualified) {
    const hours = task.estimatedHours ?? 1
    const totalMinsNeeded = Math.ceil(hours * 60)
    let minsScheduled = 0

    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
      const day = new Date(today)
      day.setDate(today.getDate() + dayOffset)
      const dateStr = toDateStr(day)

      for (const [winStart, winEnd] of WINDOWS) {
        for (let slot = winStart; slot + SLOT_MINS <= winEnd; slot += 30) {
          const slotEnd = Math.min(slot + SLOT_MINS, winEnd)
          const startStr = toTimeStr(slot)
          const endStr = toTimeStr(slotEnd)

          if (isSlotFree(dateStr, startStr, endStr, events)) {
            suggestions.push({
              date: dateStr,
              startTime: startStr,
              endTime: endStr,
              suggestedFor: task.title,
              taskId: task.id,
            })
            minsScheduled += slotEnd - slot

            if (suggestions.length >= 3) break outer
            if (minsScheduled >= totalMinsNeeded) break
          }
        }
        if (minsScheduled >= totalMinsNeeded) break
      }
      if (minsScheduled >= totalMinsNeeded) break
    }
  }

  return suggestions
}
