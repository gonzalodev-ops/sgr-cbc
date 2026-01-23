-- ============================================
-- SGR CBC - Sprint 7B: Auditoria Mejorada
-- T2B.4 - Tabla de auditorias con estados completos
--
-- PROPOSITO: Reemplaza/mejora las tablas placeholder 'audits'
-- y 'tarea_auditoria' con un modelo completo para el ciclo
-- de vida de auditorias de calidad.
--
-- Ejecutar DESPUES de: schema.sql, rls_policies.sql, schema_v2_updates.sql
-- ============================================

-- ============================================
-- HELPER: Verificar si el usuario es auditor
-- ============================================
CREATE OR REPLACE FUNCTION is_auditor()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'AUDITOR';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- HELPER: Verificar si usuario puede auditar
-- (AUDITOR, ADMIN, SOCIO)
-- ============================================
CREATE OR REPLACE FUNCTION can_audit()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('AUDITOR', 'ADMIN', 'SOCIO');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- CREAR TABLA: auditoria
-- ============================================
-- Nota: Esta tabla complementa 'audits' y 'tarea_auditoria'
-- existentes, proporcionando un modelo mas completo para
-- el proceso de auditoria de calidad.
CREATE TABLE IF NOT EXISTS auditoria (
  auditoria_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  tarea_id UUID NOT NULL REFERENCES tarea(tarea_id) ON DELETE CASCADE,
  auditor_id UUID NOT NULL REFERENCES users(user_id),

  -- Contexto fiscal
  periodo_fiscal TEXT NOT NULL,

  -- Fechas del ciclo de vida
  fecha_seleccion TIMESTAMPTZ DEFAULT NOW(),
  fecha_inicio_revision TIMESTAMPTZ,
  fecha_fin_revision TIMESTAMPTZ,

  -- Estado de la auditoria
  -- SELECCIONADA: Tarea marcada para auditoria (inicial)
  -- EN_REVISION: Auditor esta revisando activamente
  -- RECHAZADO: Tarea no cumple criterios, requiere retrabajo
  -- CORREGIR: Tarea tiene hallazgos menores, se puede corregir
  -- APROBADO: Tarea cumple criterios de calidad
  -- DESTACADO: Tarea cumple y supera expectativas (meritoria)
  estado VARCHAR(20) DEFAULT 'SELECCIONADA'
    CHECK (estado IN ('SELECCIONADA', 'EN_REVISION', 'RECHAZADO', 'CORREGIR', 'APROBADO', 'DESTACADO')),

  -- Calificacion numerica (0-100)
  -- NULL hasta que se complete la revision
  calificacion INTEGER CHECK (calificacion IS NULL OR (calificacion >= 0 AND calificacion <= 100)),

  -- Notas del auditor (feedback cualitativo)
  notas_auditor TEXT,

  -- Como se selecciono esta tarea para auditoria
  -- ALEATORIO: Seleccion aleatoria automatica
  -- MANUAL: Seleccionada manualmente por auditor/admin
  -- POR_RIESGO: Seleccionada por el sistema de deteccion de riesgo
  tipo_seleccion VARCHAR(20) DEFAULT 'ALEATORIO'
    CHECK (tipo_seleccion IN ('ALEATORIO', 'MANUAL', 'POR_RIESGO')),

  -- Metadata de trazabilidad
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMENTARIOS PARA DOCUMENTACION
-- ============================================
COMMENT ON TABLE auditoria IS
  'Registro de auditorias de calidad para tareas. Cada registro representa una revision formal de una tarea completada.';

COMMENT ON COLUMN auditoria.estado IS
  'SELECCIONADA=esperando, EN_REVISION=en proceso, RECHAZADO=no aprobado, CORREGIR=hallazgos menores, APROBADO=OK, DESTACADO=excepcional';

COMMENT ON COLUMN auditoria.calificacion IS
  'Puntaje de calidad 0-100. Se establece al completar la revision.';

COMMENT ON COLUMN auditoria.tipo_seleccion IS
  'ALEATORIO=muestra aleatoria, MANUAL=seleccion directa, POR_RIESGO=flaggeado por rpc_detect_risk';

-- ============================================
-- INDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_auditoria_tarea
  ON auditoria(tarea_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_auditor
  ON auditoria(auditor_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_estado
  ON auditoria(estado);

CREATE INDEX IF NOT EXISTS idx_auditoria_periodo
  ON auditoria(periodo_fiscal);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha_seleccion
  ON auditoria(fecha_seleccion DESC);

-- Indice compuesto para busquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_auditoria_auditor_estado
  ON auditoria(auditor_id, estado);

-- ============================================
-- TRIGGER: Actualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION fn_auditoria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_updated_at ON auditoria;
CREATE TRIGGER trg_auditoria_updated_at
  BEFORE UPDATE ON auditoria
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditoria_updated_at();

-- ============================================
-- TRIGGER: Validar transiciones de estado
-- ============================================
CREATE OR REPLACE FUNCTION fn_auditoria_validate_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo validar si el estado cambia
  IF OLD.estado = NEW.estado THEN
    RETURN NEW;
  END IF;

  -- Validar transiciones validas
  CASE OLD.estado
    WHEN 'SELECCIONADA' THEN
      IF NEW.estado NOT IN ('EN_REVISION', 'SELECCIONADA') THEN
        RAISE EXCEPTION 'Transicion invalida: SELECCIONADA solo puede ir a EN_REVISION';
      END IF;
      -- Marcar inicio de revision
      IF NEW.estado = 'EN_REVISION' THEN
        NEW.fecha_inicio_revision = NOW();
      END IF;

    WHEN 'EN_REVISION' THEN
      IF NEW.estado NOT IN ('RECHAZADO', 'CORREGIR', 'APROBADO', 'DESTACADO') THEN
        RAISE EXCEPTION 'Transicion invalida: EN_REVISION debe completarse con un resultado';
      END IF;
      -- Marcar fin de revision
      NEW.fecha_fin_revision = NOW();
      -- Validar que tenga calificacion al terminar
      IF NEW.calificacion IS NULL THEN
        RAISE EXCEPTION 'Se requiere calificacion al completar la revision';
      END IF;

    WHEN 'CORREGIR' THEN
      -- Puede volver a EN_REVISION despues de correccion
      IF NEW.estado NOT IN ('EN_REVISION', 'APROBADO', 'RECHAZADO') THEN
        RAISE EXCEPTION 'Transicion invalida desde CORREGIR';
      END IF;

    WHEN 'RECHAZADO' THEN
      -- Estado final, no se puede cambiar
      RAISE EXCEPTION 'RECHAZADO es un estado final, no se puede modificar';

    WHEN 'APROBADO' THEN
      -- Estado final, no se puede cambiar
      RAISE EXCEPTION 'APROBADO es un estado final, no se puede modificar';

    WHEN 'DESTACADO' THEN
      -- Estado final, no se puede cambiar
      RAISE EXCEPTION 'DESTACADO es un estado final, no se puede modificar';
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_validate_transition ON auditoria;
CREATE TRIGGER trg_auditoria_validate_transition
  BEFORE UPDATE ON auditoria
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditoria_validate_transition();

-- ============================================
-- RLS: Habilitar Row Level Security
-- ============================================
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- ADMIN y SOCIO: Acceso total
DROP POLICY IF EXISTS auditoria_admin_socio_all ON auditoria;
CREATE POLICY auditoria_admin_socio_all ON auditoria
  FOR ALL
  USING (is_admin_or_socio())
  WITH CHECK (is_admin_or_socio());

-- AUDITOR: Ver todas las auditorias
DROP POLICY IF EXISTS auditoria_auditor_select ON auditoria;
CREATE POLICY auditoria_auditor_select ON auditoria
  FOR SELECT
  USING (is_auditor());

-- AUDITOR: Insertar nuevas auditorias
DROP POLICY IF EXISTS auditoria_auditor_insert ON auditoria;
CREATE POLICY auditoria_auditor_insert ON auditoria
  FOR INSERT
  WITH CHECK (
    is_auditor() AND
    auditor_id = auth.uid()
  );

-- AUDITOR: Actualizar solo sus propias auditorias
DROP POLICY IF EXISTS auditoria_auditor_update ON auditoria;
CREATE POLICY auditoria_auditor_update ON auditoria
  FOR UPDATE
  USING (
    is_auditor() AND
    auditor_id = auth.uid()
  )
  WITH CHECK (
    is_auditor() AND
    auditor_id = auth.uid()
  );

-- LIDER: Ver auditorias de tareas de su equipo (solo lectura)
DROP POLICY IF EXISTS auditoria_lider_select ON auditoria;
CREATE POLICY auditoria_lider_select ON auditoria
  FOR SELECT
  USING (
    get_user_role() = 'LIDER' AND
    tarea_id IN (
      SELECT t.tarea_id FROM tarea t
      WHERE t.responsable_usuario_id IN (
        SELECT user_id FROM team_members
        WHERE team_id IN (SELECT get_user_teams()) AND activo = true
      )
    )
  );

-- COLABORADOR: Ver auditorias de sus propias tareas (solo lectura)
DROP POLICY IF EXISTS auditoria_colaborador_select ON auditoria;
CREATE POLICY auditoria_colaborador_select ON auditoria
  FOR SELECT
  USING (
    get_user_role() = 'COLABORADOR' AND
    tarea_id IN (
      SELECT tarea_id FROM tarea
      WHERE responsable_usuario_id = auth.uid()
    )
  );

-- ============================================
-- FUNCION: Seleccionar tareas para auditoria aleatoria
-- ============================================
CREATE OR REPLACE FUNCTION fn_seleccionar_tareas_auditoria(
  p_periodo TEXT,
  p_porcentaje DECIMAL DEFAULT 10.0,
  p_auditor_id UUID DEFAULT NULL
)
RETURNS TABLE (
  tarea_id UUID,
  cliente_nombre TEXT,
  obligacion_nombre TEXT,
  responsable_nombre TEXT,
  fecha_cierre TIMESTAMPTZ
) AS $$
BEGIN
  -- Selecciona un porcentaje aleatorio de tareas cerradas
  -- que no han sido auditadas en este periodo
  RETURN QUERY
  SELECT
    t.tarea_id,
    c.nombre_comercial AS cliente_nombre,
    o.nombre_corto AS obligacion_nombre,
    u.nombre AS responsable_nombre,
    t.updated_at AS fecha_cierre
  FROM tarea t
  JOIN cliente c ON c.cliente_id = t.cliente_id
  JOIN obligacion_fiscal o ON o.id_obligacion = t.id_obligacion
  LEFT JOIN users u ON u.user_id = t.responsable_usuario_id
  WHERE t.estado IN ('cerrado', 'pagado')
    AND t.periodo_fiscal = p_periodo
    AND NOT EXISTS (
      SELECT 1 FROM auditoria a
      WHERE a.tarea_id = t.tarea_id
        AND a.periodo_fiscal = p_periodo
    )
  ORDER BY RANDOM()
  LIMIT (
    SELECT CEIL(COUNT(*) * p_porcentaje / 100.0)
    FROM tarea
    WHERE estado IN ('cerrado', 'pagado')
      AND periodo_fiscal = p_periodo
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_seleccionar_tareas_auditoria IS
  'Selecciona un porcentaje aleatorio de tareas cerradas para auditoria. Por defecto 10%.';

-- ============================================
-- FUNCION: Crear auditorias en batch
-- ============================================
CREATE OR REPLACE FUNCTION fn_crear_auditorias_batch(
  p_periodo TEXT,
  p_auditor_id UUID,
  p_tipo_seleccion VARCHAR(20) DEFAULT 'ALEATORIO'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_tarea RECORD;
BEGIN
  -- Crear auditorias para tareas seleccionadas
  FOR v_tarea IN
    SELECT tarea_id FROM fn_seleccionar_tareas_auditoria(p_periodo, 10.0, p_auditor_id)
  LOOP
    INSERT INTO auditoria (
      tarea_id,
      auditor_id,
      periodo_fiscal,
      tipo_seleccion
    ) VALUES (
      v_tarea.tarea_id,
      p_auditor_id,
      p_periodo,
      p_tipo_seleccion
    )
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_crear_auditorias_batch IS
  'Crea registros de auditoria en batch para tareas seleccionadas aleatoriamente.';

-- ============================================
-- VISTA: Resumen de auditorias por periodo
-- ============================================
CREATE OR REPLACE VIEW vw_auditoria_resumen AS
SELECT
  periodo_fiscal,
  COUNT(*) AS total_auditorias,
  COUNT(*) FILTER (WHERE estado = 'SELECCIONADA') AS pendientes,
  COUNT(*) FILTER (WHERE estado = 'EN_REVISION') AS en_revision,
  COUNT(*) FILTER (WHERE estado = 'CORREGIR') AS en_correccion,
  COUNT(*) FILTER (WHERE estado IN ('APROBADO', 'DESTACADO')) AS aprobadas,
  COUNT(*) FILTER (WHERE estado = 'RECHAZADO') AS rechazadas,
  AVG(calificacion) FILTER (WHERE calificacion IS NOT NULL) AS calificacion_promedio,
  COUNT(*) FILTER (WHERE estado = 'DESTACADO') AS destacadas
FROM auditoria
GROUP BY periodo_fiscal
ORDER BY periodo_fiscal DESC;

COMMENT ON VIEW vw_auditoria_resumen IS
  'Resumen de auditorias agrupadas por periodo fiscal.';

-- ============================================
-- VISTA: Auditorias pendientes por auditor
-- ============================================
CREATE OR REPLACE VIEW vw_auditoria_pendientes AS
SELECT
  a.auditoria_id,
  a.tarea_id,
  a.auditor_id,
  u.nombre AS auditor_nombre,
  a.periodo_fiscal,
  a.estado,
  a.fecha_seleccion,
  c.nombre_comercial AS cliente,
  o.nombre_corto AS obligacion,
  t.fecha_limite_oficial,
  ur.nombre AS responsable_nombre
FROM auditoria a
JOIN users u ON u.user_id = a.auditor_id
JOIN tarea t ON t.tarea_id = a.tarea_id
JOIN cliente c ON c.cliente_id = t.cliente_id
JOIN obligacion_fiscal o ON o.id_obligacion = t.id_obligacion
LEFT JOIN users ur ON ur.user_id = t.responsable_usuario_id
WHERE a.estado IN ('SELECCIONADA', 'EN_REVISION', 'CORREGIR')
ORDER BY a.fecha_seleccion ASC;

COMMENT ON VIEW vw_auditoria_pendientes IS
  'Lista de auditorias pendientes de completar.';

-- ============================================
-- FIN DE MIGRACION T2B.4
-- ============================================
