CREATE TABLE "board_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text,
	"board_id" integer NOT NULL,
	"type" varchar(32) DEFAULT 'task',
	"title" varchar(255) NOT NULL,
	"body" text,
	"x" real DEFAULT 0,
	"y" real DEFAULT 0,
	"status" varchar(16) DEFAULT 'todo',
	"priority" varchar(16) DEFAULT 'medium',
	"hlc_timestamp" varchar(128),
	"sync_version" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "board_nodes_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "board_threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text,
	"board_id" integer NOT NULL,
	"from_node_id" integer NOT NULL,
	"to_node_id" integer NOT NULL,
	"label" varchar(255),
	"hlc_timestamp" varchar(128),
	"sync_version" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "board_threads_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(32),
	"icon" varchar(16),
	"is_public" boolean DEFAULT false NOT NULL,
	"hlc_timestamp" varchar(128),
	"sync_version" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "boards_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "cal_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"date" varchar(10) NOT NULL,
	"date_end" varchar(10),
	"start_time" varchar(5),
	"end_time" varchar(5),
	"tag" varchar(32) DEFAULT 'default',
	"recur" varchar(16),
	"is_public" boolean DEFAULT false NOT NULL,
	"hlc_timestamp" varchar(128),
	"sync_version" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "cal_events_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "changes" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"entity_id" integer NOT NULL,
	"field" varchar(128) NOT NULL,
	"old_value" text,
	"new_value" text,
	"operation" varchar(16) DEFAULT 'update',
	"version" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "focus_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"date" varchar(10) NOT NULL,
	"timer_type" varchar(32) DEFAULT 'pomodoro',
	"total_cycles" integer DEFAULT 4,
	"completed_cycles" integer DEFAULT 0,
	"work_minutes" integer DEFAULT 25,
	"rest_minutes" integer DEFAULT 5,
	"long_rest_minutes" integer DEFAULT 15,
	"completed_tasks" integer DEFAULT 0,
	"total_focus_seconds" integer DEFAULT 0,
	"is_public" boolean DEFAULT false NOT NULL,
	"hlc_timestamp" varchar(128),
	"sync_version" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "focus_sessions_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "goal_subs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text,
	"goal_id" integer NOT NULL,
	"text" varchar(500) NOT NULL,
	"done" boolean DEFAULT false,
	"hlc_timestamp" varchar(128),
	"sync_version" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "goal_subs_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(32) DEFAULT 'work',
	"priority" varchar(16) DEFAULT 'medium',
	"deadline" varchar(32),
	"done" boolean DEFAULT false,
	"progress" real DEFAULT 0,
	"is_public" boolean DEFAULT false NOT NULL,
	"hlc_timestamp" varchar(128),
	"sync_version" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "goals_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "habit_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text,
	"habit_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"checked" boolean DEFAULT true,
	"hlc_timestamp" varchar(128),
	"sync_version" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "habit_checks_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"emoji" varchar(16) DEFAULT '✅' NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_public" boolean DEFAULT false NOT NULL,
	"hlc_timestamp" varchar(128),
	"sync_version" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "habits_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"date" varchar(10) NOT NULL,
	"mood" varchar(16),
	"tags" json,
	"is_public" boolean DEFAULT false NOT NULL,
	"hlc_timestamp" varchar(128),
	"sync_version" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "journal_entries_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_org_id" varchar(255) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_clerk_org_id_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE TABLE "sync_cursors" (
	"id" serial PRIMARY KEY NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"last_seq" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sync_operations" (
	"id" serial PRIMARY KEY NOT NULL,
	"op_id" varchar(255) NOT NULL,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"entity_type" varchar(32) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"operation" varchar(16) NOT NULL,
	"fields" json,
	"hlc" varchar(128) NOT NULL,
	"server_seq" serial NOT NULL,
	"status" varchar(16) DEFAULT 'applied',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "sync_operations_op_id_unique" UNIQUE("op_id")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" text,
	"org_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"key" varchar(128) NOT NULL,
	"value" jsonb,
	"hlc_timestamp" varchar(128),
	"sync_version" integer DEFAULT 1,
	"is_deleted" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_preferences_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
ALTER TABLE "notes" DROP CONSTRAINT "notes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "due_date" SET DATA TYPE varchar(32);--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "org_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "hlc_timestamp" varchar(128);--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "sync_version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "is_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "org_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" varchar(16) DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "tag" varchar(32) DEFAULT 'work';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "status" varchar(16) DEFAULT 'todo';--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "hlc_timestamp" varchar(128);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "sync_version" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "is_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "board_nodes" ADD CONSTRAINT "board_nodes_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_threads" ADD CONSTRAINT "board_threads_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_threads" ADD CONSTRAINT "board_threads_from_node_id_board_nodes_id_fk" FOREIGN KEY ("from_node_id") REFERENCES "public"."board_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_threads" ADD CONSTRAINT "board_threads_to_node_id_board_nodes_id_fk" FOREIGN KEY ("to_node_id") REFERENCES "public"."board_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_subs" ADD CONSTRAINT "goal_subs_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_checks" ADD CONSTRAINT "habit_checks_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "board_nodes_board_id_idx" ON "board_nodes" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "board_threads_board_id_idx" ON "board_threads" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "boards_org_id_idx" ON "boards" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "cal_events_org_id_idx" ON "cal_events" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "changes_org_id_idx" ON "changes" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "changes_entity_idx" ON "changes" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "focus_sessions_org_id_idx" ON "focus_sessions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "focus_sessions_user_date_idx" ON "focus_sessions" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "goal_subs_goal_id_idx" ON "goal_subs" USING btree ("goal_id");--> statement-breakpoint
CREATE INDEX "goals_org_id_idx" ON "goals" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "habit_checks_habit_id_idx" ON "habit_checks" USING btree ("habit_id");--> statement-breakpoint
CREATE INDEX "habits_org_id_idx" ON "habits" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "journal_entries_org_id_idx" ON "journal_entries" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_cursors_org_device_idx" ON "sync_cursors" USING btree ("org_id","device_id");--> statement-breakpoint
CREATE INDEX "sync_ops_org_seq_idx" ON "sync_operations" USING btree ("org_id","server_seq");--> statement-breakpoint
CREATE INDEX "sync_ops_entity_idx" ON "sync_operations" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_prefs_org_user_key_idx" ON "user_preferences" USING btree ("org_id","user_id","key");--> statement-breakpoint
CREATE INDEX "notes_org_id_idx" ON "notes" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "tasks_org_id_idx" ON "tasks" USING btree ("org_id");--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_client_id_unique" UNIQUE("client_id");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_id_unique" UNIQUE("client_id");