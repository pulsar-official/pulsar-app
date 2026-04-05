"use client"

import React, { useState, useMemo, useCallback } from "react"
import styles from "./Tasks.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import type { Task, Priority, TaskTag, TaskStatus, EffortSize } from '@/types/productivity'
import { computeROI } from '@/lib/roi'
import RelatedItems from '../shared/RelatedItems'
import DeleteConfirmModal from '../shared/DeleteConfirmModal'
import PrivacyToggle from '../shared/PrivacyToggle'

/* ── Constants ── */
type ViewMode = "list" | "kanban" | "table" | "gantt"
type DateFilter = "all" | "overdue" | "today" | "week"
type DisplayPriority = "high" | "med" | "low"

const TAG_CLS: Record<TaskTag, string> = { work: styles.tagWork, personal: styles.tagPersonal, urgent: styles.tagUrgent, health: styles.tagHealth }
const PRI_CLS: Record<DisplayPriority, string> = { high: styles.priHigh, med: styles.priMed, low: styles.priLow }
const PRI_LABEL: Record<DisplayPriority, string> = { high: "High", med: "Med", low: "Low" }
const EFFORT_SIZES: EffortSize[] = ['xs', 's', 'm', 'l', 'xl']
const STATUS_COLS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "inprogress", label: "In Progress" },
  { key: "done", label: "Done" },
]

function toDisplayPri(p: Priority): DisplayPriority { return p === 'medium' ? 'med' : p as DisplayPriority }
function toStorePri(p: DisplayPriority): Priority { return p === 'med' ? 'medium' : p as Priority }
function fmtDate(d: string) { return new Date(d + 'T00:00:00').toLocaleDateString("default", { month: "short", day: "numeric" }) }

const today = new Date().toISOString().split("T")[0]
const weekEnd = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0] })()

interface FormState {
  title: string; desc: string; priority: DisplayPriority; tag: TaskTag; due: string;
  status: TaskStatus; isPublic: boolean; impact: number; effort: EffortSize;
  goalId: string; parentId: string
}
const DFORM: FormState = { title: "", desc: "", priority: "med", tag: "work", due: "", status: "todo", isPublic: false, impact: 3, effort: "m", goalId: "", parentId: "" }

/* ── Component ── */
const Tasks: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const tasks = useProductivityStore(s => s.tasks)
  const goals = useProductivityStore(s => s.goals)
  const storeAddTask = useProductivityStore(s => s.addTask)
  const storeUpdateTask = useProductivityStore(s => s.updateTask)
  const storeDeleteTask = useProductivityStore(s => s.deleteTask)
  const storeToggleTask = useProductivityStore(s => s.toggleTask)

  const [view, setView] = useState<ViewMode>("list")
  const [tagFilter, setTagFilter] = useState<"all" | TaskTag>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [roiSort, setRoiSort] = useState(false)
  const [open, setOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [form, setForm] = useState<FormState>(DFORM)
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [quickAdd, setQuickAdd] = useState("")

  const activeGoals = useMemo(() => goals.filter(g => !g.done), [goals])

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    let list = tasks.filter(t => !t.parentId) // top-level only
    if (tagFilter !== "all") list = list.filter(t => t.tag === tagFilter)
    if (dateFilter === "overdue") list = list.filter(t => t.dueDate && t.dueDate < today && !t.completed)
    else if (dateFilter === "today") list = list.filter(t => t.dueDate === today)
    else if (dateFilter === "week") list = list.filter(t => t.dueDate && t.dueDate >= today && t.dueDate <= weekEnd)
    if (roiSort) {
      const scored = list.map(t => ({ ...t, _roi: computeROI(t, activeGoals) }))
      scored.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return b._roi - a._roi
      })
      return scored
    }
    return [...list].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    })
  }, [tasks, tagFilter, dateFilter, roiSort, activeGoals])

  const subtasksOf = useCallback((parentId: string) => tasks.filter(t => t.parentId === parentId), [tasks])

  const roiMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of tasks) m.set(t.id, computeROI(t, activeGoals))
    return m
  }, [tasks, activeGoals])

  /* ── Modal actions ── */
  const openAdd = (parentId?: string) => { setEditTask(null); setForm({ ...DFORM, parentId: parentId ?? "" }); setOpen(true) }
  const openEdit = (t: Task) => {
    setEditTask(t)
    setForm({ title: t.title, desc: t.description, priority: toDisplayPri(t.priority), tag: t.tag, due: t.dueDate ?? '', status: t.status, isPublic: t.isPublic ?? false, impact: t.impact ?? 3, effort: (t.effort ?? 'm') as EffortSize, goalId: t.goalId ?? '', parentId: t.parentId ?? '' })
    setOpen(true)
  }
  const save = () => {
    if (!form.title.trim()) return
    const base = { title: form.title, description: form.desc, priority: toStorePri(form.priority), tag: form.tag, dueDate: form.due || null, status: form.status, completed: form.status === "done", isPublic: form.isPublic, impact: form.impact, effort: form.effort, goalId: form.goalId || null, parentId: form.parentId || null }
    if (editTask) storeUpdateTask({ ...editTask, ...base })
    else storeAddTask(base)
    setOpen(false)
  }
  const del = async (id: string) => { setIsDeleting(true); await storeDeleteTask(id); setIsDeleting(false); setConfirmDeleteTaskId(null); setOpen(false) }
  const togglePin = (t: Task) => storeUpdateTask({ ...t, pinned: !t.pinned })
  const quickAddTask = () => { if (!quickAdd.trim()) return; storeAddTask({ title: quickAdd.trim(), description: '', priority: 'medium', tag: 'work', dueDate: null, status: 'todo', completed: false }); setQuickAdd("") }

  /* ── List View ── */
  const renderSubtasks = (parentId: string) => {
    const subs = subtasksOf(parentId)
    if (subs.length === 0) return null
    return (
      <div className={styles.subtaskList}>
        {subs.map(s => (
          <div key={s.id} className={styles.subtaskItem}>
            <div className={`${styles.taskCheck} ${s.completed ? styles.taskCheckDone : ''}`} onClick={() => storeToggleTask(s.id)}>{s.completed && '✓'}</div>
            <span className={`${styles.subtaskTitle} ${s.completed ? styles.taskTitleDone : ''}`} onClick={() => openEdit(s)}>{s.title}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderListView = () => {
    const active = filtered.filter(t => !t.completed)
    const completed = filtered.filter(t => t.completed)
    return (
      <div className={styles.listWrap}>
        <div className={styles.quickAddRow}>
          <input className={styles.quickAddInput} value={quickAdd} placeholder="Add a task..." onChange={e => setQuickAdd(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') quickAddTask() }} />
          <button className={styles.quickAddBtn} onClick={quickAddTask} disabled={!quickAdd.trim()}>+</button>
        </div>
        {active.length > 0 && <div className={styles.sectionLabel}>Active ({active.length})</div>}
        {active.map(t => (
          <div key={t.id}>
            <div className={styles.taskItem}>
              <div className={styles.taskCheck} onClick={() => storeToggleTask(t.id)} />
              <div className={styles.taskBody} onClick={() => openEdit(t)}>
                <div className={styles.taskTitleRow}>
                  {t.pinned && <span className={styles.pinIcon}>📌</span>}
                  <span className={styles.taskTitle}>{t.title}</span>
                  {roiSort && <span className={styles.roiBadge}>{(roiMap.get(t.id) ?? 0).toFixed(1)}</span>}
                </div>
                <div className={styles.taskMeta}>
                  <span className={`${styles.taskTag} ${TAG_CLS[t.tag]}`}>{t.tag}</span>
                  <span className={`${styles.taskPriority} ${PRI_CLS[toDisplayPri(t.priority)]}`}>● {PRI_LABEL[toDisplayPri(t.priority)]}</span>
                  {t.dueDate && <span className={`${styles.taskDue} ${t.dueDate < today ? styles.taskDueOverdue : ''}`}>{fmtDate(t.dueDate)}</span>}
                  {subtasksOf(t.id).length > 0 && <span className={styles.subtaskCount}>{subtasksOf(t.id).filter(s => s.completed).length}/{subtasksOf(t.id).length}</span>}
                </div>
              </div>
              <button className={styles.pinBtn} onClick={() => togglePin(t)} title={t.pinned ? 'Unpin' : 'Pin'}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={t.pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 17v5"/><path d="M9 11V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6"/><path d="M5 17h14"/><path d="M7 11l-2 6h14l-2-6"/></svg>
              </button>
              <button className={styles.subAddBtn} onClick={() => openAdd(t.id)} title="Add subtask">+</button>
            </div>
            {renderSubtasks(t.id)}
          </div>
        ))}
        {completed.length > 0 && <div className={styles.sectionLabel}>Completed ({completed.length})</div>}
        {completed.map(t => (
          <div key={t.id} className={styles.taskItem} onClick={() => openEdit(t)}>
            <div className={`${styles.taskCheck} ${styles.taskCheckDone}`} onClick={e => { e.stopPropagation(); storeToggleTask(t.id) }}>✓</div>
            <div className={styles.taskBody}><span className={`${styles.taskTitle} ${styles.taskTitleDone}`}>{t.title}</span></div>
          </div>
        ))}
        {filtered.length === 0 && <div className={styles.empty}>No tasks yet. Add one!</div>}
      </div>
    )
  }

  /* ── Kanban View ── */
  const renderKanbanView = () => (
    <div className={styles.boardWrap}>
      {STATUS_COLS.map(col => {
        const items = filtered.filter(t => t.status === col.key)
        return (
          <div key={col.key} className={styles.boardCol}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              const id = e.dataTransfer.getData('taskId')
              const task = tasks.find(t => t.id === id)
              if (task) storeUpdateTask({ ...task, status: col.key, completed: col.key === 'done' })
            }}
          >
            <div className={styles.boardColHeader}>{col.label}<span className={styles.boardColCount}>{items.length}</span></div>
            <div className={styles.boardColBody}>
              {items.map(t => (
                <div key={t.id} className={styles.boardCard} onClick={() => openEdit(t)} draggable onDragStart={e => e.dataTransfer.setData('taskId', t.id)}>
                  <div className={styles.boardCardTitle}>{t.title}</div>
                  <div className={styles.boardCardMeta}>
                    <span className={`${styles.taskTag} ${TAG_CLS[t.tag]}`}>{t.tag}</span>
                    <span className={`${styles.taskPriority} ${PRI_CLS[toDisplayPri(t.priority)]}`}>● {PRI_LABEL[toDisplayPri(t.priority)]}</span>
                    {t.dueDate && <span className={styles.taskDue}>{fmtDate(t.dueDate)}</span>}
                    {roiSort && <span className={styles.roiBadgeSm}>{(roiMap.get(t.id) ?? 0).toFixed(1)}</span>}
                  </div>
                  {subtasksOf(t.id).length > 0 && (
                    <div className={styles.boardSubBar}>
                      <div className={styles.boardSubFill} style={{ width: `${(subtasksOf(t.id).filter(s => s.completed).length / subtasksOf(t.id).length) * 100}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )

  /* ── Table View ── */
  const [sortCol, setSortCol] = useState<string>('title')
  const [sortAsc, setSortAsc] = useState(true)
  const tableSorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      let cmp = 0
      if (sortCol === 'title') cmp = a.title.localeCompare(b.title)
      else if (sortCol === 'priority') cmp = (['high', 'medium', 'low'].indexOf(a.priority) - ['high', 'medium', 'low'].indexOf(b.priority))
      else if (sortCol === 'status') cmp = (['todo', 'inprogress', 'done'].indexOf(a.status) - ['todo', 'inprogress', 'done'].indexOf(b.status))
      else if (sortCol === 'due') cmp = (a.dueDate ?? 'z').localeCompare(b.dueDate ?? 'z')
      else if (sortCol === 'roi') cmp = (roiMap.get(b.id) ?? 0) - (roiMap.get(a.id) ?? 0)
      else if (sortCol === 'impact') cmp = (b.impact ?? 3) - (a.impact ?? 3)
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [filtered, sortCol, sortAsc, roiMap])

  const colClick = (col: string) => { if (sortCol === col) setSortAsc(!sortAsc); else { setSortCol(col); setSortAsc(true) } }
  const sortIcon = (col: string) => sortCol === col ? (sortAsc ? ' ↑' : ' ↓') : ''

  const renderTableView = () => (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thCheck}>✓</th>
            <th className={styles.thTitle} onClick={() => colClick('title')}>Title{sortIcon('title')}</th>
            <th onClick={() => colClick('priority')}>Priority{sortIcon('priority')}</th>
            <th>Tag</th>
            <th onClick={() => colClick('status')}>Status{sortIcon('status')}</th>
            <th onClick={() => colClick('due')}>Due{sortIcon('due')}</th>
            <th onClick={() => colClick('impact')}>Impact{sortIcon('impact')}</th>
            <th>Effort</th>
            <th onClick={() => colClick('roi')}>ROI{sortIcon('roi')}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tableSorted.map(t => (
            <tr key={t.id} className={`${styles.trow} ${t.completed ? styles.trowDone : ''}`}>
              <td><div className={`${styles.taskCheck} ${styles.tblCheck} ${t.completed ? styles.taskCheckDone : ''}`} onClick={() => storeToggleTask(t.id)}>{t.completed ? '✓' : ''}</div></td>
              <td className={styles.tdTitle} onClick={() => openEdit(t)}>{t.pinned && <span className={styles.pinIcon}>📌</span>}{t.title}</td>
              <td><span className={`${styles.taskPriority} ${PRI_CLS[toDisplayPri(t.priority)]}`}>{PRI_LABEL[toDisplayPri(t.priority)]}</span></td>
              <td><span className={`${styles.taskTag} ${TAG_CLS[t.tag]}`}>{t.tag}</span></td>
              <td><span className={styles.statusBadge} data-status={t.status}>{t.status === 'inprogress' ? 'In Progress' : t.status === 'todo' ? 'To Do' : 'Done'}</span></td>
              <td className={t.dueDate && t.dueDate < today && !t.completed ? styles.taskDueOverdue : ''}>{t.dueDate ? fmtDate(t.dueDate) : '—'}</td>
              <td>{t.impact ?? 3}/5</td>
              <td><span className={styles.effortBadge}>{(t.effort ?? 'm').toUpperCase()}</span></td>
              <td><span className={styles.roiBadgeSm}>{(roiMap.get(t.id) ?? 0).toFixed(1)}</span></td>
              <td><button className={styles.pinBtnSm} onClick={() => togglePin(t)} title={t.pinned ? 'Unpin' : 'Pin'}>{t.pinned ? '📌' : '○'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {tableSorted.length === 0 && <div className={styles.empty}>No tasks match filters</div>}
    </div>
  )

  /* ── Gantt View ── */
  const ganttData = useMemo(() => {
    const start = new Date(); start.setDate(start.getDate() - 7)
    const end = new Date(); end.setDate(end.getDate() + 30)
    const days: string[] = []
    const cur = new Date(start)
    while (cur <= end) { days.push(cur.toISOString().split('T')[0]); cur.setDate(cur.getDate() + 1) }
    return { days, withDate: filtered.filter(t => t.dueDate && !t.completed), noDate: filtered.filter(t => !t.dueDate && !t.completed) }
  }, [filtered])

  const renderGanttView = () => {
    const { days, withDate, noDate } = ganttData
    const dayW = 36
    return (
      <div className={styles.ganttWrap}>
        <div className={styles.ganttScroll} style={{ minWidth: days.length * dayW }}>
          <div className={styles.ganttHeader}>
            <div className={styles.ganttLabel}>Task</div>
            <div className={styles.ganttTimeline}>
              {days.map(d => (
                <div key={d} className={`${styles.ganttDay} ${d === today ? styles.ganttDayToday : ''}`} style={{ width: dayW }}>{new Date(d + 'T00:00:00').getDate()}</div>
              ))}
            </div>
          </div>
          {withDate.map(t => {
            const dayIdx = days.indexOf(t.dueDate!)
            const barStart = Math.max(0, dayIdx - 3)
            const barEnd = dayIdx >= 0 ? dayIdx : days.length - 1
            return (
              <div key={t.id} className={styles.ganttRow} onClick={() => openEdit(t)}>
                <div className={styles.ganttLabel}>
                  {t.pinned && <span className={styles.pinIcon}>📌</span>}
                  <span className={styles.ganttTaskName}>{t.title}</span>
                </div>
                <div className={styles.ganttTimeline}>
                  <div className={styles.ganttBar} data-priority={t.priority} style={{ left: barStart * dayW, width: Math.max(dayW, (barEnd - barStart + 1) * dayW) }}>
                    <span className={styles.ganttBarText}>{t.title.slice(0, 14)}</span>
                  </div>
                </div>
              </div>
            )
          })}
          {noDate.length > 0 && (
            <>
              <div className={styles.ganttDivider}>No due date</div>
              {noDate.map(t => (
                <div key={t.id} className={styles.ganttRow} onClick={() => openEdit(t)}>
                  <div className={styles.ganttLabel}><span className={styles.ganttTaskName}>{t.title}</span></div>
                  <div className={styles.ganttTimeline}><div className={styles.ganttBarNone}>No date set</div></div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    )
  }

  /* ── Render ── */
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.pageTitle}>Tasks</div>
          <div className={styles.tabs}>
            {(["list", "kanban", "table", "gantt"] as const).map(v => (
              <button key={v} className={`${styles.tab} ${view === v ? styles.active : ''}`} onClick={() => setView(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={`${styles.roiToggle} ${roiSort ? styles.roiToggleActive : ''}`} onClick={() => setRoiSort(!roiSort)} title="Sort by ROI score">ROI Sort</button>
          <button className={styles.addBtn} onClick={() => openAdd()}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add task
          </button>
        </div>
      </div>
      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          {(["all", "work", "personal", "urgent", "health"] as const).map(f => (
            <button key={f} className={`${styles.filterBtn} ${tagFilter === f ? styles.active : ''}`} onClick={() => setTagFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
        <div className={styles.filterDivider} />
        <div className={styles.filterGroup}>
          {(["all", "overdue", "today", "week"] as const).map(f => (
            <button key={f} className={`${styles.dateFilterBtn} ${dateFilter === f ? styles.active : ''}`} onClick={() => setDateFilter(f)}>
              {f === 'all' ? 'All dates' : f === 'overdue' ? 'Overdue' : f === 'today' ? 'Due today' : 'This week'}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.body}>
        {view === "list" && renderListView()}
        {view === "kanban" && renderKanbanView()}
        {view === "table" && renderTableView()}
        {view === "gantt" && renderGanttView()}
      </div>

      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>{editTask ? "Edit task" : form.parentId ? "Add subtask" : "New task"}</div>
              <button className={styles.modalClose} onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}><label className={styles.label}>Title</label><input className={styles.input} value={form.title} placeholder="Task title" onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className={styles.field}><label className={styles.label}>Description</label><textarea className={styles.textarea} value={form.desc} placeholder="Optional description" onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} /></div>
              <div className={styles.fieldRow}>
                <div className={styles.field}><label className={styles.label}>Priority</label><select className={styles.select} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as DisplayPriority }))}><option value="high">High</option><option value="med">Medium</option><option value="low">Low</option></select></div>
                <div className={styles.field}><label className={styles.label}>Tag</label><select className={styles.select} value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value as TaskTag }))}><option value="work">Work</option><option value="personal">Personal</option><option value="urgent">Urgent</option><option value="health">Health</option></select></div>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}><label className={styles.label}>Status</label><select className={styles.select} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TaskStatus }))}><option value="todo">To Do</option><option value="inprogress">In Progress</option><option value="done">Done</option></select></div>
                <div className={styles.field}><label className={styles.label}>Due date</label><input type="date" className={styles.input} value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} /></div>
              </div>
              <div className={styles.roiSection}>
                <div className={styles.roiSectionTitle}>ROI Fields</div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Impact (1-5)</label>
                    <div className={styles.starRow}>{[1, 2, 3, 4, 5].map(n => (<button key={n} className={`${styles.star} ${form.impact >= n ? styles.starActive : ''}`} onClick={() => setForm(f => ({ ...f, impact: n }))}>★</button>))}</div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Effort</label>
                    <div className={styles.effortPills}>{EFFORT_SIZES.map(e => (<button key={e} className={`${styles.effortPill} ${form.effort === e ? styles.effortPillActive : ''}`} onClick={() => setForm(f => ({ ...f, effort: e }))}>{e.toUpperCase()}</button>))}</div>
                  </div>
                </div>
                <div className={styles.field}><label className={styles.label}>Link to Goal</label><select className={styles.select} value={form.goalId} onChange={e => setForm(f => ({ ...f, goalId: e.target.value }))}><option value="">None</option>{activeGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}</select></div>
              </div>
              {editTask && subtasksOf(editTask.id).length > 0 && (
                <div className={styles.modalSubtasks}>
                  <div className={styles.label}>Subtasks</div>
                  {subtasksOf(editTask.id).map(s => (
                    <div key={s.id} className={styles.modalSubItem}>
                      <div className={`${styles.taskCheck} ${s.completed ? styles.taskCheckDone : ''}`} onClick={() => storeToggleTask(s.id)}>{s.completed && '✓'}</div>
                      <span className={s.completed ? styles.taskTitleDone : ''}>{s.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {editTask && <button className={styles.addSubBtn} onClick={() => { setOpen(false); setTimeout(() => openAdd(editTask.id), 100) }}>+ Add subtask</button>}
            </div>
            {editTask && <RelatedItems itemType="task" itemId={editTask.id} onNavigate={onNavigate} />}
            <div className={styles.modalFooter}>
              {editTask && <button className={styles.deleteBtn} onClick={() => setConfirmDeleteTaskId(editTask.id)}>Delete</button>}
              <PrivacyToggle isPublic={form.isPublic} onChange={v => setForm(f => ({ ...f, isPublic: v }))} />
              <button className={styles.cancelBtn} onClick={() => setOpen(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal isOpen={!!confirmDeleteTaskId} title="Delete Task?" description={`Are you sure you want to delete "${editTask?.title}"?`} itemName={editTask?.title || 'this task'} onConfirm={async () => { if (confirmDeleteTaskId) await del(confirmDeleteTaskId) }} onCancel={() => setConfirmDeleteTaskId(null)} isLoading={isDeleting} />
    </div>
  )
}

export default Tasks
