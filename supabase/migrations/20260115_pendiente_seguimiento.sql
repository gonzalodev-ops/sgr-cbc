-- ============================================
-- SGR CBC - FASE 2: Sprint 5A - Tabla pendiente_seguimiento
-- Fecha: 2026-01-15
-- Descripcion: Tabla para seguimiento de pendientes que persisten entre periodos
-- T2A.4 - AGENTE BD
-- ============================================

-- ============================================
-- SECCION 1: CREAR TABLA pendiente_seguimiento
-- ============================================

-- Eliminar tabla si existe (idempotencia)
DROP TABLE IF EXISTS pendiente_seguimiento CASCADE;

CREATE TABLE pendiente_seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL,
  cliente_id UUID REFERENCES cliente(cliente_id),
  tarea_origen_id UUID REFERENCES tarea(tarea_id), -- Opcional: si nace de una tarea
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

-- ============================================
-- SECCION 2: INDICES
-- ============================================

CREATE INDEX idx_pendiente_seguimiento_cliente ON pendiente_seguimiento(cliente_id);
CREATE INDEX idx_pendiente_seguimiento_responsable ON pendiente_seguimiento(responsable_id);
CREATE INDEX idx_pendiente_seguimiento_lider ON pendiente_seguimiento(lider_id);
CREATE INDEX idx_pendiente_seguimiento_team ON pendiente_seguimiento(team_id);
CREATE INDEX idx_pendiente_seguimiento_estado ON pendiente_seguimiento(estado);
CREATE INDEX idx_pendiente_seguimiento_fecha_compromiso ON pendiente_seguimiento(fecha_compromiso);
CREATE INDEX idx_pendiente_seguimiento_categoria ON pendiente_seguimiento(categoria);
CREATE INDEX idx_pendiente_seguimiento_prioridad ON pendiente_seguimiento(prioridad);
CREATE INDEX idx_pendiente_seguimiento_tarea_origen ON pendiente_seguimiento(tarea_origen_id);

-- ============================================
-- SECCION 3: TRIGGER PARA UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS set_updated_at_pendiente_seguimiento ON pendiente_seguimiento;
CREATE TRIGGER set_updated_at_pendiente_seguimiento
  BEFORE UPDATE ON pendiente_seguimiento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SECCION 4: HABILITAR RLS
-- ============================================

ALTER TABLE pendiente_seguimiento ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECCION 5: POLITICAS RLS
-- ============================================

-- 5.1 SELECT: Admin/Socio ven todo, lideres y responsables ven sus seguimientos
DROP POLICY IF EXISTS "pendiente_seguimiento_select" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_select" ON pendiente_seguimiento
  FOR SELECT USING (
    -- Admin/Socio ven todo
    is_admin_or_socio()
    OR
    -- Lider del equipo ve seguimientos de su equipo
    team_id IN (SELECT get_leader_teams())
    OR
    -- Responsable ve sus seguimientos asignados
    responsable_id = (SELECT auth.uid())
    OR
    -- Lider asignado ve el seguimiento
    lider_id = (SELECT auth.uid())
    OR
    -- Miembros del equipo ven seguimientos del equipo
    team_id IN (SELECT get_user_teams())
  );

-- 5.2 INSERT: Admin/Socio/Lider pueden crear seguimientos
DROP POLICY IF EXISTS "pendiente_seguimiento_insert" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_insert" ON pendiente_seguimiento
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR
    -- Lideres pueden crear para su equipo
    (is_team_leader() AND (team_id IN (SELECT get_leader_teams()) OR team_id IS NULL))
    OR
    -- Cualquier usuario autenticado puede crear (el sistema asigna team automaticamente)
    (SELECT auth.uid()) IS NOT NULL
  );

-- 5.3 UPDATE: Admin/Socio/Lider/Responsable pueden actualizar
DROP POLICY IF EXISTS "pendiente_seguimiento_update" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_update" ON pendiente_seguimiento
  FOR UPDATE USING (
    is_admin_or_socio()
    OR
    -- Lider del equipo puede actualizar
    team_id IN (SELECT get_leader_teams())
    OR
    -- Responsable puede actualizar sus seguimientos
    responsable_id = (SELECT auth.uid())
    OR
    -- Lider asignado puede actualizar
    lider_id = (SELECT auth.uid())
  );

-- 5.4 DELETE: Solo Admin/Socio pueden eliminar
DROP POLICY IF EXISTS "pendiente_seguimiento_delete" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_delete" ON pendiente_seguimiento
  FOR DELETE USING (is_admin_or_socio());

-- ============================================
-- SECCION 6: COMENTARIOS
-- ============================================

COMMENT ON TABLE pendiente_seguimiento IS
  'Tabla para gestionar pendientes de seguimiento que persisten entre periodos fiscales. Puede originarse de tareas vencidas o crearse manualmente.';

COMMENT ON COLUMN pendiente_seguimiento.id IS 'Identificador unico del seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.descripcion IS 'Descripcion detallada del pendiente';
COMMENT ON COLUMN pendiente_seguimiento.cliente_id IS 'Cliente relacionado con el seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.tarea_origen_id IS 'Tarea que origino el seguimiento (si aplica)';
COMMENT ON COLUMN pendiente_seguimiento.categoria IS 'Tipo de seguimiento: PAGO, TRAMITE, CAMBIO, DOCUMENTACION, REQUERIMIENTO, OTRO';
COMMENT ON COLUMN pendiente_seguimiento.prioridad IS 'Nivel de prioridad: ALTA, MEDIA, BAJA';
COMMENT ON COLUMN pendiente_seguimiento.fecha_creacion IS 'Fecha y hora de creacion del seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.fecha_compromiso IS 'Fecha limite comprometida para resolver el pendiente';
COMMENT ON COLUMN pendiente_seguimiento.responsable_id IS 'Usuario responsable de dar seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.lider_id IS 'Lider de equipo asignado para supervisar';
COMMENT ON COLUMN pendiente_seguimiento.team_id IS 'Equipo al que pertenece el seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.estado IS 'Estado actual: ABIERTO o CERRADO';
COMMENT ON COLUMN pendiente_seguimiento.evidencia_cierre_url IS 'URL de evidencia al cerrar el seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.fecha_cierre IS 'Fecha y hora de cierre del seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.cerrado_por IS 'Usuario que cerro el seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.notas IS 'Notas adicionales sobre el seguimiento';

-- ============================================
-- FIN DE MIGRACION T2A.4 - pendiente_seguimiento
-- ============================================
