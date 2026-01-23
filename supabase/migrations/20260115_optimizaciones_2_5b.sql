-- ============================================
-- SGR CBC - Sprint 2.5b: Optimizaciones BD
-- Fecha: 2026-01-15
-- ============================================

-- ============================================
-- SECCION 1: INDICES PARA FOREIGN KEYS
-- Mejora rendimiento de JOINs y deletes en cascada
-- ============================================

-- audits
CREATE INDEX IF NOT EXISTS idx_audits_tarea_id ON audits(tarea_id);

-- ausencia
CREATE INDEX IF NOT EXISTS idx_ausencia_created_by ON ausencia(created_by);

-- calendario_deadline
CREATE INDEX IF NOT EXISTS idx_calendario_deadline_regla ON calendario_deadline(calendario_regla_id);

-- calendario_regla_obligacion
CREATE INDEX IF NOT EXISTS idx_calendario_regla_obligacion_obl ON calendario_regla_obligacion(id_obligacion);

-- cliente_contribuyente
CREATE INDEX IF NOT EXISTS idx_cliente_contribuyente_contrib ON cliente_contribuyente(contribuyente_id);

-- cliente_servicio
CREATE INDEX IF NOT EXISTS idx_cliente_servicio_servicio ON cliente_servicio(servicio_id);
CREATE INDEX IF NOT EXISTS idx_cliente_servicio_talla ON cliente_servicio(talla_id);

-- cliente_talla
CREATE INDEX IF NOT EXISTS idx_cliente_talla_talla ON cliente_talla(talla_id);

-- contribuyente_proceso_talla
CREATE INDEX IF NOT EXISTS idx_cpt_created_by ON contribuyente_proceso_talla(created_by);
CREATE INDEX IF NOT EXISTS idx_cpt_talla ON contribuyente_proceso_talla(talla_id);

-- contribuyente_regimen
CREATE INDEX IF NOT EXISTS idx_contribuyente_regimen_reg ON contribuyente_regimen(c_regimen);

-- entregable_obligacion
CREATE INDEX IF NOT EXISTS idx_entregable_obligacion_obl ON entregable_obligacion(id_obligacion);

-- findings
CREATE INDEX IF NOT EXISTS idx_findings_audit ON findings(audit_id);

-- obligacion_calendario
CREATE INDEX IF NOT EXISTS idx_obligacion_calendario_regla ON obligacion_calendario(calendario_regla_id);

-- obligacion_proceso
CREATE INDEX IF NOT EXISTS idx_obligacion_proceso_proc ON obligacion_proceso(proceso_id);

-- regimen_entregable_peso
CREATE INDEX IF NOT EXISTS idx_regimen_entregable_peso_ent ON regimen_entregable_peso(entregable_id);

-- regimen_obligacion
CREATE INDEX IF NOT EXISTS idx_regimen_obligacion_obl ON regimen_obligacion(id_obligacion);

-- retrabajo
CREATE INDEX IF NOT EXISTS idx_retrabajo_finding ON retrabajo(finding_id);
CREATE INDEX IF NOT EXISTS idx_retrabajo_tarea ON retrabajo(tarea_id);

-- servicio_obligacion
CREATE INDEX IF NOT EXISTS idx_servicio_obligacion_obl ON servicio_obligacion(id_obligacion);

-- tarea
CREATE INDEX IF NOT EXISTS idx_tarea_revisor ON tarea(revisor_usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarea_obligacion ON tarea(id_obligacion);
CREATE INDEX IF NOT EXISTS idx_tarea_vobo_por ON tarea(vobo_lider_por);

-- tarea_documento
CREATE INDEX IF NOT EXISTS idx_tarea_documento_doc ON tarea_documento(documento_id);

-- team_members
CREATE INDEX IF NOT EXISTS idx_team_members_suplente ON team_members(suplente_de);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

-- ============================================
-- SECCION 2: OPTIMIZAR POLITICAS RLS
-- Cambiar auth.uid() a (select auth.uid()) para evaluacion unica
-- ============================================

-- cliente policies
DROP POLICY IF EXISTS "cliente_select" ON cliente;
CREATE POLICY "cliente_select" ON cliente
  FOR SELECT USING (
    is_admin_or_socio()
    OR EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.cliente_id = cliente.cliente_id
      AND t.responsable_usuario_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM contribuyente c
      JOIN cliente_contribuyente cc ON cc.contribuyente_id = c.contribuyente_id
      WHERE cc.cliente_id = cliente.cliente_id
      AND c.team_id IN (SELECT get_user_teams())
    )
  );

-- contribuyente policies
DROP POLICY IF EXISTS "contribuyente_select" ON contribuyente;
CREATE POLICY "contribuyente_select" ON contribuyente
  FOR SELECT USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_user_teams())
    OR EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.contribuyente_id = contribuyente.contribuyente_id
      AND t.responsable_usuario_id = (SELECT auth.uid())
    )
  );

-- tarea policies (optimizadas)
DROP POLICY IF EXISTS "tarea_select" ON tarea;
CREATE POLICY "tarea_select" ON tarea
  FOR SELECT USING (
    is_admin_or_socio()
    OR responsable_usuario_id = (SELECT auth.uid())
    OR revisor_usuario_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM contribuyente c
      WHERE c.contribuyente_id = tarea.contribuyente_id
      AND c.team_id IN (SELECT get_user_teams())
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = (SELECT auth.uid())
      AND u.rol_global = 'AUDITOR'
    )
  );

DROP POLICY IF EXISTS "tarea_update" ON tarea;
CREATE POLICY "tarea_update" ON tarea
  FOR UPDATE USING (
    is_admin_or_socio()
    OR responsable_usuario_id = (SELECT auth.uid())
    OR revisor_usuario_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM contribuyente c
      WHERE c.contribuyente_id = tarea.contribuyente_id
      AND c.team_id IN (SELECT get_leader_teams())
    )
  );

DROP POLICY IF EXISTS "tarea_insert" ON tarea;
CREATE POLICY "tarea_insert" ON tarea
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR is_team_leader()
  );

DROP POLICY IF EXISTS "tarea_delete" ON tarea;
CREATE POLICY "tarea_delete" ON tarea
  FOR DELETE USING (is_admin_or_socio());

-- teams policies
DROP POLICY IF EXISTS "teams_select" ON teams;
CREATE POLICY "teams_select" ON teams
  FOR SELECT USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_user_teams())
  );

DROP POLICY IF EXISTS "teams_insert" ON teams;
CREATE POLICY "teams_insert" ON teams
  FOR INSERT WITH CHECK (is_admin_or_socio());

DROP POLICY IF EXISTS "teams_update" ON teams;
CREATE POLICY "teams_update" ON teams
  FOR UPDATE USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_leader_teams())
  );

DROP POLICY IF EXISTS "teams_delete" ON teams;
CREATE POLICY "teams_delete" ON teams
  FOR DELETE USING (is_admin_or_socio());

-- team_members policies
DROP POLICY IF EXISTS "team_members_select" ON team_members;
CREATE POLICY "team_members_select" ON team_members
  FOR SELECT USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_user_teams())
  );

DROP POLICY IF EXISTS "team_members_insert" ON team_members;
CREATE POLICY "team_members_insert" ON team_members
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR team_id IN (SELECT get_leader_teams())
  );

DROP POLICY IF EXISTS "team_members_update" ON team_members;
CREATE POLICY "team_members_update" ON team_members
  FOR UPDATE USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_leader_teams())
    OR user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "team_members_delete" ON team_members;
CREATE POLICY "team_members_delete" ON team_members
  FOR DELETE USING (is_admin_or_socio());

-- ============================================
-- SECCION 3: HABILITAR RLS EN TABLAS FALTANTES
-- ============================================

ALTER TABLE IF EXISTS cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contribuyente ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tarea ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECCION 4: INDICES NO USADOS (SOLO DOCUMENTACION)
-- ============================================

-- NOTA: Los siguientes indices fueron creados pero no se han usado aun.
-- NO ELIMINAR - el sistema es nuevo y pueden volverse utiles con mas datos.
-- Reevaluar despues de 3-6 meses de uso en produccion.
--
-- Candidatos a revision futura:
-- idx_calendario_deadline_fecha
-- idx_calendario_deadline_periodo
-- idx_tarea_cliente
-- idx_tarea_auditoria_auditor
-- idx_tarea_vobo_lider
-- idx_contribuyente_team
-- idx_evento_usuario
-- idx_evento_equipo
-- idx_evento_activo
-- idx_ausencia_colaborador
-- idx_ausencia_fechas
-- idx_ausencia_suplente
-- idx_ausencia_activo
-- idx_dia_inhabil_fecha
-- idx_dia_inhabil_activo
-- idx_tarea_en_riesgo
-- idx_fecha_ajuste_tarea
-- idx_fecha_ajuste_usuario
-- idx_fecha_ajuste_created
-- idx_cpt_contribuyente
-- idx_cpt_proceso

-- ============================================
-- SECCION 5: FUNCION PARA VERIFICAR INDICES
-- ============================================

CREATE OR REPLACE FUNCTION verificar_indices_fk()
RETURNS TABLE (
  tabla TEXT,
  columna TEXT,
  tiene_indice BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.table_name::TEXT,
    kcu.column_name::TEXT,
    EXISTS (
      SELECT 1 FROM pg_indexes pi
      WHERE pi.tablename = tc.table_name
      AND pi.indexdef LIKE '%' || kcu.column_name || '%'
    ) as tiene_indice
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
  ORDER BY tc.table_name, kcu.column_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIN Sprint 2.5b - Optimizaciones BD
-- Verificar con: SELECT * FROM verificar_indices_fk() WHERE NOT tiene_indice;
-- ============================================
