-- Migration: Add vobo_lider column to tarea table
-- Date: 2026-01-13
-- Description: Adds VoBo Lider approval tracking to tasks

-- Add vobo_lider column with default false
ALTER TABLE tarea ADD COLUMN IF NOT EXISTS vobo_lider BOOLEAN NOT NULL DEFAULT false;

-- Add vobo_lider_at timestamp for when it was approved
ALTER TABLE tarea ADD COLUMN IF NOT EXISTS vobo_lider_at TIMESTAMPTZ;

-- Add vobo_lider_por to track who approved
ALTER TABLE tarea ADD COLUMN IF NOT EXISTS vobo_lider_por UUID REFERENCES users(user_id);

-- Create index for filtering by vobo status
CREATE INDEX IF NOT EXISTS idx_tarea_vobo_lider ON tarea(vobo_lider) WHERE vobo_lider = true;

COMMENT ON COLUMN tarea.vobo_lider IS 'Indicates if the team leader has approved the deliverable';
COMMENT ON COLUMN tarea.vobo_lider_at IS 'Timestamp when vobo_lider was set to true';
COMMENT ON COLUMN tarea.vobo_lider_por IS 'User ID of the leader who approved';
