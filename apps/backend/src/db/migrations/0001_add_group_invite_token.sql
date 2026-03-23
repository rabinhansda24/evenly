ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "invite_token" varchar(64);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_group_invite_token" ON "groups" ("invite_token");
