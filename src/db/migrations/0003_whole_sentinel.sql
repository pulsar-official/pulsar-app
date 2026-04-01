DROP INDEX IF EXISTS "org_members_user_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "tasks_client_id_idx";--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "boards" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cal_events" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cal_events" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "changes" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "changes" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "focus_sessions" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "focus_sessions" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "goals" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "goals" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "habits" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "notes" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "organizations" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sync_cursors" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sync_cursors" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sync_operations" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "sync_operations" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "org_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "user_preferences" ALTER COLUMN "user_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_client_id_unique" UNIQUE("client_id");