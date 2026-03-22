"use client"

import React, { useState } from "react"
import styles from "./Tasks.module.scss"
import { useProductivityStore } from '@/stores/productivityStore'
import type { Task, Priority, TaskTag, TaskStatus } from '@/types/productivity'
import RelatedItems from '../shared/RelatedItems'
import DeleteConfirmModal from '../shared/DeleteConfirmModal'

type DisplayPriority = "high" | "med" | "low"

const TAG_CLS: Record<TaskTag,string> = { work:styles.tagWork, personal:styles.tagPersonal, urgent:styles.tagUrgent, health:styles.tagHealth }
const PRI_CLS: Record<DisplayPriority,string> = { high:styles.priHigh, med:styles.priMed, low:styles.priLow }
const PRI_LABEL: Record<DisplayPriority,string> = { high:"● High", med:"● Med", low:"● Low" }

function toDisplayPri(p: Priority): DisplayPriority { return p === 'medium' ? 'med' : p as DisplayPriority }
function toStorePri(p: DisplayPriority): Priority { return p === 'med' ? 'medium' : p as Priority }

interface FormState { title:string; desc:string; priority:DisplayPriority; tag:TaskTag; due:string; status:TaskStatus }
const DFORM: FormState = { title:"", desc:"", priority:"med", tag:"work", due:"", status:"todo" }

const Tasks: React.FC<{ onNavigate?: (page: string) => void }> = ({ onNavigate }) => {
  const tasks = useProductivityStore(s => s.tasks)
  const storeAddTask = useProductivityStore(s => s.addTask)
  const storeUpdateTask = useProductivityStore(s => s.updateTask)
  const storeDeleteTask = useProductivityStore(s => s.deleteTask)
  const storeToggleTask = useProductivityStore(s => s.toggleTask)

  const [view, setView] = useState<"list"|"board">("list")
  const [filter, setFilter] = useState<"all"|TaskTag>("all")
  const [open, setOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task|null>(null)
  const [form, setForm] = useState<FormState>(DFORM)
  const [confirmDeleteTaskId, setConfirmDeleteTaskId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.tag === filter)

  const toggleDone = (id: number) => {
    storeToggleTask(id)
  }

  const openAdd = () => { setEditTask(null); setForm(DFORM); setOpen(true) }
  const openEdit = (t: Task) => {
    setEditTask(t)
    setForm({ title:t.title, desc:t.description, priority:toDisplayPri(t.priority), tag:t.tag, due:t.dueDate ?? '', status:t.status })
    setOpen(true)
  }

  const save = () => {
    if (!form.title.trim()) return
    if (editTask) {
      storeUpdateTask({ ...editTask, title:form.title, description:form.desc, priority:toStorePri(form.priority), tag:form.tag, dueDate:form.due || null, status:form.status, completed: form.status === "done" })
    } else {
      storeAddTask({ title:form.title, description:form.desc, priority:toStorePri(form.priority), tag:form.tag, dueDate:form.due || null, status:form.status, completed: form.status === "done" })
    }
    setOpen(false)
  }

  const del = async (id: number) => {
    setIsDeleting(true)
    await storeDeleteTask(id)
    setIsDeleting(false)
    setConfirmDeleteTaskId(null)
    setOpen(false)
  }
  const renderListView = () => {
    const active = filtered.filter(t => !t.completed)
    const completed = filtered.filter(t => t.completed)
    return (
      <div className={styles.taskList}>
        {active.length > 0 && <div className={styles.sectionLabel}>Active ({active.length})</div>}
        {active.map(t => (
          <div key={t.id} className={styles.taskItem} onClick={() => openEdit(t)}>
            <div className={styles.taskCheck} onClick={e => { e.stopPropagation(); toggleDone(t.id) }}>
            </div>
            <div className={styles.taskBody}>
              <div className={styles.taskTitle}>{t.title}</div>
              <div className={styles.taskMeta}>
                <span className={[styles.taskTag, TAG_CLS[t.tag]].join(" ")}>{t.tag}</span>
                <span className={[styles.taskPriority, PRI_CLS[toDisplayPri(t.priority)]].join(" ")}>{PRI_LABEL[toDisplayPri(t.priority)]}</span>
                {t.dueDate && <span className={styles.taskDue}>Due {t.dueDate}</span>}
              </div>
            </div>
          </div>
        ))}
        {completed.length > 0 && <div className={styles.sectionLabel}>Completed ({completed.length})</div>}
        {completed.map(t => (
          <div key={t.id} className={styles.taskItem} onClick={() => openEdit(t)}>
            <div className={[styles.taskCheck, styles.taskCheckDone].join(" ")} onClick={e => { e.stopPropagation(); toggleDone(t.id) }}>
              ✓
            </div>
            <div className={styles.taskBody}>
              <div className={[styles.taskTitle, styles.taskTitleDone].join(" ")}>{t.title}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className={styles.empty}>No tasks yet. Add one!</div>}
      </div>
    )
  }
  const renderBoardView = () => {
    const cols: { key: TaskStatus; label: string }[] = [
      { key: "todo", label: "To Do" },
      { key: "inprogress", label: "In Progress" },
      { key: "done", label: "Done" },
    ]
    return (
      <div className={styles.boardWrap}>
        {cols.map(col => {
          const items = filtered.filter(t => t.status === col.key)
          return (
            <div key={col.key} className={styles.boardCol}>
              <div className={styles.boardColHeader}>
                {col.label}
                <span className={styles.boardColCount}>{items.length}</span>
              </div>
              <div className={styles.boardColBody}>
                {items.map(t => (
                  <div key={t.id} className={styles.boardCard} onClick={() => openEdit(t)}>
                    <div className={styles.boardCardTitle}>{t.title}</div>
                    <div className={styles.boardCardMeta}>
                      <span className={[styles.taskTag, TAG_CLS[t.tag]].join(" ")}>{t.tag}</span>
                      <span className={[styles.taskPriority, PRI_CLS[toDisplayPri(t.priority)]].join(" ")}>{PRI_LABEL[toDisplayPri(t.priority)]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.pageTitle}>Tasks</div>
          <div className={styles.tabs}>
            {(["list","board"] as const).map(v => (
              <button key={v} className={[styles.tab, view===v?styles.active:""].filter(Boolean).join(" ")} onClick={()=>setView(v)}>
                {v.charAt(0).toUpperCase()+v.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addBtn} onClick={openAdd}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add task
          </button>
        </div>
      </div>
      <div className={styles.filterRow}>
        {(["all","work","personal","urgent","health"] as const).map(f => (
          <button key={f} className={[styles.filterBtn, filter===f?styles.active:""].filter(Boolean).join(" ")} onClick={()=>setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      <div className={styles.body}>
        {view === "list" ? renderListView() : renderBoardView()}
      </div>      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTop}>
              <div className={styles.modalTitle}>{editTask ? "Edit task" : "New task"}</div>
              <button className={styles.modalClose} onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.label}>Title</label>
                <input className={styles.input} value={form.title} placeholder="Task title" onChange={e => setForm(f => ({...f, title: e.target.value}))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Description</label>
                <textarea className={styles.textarea} value={form.desc} placeholder="Optional description" onChange={e => setForm(f => ({...f, desc: e.target.value}))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Priority</label>
                <select className={styles.select} value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value as DisplayPriority}))}>
                  <option value="high">High</option>
                  <option value="med">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tag</label>
                <select className={styles.select} value={form.tag} onChange={e => setForm(f => ({...f, tag: e.target.value as TaskTag}))}>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="urgent">Urgent</option>
                  <option value="health">Health</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <select className={styles.select} value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value as TaskStatus}))}>
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Due date</label>
                <input type="date" className={styles.input} value={form.due} onChange={e => setForm(f => ({...f, due: e.target.value}))} />
              </div>
            </div>
            {editTask && <RelatedItems itemType="task" itemId={editTask.id} onNavigate={onNavigate} />}
            <div className={styles.modalFooter}>
              {editTask && <button className={styles.deleteBtn} onClick={() => setConfirmDeleteTaskId(editTask.id)}>Delete</button>}
              <button className={styles.cancelBtn} onClick={() => setOpen(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
      <DeleteConfirmModal
        isOpen={!!confirmDeleteTaskId}
        title="Delete Task?"
        description={`Are you sure you want to delete "${editTask?.title}"? This cannot be undone.`}
        itemName={editTask?.title || 'this task'}
        onConfirm={() => confirmDeleteTaskId && del(confirmDeleteTaskId)}
        onCancel={() => setConfirmDeleteTaskId(null)}
        isLoading={isDeleting}
      />
    </div>
  )
}

export default Tasks