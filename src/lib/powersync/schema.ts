import { column, Schema, Table } from '@powersync/web'

// Shared sync metadata columns present on all entities
const syncMeta = {
  hlc_timestamp: column.text,
  sync_version:  column.integer,
  is_deleted:    column.integer, // boolean stored as 0/1
  created_at:    column.text,
  updated_at:    column.text,
}

const tasks = new Table({
  org_id:      column.text,
  user_id:     column.text,
  title:       column.text,
  description: column.text,
  completed:   column.integer, // boolean → 0/1
  priority:    column.text,
  tag:         column.text,
  status:      column.text,
  due_date:    column.text,
  ...syncMeta,
})

const habits = new Table({
  org_id:     column.text,
  user_id:    column.text,
  name:       column.text,
  emoji:      column.text,
  sort_order: column.integer,
  hlc_timestamp: column.text,
  sync_version:  column.integer,
  is_deleted:    column.integer,
  created_at:    column.text,
  // no updated_at on habits
})

const habit_checks = new Table({
  habit_id:      column.integer, // integer FK
  date:          column.text,
  checked:       column.integer, // boolean → 0/1
  hlc_timestamp: column.text,
  sync_version:  column.integer,
  is_deleted:    column.integer,
  created_at:    column.text,
  // no updated_at on habit_checks
})

const goals = new Table({
  org_id:      column.text,
  user_id:     column.text,
  title:       column.text,
  description: column.text,
  category:    column.text,
  priority:    column.text,
  deadline:    column.text,
  done:        column.integer, // boolean → 0/1
  progress:    column.real,    // float4 → REAL
  ...syncMeta,
})

const goal_subs = new Table({
  goal_id:       column.integer, // integer FK
  text:          column.text,
  done:          column.integer, // boolean → 0/1
  hlc_timestamp: column.text,
  sync_version:  column.integer,
  is_deleted:    column.integer,
  // no timestamps on goal_subs
})

const journal_entries = new Table({
  org_id:  column.text,
  user_id: column.text,
  title:   column.text,
  content: column.text,
  date:    column.text,
  mood:    column.text,
  tags:    column.text, // json → TEXT (JSON.stringify/parse)
  ...syncMeta,
})

const cal_events = new Table({
  org_id:     column.text,
  user_id:    column.text,
  title:      column.text,
  date:       column.text,
  date_end:   column.text,
  start_time: column.text,
  end_time:   column.text,
  tag:        column.text,
  recur:      column.text,
  ...syncMeta,
})

const boards = new Table({
  org_id:      column.text,
  user_id:     column.text,
  name:        column.text,
  description: column.text,
  color:       column.text,
  icon:        column.text,
  ...syncMeta,
})

const board_nodes = new Table({
  board_id:      column.integer, // integer FK
  type:          column.text,
  title:         column.text,
  body:          column.text,
  x:             column.real,
  y:             column.real,
  status:        column.text,
  priority:      column.text,
  hlc_timestamp: column.text,
  sync_version:  column.integer,
  is_deleted:    column.integer,
  created_at:    column.text,
  // no updated_at on board_nodes
})

const board_threads = new Table({
  board_id:      column.integer, // integer FK
  from_node_id:  column.integer, // integer FK
  to_node_id:    column.integer, // integer FK
  label:         column.text,
  hlc_timestamp: column.text,
  sync_version:  column.integer,
  is_deleted:    column.integer,
  // no timestamps on board_threads
})

const notes = new Table({
  org_id:    column.text,
  user_id:   column.text,
  title:     column.text,
  content:   column.text,
  is_public: column.integer, // boolean → 0/1
  tags:      column.text,    // json → TEXT (JSON.stringify/parse)
  ...syncMeta,
})

const focus_sessions = new Table({
  org_id:               column.text,
  user_id:              column.text,
  date:                 column.text,
  timer_type:           column.text,
  total_cycles:         column.integer,
  completed_cycles:     column.integer,
  work_minutes:         column.integer,
  rest_minutes:         column.integer,
  long_rest_minutes:    column.integer,
  completed_tasks:      column.integer,
  total_focus_seconds:  column.integer,
  ...syncMeta,
})

const user_preferences = new Table({
  org_id:        column.text,
  user_id:       column.text,
  key:           column.text,
  value:         column.text, // jsonb → TEXT (JSON.stringify/parse)
  hlc_timestamp: column.text,
  sync_version:  column.integer,
  is_deleted:    column.integer,
  updated_at:    column.text,
  // no created_at on user_preferences
})

export const AppSchema = new Schema({
  tasks,
  habits,
  habit_checks,
  goals,
  goal_subs,
  journal_entries,
  cal_events,
  boards,
  board_nodes,
  board_threads,
  notes,
  focus_sessions,
  user_preferences,
})

export type Database = (typeof AppSchema)['types']
