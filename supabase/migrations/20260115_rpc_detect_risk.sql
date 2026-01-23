-- ============================================
-- SGR CBC - Sprint 7B: RPC Deteccion de Riesgo
-- T2B.7 - Stored procedure para deteccion transaccional de riesgo
--
-- PROPOSITO: Evalua tareas pendientes y detecta situaciones
-- de riesgo basandose en multiples criterios. Marca las tareas
-- con riesgo ALTO para priorizacion y posible auditoria.
--
-- Criterios de riesgo evaluados:
-- 1. Dias hasta vencimiento (< 5 dias = ALTO)
-- 2. Estado PRESENTADO sin pago (> 3 dias = ALTO)
-- 3. Bloqueada por dependencias
-- 4. Patron historico de retrasos del cliente
--
-- Ejecutar DESPUES de: 20260115_metrica_calidad.sql
-- ============================================

-- ============================================
-- TIPO: Resultado de deteccion de riesgo
-- ============================================
DROP TYPE IF EXISTS tipo_resultado_riesgo CASCADE;
CREATE TYPE tipo_resultado_riesgo AS (
  tareas_evaluadas INTEGER,
  tareas_marcadas_riesgo INTEGER,
  criterios_aplicados TEXT[]
);

-- ============================================
-- TABLA: Historico de ejecuciones de deteccion
-- ============================================
CREATE TABLE IF NOT EXISTS deteccion_riesgo_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_fiscal TEXT,
  tareas_evaluadas INTEGER NOT NULL,
  tareas_marcadas INTEGER NOT NULL,
  criterios_aplicados TEXT[],
  ejecutado_por UUID REFERENCES users(user_id),
  ejecutado_at TIMESTAMPTZ DEFAULT NOW(),
  duracion_ms INTEGER,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_deteccion_riesgo_log_fecha
  ON deteccion_riesgo_log(ejecutado_at DESC);

COMMENT ON TABLE deteccion_riesgo_log IS
  'Historico de ejecuciones de rpc_detect_risk para auditoria y monitoreo.';

-- ============================================
-- FUNCION AUXILIAR: Dias habiles hasta fecha
-- Considera dias inhabiles si existe la tabla
-- ============================================
CREATE OR REPLACE FUNCTION fn_dias_habiles_hasta(
  p_fecha_limite DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_dias INTEGER := 0;
  v_fecha_actual DATE := CURRENT_DATE;
  v_fecha DATE;
BEGIN
  -- Contar dias habiles (excluyendo fines de semana)
  v_fecha := v_fecha_actual;
  WHILE v_fecha < p_fecha_limite LOOP
    -- Excluir sabados (6) y domingos (0)
    IF EXTRACT(DOW FROM v_fecha) NOT IN (0, 6) THEN
      -- Verificar si es dia inhabil (si existe la tabla)
      IF NOT EXISTS (
        SELECT 1 FROM dias_inhabiles
        WHERE fecha = v_fecha AND activo = true
      ) THEN
        v_dias := v_dias + 1;
      END IF;
    END IF;
    v_fecha := v_fecha + INTERVAL '1 day';
  END LOOP;

  RETURN v_dias;
EXCEPTION
  -- Si la tabla dias_inhabiles no existe, contar solo dias naturales
  WHEN undefined_table THEN
    RETURN p_fecha_limite - v_fecha_actual;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_dias_habiles_hasta IS
  'Calcula dias habiles hasta una fecha, excluyendo fines de semana y dias inhabiles.';

-- ============================================
-- FUNCION AUXILIAR: Obtener patron historico de retrasos
-- para un cliente/contribuyente
-- ============================================
CREATE OR REPLACE FUNCTION fn_patron_retrasos_cliente(
  p_cliente_id UUID,
  p_contribuyente_id UUID DEFAULT NULL,
  p_meses_historico INTEGER DEFAULT 12
)
RETURNS TABLE (
  tareas_historicas INTEGER,
  tareas_retrasadas INTEGER,
  pct_retraso DECIMAL(5,2),
  es_patron_riesgo BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS tareas_historicas,
    COUNT(*) FILTER (WHERE t.updated_at > t.fecha_limite_oficial)::INTEGER AS tareas_retrasadas,
    CASE
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE t.updated_at > t.fecha_limite_oficial)::DECIMAL / COUNT(*)) * 100
      ELSE 0
    END AS pct_retraso,
    -- Es patron de riesgo si > 30% de tareas se retrasan
    (COUNT(*) FILTER (WHERE t.updated_at > t.fecha_limite_oficial)::DECIMAL / NULLIF(COUNT(*), 0)) > 0.30 AS es_patron_riesgo
  FROM tarea t
  WHERE t.cliente_id = p_cliente_id
    AND (p_contribuyente_id IS NULL OR t.contribuyente_id = p_contribuyente_id)
    AND t.estado IN ('cerrado', 'pagado')
    AND t.created_at >= CURRENT_DATE - (p_meses_historico || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_patron_retrasos_cliente IS
  'Analiza el historico de retrasos de un cliente para detectar patrones de riesgo.';

-- ============================================
-- FUNCION PRINCIPAL: rpc_detect_risk
-- ============================================
CREATE OR REPLACE FUNCTION rpc_detect_risk(
  p_periodo TEXT DEFAULT NULL
)
RETURNS TABLE (
  tareas_evaluadas INTEGER,
  tareas_marcadas_riesgo INTEGER,
  criterios_aplicados TEXT[]
) AS $$
DECLARE
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_tareas_evaluadas INTEGER := 0;
  v_tareas_marcadas INTEGER := 0;
  v_criterios TEXT[] := ARRAY[]::TEXT[];
  v_tarea RECORD;
  v_nuevo_riesgo TEXT;
  v_razon TEXT;
  v_criterio_aplicado TEXT;
BEGIN
  -- Criterios disponibles
  v_criterios := ARRAY[
    'DIAS_VENCIMIENTO',    -- < 5 dias habiles
    'PRESENTADO_SIN_PAGO', -- > 3 dias sin pago
    'BLOQUEADO_DEPS',      -- Bloqueado por dependencias
    'PATRON_HISTORICO'     -- Cliente con historial de retrasos
  ];

  -- Evaluar cada tarea pendiente
  FOR v_tarea IN
    SELECT
      t.tarea_id,
      t.cliente_id,
      t.contribuyente_id,
      t.estado,
      t.riesgo AS riesgo_actual,
      t.fecha_limite_oficial,
      t.fecha_limite_interna,
      t.periodo_fiscal,
      t.updated_at,
      fn_dias_habiles_hasta(t.fecha_limite_oficial) AS dias_hasta_limite
    FROM tarea t
    WHERE t.estado NOT IN ('cerrado', 'pagado', 'rechazado')
      AND (p_periodo IS NULL OR t.periodo_fiscal = p_periodo)
  LOOP
    v_tareas_evaluadas := v_tareas_evaluadas + 1;
    v_nuevo_riesgo := v_tarea.riesgo_actual;
    v_razon := NULL;
    v_criterio_aplicado := NULL;

    -- CRITERIO 1: Dias hasta vencimiento (< 5 dias habiles = ALTO)
    IF v_tarea.dias_hasta_limite < 5 AND v_tarea.dias_hasta_limite >= 0 THEN
      IF v_tarea.riesgo_actual <> 'ALTO' THEN
        v_nuevo_riesgo := 'ALTO';
        v_razon := 'Menos de 5 dias habiles hasta vencimiento';
        v_criterio_aplicado := 'DIAS_VENCIMIENTO';
      END IF;
    END IF;

    -- CRITERIO 2: Presentado sin pago > 3 dias
    IF v_tarea.estado = 'presentado' THEN
      IF CURRENT_DATE - v_tarea.updated_at::DATE > 3 THEN
        IF v_tarea.riesgo_actual <> 'ALTO' THEN
          v_nuevo_riesgo := 'ALTO';
          v_razon := 'Presentado hace mas de 3 dias sin confirmacion de pago';
          v_criterio_aplicado := 'PRESENTADO_SIN_PAGO';
        END IF;
      END IF;
    END IF;

    -- CRITERIO 3: Bloqueado por dependencias (estado bloqueado_cliente)
    IF v_tarea.estado = 'bloqueado_cliente' THEN
      -- Verificar tiempo bloqueado
      IF CURRENT_DATE - v_tarea.updated_at::DATE > 2 THEN
        IF v_tarea.riesgo_actual <> 'ALTO' THEN
          v_nuevo_riesgo := 'ALTO';
          v_razon := 'Bloqueado por cliente por mas de 2 dias';
          v_criterio_aplicado := 'BLOQUEADO_DEPS';
        END IF;
      END IF;
    END IF;

    -- CRITERIO 4: Patron historico de retrasos
    IF v_nuevo_riesgo <> 'ALTO' THEN
      -- Solo evaluar si aun no es ALTO
      DECLARE
        v_patron RECORD;
      BEGIN
        SELECT * INTO v_patron
        FROM fn_patron_retrasos_cliente(v_tarea.cliente_id, v_tarea.contribuyente_id);

        IF v_patron.es_patron_riesgo AND v_patron.tareas_historicas >= 5 THEN
          IF v_tarea.riesgo_actual = 'BAJO' THEN
            v_nuevo_riesgo := 'MEDIO';
            v_razon := 'Cliente con patron historico de retrasos (' || v_patron.pct_retraso::TEXT || '%)';
            v_criterio_aplicado := 'PATRON_HISTORICO';
          END IF;
        END IF;
      END;
    END IF;

    -- Si el riesgo cambio, actualizar la tarea
    IF v_nuevo_riesgo <> v_tarea.riesgo_actual THEN
      UPDATE tarea
      SET
        riesgo = v_nuevo_riesgo,
        updated_at = NOW()
      WHERE tarea_id = v_tarea.tarea_id;

      -- Registrar el evento de cambio de riesgo
      INSERT INTO tarea_evento (
        tarea_id,
        tipo_evento,
        estado_anterior,
        estado_nuevo,
        actor_usuario_id,
        occurred_at,
        metadata_json
      ) VALUES (
        v_tarea.tarea_id,
        'RISK_CHANGE',
        v_tarea.riesgo_actual,
        v_nuevo_riesgo,
        auth.uid(),
        NOW(),
        jsonb_build_object(
          'criterio', v_criterio_aplicado,
          'razon', v_razon,
          'dias_hasta_limite', v_tarea.dias_hasta_limite
        )
      );

      v_tareas_marcadas := v_tareas_marcadas + 1;
    END IF;
  END LOOP;

  -- Registrar ejecucion en el log
  INSERT INTO deteccion_riesgo_log (
    periodo_fiscal,
    tareas_evaluadas,
    tareas_marcadas,
    criterios_aplicados,
    ejecutado_por,
    duracion_ms,
    metadata
  ) VALUES (
    p_periodo,
    v_tareas_evaluadas,
    v_tareas_marcadas,
    v_criterios,
    auth.uid(),
    EXTRACT(MILLISECOND FROM (clock_timestamp() - v_start_time))::INTEGER,
    jsonb_build_object(
      'version', '1.0',
      'ejecutado_at', NOW()
    )
  );

  -- Retornar resultados
  RETURN QUERY SELECT
    v_tareas_evaluadas,
    v_tareas_marcadas,
    v_criterios;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION rpc_detect_risk IS
  'Evalua tareas pendientes y marca las de alto riesgo. Criterios: dias vencimiento, presentado sin pago, bloqueado, patron historico.';

-- ============================================
-- FUNCION: Obtener tareas de alto riesgo
-- ============================================
CREATE OR REPLACE FUNCTION rpc_get_high_risk_tasks(
  p_periodo TEXT DEFAULT NULL,
  p_limite INTEGER DEFAULT 50
)
RETURNS TABLE (
  tarea_id UUID,
  cliente_nombre TEXT,
  contribuyente_rfc TEXT,
  obligacion_nombre TEXT,
  estado TEXT,
  riesgo TEXT,
  fecha_limite_oficial DATE,
  dias_restantes INTEGER,
  responsable_nombre TEXT,
  criterio_riesgo TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tarea_id,
    c.nombre_comercial AS cliente_nombre,
    co.rfc AS contribuyente_rfc,
    o.nombre_corto AS obligacion_nombre,
    t.estado,
    t.riesgo,
    t.fecha_limite_oficial,
    fn_dias_habiles_hasta(t.fecha_limite_oficial) AS dias_restantes,
    u.nombre AS responsable_nombre,
    -- Determinar criterio principal de riesgo
    CASE
      WHEN fn_dias_habiles_hasta(t.fecha_limite_oficial) < 5 THEN 'DIAS_VENCIMIENTO'
      WHEN t.estado = 'presentado' AND CURRENT_DATE - t.updated_at::DATE > 3 THEN 'PRESENTADO_SIN_PAGO'
      WHEN t.estado = 'bloqueado_cliente' THEN 'BLOQUEADO_DEPS'
      ELSE 'OTRO'
    END AS criterio_riesgo
  FROM tarea t
  JOIN cliente c ON c.cliente_id = t.cliente_id
  JOIN contribuyente co ON co.contribuyente_id = t.contribuyente_id
  JOIN obligacion_fiscal o ON o.id_obligacion = t.id_obligacion
  LEFT JOIN users u ON u.user_id = t.responsable_usuario_id
  WHERE t.riesgo = 'ALTO'
    AND t.estado NOT IN ('cerrado', 'pagado', 'rechazado')
    AND (p_periodo IS NULL OR t.periodo_fiscal = p_periodo)
  ORDER BY
    fn_dias_habiles_hasta(t.fecha_limite_oficial) ASC,
    t.fecha_limite_oficial ASC
  LIMIT p_limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION rpc_get_high_risk_tasks IS
  'Obtiene la lista de tareas de alto riesgo ordenadas por urgencia.';

-- ============================================
-- FUNCION: Resumen de riesgo por periodo
-- ============================================
CREATE OR REPLACE FUNCTION rpc_risk_summary(
  p_periodo TEXT DEFAULT NULL
)
RETURNS TABLE (
  periodo TEXT,
  total_tareas INTEGER,
  riesgo_alto INTEGER,
  riesgo_medio INTEGER,
  riesgo_bajo INTEGER,
  pct_alto DECIMAL(5,2),
  tareas_vencidas INTEGER,
  tareas_por_vencer_5_dias INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(p_periodo, t.periodo_fiscal) AS periodo,
    COUNT(*)::INTEGER AS total_tareas,
    COUNT(*) FILTER (WHERE t.riesgo = 'ALTO')::INTEGER AS riesgo_alto,
    COUNT(*) FILTER (WHERE t.riesgo = 'MEDIO')::INTEGER AS riesgo_medio,
    COUNT(*) FILTER (WHERE t.riesgo = 'BAJO')::INTEGER AS riesgo_bajo,
    (COUNT(*) FILTER (WHERE t.riesgo = 'ALTO')::DECIMAL / NULLIF(COUNT(*), 0) * 100)::DECIMAL(5,2) AS pct_alto,
    COUNT(*) FILTER (WHERE t.fecha_limite_oficial < CURRENT_DATE)::INTEGER AS tareas_vencidas,
    COUNT(*) FILTER (WHERE fn_dias_habiles_hasta(t.fecha_limite_oficial) BETWEEN 0 AND 5)::INTEGER AS tareas_por_vencer_5_dias
  FROM tarea t
  WHERE t.estado NOT IN ('cerrado', 'pagado', 'rechazado')
    AND (p_periodo IS NULL OR t.periodo_fiscal = p_periodo)
  GROUP BY COALESCE(p_periodo, t.periodo_fiscal)
  ORDER BY periodo DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION rpc_risk_summary IS
  'Resumen de distribucion de riesgo y tareas por vencer.';

-- ============================================
-- FUNCION: Seleccionar tareas para auditoria por riesgo
-- Selecciona tareas que han sido marcadas como riesgo
-- ============================================
CREATE OR REPLACE FUNCTION rpc_seleccionar_auditoria_por_riesgo(
  p_periodo TEXT,
  p_auditor_id UUID,
  p_limite INTEGER DEFAULT 10
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_tarea RECORD;
BEGIN
  -- Seleccionar tareas cerradas que tuvieron riesgo ALTO
  FOR v_tarea IN
    SELECT DISTINCT t.tarea_id
    FROM tarea t
    JOIN tarea_evento te ON te.tarea_id = t.tarea_id
    WHERE t.estado IN ('cerrado', 'pagado')
      AND t.periodo_fiscal = p_periodo
      -- Que hayan tenido evento de cambio de riesgo a ALTO
      AND te.tipo_evento = 'RISK_CHANGE'
      AND te.estado_nuevo = 'ALTO'
      -- Que no hayan sido auditadas
      AND NOT EXISTS (
        SELECT 1 FROM auditoria a
        WHERE a.tarea_id = t.tarea_id
      )
    ORDER BY t.fecha_limite_oficial DESC
    LIMIT p_limite
  LOOP
    -- Crear registro de auditoria
    INSERT INTO auditoria (
      tarea_id,
      auditor_id,
      periodo_fiscal,
      tipo_seleccion
    ) VALUES (
      v_tarea.tarea_id,
      p_auditor_id,
      p_periodo,
      'POR_RIESGO'
    )
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION rpc_seleccionar_auditoria_por_riesgo IS
  'Selecciona tareas cerradas que fueron de alto riesgo para auditoria prioritaria.';

-- ============================================
-- VISTA: Dashboard de riesgo
-- ============================================
CREATE OR REPLACE VIEW vw_dashboard_riesgo AS
SELECT
  t.periodo_fiscal,
  -- Metricas generales
  COUNT(*) AS total_tareas_activas,
  COUNT(*) FILTER (WHERE t.riesgo = 'ALTO') AS tareas_alto_riesgo,
  COUNT(*) FILTER (WHERE t.fecha_limite_oficial < CURRENT_DATE) AS tareas_vencidas,
  COUNT(*) FILTER (WHERE fn_dias_habiles_hasta(t.fecha_limite_oficial) BETWEEN 0 AND 5) AS por_vencer_5_dias,
  -- Por estado
  COUNT(*) FILTER (WHERE t.estado = 'pendiente') AS pendientes,
  COUNT(*) FILTER (WHERE t.estado = 'en_curso') AS en_curso,
  COUNT(*) FILTER (WHERE t.estado = 'bloqueado_cliente') AS bloqueadas,
  COUNT(*) FILTER (WHERE t.estado = 'presentado') AS presentadas_sin_pago,
  -- Metricas de tiempo
  AVG(fn_dias_habiles_hasta(t.fecha_limite_oficial)) FILTER (WHERE t.riesgo = 'ALTO') AS dias_promedio_alto_riesgo
FROM tarea t
WHERE t.estado NOT IN ('cerrado', 'pagado', 'rechazado')
GROUP BY t.periodo_fiscal
ORDER BY t.periodo_fiscal DESC;

COMMENT ON VIEW vw_dashboard_riesgo IS
  'Vista consolidada para dashboard de monitoreo de riesgo.';

-- ============================================
-- RLS para tabla de log
-- ============================================
ALTER TABLE deteccion_riesgo_log ENABLE ROW LEVEL SECURITY;

-- Solo ADMIN/SOCIO/AUDITOR pueden ver el log
DROP POLICY IF EXISTS deteccion_riesgo_log_select ON deteccion_riesgo_log;
CREATE POLICY deteccion_riesgo_log_select ON deteccion_riesgo_log
  FOR SELECT
  USING (
    get_user_role() IN ('ADMIN', 'SOCIO', 'AUDITOR')
  );

-- Solo el sistema puede insertar (via SECURITY DEFINER)
DROP POLICY IF EXISTS deteccion_riesgo_log_insert ON deteccion_riesgo_log;
CREATE POLICY deteccion_riesgo_log_insert ON deteccion_riesgo_log
  FOR INSERT
  WITH CHECK (is_admin_or_socio());

-- ============================================
-- PERMISOS: Ejecutar funciones RPC
-- ============================================
GRANT EXECUTE ON FUNCTION rpc_detect_risk TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_high_risk_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_risk_summary TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_seleccionar_auditoria_por_riesgo TO authenticated;

-- ============================================
-- FIN DE MIGRACION T2B.7
-- ============================================
