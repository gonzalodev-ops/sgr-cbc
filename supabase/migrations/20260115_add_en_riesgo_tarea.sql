-- Migration: Add en_riesgo and fecha_estado_presentado columns to tarea table
-- Date: 2026-01-15
-- Description: Fixes bug where dashboard (TMR) shows "No hay entregables con estos filtros"
--              because code expects en_riesgo column but database only has riesgo column

-- Add en_riesgo boolean column (for risk detection by lack of payment)
ALTER TABLE tarea
ADD COLUMN IF NOT EXISTS en_riesgo BOOLEAN NOT NULL DEFAULT false;

-- Add fecha_estado_presentado column (tracks when task was set to 'presentado' state)
ALTER TABLE tarea
ADD COLUMN IF NOT EXISTS fecha_estado_presentado TIMESTAMPTZ;

-- Create index for efficient risk queries
CREATE INDEX IF NOT EXISTS idx_tarea_en_riesgo ON tarea(en_riesgo) WHERE en_riesgo = true;

-- Add comment for documentation
COMMENT ON COLUMN tarea.en_riesgo IS 'Indicates if task is at risk due to lack of payment confirmation after being presented';
COMMENT ON COLUMN tarea.fecha_estado_presentado IS 'Timestamp when task state was changed to presentado';
