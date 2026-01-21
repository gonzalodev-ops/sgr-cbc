-- ============================================
-- SGR CBC - Consolidación de Fixes RLS
-- Fecha: 2026-01-20
-- EJECUTAR ESTE SCRIPT COMPLETO EN SUPABASE SQL EDITOR
-- ============================================

-- ============================================
-- PASO 1: Recrear funciones helper CON SECURITY DEFINER
-- CRITICAL: SECURITY DEFINER permite que estas funciones
-- bypassen RLS para evitar dependencias circulares
-- ============================================

DROP FUNCTION IF EXISTS get_user_role() CASCADE;
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT rol_global FROM users WHERE user_id = (SELECT auth.uid());
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

DROP FUNCTION IF EXISTS get_user_teams() CASCADE;
CREATE OR REPLACE FUNCTION get_user_teams()
RETURNS SETOF UUID AS $$
  SELECT team_id FROM team_members
  WHERE user_id = (SELECT auth.uid()) AND activo = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

DROP FUNCTION IF EXISTS is_admin_or_socio() CASCADE;
CREATE OR REPLACE FUNCTION is_admin_or_socio()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE user_id = (SELECT auth.uid())
    AND rol_global IN ('ADMIN', 'SOCIO')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

DROP FUNCTION IF EXISTS is_team_leader() CASCADE;
CREATE OR REPLACE FUNCTION is_team_leader()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = (SELECT auth.uid())
    AND rol_en_equipo = 'LIDER'
    AND activo = true
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

DROP FUNCTION IF EXISTS get_leader_teams() CASCADE;
CREATE OR REPLACE FUNCTION get_leader_teams()
RETURNS SETOF UUID AS $$
  SELECT team_id FROM team_members
  WHERE user_id = (SELECT auth.uid())
  AND rol_en_equipo = 'LIDER'
  AND activo = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- ============================================
-- PASO 1b: Asegurar que las funciones sean propiedad de postgres
-- para que SECURITY DEFINER pueda bypassear RLS
-- ============================================

ALTER FUNCTION get_user_role() OWNER TO postgres;
ALTER FUNCTION get_user_teams() OWNER TO postgres;
ALTER FUNCTION is_admin_or_socio() OWNER TO postgres;
ALTER FUNCTION is_team_leader() OWNER TO postgres;
ALTER FUNCTION get_leader_teams() OWNER TO postgres;

-- Verificar que el owner sea correcto (opcional, para debug)
-- SELECT proname, proowner::regrole FROM pg_proc WHERE proname IN ('get_user_teams', 'is_admin_or_socio');

-- ============================================
-- PASO 2: Habilitar RLS en tablas principales
-- ============================================

ALTER TABLE IF EXISTS cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contribuyente ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cliente_contribuyente ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tarea ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tarea_step ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tarea_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tarea_documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evento_calendario ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 3: Políticas para CLIENTE
-- ============================================

DROP POLICY IF EXISTS "cliente_read" ON cliente;
DROP POLICY IF EXISTS "cliente_select" ON cliente;
DROP POLICY IF EXISTS "admin_socio_all_clientes" ON cliente;
DROP POLICY IF EXISTS "lider_team_clientes" ON cliente;
DROP POLICY IF EXISTS "colaborador_assigned_clientes" ON cliente;

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
-- PASO 5: Políticas para CLIENTE_CONTRIBUYENTE
-- (CRITICAL: Esta tabla tenía RLS habilitado pero SIN política)
-- ============================================

DROP POLICY IF EXISTS "cliente_contribuyente_read" ON cliente_contribuyente;
DROP POLICY IF EXISTS "cliente_contribuyente_select" ON cliente_contribuyente;

CREATE POLICY "cliente_contribuyente_read" ON cliente_contribuyente
  FOR SELECT USING (
    is_admin_or_socio()
    -- Usuarios pueden ver relaciones de contribuyentes de su equipo
    OR EXISTS (
      SELECT 1 FROM contribuyente c
      WHERE c.contribuyente_id = cliente_contribuyente.contribuyente_id
      AND c.team_id IN (SELECT get_user_teams())
    )
    -- Usuarios pueden ver relaciones de clientes con tareas asignadas
    OR EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.cliente_id = cliente_contribuyente.cliente_id
      AND t.responsable_usuario_id = auth.uid()
    )
  );

-- ============================================
-- PASO 6: Políticas para TAREA
-- ============================================

DROP POLICY IF EXISTS "tarea_read" ON tarea;
DROP POLICY IF EXISTS "tarea_select" ON tarea;
DROP POLICY IF EXISTS "admin_socio_all_tareas" ON tarea;
DROP POLICY IF EXISTS "lider_team_tareas" ON tarea;
DROP POLICY IF EXISTS "colaborador_own_tareas" ON tarea;

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
-- PASO 7: Políticas para TAREA_STEP
-- ============================================

DROP POLICY IF EXISTS "tarea_step_read" ON tarea_step;
DROP POLICY IF EXISTS "tarea_step_access" ON tarea_step;

CREATE POLICY "tarea_step_read" ON tarea_step
  FOR SELECT USING (
    -- Acceso si el usuario puede ver la tarea padre
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_step.tarea_id
      AND (
        is_admin_or_socio()
        OR t.responsable_usuario_id = auth.uid()
        OR t.revisor_usuario_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM contribuyente c
          WHERE c.contribuyente_id = t.contribuyente_id
          AND c.team_id IN (SELECT get_user_teams())
        )
      )
    )
  );

-- ============================================
-- PASO 8: Políticas para TAREA_EVENTO
-- (CRITICAL: Esta tabla tenía RLS habilitado pero SIN política)
-- ============================================

DROP POLICY IF EXISTS "tarea_evento_read" ON tarea_evento;
DROP POLICY IF EXISTS "tarea_evento_select" ON tarea_evento;

CREATE POLICY "tarea_evento_read" ON tarea_evento
  FOR SELECT USING (
    -- Acceso si el usuario puede ver la tarea padre
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_evento.tarea_id
      AND (
        is_admin_or_socio()
        OR t.responsable_usuario_id = auth.uid()
        OR t.revisor_usuario_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM contribuyente c
          WHERE c.contribuyente_id = t.contribuyente_id
          AND c.team_id IN (SELECT get_user_teams())
        )
      )
    )
  );

-- ============================================
-- PASO 9: Políticas para TAREA_DOCUMENTO
-- (CRITICAL: Esta tabla tenía RLS habilitado pero SIN política)
-- ============================================

DROP POLICY IF EXISTS "tarea_documento_read" ON tarea_documento;
DROP POLICY IF EXISTS "tarea_documento_select" ON tarea_documento;

CREATE POLICY "tarea_documento_read" ON tarea_documento
  FOR SELECT USING (
    -- Acceso si el usuario puede ver la tarea padre
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_documento.tarea_id
      AND (
        is_admin_or_socio()
        OR t.responsable_usuario_id = auth.uid()
        OR t.revisor_usuario_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM contribuyente c
          WHERE c.contribuyente_id = t.contribuyente_id
          AND c.team_id IN (SELECT get_user_teams())
        )
      )
    )
  );

-- ============================================
-- PASO 10: Políticas para DOCUMENTO
-- ============================================

DROP POLICY IF EXISTS "documento_read" ON documento;
DROP POLICY IF EXISTS "documento_access" ON documento;
DROP POLICY IF EXISTS "documento_view_by_task" ON documento;

CREATE POLICY "documento_read" ON documento
  FOR SELECT USING (
    is_admin_or_socio()
    -- Usuarios ven documentos vinculados a tareas accesibles
    OR EXISTS (
      SELECT 1 FROM tarea_documento td
      JOIN tarea t ON t.tarea_id = td.tarea_id
      WHERE td.documento_id = documento.documento_id
      AND (
        t.responsable_usuario_id = auth.uid()
        OR t.revisor_usuario_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM contribuyente c
          WHERE c.contribuyente_id = t.contribuyente_id
          AND c.team_id IN (SELECT get_user_teams())
        )
      )
    )
  );

-- ============================================
-- PASO 11: Políticas para TEAMS
-- ============================================

DROP POLICY IF EXISTS "teams_view_all" ON teams;
DROP POLICY IF EXISTS "teams_select" ON teams;
DROP POLICY IF EXISTS "teams_read" ON teams;

CREATE POLICY "teams_read" ON teams
  FOR SELECT USING (
    is_admin_or_socio()
    OR team_id IN (SELECT get_user_teams())
  );

-- ============================================
-- PASO 12: Políticas para TEAM_MEMBERS
-- CRITICAL: Esta política NO debe llamar a get_user_teams()
-- porque causaría recursión infinita (get_user_teams() lee team_members)
-- ============================================

DROP POLICY IF EXISTS "team_members_read" ON team_members;
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_view" ON team_members;
DROP POLICY IF EXISTS "team_members_own" ON team_members;

-- Política simplificada que evita recursión:
-- 1. ADMIN/SOCIO ven todo
-- 2. Cualquier usuario autenticado puede ver membresías de equipos
--    (info no sensible, necesaria para funcionalidad del sistema)
CREATE POLICY "team_members_read" ON team_members
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- ============================================
-- PASO 13: Políticas para EVENTO_CALENDARIO
-- ============================================

DROP POLICY IF EXISTS "evento_calendario_select" ON evento_calendario;
DROP POLICY IF EXISTS "evento_calendario_read" ON evento_calendario;

CREATE POLICY "evento_calendario_read" ON evento_calendario
  FOR SELECT USING (
    is_admin_or_socio()
    OR usuario_id = auth.uid()
    OR equipo_id IN (SELECT get_user_teams())
  );

-- ============================================
-- PASO 14: Refresh PostgREST schema cache
-- ============================================

NOTIFY pgrst, 'reload schema';

-- ============================================
-- FIN - Verificar con:
-- SELECT tablename, policyname FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
-- ============================================
