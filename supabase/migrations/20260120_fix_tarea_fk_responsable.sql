-- ============================================
-- Fix: Add missing FK for responsable_usuario_id
-- This allows Supabase to resolve the join automatically
-- ============================================

-- Add FK constraint for responsable_usuario_id -> users(user_id)
-- This fixes the "Error cargando tarea" 400 error in TaskDetailModal
DO $$
BEGIN
  -- Only add if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tarea_responsable_usuario_id_fkey'
    AND table_name = 'tarea'
  ) THEN
    ALTER TABLE tarea
      ADD CONSTRAINT tarea_responsable_usuario_id_fkey
      FOREIGN KEY (responsable_usuario_id)
      REFERENCES users(user_id);
  END IF;
END $$;

-- Add FK constraint for revisor_usuario_id -> users(user_id) (also missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tarea_revisor_usuario_id_fkey'
    AND table_name = 'tarea'
  ) THEN
    ALTER TABLE tarea
      ADD CONSTRAINT tarea_revisor_usuario_id_fkey
      FOREIGN KEY (revisor_usuario_id)
      REFERENCES users(user_id);
  END IF;
END $$;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_tarea_revisor ON tarea(revisor_usuario_id);
