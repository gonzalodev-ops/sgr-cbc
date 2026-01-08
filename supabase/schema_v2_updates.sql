-- ============================================
-- SGR CBC - Actualizaciones Schema v2
-- Ejecutar DESPUÉS de schema.sql y rls_policies.sql
-- ============================================

-- Actualizar estados de tarea
ALTER TABLE tarea DROP CONSTRAINT IF EXISTS tarea_estado_check;
ALTER TABLE tarea ADD CONSTRAINT tarea_estado_check 
  CHECK (estado IN ('no_iniciado', 'en_curso', 'revision', 'terminado', 'bloqueado_cliente', 'rechazado', 'presentado', 'pagado', 'cerrado'));

-- Agregar campos faltantes a tarea
ALTER TABLE tarea ADD COLUMN IF NOT EXISTS evidencia_url TEXT;
ALTER TABLE tarea ADD COLUMN IF NOT EXISTS vobo_lider BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE tarea ADD COLUMN IF NOT EXISTS vobo_lider_at TIMESTAMPTZ;
ALTER TABLE tarea ADD COLUMN IF NOT EXISTS vobo_lider_por UUID REFERENCES users(user_id);

-- Actualizar rol_global para incluir AUDITOR
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_rol_global_check;
ALTER TABLE users ADD CONSTRAINT users_rol_global_check 
  CHECK (rol_global IN ('ADMIN', 'SOCIO', 'LIDER', 'COLABORADOR', 'AUDITOR'));

-- Tabla de auditorías
CREATE TABLE IF NOT EXISTS tarea_auditoria (
  auditoria_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID NOT NULL REFERENCES tarea(tarea_id) ON DELETE CASCADE,
  auditor_id UUID NOT NULL REFERENCES users(user_id),
  resultado TEXT NOT NULL DEFAULT 'PENDIENTE' CHECK (resultado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO')),
  comentarios TEXT,
  comentarios_positivos TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarea_auditoria_tarea ON tarea_auditoria(tarea_id);
CREATE INDEX IF NOT EXISTS idx_tarea_auditoria_auditor ON tarea_auditoria(auditor_id);

-- RLS para tarea_auditoria
ALTER TABLE tarea_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auditor_can_view_own_audits" ON tarea_auditoria
  FOR SELECT USING (
    auditor_id = auth.uid() OR
    get_user_role() IN ('ADMIN', 'SOCIO')
  );

CREATE POLICY "auditor_can_insert_audits" ON tarea_auditoria
  FOR INSERT WITH CHECK (
    auditor_id = auth.uid() AND
    get_user_role() IN ('AUDITOR', 'ADMIN', 'SOCIO')
  );

CREATE POLICY "auditor_can_update_own_audits" ON tarea_auditoria
  FOR UPDATE USING (
    auditor_id = auth.uid()
  );

-- Agregar tribu a teams (si no existe el campo)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS es_tribu BOOLEAN NOT NULL DEFAULT true;

-- Seed de tribus
INSERT INTO teams (nombre, es_tribu) VALUES
  ('Isidora', true),
  ('Noelia', true),
  ('Vianey', true),
  ('Querétaro', true)
ON CONFLICT DO NOTHING;
