"use client"

import React, { useState } from "react"
import { motion, Reorder } from "framer-motion"
import styles from "./TaskKanbanView.module.scss"
import { useProductivityStore } from "@/stores/productivityStore"
import type { Task, TaskStatus, Priority, TaskTag } from "@/types/productivity"

type DisplayPriority = "high" | "med" | "low"
function toDisplayPri(p: Priority): DisplayPriority { return p === "medium" ? "med" : p as DisplayPriority }

const PRI_COLORS: Record<DisplayPriority, string> = {
  high: "oklch(0.65 0.15 20)",
  med: "oklch(0.75 0.14 60)",
  low: "oklch(0.65 0.14 150)",
}

const COLUMN_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  inprogress: "In Progress",
  done: "Done",
}

const COLUMNS: TaskStatus[] = ["todo", "inprogress", "done"]

interface AddFormState { title: string; priority: DisplayPriority; tag: TaskTag; due: string }
const EMPTY_FORM: AddFormState = { title: "", priority: "med", tag: "work", due: "" }

function toStorePri(p: DisplayPriority): Priority { return p === "med" ? "medium" : p as Priority }

const TaskKanbanView: React.FC = () => {
  const tasks = useProductivityStore(s => s.tasks)
  const addTask = useProductivityStore(s => s.addTask)
  const updateTask = useProductivityStore(s => s.updateTask)

  const [addingIn, setAddingIn] = useState<TaskStatus | null>(null)
  const [form, setForm] = useState<AddFormState>(EMPTY_FORM)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const tasksByColumn = (col: TaskStatus) =>
    tasks.filter(t => !t.isDeleted && t.status === col)

  const handleDrop = (taskId: string, targetCol: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === targetCol) return
    updateTask({ ...task, status: targetCol, completed: targetCol === "done" })
    setDraggingId(null)
  }

  const handleAddSave = (col: TaskStatus) => {
    if (!form.title.trim()) return
    addTask({
      title: form.title,
      description: "",
      priority: toStorePri(form.priority),
      tag: form.tag,
      dueDate: form.due || null,
      status: col,
      completed: col === "done",
      isPublic: false,
    })
    setAddingIn(null)
    setForm(EMPTY_FORM)
  }

  return (
    <div className={styles.board}>
      {COLUMNS.map(col => {
        const colTasks = tasksByColumn(col)
        return (
          <div
            key={col}
            className={styles.column}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              const id = e.dataTransfer.getData("taskId")
              if (id) handleDrop(id, col)
            }}
          >
            {/* Column header */}
            <div className={`${styles.colHeader} ${styles[`col_${col}`]}`}>
              <span className={styles.colTitle}>{COLUMN_LABELS[col]}</span>
              <span className={styles.colCount}>{colTasks.length}</span>
            </div>

            {/* Task cards */}
            <div className={styles.cardList}>
              {colTasks.map(task => (
                <motion.div
                  key={task.id}
                  className={`${styles.card} ${draggingId === task.id ? styles.cardDragging : ""}`}
                  layout
                  draggable
                  onDragStart={e => {
                    (e as unknown as React.DragEvent).dataTransfer.setData("taskId", task.id)
                    setDraggingId(task.id)
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.cardTitle}>{task.title}</span>
                    <span
                      className={styles.priDot}
                      style={{ background: PRI_COLORS[toDisplayPri(task.priority)] }}
                      title={toDisplayPri(task.priority)}
                    />
                  </div>
                  <div className={styles.cardMeta}>
                    {task.tag && <span className={styles.cardTag}>{task.tag}</span>}
                    {task.dueDate && (
                      <span className={styles.cardDue}>Due {task.dueDate}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Add task inline */}
            {addingIn === col ? (
              <div className={styles.addForm}>
                <input
                  className={styles.addInput}
                  placeholder="Task title…"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === "Enter") handleAddSave(col)
                    if (e.key === "Escape") { setAddingIn(null); setForm(EMPTY_FORM) }
                  }}
                />
                <div className={styles.addFormRow}>
                  <select
                    className={styles.addSelect}
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as DisplayPriority }))}
                  >
                    <option value="high">High</option>
                    <option value="med">Med</option>
                    <option value="low">Low</option>
                  </select>
                  <select
                    className={styles.addSelect}
                    value={form.tag}
                    onChange={e => setForm(f => ({ ...f, tag: e.target.value as TaskTag }))}
                  >
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="urgent">Urgent</option>
                    <option value="health">Health</option>
                  </select>
                  <input
                    type="date"
                    className={styles.addSelect}
                    value={form.due}
                    onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
                  />
                </div>
                <div className={styles.addFormActions}>
                  <button className={styles.btnSave} onClick={() => handleAddSave(col)}>Add</button>
                  <button className={styles.btnCancel} onClick={() => { setAddingIn(null); setForm(EMPTY_FORM) }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className={styles.addBtn} onClick={() => { setAddingIn(col); setForm(EMPTY_FORM) }}>
                + Add task
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default TaskKanbanView
