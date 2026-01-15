-- ============================================
-- SGR CBC - Sprint 7B: Metricas de Calidad
-- T2B.6 - Tabla de metricas para calculo de bonos
--
-- PROPOSITO: Registra metricas de desempeno por usuario
-- y periodo fiscal. Estas metricas alimentan el sistema
-- de bonos y reconocimientos.
--
-- Ejecutar DESPUES de: 20260115_hallazgo.sql
-- ============================================

-- ============================================
-- CREAR TABLA: metrica_calidad
-- ============================================
CREATE TABLE IF NOT EXISTS metrica_calidad (
  metrica_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario evaluado
  usuario_id UUID NOT NULL REFERENCES users(user_id),

  -- Periodo fiscal (formato: AAAA-MM o AAAA-T1, etc.)
  periodo_fiscal TEXT NOT NULL,

  -- Metricas de productividad
  tareas_completadas INTEGER DEFAULT 0,
  tareas_a_tiempo INTEGER DEFAULT 0,
  tareas_con_retraso INTEGER DEFAULT 0,

  -- Metricas de auditoria
  tareas_auditadas INTEGER DEFAULT 0,
  tareas_aprobadas_primera INTEGER DEFAULT 0,  -- Aprobadas en primera revision (sin correciones)
  tareas_aprobadas_total INTEGER DEFAULT 0,    -- Total aprobadas (incluye despues de correccion)
  tareas_rechazadas INTEGER DEFAULT 0,
  tareas_destacadas INTEGER DEFAULT 0,         -- Tareas con calificacion DESTACADO

  -- Metricas de hallazgos
  hallazgos_recibidos INTEGER DEFAULT 0,
  hallazgos_graves INTEGER DEFAULT 0,          -- GRAVE + CRITICO
  hallazgos_leves INTEGER DEFAULT 0,           -- LEVE + MODERADO
  hallazgos_corregidos_a_tiempo INTEGER DEFAULT 0,

  -- Puntaje compuesto
  puntos_totales INTEGER DEFAULT 0,
  score_calidad DECIMAL(5,2),  -- Score normalizado 0-100

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Restriccion: un registro por usuario por periodo
  UNIQUE(usuario_id, periodo_fiscal)
);

-- ============================================
-- COMENTARIOS PARA DOCUMENTACION
-- ============================================
COMMENT ON TABLE metrica_calidad IS
  'Metricas de calidad por usuario y periodo. Alimenta el sistema de bonos.';

COMMENT ON COLUMN metrica_calidad.tareas_aprobadas_primera IS
  'Tareas aprobadas en la primera revision sin hallazgos que requieran correccion.';

COMMENT ON COLUMN metrica_calidad.score_calidad IS
  'Score normalizado 0-100 calculado con formula ponderada.';

COMMENT ON COLUMN metrica_calidad.puntos_totales IS
  'Puntos acumulados antes de normalizar. Util para rankings.';

-- ============================================
-- INDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_metrica_usuario
  ON metrica_calidad(usuario_id);

CREATE INDEX IF NOT EXISTS idx_metrica_periodo
  ON metrica_calidad(periodo_fiscal);

CREATE INDEX IF NOT EXISTS idx_metrica_score
  ON metrica_calidad(score_calidad DESC NULLS LAST);

-- Indice compuesto para busquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_metrica_usuario_periodo
  ON metrica_calidad(usuario_id, periodo_fiscal DESC);

-- ============================================
-- TRIGGER: Actualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION fn_metrica_calidad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_metrica_calidad_updated_at ON metrica_calidad;
CREATE TRIGGER trg_metrica_calidad_updated_at
  BEFORE UPDATE ON metrica_calidad
  FOR EACH ROW
  EXECUTE FUNCTION fn_metrica_calidad_updated_at();

-- ============================================
-- FUNCION: Calcular score de calidad
-- Formula ponderada para calcular el score normalizado
-- ============================================
CREATE OR REPLACE FUNCTION fn_calcular_score_calidad(
  p_tareas_completadas INTEGER,
  p_tareas_a_tiempo INTEGER,
  p_tareas_auditadas INTEGER,
  p_tareas_aprobadas_primera INTEGER,
  p_hallazgos_recibidos INTEGER,
  p_hallazgos_graves INTEGER
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_score DECIMAL(10,4) := 0;
  v_pct_a_tiempo DECIMAL(5,2) := 0;
  v_pct_aprobadas_primera DECIMAL(5,2) := 0;
  v_penalizacion_hallazgos DECIMAL(5,2) := 0;
BEGIN
  -- Si no hay tareas, score es 0
  IF p_tareas_completadas = 0 THEN
    RETURN 0;
  END IF;

  -- Componente 1: Porcentaje de tareas a tiempo (peso: 40%)
  v_pct_a_tiempo := (p_tareas_a_tiempo::DECIMAL / p_tareas_completadas) * 100;

  -- Componente 2: Porcentaje aprobadas en primera (peso: 40%)
  IF p_tareas_auditadas > 0 THEN
    v_pct_aprobadas_primera := (p_tareas_aprobadas_primera::DECIMAL / p_tareas_auditadas) * 100;
  ELSE
    v_pct_aprobadas_primera := 100; -- Sin auditorias = score perfecto en este componente
  END IF;

  -- Componente 3: Penalizacion por hallazgos graves (peso: -20% max)
  -- Cada hallazgo grave resta 5 puntos, max 20
  v_penalizacion_hallazgos := LEAST(p_hallazgos_graves * 5, 20);

  -- Formula final
  v_score := (v_pct_a_tiempo * 0.40) +
             (v_pct_aprobadas_primera * 0.40) +
             (20 - v_penalizacion_hallazgos);  -- Base 20 puntos menos penalizacion

  -- Normalizar a 0-100
  RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_calcular_score_calidad IS
  'Calcula el score de calidad ponderado: 40% puntualidad + 40% aprobadas primera + 20% base con penalizacion por hallazgos.';

-- ============================================
-- FUNCION: Calcular puntos totales
-- Puntos acumulativos para ranking
-- ============================================
CREATE OR REPLACE FUNCTION fn_calcular_puntos_totales(
  p_tareas_completadas INTEGER,
  p_tareas_a_tiempo INTEGER,
  p_tareas_destacadas INTEGER,
  p_tareas_aprobadas_primera INTEGER,
  p_hallazgos_graves INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_puntos INTEGER := 0;
BEGIN
  -- Puntos base por tarea completada: 10 puntos
  v_puntos := p_tareas_completadas * 10;

  -- Bonus por puntualidad: +5 puntos
  v_puntos := v_puntos + (p_tareas_a_tiempo * 5);

  -- Bonus por DESTACADO: +20 puntos
  v_puntos := v_puntos + (p_tareas_destacadas * 20);

  -- Bonus por aprobadas en primera: +10 puntos
  v_puntos := v_puntos + (p_tareas_aprobadas_primera * 10);

  -- Penalizacion por hallazgos graves: -15 puntos
  v_puntos := v_puntos - (p_hallazgos_graves * 15);

  -- Minimo 0 puntos
  RETURN GREATEST(v_puntos, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_calcular_puntos_totales IS
  'Calcula puntos acumulativos: +10 base, +5 puntualidad, +20 destacado, +10 primera, -15 hallazgo grave.';

-- ============================================
-- FUNCION: Actualizar metricas de un usuario
-- Recalcula todas las metricas para un usuario/periodo
-- ============================================
CREATE OR REPLACE FUNCTION fn_actualizar_metricas_usuario(
  p_usuario_id UUID,
  p_periodo TEXT
)
RETURNS metrica_calidad AS $$
DECLARE
  v_result metrica_calidad;
  v_tareas_completadas INTEGER := 0;
  v_tareas_a_tiempo INTEGER := 0;
  v_tareas_con_retraso INTEGER := 0;
  v_tareas_auditadas INTEGER := 0;
  v_tareas_aprobadas_primera INTEGER := 0;
  v_tareas_aprobadas_total INTEGER := 0;
  v_tareas_rechazadas INTEGER := 0;
  v_tareas_destacadas INTEGER := 0;
  v_hallazgos_recibidos INTEGER := 0;
  v_hallazgos_graves INTEGER := 0;
  v_hallazgos_leves INTEGER := 0;
  v_hallazgos_corregidos_a_tiempo INTEGER := 0;
BEGIN
  -- Contar tareas completadas
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE t.updated_at <= t.fecha_limite_oficial),
    COUNT(*) FILTER (WHERE t.updated_at > t.fecha_limite_oficial)
  INTO v_tareas_completadas, v_tareas_a_tiempo, v_tareas_con_retraso
  FROM tarea t
  WHERE t.responsable_usuario_id = p_usuario_id
    AND t.periodo_fiscal = p_periodo
    AND t.estado IN ('cerrado', 'pagado');

  -- Contar auditorias
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE a.estado IN ('APROBADO', 'DESTACADO') AND NOT EXISTS (
      SELECT 1 FROM hallazgo h
      WHERE h.auditoria_id = a.auditoria_id
        AND h.gravedad IN ('GRAVE', 'CRITICO')
    )),
    COUNT(*) FILTER (WHERE a.estado IN ('APROBADO', 'DESTACADO')),
    COUNT(*) FILTER (WHERE a.estado = 'RECHAZADO'),
    COUNT(*) FILTER (WHERE a.estado = 'DESTACADO')
  INTO v_tareas_auditadas, v_tareas_aprobadas_primera, v_tareas_aprobadas_total,
       v_tareas_rechazadas, v_tareas_destacadas
  FROM auditoria a
  JOIN tarea t ON t.tarea_id = a.tarea_id
  WHERE t.responsable_usuario_id = p_usuario_id
    AND a.periodo_fiscal = p_periodo;

  -- Contar hallazgos
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE h.gravedad IN ('GRAVE', 'CRITICO')),
    COUNT(*) FILTER (WHERE h.gravedad IN ('LEVE', 'MODERADO')),
    COUNT(*) FILTER (WHERE h.estado = 'CORREGIDO'
      AND h.fecha_correccion IS NOT NULL
      AND h.fecha_compromiso_correccion IS NOT NULL
      AND h.fecha_correccion::DATE <= h.fecha_compromiso_correccion)
  INTO v_hallazgos_recibidos, v_hallazgos_graves, v_hallazgos_leves,
       v_hallazgos_corregidos_a_tiempo
  FROM hallazgo h
  JOIN auditoria a ON a.auditoria_id = h.auditoria_id
  JOIN tarea t ON t.tarea_id = a.tarea_id
  WHERE t.responsable_usuario_id = p_usuario_id
    AND a.periodo_fiscal = p_periodo;

  -- Insertar o actualizar metricas
  INSERT INTO metrica_calidad (
    usuario_id,
    periodo_fiscal,
    tareas_completadas,
    tareas_a_tiempo,
    tareas_con_retraso,
    tareas_auditadas,
    tareas_aprobadas_primera,
    tareas_aprobadas_total,
    tareas_rechazadas,
    tareas_destacadas,
    hallazgos_recibidos,
    hallazgos_graves,
    hallazgos_leves,
    hallazgos_corregidos_a_tiempo,
    puntos_totales,
    score_calidad
  ) VALUES (
    p_usuario_id,
    p_periodo,
    v_tareas_completadas,
    v_tareas_a_tiempo,
    v_tareas_con_retraso,
    v_tareas_auditadas,
    v_tareas_aprobadas_primera,
    v_tareas_aprobadas_total,
    v_tareas_rechazadas,
    v_tareas_destacadas,
    v_hallazgos_recibidos,
    v_hallazgos_graves,
    v_hallazgos_leves,
    v_hallazgos_corregidos_a_tiempo,
    fn_calcular_puntos_totales(
      v_tareas_completadas,
      v_tareas_a_tiempo,
      v_tareas_destacadas,
      v_tareas_aprobadas_primera,
      v_hallazgos_graves
    ),
    fn_calcular_score_calidad(
      v_tareas_completadas,
      v_tareas_a_tiempo,
      v_tareas_auditadas,
      v_tareas_aprobadas_primera,
      v_hallazgos_recibidos,
      v_hallazgos_graves
    )
  )
  ON CONFLICT (usuario_id, periodo_fiscal)
  DO UPDATE SET
    tareas_completadas = EXCLUDED.tareas_completadas,
    tareas_a_tiempo = EXCLUDED.tareas_a_tiempo,
    tareas_con_retraso = EXCLUDED.tareas_con_retraso,
    tareas_auditadas = EXCLUDED.tareas_auditadas,
    tareas_aprobadas_primera = EXCLUDED.tareas_aprobadas_primera,
    tareas_aprobadas_total = EXCLUDED.tareas_aprobadas_total,
    tareas_rechazadas = EXCLUDED.tareas_rechazadas,
    tareas_destacadas = EXCLUDED.tareas_destacadas,
    hallazgos_recibidos = EXCLUDED.hallazgos_recibidos,
    hallazgos_graves = EXCLUDED.hallazgos_graves,
    hallazgos_leves = EXCLUDED.hallazgos_leves,
    hallazgos_corregidos_a_tiempo = EXCLUDED.hallazgos_corregidos_a_tiempo,
    puntos_totales = EXCLUDED.puntos_totales,
    score_calidad = EXCLUDED.score_calidad,
    updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_actualizar_metricas_usuario IS
  'Recalcula todas las metricas de calidad para un usuario en un periodo.';

-- ============================================
-- FUNCION: Actualizar metricas de todos los usuarios
-- Para un periodo dado
-- ============================================
CREATE OR REPLACE FUNCTION fn_actualizar_metricas_periodo(
  p_periodo TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_usuario RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Iterar sobre todos los usuarios con tareas en el periodo
  FOR v_usuario IN
    SELECT DISTINCT responsable_usuario_id AS user_id
    FROM tarea
    WHERE periodo_fiscal = p_periodo
      AND responsable_usuario_id IS NOT NULL
  LOOP
    PERFORM fn_actualizar_metricas_usuario(v_usuario.user_id, p_periodo);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_actualizar_metricas_periodo IS
  'Actualiza metricas de todos los usuarios para un periodo dado.';

-- ============================================
-- TRIGGER: Actualizar metricas cuando cambia tarea
-- ============================================
CREATE OR REPLACE FUNCTION fn_trigger_actualizar_metricas_tarea()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar si la tarea se cierra o hay cambio de estado final
  IF NEW.estado IN ('cerrado', 'pagado') AND
     (OLD.estado IS NULL OR OLD.estado NOT IN ('cerrado', 'pagado')) THEN
    -- Actualizar metricas del responsable
    IF NEW.responsable_usuario_id IS NOT NULL THEN
      PERFORM fn_actualizar_metricas_usuario(
        NEW.responsable_usuario_id,
        NEW.periodo_fiscal
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_actualizar_metricas_tarea ON tarea;
CREATE TRIGGER trg_actualizar_metricas_tarea
  AFTER UPDATE ON tarea
  FOR EACH ROW
  EXECUTE FUNCTION fn_trigger_actualizar_metricas_tarea();

-- ============================================
-- TRIGGER: Actualizar metricas cuando cambia auditoria
-- ============================================
CREATE OR REPLACE FUNCTION fn_trigger_actualizar_metricas_auditoria()
RETURNS TRIGGER AS $$
DECLARE
  v_responsable_id UUID;
  v_periodo TEXT;
BEGIN
  -- Obtener datos de la tarea asociada
  SELECT t.responsable_usuario_id, t.periodo_fiscal
  INTO v_responsable_id, v_periodo
  FROM tarea t
  WHERE t.tarea_id = NEW.tarea_id;

  -- Solo actualizar si la auditoria llega a estado final
  IF NEW.estado IN ('APROBADO', 'DESTACADO', 'RECHAZADO') AND
     (OLD.estado IS NULL OR OLD.estado NOT IN ('APROBADO', 'DESTACADO', 'RECHAZADO')) THEN
    IF v_responsable_id IS NOT NULL THEN
      PERFORM fn_actualizar_metricas_usuario(v_responsable_id, v_periodo);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_actualizar_metricas_auditoria ON auditoria;
CREATE TRIGGER trg_actualizar_metricas_auditoria
  AFTER UPDATE ON auditoria
  FOR EACH ROW
  EXECUTE FUNCTION fn_trigger_actualizar_metricas_auditoria();

-- ============================================
-- RLS: Habilitar Row Level Security
-- ============================================
ALTER TABLE metrica_calidad ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- ADMIN y SOCIO: Acceso total
DROP POLICY IF EXISTS metrica_admin_socio_all ON metrica_calidad;
CREATE POLICY metrica_admin_socio_all ON metrica_calidad
  FOR ALL
  USING (is_admin_or_socio())
  WITH CHECK (is_admin_or_socio());

-- AUDITOR: Ver todas las metricas (solo lectura)
DROP POLICY IF EXISTS metrica_auditor_select ON metrica_calidad;
CREATE POLICY metrica_auditor_select ON metrica_calidad
  FOR SELECT
  USING (is_auditor());

-- LIDER: Ver metricas de su equipo
DROP POLICY IF EXISTS metrica_lider_select ON metrica_calidad;
CREATE POLICY metrica_lider_select ON metrica_calidad
  FOR SELECT
  USING (
    get_user_role() = 'LIDER' AND
    usuario_id IN (
      SELECT user_id FROM team_members
      WHERE team_id IN (SELECT get_user_teams()) AND activo = true
    )
  );

-- COLABORADOR: Ver solo sus propias metricas
DROP POLICY IF EXISTS metrica_colaborador_select ON metrica_calidad;
CREATE POLICY metrica_colaborador_select ON metrica_calidad
  FOR SELECT
  USING (
    get_user_role() = 'COLABORADOR' AND
    usuario_id = auth.uid()
  );

-- ============================================
-- VISTA: Ranking de usuarios por periodo
-- ============================================
CREATE OR REPLACE VIEW vw_ranking_calidad AS
SELECT
  m.metrica_id,
  m.usuario_id,
  u.nombre AS usuario_nombre,
  u.rol_global,
  m.periodo_fiscal,
  m.tareas_completadas,
  m.tareas_a_tiempo,
  m.tareas_auditadas,
  m.tareas_aprobadas_primera,
  m.tareas_destacadas,
  m.hallazgos_graves,
  m.puntos_totales,
  m.score_calidad,
  -- Ranking por puntos
  RANK() OVER (
    PARTITION BY m.periodo_fiscal
    ORDER BY m.puntos_totales DESC
  ) AS ranking_puntos,
  -- Ranking por score
  RANK() OVER (
    PARTITION BY m.periodo_fiscal
    ORDER BY m.score_calidad DESC NULLS LAST
  ) AS ranking_score
FROM metrica_calidad m
JOIN users u ON u.user_id = m.usuario_id
WHERE m.tareas_completadas > 0
ORDER BY m.periodo_fiscal DESC, m.puntos_totales DESC;

COMMENT ON VIEW vw_ranking_calidad IS
  'Ranking de usuarios por periodo, ordenado por puntos y score de calidad.';

-- ============================================
-- VISTA: Tendencia de calidad por usuario
-- ============================================
CREATE OR REPLACE VIEW vw_tendencia_calidad AS
SELECT
  m.usuario_id,
  u.nombre AS usuario_nombre,
  m.periodo_fiscal,
  m.score_calidad,
  m.puntos_totales,
  -- Diferencia con periodo anterior
  LAG(m.score_calidad) OVER (
    PARTITION BY m.usuario_id
    ORDER BY m.periodo_fiscal
  ) AS score_anterior,
  m.score_calidad - LAG(m.score_calidad) OVER (
    PARTITION BY m.usuario_id
    ORDER BY m.periodo_fiscal
  ) AS variacion_score
FROM metrica_calidad m
JOIN users u ON u.user_id = m.usuario_id
ORDER BY m.usuario_id, m.periodo_fiscal;

COMMENT ON VIEW vw_tendencia_calidad IS
  'Muestra la tendencia de calidad de cada usuario comparando con periodos anteriores.';

-- ============================================
-- FUNCION: Obtener candidatos a bono
-- Usuarios con score >= umbral
-- ============================================
CREATE OR REPLACE FUNCTION fn_candidatos_bono(
  p_periodo TEXT,
  p_umbral_score DECIMAL DEFAULT 80.0,
  p_min_tareas INTEGER DEFAULT 5
)
RETURNS TABLE (
  usuario_id UUID,
  usuario_nombre TEXT,
  score_calidad DECIMAL(5,2),
  puntos_totales INTEGER,
  tareas_completadas INTEGER,
  tareas_destacadas INTEGER,
  ranking INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.usuario_id,
    u.nombre AS usuario_nombre,
    m.score_calidad,
    m.puntos_totales,
    m.tareas_completadas,
    m.tareas_destacadas,
    RANK() OVER (ORDER BY m.puntos_totales DESC)::INTEGER AS ranking
  FROM metrica_calidad m
  JOIN users u ON u.user_id = m.usuario_id
  WHERE m.periodo_fiscal = p_periodo
    AND m.score_calidad >= p_umbral_score
    AND m.tareas_completadas >= p_min_tareas
  ORDER BY m.puntos_totales DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION fn_candidatos_bono IS
  'Lista usuarios elegibles para bono: score >= umbral y tareas >= minimo.';

-- ============================================
-- FIN DE MIGRACION T2B.6
-- ============================================
