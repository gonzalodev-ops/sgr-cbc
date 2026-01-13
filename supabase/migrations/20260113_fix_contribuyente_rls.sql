-- ============================================
-- FIX: Políticas RLS faltantes para contribuyente y tablas relacionadas
-- ============================================

-- ============================================
-- CONTRIBUYENTE
-- ============================================

-- ADMIN y SOCIO tienen acceso total
CREATE POLICY "admin_socio_all_contribuyentes" ON contribuyente
  FOR ALL USING (
    get_user_role() IN ('ADMIN', 'SOCIO')
  );

-- LIDER puede ver contribuyentes de su equipo
CREATE POLICY "lider_view_contribuyentes" ON contribuyente
  FOR SELECT USING (
    get_user_role() = 'LIDER' AND
    team_id = get_user_team()
  );

-- COLABORADOR puede ver contribuyentes de tareas asignadas
CREATE POLICY "colaborador_view_contribuyentes" ON contribuyente
  FOR SELECT USING (
    get_user_role() = 'COLABORADOR' AND
    contribuyente_id IN (
      SELECT t.contribuyente_id FROM tarea t
      JOIN tarea_step ts ON t.tarea_id = ts.tarea_id
      WHERE ts.asignado_a = auth.uid()
    )
  );

-- ============================================
-- CLIENTE_CONTRIBUYENTE (relación muchos a muchos)
-- ============================================

-- ADMIN y SOCIO tienen acceso total
CREATE POLICY "admin_socio_all_cliente_contribuyente" ON cliente_contribuyente
  FOR ALL USING (
    get_user_role() IN ('ADMIN', 'SOCIO')
  );

-- LIDER puede ver relaciones de su equipo
CREATE POLICY "lider_view_cliente_contribuyente" ON cliente_contribuyente
  FOR SELECT USING (
    get_user_role() = 'LIDER' AND
    contribuyente_id IN (
      SELECT contribuyente_id FROM contribuyente WHERE team_id = get_user_team()
    )
  );

-- COLABORADOR puede ver relaciones de tareas asignadas
CREATE POLICY "colaborador_view_cliente_contribuyente" ON cliente_contribuyente
  FOR SELECT USING (
    get_user_role() = 'COLABORADOR' AND
    cliente_id IN (
      SELECT t.cliente_id FROM tarea t
      JOIN tarea_step ts ON t.tarea_id = ts.tarea_id
      WHERE ts.asignado_a = auth.uid()
    )
  );

-- ============================================
-- CONTRIBUYENTE_REGIMEN
-- ============================================

-- ADMIN y SOCIO tienen acceso total
CREATE POLICY "admin_socio_all_contribuyente_regimen" ON contribuyente_regimen
  FOR ALL USING (
    get_user_role() IN ('ADMIN', 'SOCIO')
  );

-- LIDER puede ver regímenes de contribuyentes de su equipo
CREATE POLICY "lider_view_contribuyente_regimen" ON contribuyente_regimen
  FOR SELECT USING (
    get_user_role() = 'LIDER' AND
    contribuyente_id IN (
      SELECT contribuyente_id FROM contribuyente WHERE team_id = get_user_team()
    )
  );

-- COLABORADOR puede ver regímenes de tareas asignadas
CREATE POLICY "colaborador_view_contribuyente_regimen" ON contribuyente_regimen
  FOR SELECT USING (
    get_user_role() = 'COLABORADOR' AND
    contribuyente_id IN (
      SELECT c.contribuyente_id FROM contribuyente c
      JOIN tarea t ON t.contribuyente_id = c.contribuyente_id
      JOIN tarea_step ts ON t.tarea_id = ts.tarea_id
      WHERE ts.asignado_a = auth.uid()
    )
  );

-- AUDITOR puede ver todo (solo lectura)
CREATE POLICY "auditor_view_cliente_contribuyente" ON cliente_contribuyente
  FOR SELECT USING (get_user_role() = 'AUDITOR');

CREATE POLICY "auditor_view_contribuyente_regimen" ON contribuyente_regimen
  FOR SELECT USING (get_user_role() = 'AUDITOR');
