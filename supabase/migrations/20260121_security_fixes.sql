-- ============================================
-- SGR CBC - Correcciones de Seguridad RLS
-- Fecha: 2026-01-21
--
-- CORRIGE:
-- 1. Escalación de privilegios via users_update_own
-- 2. Auto-promoción via team_members_update
-- ============================================

-- ============================================
-- SECCIÓN 1: PROTEGER CAMPOS SENSIBLES EN USERS
-- ============================================

CREATE OR REPLACE FUNCTION protect_user_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo ADMIN/SOCIO pueden cambiar rol_global
  IF OLD.rol_global IS DISTINCT FROM NEW.rol_global THEN
    IF NOT is_admin_or_socio() THEN
      RAISE EXCEPTION 'No autorizado para cambiar rol_global';
    END IF;
  END IF;

  -- Solo ADMIN/SOCIO pueden cambiar estado activo
  IF OLD.activo IS DISTINCT FROM NEW.activo THEN
    IF NOT is_admin_or_socio() THEN
      RAISE EXCEPTION 'No autorizado para cambiar estado activo';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Asegurar owner correcto
ALTER FUNCTION protect_user_sensitive_fields() OWNER TO postgres;

-- Crear trigger (DROP IF EXISTS para idempotencia)
DROP TRIGGER IF EXISTS protect_user_fields ON users;
CREATE TRIGGER protect_user_fields
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION protect_user_sensitive_fields();

-- ============================================
-- SECCIÓN 2: PROTEGER ROL EN TEAM_MEMBERS
-- ============================================

CREATE OR REPLACE FUNCTION protect_team_member_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo ADMIN/SOCIO o LIDER del equipo pueden cambiar rol
  IF OLD.rol_en_equipo IS DISTINCT FROM NEW.rol_en_equipo THEN
    IF NOT (is_admin_or_socio() OR OLD.team_id IN (SELECT get_leader_teams())) THEN
      RAISE EXCEPTION 'No autorizado para cambiar rol_en_equipo';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION protect_team_member_role() OWNER TO postgres;

DROP TRIGGER IF EXISTS protect_team_member_role ON team_members;
CREATE TRIGGER protect_team_member_role
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION protect_team_member_role();

-- ============================================
-- SECCIÓN 3: VERIFICACIÓN
-- ============================================

-- Función para verificar estado de seguridad
CREATE OR REPLACE FUNCTION verificar_seguridad_rls()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check 1: Trigger de protección users existe
  RETURN QUERY
  SELECT
    'users_protection_trigger'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'protect_user_fields'
    ) THEN 'OK' ELSE 'FAIL' END::TEXT,
    'Trigger que protege rol_global y activo'::TEXT;

  -- Check 2: Trigger de protección team_members existe
  RETURN QUERY
  SELECT
    'team_members_protection_trigger'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'protect_team_member_role'
    ) THEN 'OK' ELSE 'FAIL' END::TEXT,
    'Trigger que protege rol_en_equipo'::TEXT;

  -- Check 3: Funciones helper con SECURITY DEFINER
  RETURN QUERY
  SELECT
    'helper_functions_secure'::TEXT,
    CASE WHEN (
      SELECT COUNT(*) FROM pg_proc
      WHERE proname IN ('is_admin_or_socio', 'get_user_teams', 'get_leader_teams', 'is_team_leader')
      AND prosecdef = true
    ) = 4 THEN 'OK' ELSE 'FAIL' END::TEXT,
    '4 funciones helper con SECURITY DEFINER'::TEXT;

  -- Check 4: RLS habilitado en tablas críticas
  RETURN QUERY
  SELECT
    'critical_tables_rls'::TEXT,
    CASE WHEN (
      SELECT COUNT(*) FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename IN ('cliente', 'contribuyente', 'tarea', 'teams', 'team_members')
      AND rowsecurity = true
    ) = 5 THEN 'OK' ELSE 'FAIL' END::TEXT,
    '5 tablas críticas con RLS habilitado'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIN - Ejecutar: SELECT * FROM verificar_seguridad_rls();
-- ============================================
