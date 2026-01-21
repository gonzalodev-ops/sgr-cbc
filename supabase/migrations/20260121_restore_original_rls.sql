-- ============================================
-- SGR CBC - RESTAURACIÓN DE RLS ORIGINAL
-- Fecha: 2026-01-21
--
-- Este script restaura las políticas RLS EXACTAS del diseño original
-- basado en 20260115_optimizaciones_2_5b.sql y 20260115_rls_security_phase0.sql
--
-- EJECUTAR COMPLETO EN SUPABASE SQL EDITOR
-- ============================================

-- ============================================
-- PASO 1: DESHABILITAR RLS EN cliente_contribuyente
-- (NUNCA debió tener RLS - es tabla junction)
-- ============================================

ALTER TABLE IF EXISTS cliente_contribuyente DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cliente_contribuyente_read" ON cliente_contribuyente;
DROP POLICY IF EXISTS "cliente_contribuyente_select" ON cliente_contribuyente;

-- ============================================
-- PASO 2: RESTAURAR FUNCIONES HELPER ORIGINALES
-- (Exactamente como en APLICAR_TODO_20260115.sql)
-- ============================================

-- is_admin_or_socio (línea 54-61 de APLICAR_TODO)
DROP FUNCTION IF EXISTS is_admin_or_socio() CASCADE;
CREATE OR REPLACE FUNCTION is_admin_or_socio()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE user_id = (SELECT auth.uid())
    AND rol_global IN ('ADMIN', 'SOCIO')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- get_user_teams (línea 309-313 de APLICAR_TODO)
DROP FUNCTION IF EXISTS get_user_teams() CASCADE;
CREATE OR REPLACE FUNCTION get_user_teams()
RETURNS SETOF UUID AS $$
  SELECT team_id FROM team_members
  WHERE user_id = (SELECT auth.uid()) AND activo = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- get_leader_teams (necesario para algunas políticas)
DROP FUNCTION IF EXISTS get_leader_teams() CASCADE;
CREATE OR REPLACE FUNCTION get_leader_teams()
RETURNS SETOF UUID AS $$
  SELECT team_id FROM team_members
  WHERE user_id = (SELECT auth.uid())
  AND rol_en_equipo = 'LIDER'
  AND activo = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- is_team_leader
DROP FUNCTION IF EXISTS is_team_leader() CASCADE;
CREATE OR REPLACE FUNCTION is_team_leader()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = (SELECT auth.uid())
    AND rol_en_equipo = 'LIDER'
    AND activo = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Asegurar owner postgres para SECURITY DEFINER
ALTER FUNCTION is_admin_or_socio() OWNER TO postgres;
ALTER FUNCTION get_user_teams() OWNER TO postgres;
ALTER FUNCTION get_leader_teams() OWNER TO postgres;
ALTER FUNCTION is_team_leader() OWNER TO postgres;

-- ============================================
-- PASO 3: HABILITAR RLS EN TABLAS CORRECTAS
-- (Solo las 5 tablas del diseño original)
-- ============================================

ALTER TABLE IF EXISTS cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contribuyente ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tarea ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 4: RESTAURAR POLÍTICAS DE cliente
-- (Exactamente como líneas 83-98 de optimizaciones_2_5b.sql)
-- ============================================

DROP POLICY IF EXISTS "cliente_read" ON cliente;
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

-- ============================================
-- PASO 5: RESTAURAR POLÍTICAS DE contribuyente
-- (Exactamente como líneas 101-111 de optimizaciones_2_5b.sql)
-- ============================================

DROP POLICY IF EXISTS "contribuyente_read" ON contribuyente;
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

-- ============================================
-- PASO 6: RESTAURAR POLÍTICAS DE tarea
-- (Exactamente como líneas 114-154 de optimizaciones_2_5b.sql)
-- ============================================

DROP POLICY IF EXISTS "tarea_read" ON tarea;
DROP POLICY IF EXISTS "tarea_select" ON tarea;
DROP POLICY IF EXISTS "tarea_update" ON tarea;
DROP POLICY IF EXISTS "tarea_insert" ON tarea;
DROP POLICY IF EXISTS "tarea_delete" ON tarea;

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

CREATE POLICY "tarea_insert" ON tarea
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR is_team_leader()
  );

CREATE POLICY "tarea_delete" ON tarea
  FOR DELETE USING (is_admin_or_socio());

-- ============================================
-- PASO 7: RESTAURAR POLÍTICAS DE teams
-- (Exactamente como líneas 157-177 de optimizaciones_2_5b.sql)
-- ============================================

DROP POLICY IF EXISTS "teams_read" ON teams;
DROP POLICY IF EXISTS "teams_select" ON teams;
DROP POLICY IF EXISTS "teams_insert" ON teams;
DROP POLICY IF EXISTS "teams_update" ON teams;
DROP POLICY IF EXISTS "teams_delete" ON teams;

CREATE POLICY "teams_select" ON teams
  FOR SELECT USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_user_teams())
  );

CREATE POLICY "teams_insert" ON teams
  FOR INSERT WITH CHECK (is_admin_or_socio());

CREATE POLICY "teams_update" ON teams
  FOR UPDATE USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_leader_teams())
  );

CREATE POLICY "teams_delete" ON teams
  FOR DELETE USING (is_admin_or_socio());

-- ============================================
-- PASO 8: RESTAURAR POLÍTICAS DE team_members
-- (Exactamente como líneas 180-204 de optimizaciones_2_5b.sql)
-- ============================================

DROP POLICY IF EXISTS "team_members_read" ON team_members;
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;
DROP POLICY IF EXISTS "team_members_own" ON team_members;

CREATE POLICY "team_members_select" ON team_members
  FOR SELECT USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_user_teams())
  );

CREATE POLICY "team_members_insert" ON team_members
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR team_id IN (SELECT get_leader_teams())
  );

CREATE POLICY "team_members_update" ON team_members
  FOR UPDATE USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_leader_teams())
    OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "team_members_delete" ON team_members
  FOR DELETE USING (is_admin_or_socio());

-- ============================================
-- PASO 9: RESTAURAR POLÍTICAS DE tarea_documento
-- (Exactamente como líneas 616-663 de rls_security_phase0.sql)
-- ============================================

DROP POLICY IF EXISTS "tarea_documento_read" ON tarea_documento;
DROP POLICY IF EXISTS "tarea_documento_select" ON tarea_documento;
DROP POLICY IF EXISTS "tarea_documento_insert" ON tarea_documento;
DROP POLICY IF EXISTS "tarea_documento_update" ON tarea_documento;
DROP POLICY IF EXISTS "tarea_documento_delete" ON tarea_documento;

CREATE POLICY "tarea_documento_select" ON tarea_documento
  FOR SELECT USING (
    is_admin_or_socio()
    OR EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_documento.tarea_id
      AND (
        t.responsable_usuario_id = (SELECT auth.uid())
        OR t.revisor_usuario_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM tarea t
      JOIN contribuyente c ON c.contribuyente_id = t.contribuyente_id
      WHERE t.tarea_id = tarea_documento.tarea_id
      AND c.team_id IN (SELECT get_leader_teams())
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.user_id = (SELECT auth.uid()) AND u.rol_global = 'AUDITOR'
    )
  );

CREATE POLICY "tarea_documento_insert" ON tarea_documento
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_documento.tarea_id
      AND (t.responsable_usuario_id = (SELECT auth.uid()) OR t.revisor_usuario_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "tarea_documento_update" ON tarea_documento
  FOR UPDATE USING (
    is_admin_or_socio()
    OR EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_documento.tarea_id
      AND (t.responsable_usuario_id = (SELECT auth.uid()) OR t.revisor_usuario_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "tarea_documento_delete" ON tarea_documento
  FOR DELETE USING (
    is_admin_or_socio()
    OR EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_documento.tarea_id
      AND t.responsable_usuario_id = (SELECT auth.uid())
    )
  );

-- ============================================
-- PASO 10: RESTAURAR POLÍTICAS DE tarea_evento
-- (Exactamente como líneas 671-694 de rls_security_phase0.sql)
-- ============================================

DROP POLICY IF EXISTS "tarea_evento_read" ON tarea_evento;
DROP POLICY IF EXISTS "tarea_evento_select" ON tarea_evento;
DROP POLICY IF EXISTS "tarea_evento_insert" ON tarea_evento;
DROP POLICY IF EXISTS "tarea_evento_update" ON tarea_evento;
DROP POLICY IF EXISTS "tarea_evento_delete" ON tarea_evento;

CREATE POLICY "tarea_evento_select" ON tarea_evento
  FOR SELECT USING (
    is_admin_or_socio()
    OR EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_evento.tarea_id
      AND (
        t.responsable_usuario_id = (SELECT auth.uid())
        OR t.revisor_usuario_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM tarea t
      JOIN contribuyente c ON c.contribuyente_id = t.contribuyente_id
      WHERE t.tarea_id = tarea_evento.tarea_id
      AND c.team_id IN (SELECT get_leader_teams())
    )
    OR EXISTS (
      SELECT 1 FROM users u WHERE u.user_id = (SELECT auth.uid()) AND u.rol_global = 'AUDITOR'
    )
  );

CREATE POLICY "tarea_evento_insert" ON tarea_evento FOR INSERT WITH CHECK (true);
CREATE POLICY "tarea_evento_update" ON tarea_evento FOR UPDATE USING (false);
CREATE POLICY "tarea_evento_delete" ON tarea_evento FOR DELETE USING (is_admin_or_socio());

-- ============================================
-- PASO 11: RESTAURAR POLÍTICAS DE tarea_step
-- ============================================

DROP POLICY IF EXISTS "tarea_step_read" ON tarea_step;
DROP POLICY IF EXISTS "tarea_step_access" ON tarea_step;
DROP POLICY IF EXISTS "tarea_step_select" ON tarea_step;

CREATE POLICY "tarea_step_select" ON tarea_step
  FOR SELECT USING (
    is_admin_or_socio()
    OR EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_step.tarea_id
      AND (
        t.responsable_usuario_id = (SELECT auth.uid())
        OR t.revisor_usuario_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM tarea t
      JOIN contribuyente c ON c.contribuyente_id = t.contribuyente_id
      WHERE t.tarea_id = tarea_step.tarea_id
      AND c.team_id IN (SELECT get_user_teams())
    )
  );

-- ============================================
-- PASO 12: RESTAURAR POLÍTICAS DE documento
-- ============================================

DROP POLICY IF EXISTS "documento_read" ON documento;
DROP POLICY IF EXISTS "documento_access" ON documento;
DROP POLICY IF EXISTS "documento_select" ON documento;

CREATE POLICY "documento_select" ON documento
  FOR SELECT USING (
    is_admin_or_socio()
    OR EXISTS (
      SELECT 1 FROM tarea_documento td
      JOIN tarea t ON t.tarea_id = td.tarea_id
      WHERE td.documento_id = documento.documento_id
      AND (
        t.responsable_usuario_id = (SELECT auth.uid())
        OR t.revisor_usuario_id = (SELECT auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1 FROM tarea_documento td
      JOIN tarea t ON t.tarea_id = td.tarea_id
      JOIN contribuyente c ON c.contribuyente_id = t.contribuyente_id
      WHERE td.documento_id = documento.documento_id
      AND c.team_id IN (SELECT get_user_teams())
    )
  );

-- ============================================
-- PASO 13: RESTAURAR POLÍTICAS DE evento_calendario
-- (Exactamente como líneas 432-461 de APLICAR_TODO)
-- ============================================

DROP POLICY IF EXISTS "evento_calendario_read" ON evento_calendario;
DROP POLICY IF EXISTS "evento_calendario_select" ON evento_calendario;

CREATE POLICY "evento_calendario_select" ON evento_calendario
  FOR SELECT USING (
    is_admin_or_socio()
    OR usuario_id = (SELECT auth.uid())
    OR equipo_id IN (SELECT get_user_teams())
  );

-- ============================================
-- PASO 14: REFRESH SCHEMA CACHE
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- FIN - VERIFICAR CON:
--
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('cliente', 'contribuyente', 'tarea', 'teams', 'team_members', 'cliente_contribuyente')
-- ORDER BY tablename, policyname;
--
-- DEBE MOSTRAR:
-- - cliente: cliente_select
-- - contribuyente: contribuyente_select
-- - tarea: tarea_select, tarea_update, tarea_insert, tarea_delete
-- - teams: teams_select, teams_insert, teams_update, teams_delete
-- - team_members: team_members_select, team_members_insert, team_members_update, team_members_delete
-- - cliente_contribuyente: (NINGUNA - RLS deshabilitado)
-- ============================================
