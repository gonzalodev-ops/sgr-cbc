-- ============================================
-- SGR CBC - FASE 2: Sprint 5A - Tabla pendiente_seguimiento
-- Fecha: 2026-01-15
-- Descripcion: Tabla para seguimiento de pendientes que persisten entre periodos
-- VERSION CORREGIDA - Sin referencias a t.lider_id
-- ============================================

DROP TABLE IF EXISTS pendiente_seguimiento CASCADE;

CREATE TABLE pendiente_seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL,
  cliente_id UUID REFERENCES cliente(cliente_id),
  tarea_origen_id UUID REFERENCES tarea(tarea_id),
  categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('PAGO', 'TRAMITE', 'CAMBIO', 'DOCUMENTACION', 'REQUERIMIENTO', 'OTRO')),
  prioridad VARCHAR(10) NOT NULL DEFAULT 'MEDIA' CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_compromiso DATE,
  responsable_id UUID REFERENCES users(user_id),
  lider_id UUID REFERENCES users(user_id),
  team_id UUID REFERENCES teams(team_id),
  estado VARCHAR(20) DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO')),
  evidencia_cierre_url TEXT,
  fecha_cierre TIMESTAMPTZ,
  cerrado_por UUID REFERENCES users(user_id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_pendiente_seguimiento_cliente ON pendiente_seguimiento(cliente_id);
CREATE INDEX idx_pendiente_seguimiento_responsable ON pendiente_seguimiento(responsable_id);
CREATE INDEX idx_pendiente_seguimiento_lider ON pendiente_seguimiento(lider_id);
CREATE INDEX idx_pendiente_seguimiento_team ON pendiente_seguimiento(team_id);
CREATE INDEX idx_pendiente_seguimiento_estado ON pendiente_seguimiento(estado);
CREATE INDEX idx_pendiente_seguimiento_fecha_compromiso ON pendiente_seguimiento(fecha_compromiso);
CREATE INDEX idx_pendiente_seguimiento_categoria ON pendiente_seguimiento(categoria);
CREATE INDEX idx_pendiente_seguimiento_prioridad ON pendiente_seguimiento(prioridad);
CREATE INDEX idx_pendiente_seguimiento_tarea_origen ON pendiente_seguimiento(tarea_origen_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at_pendiente_seguimiento ON pendiente_seguimiento;
CREATE TRIGGER set_updated_at_pendiente_seguimiento
  BEFORE UPDATE ON pendiente_seguimiento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE pendiente_seguimiento ENABLE ROW LEVEL SECURITY;

-- Politicas RLS usando funciones helper correctas
DROP POLICY IF EXISTS "pendiente_seguimiento_select" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_select" ON pendiente_seguimiento
  FOR SELECT USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_leader_teams())
    OR responsable_id = (SELECT auth.uid())
    OR lider_id = (SELECT auth.uid())
    OR team_id IN (SELECT get_user_teams())
  );

DROP POLICY IF EXISTS "pendiente_seguimiento_insert" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_insert" ON pendiente_seguimiento
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR (is_team_leader() AND (team_id IN (SELECT get_leader_teams()) OR team_id IS NULL))
    OR (SELECT auth.uid()) IS NOT NULL
  );

DROP POLICY IF EXISTS "pendiente_seguimiento_update" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_update" ON pendiente_seguimiento
  FOR UPDATE USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_leader_teams())
    OR responsable_id = (SELECT auth.uid())
    OR lider_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "pendiente_seguimiento_delete" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_delete" ON pendiente_seguimiento
  FOR DELETE USING (is_admin_or_socio());

-- Comentarios
COMMENT ON TABLE pendiente_seguimiento IS 'Tabla para gestionar pendientes de seguimiento que persisten entre periodos fiscales';
COMMENT ON COLUMN pendiente_seguimiento.lider_id IS 'Lider de equipo asignado para supervisar';
COMMENT ON COLUMN pendiente_seguimiento.team_id IS 'Equipo al que pertenece el seguimiento';
