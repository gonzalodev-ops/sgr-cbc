-- ============================================
-- SGR CBC - RLS Policies para AUDITOR
-- Ejecutar DESPUÉS de rls_policies.sql
-- ============================================

-- AUDITOR puede ver todas las tareas (solo lectura para auditar)
CREATE POLICY "auditor_view_tareas" ON tarea
  FOR SELECT USING (
    get_user_role() = 'AUDITOR'
  );

-- AUDITOR puede ver todos los clientes (solo lectura)
CREATE POLICY "auditor_view_clientes" ON cliente
  FOR SELECT USING (
    get_user_role() = 'AUDITOR'
  );

-- AUDITOR puede ver contribuyentes
CREATE POLICY "auditor_view_contribuyentes" ON contribuyente
  FOR SELECT USING (
    get_user_role() = 'AUDITOR'
  );

-- AUDITOR puede ver todos los equipos
CREATE POLICY "auditor_view_teams" ON team_members
  FOR SELECT USING (
    get_user_role() = 'AUDITOR'
  );

-- AUDITOR puede ver todos los pasos de tarea
CREATE POLICY "auditor_view_tarea_steps" ON tarea_step
  FOR SELECT USING (
    get_user_role() = 'AUDITOR'
  );

-- AUDITOR puede ver y crear auditorías
CREATE POLICY "auditor_view_all_auditorias" ON tarea_auditoria
  FOR SELECT USING (
    get_user_role() IN ('AUDITOR', 'ADMIN', 'SOCIO')
  );

-- Resumen de permisos por rol:
-- ============================================
-- | Tabla        | ADMIN/SOCIO | LIDER | COLABORADOR | AUDITOR |
-- |--------------|-------------|-------|-------------|---------|
-- | cliente      | ALL         | SELECT(equipo) | SELECT(asignados) | SELECT |
-- | tarea        | ALL         | ALL(equipo) | SELECT/UPDATE(propias) | SELECT |
-- | tarea_step   | ALL         | ALL   | SELECT/UPDATE | SELECT |
-- | teams        | ALL         | SELECT| SELECT      | SELECT  |
-- | team_members | ALL         | SELECT| SELECT      | SELECT  |
-- | documento    | ALL         | SELECT| SELECT      | SELECT  |
-- | tarea_auditoria | ALL      | SELECT| -           | ALL     |
-- ============================================
