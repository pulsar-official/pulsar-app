-- Phase 1: Tasks — subtasks, pinning, sort ordering
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS parent_id   text,
  ADD COLUMN IF NOT EXISTS pinned      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order  integer DEFAULT 0;

-- Phase 4: Tasks — ROI fields (impact, effort, goal link)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS impact   integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS effort   varchar(4) DEFAULT 'm',
  ADD COLUMN IF NOT EXISTS goal_id  text;

-- Phase 2: Habits — categories, archive, frequency
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS category   varchar(32) DEFAULT 'health',
  ADD COLUMN IF NOT EXISTS archived   boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS frequency  varchar(16) DEFAULT 'daily';

-- Phase 8: Journal — pinned entries
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;
