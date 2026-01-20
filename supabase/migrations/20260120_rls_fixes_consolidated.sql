-- ============================================
-- SGR CBC - Consolidación de Fixes RLS
-- Fecha: 2026-01-20
-- EJECUTAR ESTE SCRIPT COMPLETO EN SUPABASE SQL EDITOR
-- ============================================

-- ============================================
-- PASO 1: Recrear funciones helper SIN SECURITY DEFINER
-- (Esto permite que auth.uid() funcione correctamente)
-- ============================================

DROP FUNCTION IF EXISTS get_user_teams() CASCADE;
CREATE OR REPLACE FUNCTION get_user_teams()
RETURNS SETOF UUID AS $$
  SELECT team_id FROM team_members
  WHERE user_id = auth.uid() AND activo = true;
$$ LANGUAGE SQL STABLE;

DROP FUNCTION IF EXISTS is_admin_or_socio() CASCADE;
CREATE OR REPLACE FUNCTION is_admin_or_socio()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE user_id = auth.uid()
    AND rol_global IN ('ADMIN', 'SOCIO')
  );
$$ LANGUAGE SQL STABLE;

DROP FUNCTION IF EXISTS is_team_leader() CASCADE;
CREATE OR REPLACE FUNCTION is_team_leader()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
    AND rol_en_equipo = 'LIDER'
    AND activo = true
  );
$$ LANGUAGE SQL STABLE;

DROP FUNCTION IF EXISTS get_leader_teams() CASCADE;
CREATE OR REPLACE FUNCTION get_leader_teams()
RETURNS SETOF UUID AS $$
  SELECT team_id FROM team_members
  WHERE user_id = auth.uid()
  AND rol_en_equipo = 'LIDER'
  AND activo = true;
$$ LANGUAGE SQL STABLE;

-- ============================================
-- PASO 2: Habilitar RLS en tablas principales
-- ============================================

ALTER TABLE IF EXISTS cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contribuyente ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tarea ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 3: Políticas para CLIENTE
-- ============================================

DROP POLICY IF EXISTS "cliente_read" ON cliente;
DROP POLICY IF EXISTS "cliente_select" ON cliente;

CREATE POLICY "cliente_read" ON cliente
  FOR SELECT USING (
    -- ADMIN y SOCIO ven todo
    is_admin_or_socio()
    -- Usuarios ven clientes donde tienen tareas asignadas
    OR EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.cliente_id = cliente.cliente_id
      AND t.responsable_usuario_id = auth.uid()
    )
    -- Usuarios ven clientes cuyos contribuyentes pertenecen a su equipo
    OR EXISTS (
      SELECT 1 FROM contribuyente c
      JOIN cliente_contribuyente cc ON cc.contribuyente_id = c.contribuyente_id
      WHERE cc.cliente_id = cliente.cliente_id
      AND c.team_id IN (SELECT get_user_teams())
    )
  );

-- ============================================
-- PASO 4: Políticas para CONTRIBUYENTE
-- ============================================

DROP POLICY IF EXISTS "contribuyente_read" ON contribuyente;
DROP POLICY IF EXISTS "contribuyente_select" ON contribuyente;

CREATE POLICY "contribuyente_read" ON contribuyente
  FOR SELECT USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_user_teams())
    OR EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.contribuyente_id = contribuyente.contribuyente_id
      AND t.responsable_usuario_id = auth.uid()
    )
  );

-- ============================================
-- PASO 5: Políticas para TAREA
-- ============================================

DROP POLICY IF EXISTS "tarea_read" ON tarea;
DROP POLICY IF EXISTS "tarea_select" ON tarea;

CREATE POLICY "tarea_read" ON tarea
  FOR SELECT USING (
    is_admin_or_socio()
    OR responsable_usuario_id = auth.uid()
    OR revisor_usuario_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM contribuyente c
      WHERE c.contribuyente_id = tarea.contribuyente_id
      AND c.team_id IN (SELECT get_user_teams())
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = auth.uid()
      AND u.rol_global = 'AUDITOR'
    )
  );

-- ============================================
-- PASO 6: Políticas para TEAMS
-- ============================================

DROP POLICY IF EXISTS "teams_view_all" ON teams;
DROP POLICY IF EXISTS "teams_select" ON teams;

CREATE POLICY "teams_read" ON teams
  FOR SELECT USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_user_teams())
  );

-- ============================================
-- PASO 7: Políticas para TEAM_MEMBERS
-- ============================================

DROP POLICY IF EXISTS "team_members_read" ON team_members;
DROP POLICY IF EXISTS "team_members_select" ON team_members;

CREATE POLICY "team_members_read" ON team_members
  FOR SELECT USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_user_teams())
  );

-- ============================================
-- PASO 8: Políticas para EVENTO_CALENDARIO
-- ============================================

DROP POLICY IF EXISTS "evento_calendario_select" ON evento_calendario;

CREATE POLICY "evento_calendario_select" ON evento_calendario
  FOR SELECT USING (
    is_admin_or_socio()
    OR usuario_id = auth.uid()
    OR equipo_id IN (SELECT get_user_teams())
  );

-- ============================================
-- FIN - Verificar con:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
-- ============================================
