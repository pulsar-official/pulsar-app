"use client"

import React, { useState } from "react"
import styles from "./Tasks.module.scss"

type Priority = "high" | "med" | "low"
type Tag = "work" | "personal" | "urgent" | "health"
type Status = "todo" | "inprogress" | "done"

interface Task {
  id: string; title: string; desc: string; done: boolean
  priority: Priority; tag: Tag; due: string; status: Status
}

function makeId() { return Math.random().toString(36).slice(2) }

const SAMPLE: Task[] = [
  { id:makeId(), title:"Design new dashboard layout", desc:"", done:false, priority:"high", tag:"work", due:"2025-06-10", status:"inprogress" },
  { id:makeId(), title:"Review pull requests", desc:"", done:false, priority:"med", tag:"work", due:"2025-06-08", status:"todo" },
  { id:makeId(), title:"Write unit tests for auth module", desc:"", done:false, priority:"high", tag:"work", due:"2025-06-12", status:"todo" },
  { id:makeId(), title:"Schedule dentist appointment", desc:"", done:false, priority:"low", tag:"personal", due:"2025-06-15", status:"todo" },
  { id:makeId(), title:"Prepare sprint presentation", desc:"", done:true, priority:"med", tag:"work", due:"2025-06-05", status:"done" },
  { id:makeId(), title:"Buy groceries", desc:"", done:true, priority:"low", tag:"personal", due:"2025-06-04", status:"done" },
  { id:makeId(), title:"Morning run - 5km", desc:"", done:false, priority:"med", tag:"health", due:"", status:"todo" },
  { id:makeId(), title:"Fix critical login bug", desc:"", done:false, priority:"high", tag:"urgent", due:"2025-06-07", status:"inprogress" },
]
const TAG_CLS: Record<Tag,string> = { work:styles.tagWork, personal:styles.tagPersonal, urgent:styles.tagUrgent, health:styles.tagHealth }
const PRI_CLS: Record<Priority,string> = { high:styles.priHigh, med:styles.priMed, low:styles.priLow }
const PRI_LABEL: Record<Priority,string> = { high:"● High", med:"● Med", low:"● Low" }

interface FormState { title:string; desc:string; priority:Priority; tag:Tag; due:string; status:Status }
const DFORM: FormState = { title:"", desc:"", priority:"med", tag:"work", due:"", status:"todo" }

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE)
  const [view, setView] = useState<"list"|"board">("list")
  const [filter, setFilter] = useState<"all"|Tag>("all")
  const [open, setOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task|null>(null)
  const [form, setForm] = useState<FormState>(DFORM)

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.tag === filter)

  const toggleDone = (id: string) => {
    setTasks(ts => ts.map(t => t.id !== id ? t : { ...t, done: !t.done, status: t.done ? "todo" : "done" }))
  }

  const openAdd = () => { setEditTask(null); setForm(DFORM); setOpen(true) }
  const openEdit = (t: Task) => {
    setEditTask(t)
    setForm({ title:t.title, desc:t.desc, priority:t.priority, tag:t.tag, due:t.due, status:t.status })
    setOpen(true)
  }

  const save = () => {
    if (!form.title.trim()) return
    if (editTask) {
      setTasks(ts => ts.map(t => t.id === editTask.id ? { ...t, ...form, done: form.status === "done" } : t))
    } else {
      setTasks(ts => [...ts, { id:makeId(), ...form, done: form.status === "done" }])
    }
    setOpen(false)
  }

  const del = (id: string) => { setTasks(ts => ts.filter(t => t.id !== id)); setOpen(false) }
  const renderListView = () => {
    const active = filtered.filter(t => !t.done)
    const completed = filtered.filter(t => t.done)
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
                <span className={[styles.taskPriority, PRI_CLS[t.priority]].join(" ")}>{PRI_LABEL[t.priority]}</span>
                {t.due && <span className={styles.taskDue}>Due {t.due}</span>}
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
    const cols: { key: Status; label: string }[] = [
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
                      <span className={[styles.taskPriority, PRI_CLS[t.priority]].join(" ")}>{PRI_LABEL[t.priority]}</span>
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
                <select className={styles.select} value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value as Priority}))}>
                  <option value="high">High</option>
                  <option value="med">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tag</label>
                <select className={styles.select} value={form.tag} onChange={e => setForm(f => ({...f, tag: e.target.value as Tag}))}>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="urgent">Urgent</option>
                  <option value="health">Health</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Status</label>
                <select className={styles.select} value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value as Status}))}>
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
            <div className={styles.modalFooter}>
              {editTask && <button className={styles.deleteBtn} onClick={() => del(editTask.id)}>Delete</button>}
              <button className={styles.cancelBtn} onClick={() => setOpen(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks