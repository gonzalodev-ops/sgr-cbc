-- ============================================
-- SGR CBC - FASE 2: Sprint 5A - RPC para generacion de tareas
-- Fecha: 2026-01-15
-- Descripcion: Procedimiento almacenado para generacion batch de tareas
-- T2A.7 - AGENTE BD
-- ============================================

-- ============================================
-- SECCION 1: FUNCION AUXILIAR - Verificar si tarea existe
-- ============================================

CREATE OR REPLACE FUNCTION tarea_existe(
  p_contribuyente_id UUID,
  p_id_obligacion TEXT,
  p_periodo_fiscal TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tarea
    WHERE contribuyente_id = p_contribuyente_id
      AND id_obligacion = p_id_obligacion
      AND periodo_fiscal = p_periodo_fiscal
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION tarea_existe(UUID, TEXT, TEXT) SET search_path = public;

-- ============================================
-- SECCION 2: FUNCION AUXILIAR - Obtener cliente principal de contribuyente
-- ============================================

CREATE OR REPLACE FUNCTION get_cliente_principal(p_contribuyente_id UUID)
RETURNS UUID AS $$
DECLARE
  v_cliente_id UUID;
BEGIN
  SELECT cc.cliente_id INTO v_cliente_id
  FROM cliente_contribuyente cc
  WHERE cc.contribuyente_id = p_contribuyente_id
    AND cc.activo = true
  ORDER BY cc.vigencia_desde DESC NULLS LAST
  LIMIT 1;

  RETURN v_cliente_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION get_cliente_principal(UUID) SET search_path = public;

-- ============================================
-- SECCION 3: FUNCION AUXILIAR - Obtener fecha limite para obligacion/periodo
-- ============================================

CREATE OR REPLACE FUNCTION get_fecha_limite_obligacion(
  p_id_obligacion TEXT,
  p_ejercicio INTEGER,
  p_periodo_fiscal TEXT
)
RETURNS DATE AS $$
DECLARE
  v_fecha_limite DATE;
BEGIN
  -- Buscar en calendario_deadline via obligacion_calendario
  SELECT cd.fecha_limite INTO v_fecha_limite
  FROM calendario_deadline cd
  JOIN calendario_regla_obligacion cro ON cro.calendario_regla_id = cd.calendario_regla_id
  WHERE cro.id_obligacion = p_id_obligacion
    AND cd.ejercicio = p_ejercicio
    AND cd.periodo_fiscal = p_periodo_fiscal
    AND cd.activo = true
  LIMIT 1;

  -- Si no hay fecha especifica, calcular basado en periodicidad
  IF v_fecha_limite IS NULL THEN
    SELECT
      CASE
        -- Mensual: dia 17 del mes siguiente
        WHEN of.periodicidad = 'MENSUAL' THEN
          MAKE_DATE(
            CASE WHEN p_periodo_fiscal::INTEGER = 12 THEN p_ejercicio + 1 ELSE p_ejercicio END,
            CASE WHEN p_periodo_fiscal::INTEGER = 12 THEN 1 ELSE p_periodo_fiscal::INTEGER + 1 END,
            17
          )
        -- Anual: 31 de marzo del ejercicio siguiente
        WHEN of.periodicidad = 'ANUAL' THEN
          MAKE_DATE(p_ejercicio + 1, 3, 31)
        -- Eventual: fecha actual + 30 dias
        WHEN of.periodicidad = 'EVENTUAL' THEN
          CURRENT_DATE + INTERVAL '30 days'
        -- Default: fin del mes siguiente
        ELSE
          (DATE_TRUNC('month', MAKE_DATE(p_ejercicio, p_periodo_fiscal::INTEGER, 1)) + INTERVAL '2 months' - INTERVAL '1 day')::DATE
      END
    INTO v_fecha_limite
    FROM obligacion_fiscal of
    WHERE of.id_obligacion = p_id_obligacion;
  END IF;

  RETURN v_fecha_limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION get_fecha_limite_obligacion(TEXT, INTEGER, TEXT) SET search_path = public;

-- ============================================
-- SECCION 4: RPC PRINCIPAL - rpc_generate_tasks
-- ============================================

CREATE OR REPLACE FUNCTION rpc_generate_tasks(
  p_periodo TEXT,           -- Formato: 'YYYY-MM' (ej: '2026-01')
  p_contribuyente_id UUID DEFAULT NULL  -- Opcional: filtrar por contribuyente
)
RETURNS TABLE (
  tareas_creadas INTEGER,
  tareas_existentes INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_tareas_creadas INTEGER := 0;
  v_tareas_existentes INTEGER := 0;
  v_errores TEXT[] := ARRAY[]::TEXT[];
  v_ejercicio INTEGER;
  v_periodo_fiscal TEXT;
  v_contribuyente RECORD;
  v_obligacion RECORD;
  v_cliente_id UUID;
  v_fecha_limite DATE;
  v_riesgo TEXT;
  v_prioridad INTEGER;
  v_nueva_tarea_id UUID;
BEGIN
  -- Validar formato del periodo
  IF p_periodo !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    v_errores := array_append(v_errores, 'Formato de periodo invalido. Use YYYY-MM');
    RETURN QUERY SELECT 0, 0, v_errores;
    RETURN;
  END IF;

  -- Extraer ejercicio y periodo fiscal
  v_ejercicio := SPLIT_PART(p_periodo, '-', 1)::INTEGER;
  v_periodo_fiscal := SPLIT_PART(p_periodo, '-', 2);

  -- Iterar sobre contribuyentes activos
  FOR v_contribuyente IN
    SELECT c.*
    FROM contribuyente c
    WHERE c.activo = true
      AND (p_contribuyente_id IS NULL OR c.contribuyente_id = p_contribuyente_id)
  LOOP
    -- Obtener cliente principal
    v_cliente_id := get_cliente_principal(v_contribuyente.contribuyente_id);

    IF v_cliente_id IS NULL THEN
      v_errores := array_append(v_errores,
        'Contribuyente ' || v_contribuyente.rfc || ' sin cliente asociado');
      CONTINUE;
    END IF;

    -- Iterar sobre obligaciones del contribuyente segun sus regimenes
    FOR v_obligacion IN
      SELECT DISTINCT
        of.id_obligacion,
        of.nombre_corto,
        of.periodicidad,
        ro.riesgo_default,
        ro.prioridad_default
      FROM contribuyente_regimen cr
      JOIN regimen_obligacion ro ON ro.c_regimen = cr.c_regimen
      JOIN obligacion_fiscal of ON of.id_obligacion = ro.id_obligacion
      WHERE cr.contribuyente_id = v_contribuyente.contribuyente_id
        AND cr.activo = true
        AND of.activo = true
        AND ro.es_obligatoria = true
        -- Filtrar por periodicidad segun periodo solicitado
        AND (
          of.periodicidad = 'MENSUAL'
          OR (of.periodicidad = 'ANUAL' AND v_periodo_fiscal = '12')
          OR of.periodicidad IN ('EVENTUAL', 'POR_OPERACION', 'PERMANENTE')
        )
    LOOP
      BEGIN
        -- Verificar si ya existe la tarea
        IF tarea_existe(v_contribuyente.contribuyente_id, v_obligacion.id_obligacion, v_periodo_fiscal) THEN
          v_tareas_existentes := v_tareas_existentes + 1;
          CONTINUE;
        END IF;

        -- Obtener fecha limite
        v_fecha_limite := get_fecha_limite_obligacion(
          v_obligacion.id_obligacion,
          v_ejercicio,
          v_periodo_fiscal
        );

        -- Determinar riesgo y prioridad
        v_riesgo := COALESCE(v_obligacion.riesgo_default, 'MEDIO');
        v_prioridad := COALESCE(v_obligacion.prioridad_default, 50);

        -- Crear la tarea
        INSERT INTO tarea (
          cliente_id,
          contribuyente_id,
          id_obligacion,
          ejercicio,
          periodo_fiscal,
          fecha_limite_oficial,
          fecha_limite_interna,
          estado,
          riesgo,
          prioridad,
          origen,
          comentarios
        ) VALUES (
          v_cliente_id,
          v_contribuyente.contribuyente_id,
          v_obligacion.id_obligacion,
          v_ejercicio,
          v_periodo_fiscal,
          v_fecha_limite,
          v_fecha_limite - INTERVAL '3 days',  -- Fecha interna 3 dias antes
          'pendiente',
          v_riesgo,
          v_prioridad,
          'AUTO_CALENDARIO',
          'Tarea generada automaticamente para periodo ' || p_periodo
        )
        RETURNING tarea_id INTO v_nueva_tarea_id;

        v_tareas_creadas := v_tareas_creadas + 1;

        -- Registrar evento de creacion
        INSERT INTO tarea_evento (
          tarea_id,
          tipo_evento,
          estado_anterior,
          estado_nuevo,
          metadata_json
        ) VALUES (
          v_nueva_tarea_id,
          'TAREA_CREADA',
          NULL,
          'pendiente',
          jsonb_build_object(
            'origen', 'rpc_generate_tasks',
            'periodo', p_periodo,
            'fecha_limite', v_fecha_limite
          )
        );

      EXCEPTION WHEN OTHERS THEN
        v_errores := array_append(v_errores,
          'Error en ' || v_contribuyente.rfc || '/' || v_obligacion.id_obligacion || ': ' || SQLERRM);
      END;
    END LOOP;
  END LOOP;

  -- Registrar en log del sistema
  INSERT INTO system_log (tipo, mensaje, metadata)
  VALUES (
    'GENERACION_TAREAS',
    'Ejecucion de rpc_generate_tasks',
    jsonb_build_object(
      'periodo', p_periodo,
      'contribuyente_filtro', p_contribuyente_id,
      'tareas_creadas', v_tareas_creadas,
      'tareas_existentes', v_tareas_existentes,
      'errores_count', array_length(v_errores, 1)
    )
  );

  RETURN QUERY SELECT v_tareas_creadas, v_tareas_existentes, v_errores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION rpc_generate_tasks(TEXT, UUID) SET search_path = public;

-- ============================================
-- SECCION 5: FUNCION AUXILIAR - Generar tareas para multiples periodos
-- ============================================

CREATE OR REPLACE FUNCTION rpc_generate_tasks_range(
  p_periodo_inicio TEXT,    -- Formato: 'YYYY-MM'
  p_periodo_fin TEXT,       -- Formato: 'YYYY-MM'
  p_contribuyente_id UUID DEFAULT NULL
)
RETURNS TABLE (
  periodo TEXT,
  tareas_creadas INTEGER,
  tareas_existentes INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_fecha_inicio DATE;
  v_fecha_fin DATE;
  v_fecha_actual DATE;
  v_periodo_actual TEXT;
  v_result RECORD;
BEGIN
  -- Validar formatos
  IF p_periodo_inicio !~ '^\d{4}-(0[1-9]|1[0-2])$' OR p_periodo_fin !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    RETURN QUERY SELECT
      'ERROR'::TEXT,
      0,
      0,
      ARRAY['Formato de periodo invalido. Use YYYY-MM']::TEXT[];
    RETURN;
  END IF;

  -- Convertir a fechas
  v_fecha_inicio := (p_periodo_inicio || '-01')::DATE;
  v_fecha_fin := (p_periodo_fin || '-01')::DATE;

  -- Validar rango
  IF v_fecha_inicio > v_fecha_fin THEN
    RETURN QUERY SELECT
      'ERROR'::TEXT,
      0,
      0,
      ARRAY['Periodo inicio debe ser menor o igual a periodo fin']::TEXT[];
    RETURN;
  END IF;

  -- Iterar por cada mes en el rango
  v_fecha_actual := v_fecha_inicio;
  WHILE v_fecha_actual <= v_fecha_fin LOOP
    v_periodo_actual := TO_CHAR(v_fecha_actual, 'YYYY-MM');

    SELECT * INTO v_result
    FROM rpc_generate_tasks(v_periodo_actual, p_contribuyente_id);

    RETURN QUERY SELECT
      v_periodo_actual,
      v_result.tareas_creadas,
      v_result.tareas_existentes,
      v_result.errores;

    v_fecha_actual := v_fecha_actual + INTERVAL '1 month';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION rpc_generate_tasks_range(TEXT, TEXT, UUID) SET search_path = public;

-- ============================================
-- SECCION 6: FUNCION PARA GENERAR PASOS DE TAREA
-- ============================================

CREATE OR REPLACE FUNCTION generar_pasos_tarea(p_tarea_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_obligacion_id TEXT;
  v_proceso_id TEXT;
  v_paso RECORD;
  v_pasos_creados INTEGER := 0;
BEGIN
  -- Obtener la obligacion de la tarea
  SELECT id_obligacion INTO v_obligacion_id
  FROM tarea WHERE tarea_id = p_tarea_id;

  IF v_obligacion_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Obtener el proceso asociado a la obligacion
  SELECT op.proceso_id INTO v_proceso_id
  FROM obligacion_proceso op
  WHERE op.id_obligacion = v_obligacion_id
    AND op.activo = true
  LIMIT 1;

  IF v_proceso_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Verificar que no existan pasos ya
  IF EXISTS (SELECT 1 FROM tarea_step WHERE tarea_id = p_tarea_id) THEN
    RETURN 0;
  END IF;

  -- Crear los pasos basados en el proceso
  FOR v_paso IN
    SELECT *
    FROM proceso_paso
    WHERE proceso_id = v_proceso_id
      AND activo = true
    ORDER BY orden
  LOOP
    INSERT INTO tarea_step (
      tarea_id,
      proceso_paso_id,
      orden,
      titulo,
      peso_pct,
      tipo_colaborador,
      completado
    ) VALUES (
      p_tarea_id,
      v_paso.paso_id,
      v_paso.orden,
      v_paso.nombre,
      v_paso.peso_pct,
      v_paso.tipo_colaborador,
      false
    );

    v_pasos_creados := v_pasos_creados + 1;
  END LOOP;

  RETURN v_pasos_creados;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION generar_pasos_tarea(UUID) SET search_path = public;

-- ============================================
-- SECCION 7: VERSION EXTENDIDA CON PASOS
-- ============================================

CREATE OR REPLACE FUNCTION rpc_generate_tasks_with_steps(
  p_periodo TEXT,
  p_contribuyente_id UUID DEFAULT NULL
)
RETURNS TABLE (
  tareas_creadas INTEGER,
  tareas_existentes INTEGER,
  pasos_creados INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_result RECORD;
  v_pasos_total INTEGER := 0;
  v_tarea RECORD;
BEGIN
  -- Primero generar las tareas
  SELECT * INTO v_result
  FROM rpc_generate_tasks(p_periodo, p_contribuyente_id);

  -- Luego generar los pasos para las tareas recien creadas
  FOR v_tarea IN
    SELECT tarea_id
    FROM tarea
    WHERE ejercicio = SPLIT_PART(p_periodo, '-', 1)::INTEGER
      AND periodo_fiscal = SPLIT_PART(p_periodo, '-', 2)
      AND origen = 'AUTO_CALENDARIO'
      AND (p_contribuyente_id IS NULL OR contribuyente_id = p_contribuyente_id)
      AND NOT EXISTS (SELECT 1 FROM tarea_step WHERE tarea_step.tarea_id = tarea.tarea_id)
  LOOP
    v_pasos_total := v_pasos_total + generar_pasos_tarea(v_tarea.tarea_id);
  END LOOP;

  RETURN QUERY SELECT
    v_result.tareas_creadas,
    v_result.tareas_existentes,
    v_pasos_total,
    v_result.errores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION rpc_generate_tasks_with_steps(TEXT, UUID) SET search_path = public;

-- ============================================
-- SECCION 8: COMENTARIOS
-- ============================================

COMMENT ON FUNCTION tarea_existe IS 'Verifica si ya existe una tarea para el contribuyente/obligacion/periodo';
COMMENT ON FUNCTION get_cliente_principal IS 'Obtiene el cliente principal asociado a un contribuyente';
COMMENT ON FUNCTION get_fecha_limite_obligacion IS 'Calcula la fecha limite para una obligacion en un periodo';

COMMENT ON FUNCTION rpc_generate_tasks IS
  'RPC principal para generacion batch de tareas. Genera tareas para un periodo especifico basado en las obligaciones de cada contribuyente segun sus regimenes fiscales.
   Parametros:
   - p_periodo: Periodo en formato YYYY-MM (ej: 2026-01)
   - p_contribuyente_id: UUID opcional para filtrar por contribuyente especifico
   Retorna: Numero de tareas creadas, existentes y lista de errores';

COMMENT ON FUNCTION rpc_generate_tasks_range IS
  'Genera tareas para un rango de periodos. Util para generacion masiva.
   Parametros:
   - p_periodo_inicio: Periodo inicial YYYY-MM
   - p_periodo_fin: Periodo final YYYY-MM
   - p_contribuyente_id: UUID opcional para filtrar';

COMMENT ON FUNCTION generar_pasos_tarea IS
  'Genera los pasos (steps) de una tarea basado en el proceso operativo asociado a su obligacion';

COMMENT ON FUNCTION rpc_generate_tasks_with_steps IS
  'Version extendida de rpc_generate_tasks que tambien genera los pasos de cada tarea';

-- ============================================
-- FIN DE MIGRACION T2A.7 - RPC Generate Tasks
-- ============================================
