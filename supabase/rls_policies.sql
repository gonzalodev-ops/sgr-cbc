-- ============================================
-- SGR CBC - RLS Policies & Security
-- Ejecutar DESPUÉS de schema.sql
-- ============================================

-- Habilitar RLS en todas las tablas operativas
ALTER TABLE cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribuyente ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_contribuyente ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarea ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarea_step ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarea_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarea_documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Obtener rol global del usuario actual
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT rol_global FROM users WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Verificar si usuario es admin o socio
CREATE OR REPLACE FUNCTION is_admin_or_socio()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('ADMIN', 'SOCIO');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Obtener equipos del usuario actual
CREATE OR REPLACE FUNCTION get_user_teams()
RETURNS SETOF UUID AS $$
  SELECT team_id FROM team_members WHERE user_id = auth.uid() AND activo = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Obtener clientes asignados al equipo del usuario
CREATE OR REPLACE FUNCTION get_user_clients()
RETURNS SETOF UUID AS $$
  SELECT DISTINCT t.cliente_id 
  FROM tarea t
  WHERE t.responsable_usuario_id = auth.uid()
     OR t.revisor_usuario_id = auth.uid()
     OR EXISTS (
       SELECT 1 FROM team_members tm 
       JOIN tarea t2 ON t2.responsable_usuario_id = tm.user_id
       WHERE tm.team_id IN (SELECT get_user_teams())
         AND tm.rol_en_equipo = 'LIDER'
         AND tm.user_id = auth.uid()
     );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- POLÍTICAS: CLIENTES
-- ============================================

-- Admin/Socio ven todos los clientes
CREATE POLICY "admin_socio_all_clientes" ON cliente
  FOR ALL USING (is_admin_or_socio());

-- Líder ve clientes de su equipo
CREATE POLICY "lider_team_clientes" ON cliente
  FOR SELECT USING (
    get_user_role() = 'LIDER' AND 
    cliente_id IN (SELECT get_user_clients())
  );

-- Colaborador ve solo clientes asignados
CREATE POLICY "colaborador_assigned_clientes" ON cliente
  FOR SELECT USING (
    get_user_role() = 'COLABORADOR' AND
    cliente_id IN (
      SELECT cliente_id FROM tarea 
      WHERE responsable_usuario_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS: TAREAS
-- ============================================

-- Admin/Socio: acceso total
CREATE POLICY "admin_socio_all_tareas" ON tarea
  FOR ALL USING (is_admin_or_socio());

-- Líder: tareas de su equipo
CREATE POLICY "lider_team_tareas" ON tarea
  FOR ALL USING (
    get_user_role() = 'LIDER' AND
    (responsable_usuario_id IN (
      SELECT user_id FROM team_members 
      WHERE team_id IN (SELECT get_user_teams()) AND activo = true
    ) OR revisor_usuario_id = auth.uid())
  );

-- Colaborador: solo sus tareas asignadas
CREATE POLICY "colaborador_own_tareas" ON tarea
  FOR SELECT USING (
    get_user_role() = 'COLABORADOR' AND
    responsable_usuario_id = auth.uid()
  );

-- Colaborador: puede actualizar estado de sus tareas
CREATE POLICY "colaborador_update_own_tareas" ON tarea
  FOR UPDATE USING (
    get_user_role() = 'COLABORADOR' AND
    responsable_usuario_id = auth.uid()
  );

-- ============================================
-- POLÍTICAS: TAREA_STEP
-- ============================================

CREATE POLICY "tarea_step_access" ON tarea_step
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tarea t 
      WHERE t.tarea_id = tarea_step.tarea_id
    )
  );

-- ============================================
-- POLÍTICAS: DOCUMENTOS
-- ============================================

CREATE POLICY "documento_access" ON documento
  FOR ALL USING (is_admin_or_socio());

CREATE POLICY "documento_view_by_task" ON documento
  FOR SELECT USING (
    documento_id IN (
      SELECT documento_id FROM tarea_documento td
      JOIN tarea t ON t.tarea_id = td.tarea_id
      WHERE t.responsable_usuario_id = auth.uid()
         OR t.revisor_usuario_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS: EQUIPOS
-- ============================================

CREATE POLICY "teams_view_all" ON teams
  FOR SELECT USING (true);

CREATE POLICY "teams_manage_admin" ON teams
  FOR ALL USING (is_admin_or_socio());

CREATE POLICY "team_members_view" ON team_members
  FOR SELECT USING (
    team_id IN (SELECT get_user_teams()) OR is_admin_or_socio()
  );

CREATE POLICY "team_members_manage" ON team_members
  FOR ALL USING (is_admin_or_socio());

-- ============================================
-- AUDITORÍA MEJORADA: Trigger para tarea_evento
-- ============================================

-- Añadir campos de auditoría a tarea_evento
ALTER TABLE tarea_evento ADD COLUMN IF NOT EXISTS razon TEXT;
ALTER TABLE tarea_evento ADD COLUMN IF NOT EXISTS ip_address INET;

-- Función para registrar cambios automáticamente
CREATE OR REPLACE FUNCTION fn_audit_tarea_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO tarea_evento (
      tarea_id,
      tipo_evento,
      estado_anterior,
      estado_nuevo,
      actor_usuario_id,
      occurred_at,
      metadata_json
    ) VALUES (
      NEW.tarea_id,
      'STATUS_CHANGE',
      OLD.estado,
      NEW.estado,
      auth.uid(),
      NOW(),
      jsonb_build_object(
        'changed_fields', jsonb_build_object('estado', jsonb_build_object('old', OLD.estado, 'new', NEW.estado))
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auditar cambios en tareas
CREATE TRIGGER trg_audit_tarea_changes
  AFTER UPDATE ON tarea
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_tarea_changes();

-- ============================================
-- REGLAS DE BLOQUEO (Computed en runtime)
-- ============================================

-- Vista para detectar pasos bloqueados
CREATE OR REPLACE VIEW vw_pasos_bloqueados AS
SELECT 
  ts.tarea_step_id,
  ts.tarea_id,
  ts.orden,
  ts.titulo,
  pp.grupo_concurrencia,
  CASE 
    WHEN pp.grupo_concurrencia IS NULL THEN
      -- Secuencial: bloqueado si el paso anterior no está completado
      EXISTS (
        SELECT 1 FROM tarea_step prev
        WHERE prev.tarea_id = ts.tarea_id
          AND prev.orden = ts.orden - 1
          AND prev.completado = false
      )
    ELSE
      -- Paralelo: buscar el paso más antiguo del grupo anterior
      EXISTS (
        SELECT 1 FROM tarea_step prev
        JOIN proceso_paso pp_prev ON pp_prev.paso_id = prev.proceso_paso_id
        WHERE prev.tarea_id = ts.tarea_id
          AND pp_prev.grupo_concurrencia < pp.grupo_concurrencia
          AND prev.completado = false
      )
  END AS esta_bloqueado,
  -- Quién bloquea
  (
    SELECT array_agg(prev.titulo)
    FROM tarea_step prev
    WHERE prev.tarea_id = ts.tarea_id
      AND prev.orden < ts.orden
      AND prev.completado = false
  ) AS bloqueado_por
FROM tarea_step ts
LEFT JOIN proceso_paso pp ON pp.paso_id = ts.proceso_paso_id
WHERE ts.completado = false;

-- ============================================
-- IDEMPOTENCIA: Ya existe en schema.sql
-- UNIQUE (contribuyente_id, id_obligacion, periodo_fiscal)
-- ============================================

-- Función helper para verificar duplicados antes de insertar
CREATE OR REPLACE FUNCTION check_tarea_exists(
  p_contribuyente_id UUID,
  p_id_obligacion TEXT,
  p_periodo_fiscal TEXT
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tarea 
    WHERE contribuyente_id = p_contribuyente_id
      AND id_obligacion = p_id_obligacion  
      AND periodo_fiscal = p_periodo_fiscal
  );
$$ LANGUAGE SQL STABLE;
