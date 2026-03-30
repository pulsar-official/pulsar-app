import { pgTable, serial, integer, bigint, text, timestamp, varchar, boolean, json, jsonb, real, date, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core'

/* ── Users ── */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  supabaseId: uuid('supabase_id').unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 255 }),
  phone: varchar('phone', { length: 32 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  subscriptionStatus: varchar('subscription_status', { length: 32 }).default('free'),
  planTier: varchar('plan_tier', { length: 32 }).default('free'),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  subscriptionPeriodEnd: timestamp('subscription_period_end'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

/* ── Organizations ── */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

/* ── Organization Members ── */
export const organizationMembers = pgTable('organization_members', {
  id: serial('id').primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull(),
  role: varchar('role', { length: 32 }).default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (t) => [
  uniqueIndex('org_members_org_user_idx').on(t.orgId, t.userId),
])

/* ── Notes ── */
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  isPublic: boolean('is_public').default(false),
  tags: json('tags'),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('notes_org_id_idx').on(t.orgId),
])

/* ── Tasks ── */
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  completed: boolean('completed').default(false),
  priority: varchar('priority', { length: 16 }).default('medium'),
  tag: varchar('tag', { length: 32 }).default('work'),
  status: varchar('status', { length: 16 }).default('todo'),
  dueDate: varchar('due_date', { length: 32 }),
  isPublic: boolean('is_public').default(false).notNull(),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('tasks_org_id_idx').on(t.orgId),
])

/* ── Habits ── */
export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  emoji: varchar('emoji', { length: 16 }).notNull().default('✅'),
  sortOrder: integer('sort_order').default(0),
  isPublic: boolean('is_public').default(false).notNull(),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('habits_org_id_idx').on(t.orgId),
])

/* ── Habit Checks ── */
export const habitChecks = pgTable('habit_checks', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  habitId: integer('habit_id').references(() => habits.id, { onDelete: 'cascade' }).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  checked: boolean('checked').default(true),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('habit_checks_habit_id_idx').on(t.habitId),
])

/* ── Goals ── */
export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 32 }).default('work'),
  priority: varchar('priority', { length: 16 }).default('medium'),
  deadline: varchar('deadline', { length: 32 }),
  done: boolean('done').default(false),
  progress: real('progress').default(0),
  isPublic: boolean('is_public').default(false).notNull(),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('goals_org_id_idx').on(t.orgId),
])

/* ── Goal Sub-tasks ── */
export const goalSubs = pgTable('goal_subs', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  goalId: integer('goal_id').references(() => goals.id, { onDelete: 'cascade' }).notNull(),
  text: varchar('text', { length: 500 }).notNull(),
  done: boolean('done').default(false),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
}, (t) => [
  index('goal_subs_goal_id_idx').on(t.goalId),
])

/* ── Journal Entries ── */
export const journalEntries = pgTable('journal_entries', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  date: varchar('date', { length: 10 }).notNull(),
  mood: varchar('mood', { length: 16 }),
  tags: json('tags'),
  isPublic: boolean('is_public').default(false).notNull(),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('journal_entries_org_id_idx').on(t.orgId),
])

/* ── Calendar Events ── */
export const calEvents = pgTable('cal_events', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  dateEnd: varchar('date_end', { length: 10 }),
  startTime: varchar('start_time', { length: 5 }),
  endTime: varchar('end_time', { length: 5 }),
  tag: varchar('tag', { length: 32 }).default('default'),
  recur: varchar('recur', { length: 16 }),
  isPublic: boolean('is_public').default(false).notNull(),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('cal_events_org_id_idx').on(t.orgId),
])

/* ── Project Boards ── */
export const boards = pgTable('boards', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 32 }),
  icon: varchar('icon', { length: 16 }),
  isPublic: boolean('is_public').default(false).notNull(),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('boards_org_id_idx').on(t.orgId),
])

/* ── Board Nodes ── */
export const boardNodes = pgTable('board_nodes', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  boardId: integer('board_id').references(() => boards.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 32 }).default('task'),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  x: real('x').default(0),
  y: real('y').default(0),
  status: varchar('status', { length: 16 }).default('todo'),
  priority: varchar('priority', { length: 16 }).default('medium'),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('board_nodes_board_id_idx').on(t.boardId),
])

/* ── Board Threads (connections between nodes) ── */
export const boardThreads = pgTable('board_threads', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  boardId: integer('board_id').references(() => boards.id, { onDelete: 'cascade' }).notNull(),
  fromNodeId: integer('from_node_id').references(() => boardNodes.id, { onDelete: 'cascade' }).notNull(),
  toNodeId: integer('to_node_id').references(() => boardNodes.id, { onDelete: 'cascade' }).notNull(),
  label: varchar('label', { length: 255 }),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
}, (t) => [
  index('board_threads_board_id_idx').on(t.boardId),
])

/* ── Focus Sessions ── */
export const focusSessions = pgTable('focus_sessions', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  timerType: varchar('timer_type', { length: 32 }).default('pomodoro'),
  totalCycles: integer('total_cycles').default(4),
  completedCycles: integer('completed_cycles').default(0),
  workMinutes: integer('work_minutes').default(25),
  restMinutes: integer('rest_minutes').default(5),
  longRestMinutes: integer('long_rest_minutes').default(15),
  completedTasks: integer('completed_tasks').default(0),
  totalFocusSeconds: integer('total_focus_seconds').default(0),
  isPublic: boolean('is_public').default(false).notNull(),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('focus_sessions_org_id_idx').on(t.orgId),
  index('focus_sessions_user_date_idx').on(t.userId, t.date),
])

/* ── User Preferences ── */
export const userPreferences = pgTable('user_preferences', {
  id: serial('id').primaryKey(),
  clientId: text('client_id').unique(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  key: varchar('key', { length: 128 }).notNull(),
  value: jsonb('value'),
  hlcTimestamp: varchar('hlc_timestamp', { length: 128 }),
  syncVersion: integer('sync_version').default(1),
  isDeleted: boolean('is_deleted').default(false),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  uniqueIndex('user_prefs_org_user_key_idx').on(t.orgId, t.userId, t.key),
])

/* ── Changes Log (legacy audit trail — kept for migration) ── */
export const changes = pgTable('changes', {
  id: serial('id').primaryKey(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 32 }).notNull(),
  entityId: integer('entity_id').notNull(),
  field: varchar('field', { length: 128 }).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  operation: varchar('operation', { length: 16 }).default('update'),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('changes_org_id_idx').on(t.orgId),
  index('changes_entity_idx').on(t.entityType, t.entityId),
])

/* ── Sync Operations (append-only log of all sync ops processed by server) ── */
export const syncOperations = pgTable('sync_operations', {
  id: serial('id').primaryKey(),
  opId: varchar('op_id', { length: 255 }).unique().notNull(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 32 }).notNull(),
  entityId: varchar('entity_id', { length: 64 }).notNull(),
  operation: varchar('operation', { length: 16 }).notNull(),
  fields: json('fields'),        // { fieldName: { value, hlc } }
  hlc: varchar('hlc', { length: 128 }).notNull(),
  serverSeq: serial('server_seq'),
  status: varchar('status', { length: 16 }).default('applied'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('sync_ops_org_seq_idx').on(t.orgId, t.serverSeq),
  index('sync_ops_entity_idx').on(t.entityType, t.entityId),
])

/* ── Sync Cursors (tracks each device's last-seen server_seq for catch-up) ── */
export const syncCursors = pgTable('sync_cursors', {
  id: serial('id').primaryKey(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  deviceId: varchar('device_id', { length: 255 }).notNull(),
  lastSeq: integer('last_seq').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  uniqueIndex('sync_cursors_org_device_idx').on(t.orgId, t.deviceId),
])
