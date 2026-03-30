import { column, Schema, Table } from '@powersync/web'

const tasks = new Table(
  {
    org_id: column.text,
    user_id: column.text,
    title: column.text,
    description: column.text,
    completed: column.integer,
    priority: column.text,
    tag: column.text,
    status: column.text,
    due_date: column.text,
    is_public: column.integer,
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { byOrg: ['org_id'] } }
)

const habits = new Table(
  {
    org_id: column.text,
    user_id: column.text,
    name: column.text,
    emoji: column.text,
    sort_order: column.integer,
    is_public: column.integer,
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
    created_at: column.text,
  },
  { indexes: { byOrg: ['org_id'] } }
)

const habit_checks = new Table(
  {
    habit_id: column.text,
    date: column.text,
    checked: column.integer,
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
    created_at: column.text,
  },
  { indexes: { byHabit: ['habit_id'] } }
)

const goals = new Table(
  {
    org_id: column.text,
    user_id: column.text,
    title: column.text,
    description: column.text,
    category: column.text,
    priority: column.text,
    deadline: column.text,
    done: column.integer,
    progress: column.real,
    is_public: column.integer,
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { byOrg: ['org_id'] } }
)

const goal_subs = new Table(
  {
    goal_id: column.text,
    text: column.text,
    done: column.integer,
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
  },
  { indexes: { byGoal: ['goal_id'] } }
)

const journal_entries = new Table(
  {
    org_id: column.text,
    user_id: column.text,
    title: column.text,
    content: column.text,
    date: column.text,
    mood: column.text,
    tags: column.text, // JSON stringified
    is_public: column.integer,
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { byOrg: ['org_id'] } }
)

const cal_events = new Table(
  {
    org_id: column.text,
    user_id: column.text,
    title: column.text,
    date: column.text,
    date_end: column.text,
    start_time: column.text,
    end_time: column.text,
    tag: column.text,
    recur: column.text,
    is_public: column.integer,
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { byOrg: ['org_id'] } }
)

const boards = new Table(
  {
    org_id: column.text,
    user_id: column.text,
    name: column.text,
    description: column.text,
    color: column.text,
    icon: column.text,
    is_public: column.integer,
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { byOrg: ['org_id'] } }
)

const board_nodes = new Table(
  {
    board_id: column.text,
    type: column.text,
    title: column.text,
    body: column.text,
    x: column.real,
    y: column.real,
    status: column.text,
    priority: column.text,
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
    created_at: column.text,
  },
  { indexes: { byBoard: ['board_id'] } }
)

const board_threads = new Table(
  {
    board_id: column.text,
    from_node_id: column.text,
    to_node_id: column.text,
    label: column.text,
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
  },
  { indexes: { byBoard: ['board_id'] } }
)

const focus_sessions = new Table(
  {
    org_id: column.text,
    user_id: column.text,
    date: column.text,
    timer_type: column.text,
    total_cycles: column.integer,
    completed_cycles: column.integer,
    work_minutes: column.integer,
    rest_minutes: column.integer,
    long_rest_minutes: column.integer,
    completed_tasks: column.integer,
    total_focus_seconds: column.integer,
    is_public: column.integer,
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { byOrg: ['org_id'] } }
)

const user_preferences = new Table(
  {
    org_id: column.text,
    user_id: column.text,
    key: column.text,
    value: column.text, // JSON stringified (jsonb → text in SQLite)
    is_deleted: column.integer,
    hlc_timestamp: column.text,
    sync_version: column.integer,
    updated_at: column.text,
  },
  { indexes: { byUser: ['user_id'] } }
)

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
  focus_sessions,
  user_preferences,
})

export type Database = (typeof AppSchema)['types']
