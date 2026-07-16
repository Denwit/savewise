-- Migration: Add missing columns
USE saving_plan_db;

START TRANSACTION;

-- Add columns to saving_plans table
ALTER TABLE saving_plans
ADD COLUMN IF NOT EXISTS allow_early_withdrawals BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auto_approval BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS reminder_settings JSON;

-- Add last_login to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deposits_user_plan ON deposits (user_id, plan_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals (status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_plan_members_status ON plan_members (status);

COMMIT;