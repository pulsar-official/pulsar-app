import { pgTable, serial, text, timestamp, varchar, boolean, json, integer, real, date } from 'drizzle-orm/pg-core'

/* ── Users ── */
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  username: varchar('username', { length: 255 }),
  phone: varchar('phone', { length: 32 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

/* ── Organizations (synced from Clerk) ── */
export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  clerkOrgId: varchar('clerk_org_id', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
})

/* ── Notes ── */
export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  isPublic: boolean('is_public').default(false),
  tags: json('tags'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

/* ── Tasks ── */
export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  completed: boolean('completed').default(false),
  priority: varchar('priority', { length: 16 }).default('medium'),
  tag: varchar('tag', { length: 32 }).default('work'),
  status: varchar('status', { length: 16 }).default('todo'),
  dueDate: varchar('due_date', { length: 32 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

/* ── Habits ── */
export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  emoji: varchar('emoji', { length: 16 }).notNull().default('✅'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow(),
})

/* ── Habit Checks ── */
export const habitChecks = pgTable('habit_checks', {
  id: serial('id').primaryKey(),
  habitId: integer('habit_id').references(() => habits.id, { onDelete: 'cascade' }).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  checked: boolean('checked').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})

/* ── Goals ── */
export const goals = pgTable('goals', {
  id: serial('id').primaryKey(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 32 }).default('work'),
  priority: varchar('priority', { length: 16 }).default('medium'),
  deadline: varchar('deadline', { length: 32 }),
  done: boolean('done').default(false),
  progress: real('progress').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

/* ── Goal Sub-tasks ── */
export const goalSubs = pgTable('goal_subs', {
  id: serial('id').primaryKey(),
  goalId: integer('goal_id').references(() => goals.id, { onDelete: 'cascade' }).notNull(),
  text: varchar('text', { length: 500 }).notNull(),
  done: boolean('done').default(false),
})

/* ── Journal Entries ── */
export const journalEntries = pgTable('journal_entries', {
  id: serial('id').primaryKey(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  date: varchar('date', { length: 10 }).notNull(),
  mood: varchar('mood', { length: 16 }),
  tags: json('tags'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

/* ── Calendar Events ── */
export const calEvents = pgTable('cal_events', {
  id: serial('id').primaryKey(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  dateEnd: varchar('date_end', { length: 10 }),
  startTime: varchar('start_time', { length: 5 }),
  endTime: varchar('end_time', { length: 5 }),
  tag: varchar('tag', { length: 32 }).default('default'),
  recur: varchar('recur', { length: 16 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

/* ── Project Boards ── */
export const boards = pgTable('boards', {
  id: serial('id').primaryKey(),
  orgId: varchar('org_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  color: varchar('color', { length: 32 }),
  icon: varchar('icon', { length: 16 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

/* ── Board Nodes ── */
export const boardNodes = pgTable('board_nodes', {
  id: serial('id').primaryKey(),
  boardId: integer('board_id').references(() => boards.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 32 }).default('task'),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  x: real('x').default(0),
  y: real('y').default(0),
  status: varchar('status', { length: 16 }).default('todo'),
  priority: varchar('priority', { length: 16 }).default('medium'),
  createdAt: timestamp('created_at').defaultNow(),
})

/* ── Board Threads (connections between nodes) ── */
export const boardThreads = pgTable('board_threads', {
  id: serial('id').primaryKey(),
  boardId: integer('board_id').references(() => boards.id, { onDelete: 'cascade' }).notNull(),
  fromNodeId: integer('from_node_id').references(() => boardNodes.id, { onDelete: 'cascade' }).notNull(),
  toNodeId: integer('to_node_id').references(() => boardNodes.id, { onDelete: 'cascade' }).notNull(),
  label: varchar('label', { length: 255 }),
})
