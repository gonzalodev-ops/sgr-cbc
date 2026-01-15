-- ============================================
-- SGR CBC - Sprint 7B: Tabla Hallazgo
-- T2B.5 - Hallazgos de auditoria
--
-- PROPOSITO: Registra los hallazgos (findings) detectados
-- durante las auditorias de calidad. Cada hallazgo esta
-- vinculado a una auditoria y tiene un ciclo de vida
-- de correccion.
--
-- Ejecutar DESPUES de: 20260115_auditoria_improved.sql
-- ============================================

-- ============================================
-- CREAR TABLA: hallazgo
-- ============================================
CREATE TABLE IF NOT EXISTS hallazgo (
  hallazgo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacion con auditoria
  auditoria_id UUID NOT NULL REFERENCES auditoria(auditoria_id) ON DELETE CASCADE,

  -- Tipo de hallazgo
  -- DOCUMENTACION: Falta documento, documento incorrecto, etc.
  -- PROCESO: No se siguio el proceso correcto
  -- CALCULO: Error en calculos numericos
  -- PLAZO: No se cumplio con fechas/plazos
  -- NORMATIVO: Incumplimiento de normas fiscales
  -- OTRO: Otros hallazgos
  tipo VARCHAR(30) NOT NULL
    CHECK (tipo IN ('DOCUMENTACION', 'PROCESO', 'CALCULO', 'PLAZO', 'NORMATIVO', 'OTRO')),

  -- Gravedad del hallazgo
  -- LEVE: Observacion menor, no afecta la tarea
  -- MODERADO: Requiere correccion pero no es critico
  -- GRAVE: Afecta la calidad del entregable
  -- CRITICO: Riesgo legal/fiscal, requiere accion inmediata
  gravedad VARCHAR(20) NOT NULL
    CHECK (gravedad IN ('LEVE', 'MODERADO', 'GRAVE', 'CRITICO')),

  -- Descripcion detallada del hallazgo
  descripcion TEXT NOT NULL,

  -- URL de evidencia (screenshot, documento, etc.)
  evidencia_url TEXT,

  -- Recomendacion del auditor para corregir
  recomendacion TEXT,

  -- Estado del hallazgo
  -- ABIERTO: Recien detectado
  -- EN_CORRECCION: Asignado para correccion
  -- CORREGIDO: Correccion completada y verificada
  -- DESCARTADO: Falso positivo o no aplica
  estado VARCHAR(20) DEFAULT 'ABIERTO'
    CHECK (estado IN ('ABIERTO', 'EN_CORRECCION', 'CORREGIDO', 'DESCARTADO')),

  -- Responsable de corregir el hallazgo
  responsable_correccion_id UUID REFERENCES users(user_id),

  -- Fecha limite para correccion
  fecha_compromiso_correccion DATE,

  -- Fecha real de correccion
  fecha_correccion TIMESTAMPTZ,

  -- Notas sobre la correccion realizada
  notas_correccion TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMENTARIOS PARA DOCUMENTACION
-- ============================================
COMMENT ON TABLE hallazgo IS
  'Hallazgos detectados durante auditorias. Cada hallazgo debe ser corregido o descartado.';

COMMENT ON COLUMN hallazgo.tipo IS
  'Categoria del hallazgo: DOCUMENTACION, PROCESO, CALCULO, PLAZO, NORMATIVO, OTRO';

COMMENT ON COLUMN hallazgo.gravedad IS
  'LEVE=observacion, MODERADO=corregible, GRAVE=afecta entregable, CRITICO=riesgo legal';

COMMENT ON COLUMN hallazgo.estado IS
  'Ciclo de vida: ABIERTO->EN_CORRECCION->CORREGIDO o DESCARTADO';

-- ============================================
-- INDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hallazgo_auditoria
  ON hallazgo(auditoria_id);

CREATE INDEX IF NOT EXISTS idx_hallazgo_estado
  ON hallazgo(estado);

CREATE INDEX IF NOT EXISTS idx_hallazgo_gravedad
  ON hallazgo(gravedad);

CREATE INDEX IF NOT EXISTS idx_hallazgo_tipo
  ON hallazgo(tipo);

CREATE INDEX IF NOT EXISTS idx_hallazgo_responsable
  ON hallazgo(responsable_correccion_id)
  WHERE responsable_correccion_id IS NOT NULL;

-- Indice compuesto para hallazgos abiertos por gravedad
CREATE INDEX IF NOT EXISTS idx_hallazgo_abiertos_gravedad
  ON hallazgo(gravedad, created_at)
  WHERE estado = 'ABIERTO';

-- Indice para hallazgos pendientes de correccion
CREATE INDEX IF NOT EXISTS idx_hallazgo_pendientes
  ON hallazgo(responsable_correccion_id, fecha_compromiso_correccion)
  WHERE estado = 'EN_CORRECCION';

-- ============================================
-- TRIGGER: Actualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION fn_hallazgo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hallazgo_updated_at ON hallazgo;
CREATE TRIGGER trg_hallazgo_updated_at
  BEFORE UPDATE ON hallazgo
  FOR EACH ROW
  EXECUTE FUNCTION fn_hallazgo_updated_at();

-- ============================================
-- TRIGGER: Validar transiciones de estado
-- ============================================
CREATE OR REPLACE FUNCTION fn_hallazgo_validate_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo validar si el estado cambia
  IF OLD.estado = NEW.estado THEN
    RETURN NEW;
  END IF;

  -- Validar transiciones validas
  CASE OLD.estado
    WHEN 'ABIERTO' THEN
      IF NEW.estado NOT IN ('EN_CORRECCION', 'DESCARTADO') THEN
        RAISE EXCEPTION 'Hallazgo ABIERTO solo puede pasar a EN_CORRECCION o DESCARTADO';
      END IF;
      -- Si pasa a EN_CORRECCION, debe tener responsable
      IF NEW.estado = 'EN_CORRECCION' AND NEW.responsable_correccion_id IS NULL THEN
        RAISE EXCEPTION 'Se requiere responsable_correccion_id para pasar a EN_CORRECCION';
      END IF;

    WHEN 'EN_CORRECCION' THEN
      IF NEW.estado NOT IN ('CORREGIDO', 'ABIERTO') THEN
        RAISE EXCEPTION 'Hallazgo EN_CORRECCION solo puede pasar a CORREGIDO o volver a ABIERTO';
      END IF;
      -- Si pasa a CORREGIDO, registrar fecha
      IF NEW.estado = 'CORREGIDO' THEN
        NEW.fecha_correccion = NOW();
      END IF;

    WHEN 'CORREGIDO' THEN
      -- Estado final (excepto reapertura por admin)
      IF NOT is_admin_or_socio() THEN
        RAISE EXCEPTION 'CORREGIDO es un estado final. Solo ADMIN/SOCIO pueden reabrir.';
      END IF;

    WHEN 'DESCARTADO' THEN
      -- Estado final (excepto reapertura por admin)
      IF NOT is_admin_or_socio() THEN
        RAISE EXCEPTION 'DESCARTADO es un estado final. Solo ADMIN/SOCIO pueden reabrir.';
      END IF;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hallazgo_validate_transition ON hallazgo;
CREATE TRIGGER trg_hallazgo_validate_transition
  BEFORE UPDATE ON hallazgo
  FOR EACH ROW
  EXECUTE FUNCTION fn_hallazgo_validate_transition();

-- ============================================
-- TRIGGER: Actualizar estado de auditoria al agregar hallazgo grave
-- ============================================
CREATE OR REPLACE FUNCTION fn_hallazgo_update_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se agrega un hallazgo CRITICO o GRAVE a una auditoria EN_REVISION
  -- podria cambiar automaticamente a CORREGIR
  -- (Esta logica es opcional, puede manejarse en la aplicacion)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS: Habilitar Row Level Security
-- ============================================
ALTER TABLE hallazgo ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- ADMIN y SOCIO: Acceso total
DROP POLICY IF EXISTS hallazgo_admin_socio_all ON hallazgo;
CREATE POLICY hallazgo_admin_socio_all ON hallazgo
  FOR ALL
  USING (is_admin_or_socio())
  WITH CHECK (is_admin_or_socio());

-- AUDITOR: Ver todos los hallazgos
DROP POLICY IF EXISTS hallazgo_auditor_select ON hallazgo;
CREATE POLICY hallazgo_auditor_select ON hallazgo
  FOR SELECT
  USING (is_auditor());

-- AUDITOR: Crear hallazgos en auditorias propias
DROP POLICY IF EXISTS hallazgo_auditor_insert ON hallazgo;
CREATE POLICY hallazgo_auditor_insert ON hallazgo
  FOR INSERT
  WITH CHECK (
    is_auditor() AND
    auditoria_id IN (
      SELECT auditoria_id FROM auditoria
      WHERE auditor_id = auth.uid()
    )
  );

-- AUDITOR: Actualizar hallazgos de sus auditorias
DROP POLICY IF EXISTS hallazgo_auditor_update ON hallazgo;
CREATE POLICY hallazgo_auditor_update ON hallazgo
  FOR UPDATE
  USING (
    is_auditor() AND
    auditoria_id IN (
      SELECT auditoria_id FROM auditoria
      WHERE auditor_id = auth.uid()
    )
  );

-- LIDER: Ver hallazgos de auditorias de tareas de su equipo
DROP POLICY IF EXISTS hallazgo_lider_select ON hallazgo;
CREATE POLICY hallazgo_lider_select ON hallazgo
  FOR SELECT
  USING (
    get_user_role() = 'LIDER' AND
    auditoria_id IN (
      SELECT a.auditoria_id FROM auditoria a
      JOIN tarea t ON t.tarea_id = a.tarea_id
      WHERE t.responsable_usuario_id IN (
        SELECT user_id FROM team_members
        WHERE team_id IN (SELECT get_user_teams()) AND activo = true
      )
    )
  );

-- LIDER: Puede actualizar hallazgos para asignar responsable de correccion
DROP POLICY IF EXISTS hallazgo_lider_update ON hallazgo;
CREATE POLICY hallazgo_lider_update ON hallazgo
  FOR UPDATE
  USING (
    get_user_role() = 'LIDER' AND
    auditoria_id IN (
      SELECT a.auditoria_id FROM auditoria a
      JOIN tarea t ON t.tarea_id = a.tarea_id
      WHERE t.responsable_usuario_id IN (
        SELECT user_id FROM team_members
        WHERE team_id IN (SELECT get_user_teams()) AND activo = true
      )
    )
  );

-- COLABORADOR: Ver hallazgos de sus propias tareas
DROP POLICY IF EXISTS hallazgo_colaborador_select ON hallazgo;
CREATE POLICY hallazgo_colaborador_select ON hallazgo
  FOR SELECT
  USING (
    get_user_role() = 'COLABORADOR' AND
    auditoria_id IN (
      SELECT a.auditoria_id FROM auditoria a
      JOIN tarea t ON t.tarea_id = a.tarea_id
      WHERE t.responsable_usuario_id = auth.uid()
    )
  );

-- COLABORADOR: Puede actualizar hallazgos asignados a el
DROP POLICY IF EXISTS hallazgo_colaborador_update ON hallazgo;
CREATE POLICY hallazgo_colaborador_update ON hallazgo
  FOR UPDATE
  USING (
    get_user_role() = 'COLABORADOR' AND
    responsable_correccion_id = auth.uid() AND
    estado = 'EN_CORRECCION'
  );

-- ============================================
-- VISTA: Hallazgos pendientes de correccion
-- ============================================
CREATE OR REPLACE VIEW vw_hallazgos_pendientes AS
SELECT
  h.hallazgo_id,
  h.auditoria_id,
  h.tipo,
  h.gravedad,
  h.descripcion,
  h.estado,
  h.responsable_correccion_id,
  u.nombre AS responsable_nombre,
  h.fecha_compromiso_correccion,
  h.created_at,
  -- Dias restantes para correccion
  h.fecha_compromiso_correccion - CURRENT_DATE AS dias_restantes,
  -- Info de la auditoria
  a.periodo_fiscal,
  a.auditor_id,
  ua.nombre AS auditor_nombre,
  -- Info de la tarea
  t.tarea_id,
  c.nombre_comercial AS cliente,
  o.nombre_corto AS obligacion
FROM hallazgo h
JOIN auditoria a ON a.auditoria_id = h.auditoria_id
JOIN tarea t ON t.tarea_id = a.tarea_id
JOIN cliente c ON c.cliente_id = t.cliente_id
JOIN obligacion_fiscal o ON o.id_obligacion = t.id_obligacion
LEFT JOIN users u ON u.user_id = h.responsable_correccion_id
LEFT JOIN users ua ON ua.user_id = a.auditor_id
WHERE h.estado IN ('ABIERTO', 'EN_CORRECCION')
ORDER BY
  CASE h.gravedad
    WHEN 'CRITICO' THEN 1
    WHEN 'GRAVE' THEN 2
    WHEN 'MODERADO' THEN 3
    WHEN 'LEVE' THEN 4
  END,
  h.fecha_compromiso_correccion ASC NULLS LAST;

COMMENT ON VIEW vw_hallazgos_pendientes IS
  'Lista de hallazgos pendientes de correccion, ordenados por gravedad y fecha compromiso.';

-- ============================================
-- VISTA: Resumen de hallazgos por tipo
-- ============================================
CREATE OR REPLACE VIEW vw_hallazgos_por_tipo AS
SELECT
  a.periodo_fiscal,
  h.tipo,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE h.gravedad = 'CRITICO') AS criticos,
  COUNT(*) FILTER (WHERE h.gravedad = 'GRAVE') AS graves,
  COUNT(*) FILTER (WHERE h.gravedad = 'MODERADO') AS moderados,
  COUNT(*) FILTER (WHERE h.gravedad = 'LEVE') AS leves,
  COUNT(*) FILTER (WHERE h.estado = 'CORREGIDO') AS corregidos,
  AVG(
    CASE
      WHEN h.estado = 'CORREGIDO' AND h.fecha_correccion IS NOT NULL
      THEN EXTRACT(DAY FROM (h.fecha_correccion - h.created_at))
    END
  ) AS dias_promedio_correccion
FROM hallazgo h
JOIN auditoria a ON a.auditoria_id = h.auditoria_id
GROUP BY a.periodo_fiscal, h.tipo
ORDER BY a.periodo_fiscal DESC, total DESC;

COMMENT ON VIEW vw_hallazgos_por_tipo IS
  'Estadisticas de hallazgos agrupadas por periodo y tipo.';

-- ============================================
-- FUNCION: Contar hallazgos por usuario
-- ============================================
CREATE OR REPLACE FUNCTION fn_hallazgos_por_usuario(
  p_usuario_id UUID,
  p_periodo TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_hallazgos INTEGER,
  hallazgos_criticos INTEGER,
  hallazgos_graves INTEGER,
  hallazgos_corregidos INTEGER,
  hallazgos_pendientes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_hallazgos,
    COUNT(*) FILTER (WHERE h.gravedad = 'CRITICO')::INTEGER AS hallazgos_criticos,
    COUNT(*) FILTER (WHERE h.gravedad = 'GRAVE')::INTEGER AS hallazgos_graves,
    COUNT(*) FILTER (WHERE h.estado = 'CORREGIDO')::INTEGER AS hallazgos_corregidos,
    COUNT(*) FILTER (WHERE h.estado IN ('ABIERTO', 'EN_CORRECCION'))::INTEGER AS hallazgos_pendientes
  FROM hallazgo h
  JOIN auditoria a ON a.auditoria_id = h.auditoria_id
  JOIN tarea t ON t.tarea_id = a.tarea_id
  WHERE t.responsable_usuario_id = p_usuario_id
    AND (p_periodo IS NULL OR a.periodo_fiscal = p_periodo);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION fn_hallazgos_por_usuario IS
  'Cuenta hallazgos recibidos por un usuario, opcionalmente filtrado por periodo.';

-- ============================================
-- FIN DE MIGRACION T2B.5
-- ============================================
