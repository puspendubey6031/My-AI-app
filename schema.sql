-- =================================================================
-- DATABASE FINAL FIX SCRIPT
-- =================================================================

-- 1. ADD MISSING COLUMNS
-- =================================================================

-- Add 'userId' to the 'video_jobs' table to link jobs to their creators.
-- The data type is INTEGER to match the 'users.id' primary key.
ALTER TABLE "video_jobs"
ADD COLUMN "userId" INTEGER;


-- =================================================================
-- 2. CREATE MISSING TABLES
-- =================================================================

-- Create the 'plans' table to store subscription plan details.
-- The primary key 'id' is TEXT to match the existing 'subscriptions.planId' column.
CREATE TABLE "plans" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price_inr" INTEGER NOT NULL,
    "credits_per_month" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Populate the 'plans' table with the initial set of plans.
INSERT INTO "plans" (id, name, price_inr, credits_per_month) VALUES
('free', 'Free', 0, 5),
('starter', 'Starter', 199, 50),
('creator', 'Creator', 399, 150),
('premium', 'Premium', 799, 400);

-- Create the 'banner_ads' table for managing dynamic advertisements.
CREATE TABLE "banner_ads" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "image_url" TEXT,
    "target_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_location" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the 'notifications' table to store user-specific notifications.
CREATE TABLE "notifications" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the 'app_settings' table for global application settings.
-- This table is constrained to a single row to hold one global settings object.
CREATE TABLE "app_settings" (
    "id" INTEGER PRIMARY KEY DEFAULT 1,
    "settings" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT "app_settings_single_row_check" CHECK (id = 1)
);


-- =================================================================
-- 3. ADD FOREIGN KEY CONSTRAINTS
-- =================================================================

-- Add a foreign key from 'video_jobs' to 'users'.
ALTER TABLE "video_jobs"
ADD CONSTRAINT "fk_video_jobs_user_id"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;

-- Add a foreign key from 'notifications' to 'users'.
ALTER TABLE "notifications"
ADD CONSTRAINT "fk_notifications_user_id"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

-- Add a foreign key from 'subscriptions' to 'plans'.
-- This uses the correct 'planId' column name.
ALTER TABLE "subscriptions"
ADD CONSTRAINT "fk_subscriptions_plan_id"
FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT;


-- =================================================================
-- 4. CREATE RECOMMENDED INDEXES
-- =================================================================

-- Add indexes to foreign key columns and other frequently queried columns.
CREATE INDEX "idx_video_jobs_user_id" ON "video_jobs"("userId");
CREATE INDEX "idx_notifications_user_id" ON "notifications"("userId");
CREATE INDEX "idx_subscriptions_plan_id" ON "subscriptions"("planId");
CREATE INDEX "idx_subscriptions_user_id" ON "subscriptions"("userId");
