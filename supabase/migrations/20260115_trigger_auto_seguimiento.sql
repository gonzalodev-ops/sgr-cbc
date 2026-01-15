-- ============================================
-- SGR CBC - FASE 2: Sprint 5A - Triggers para seguimiento automatico
-- Fecha: 2026-01-15
-- Descripcion: Triggers que crean seguimientos automaticamente
-- T2A.6 - AGENTE BD
-- ============================================

-- ============================================
-- SECCION 1: FUNCIONES AUXILIARES
-- ============================================

-- Funcion para obtener el lider del equipo de una tarea
CREATE OR REPLACE FUNCTION get_lider_from_tarea(p_tarea_id UUID)
RETURNS UUID AS $$
DECLARE
  v_lider_id UUID;
BEGIN
  SELECT t.lider_id INTO v_lider_id
  FROM tarea ta
  JOIN contribuyente c ON c.contribuyente_id = ta.contribuyente_id
  JOIN teams t ON t.team_id = c.team_id
  WHERE ta.tarea_id = p_tarea_id;

  RETURN v_lider_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION get_lider_from_tarea(UUID) SET search_path = public;

-- Funcion para obtener el team_id de una tarea
CREATE OR REPLACE FUNCTION get_team_from_tarea(p_tarea_id UUID)
RETURNS UUID AS $$
DECLARE
  v_team_id UUID;
BEGIN
  SELECT c.team_id INTO v_team_id
  FROM tarea ta
  JOIN contribuyente c ON c.contribuyente_id = ta.contribuyente_id
  WHERE ta.tarea_id = p_tarea_id;

  RETURN v_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION get_team_from_tarea(UUID) SET search_path = public;

-- ============================================
-- SECCION 2: TRIGGER 1 - Tarea VENCIDA
-- Crea seguimiento cuando una tarea se vence
-- (fecha_limite_oficial pasa y no esta en estado final)
-- ============================================

-- Funcion para crear seguimiento por tarea vencida
CREATE OR REPLACE FUNCTION fn_crear_seguimiento_tarea_vencida()
RETURNS TRIGGER AS $$
DECLARE
  v_seguimiento_id UUID;
  v_lider_id UUID;
  v_team_id UUID;
  v_descripcion TEXT;
  v_titulo_notif TEXT;
  v_mensaje_notif TEXT;
BEGIN
  -- Solo procesar si la tarea esta vencida (fecha limite pasada)
  -- y no esta en estado final (cerrado, pagado, rechazado)
  IF NEW.fecha_limite_oficial < CURRENT_DATE
     AND NEW.estado NOT IN ('cerrado', 'pagado', 'rechazado')
     AND (OLD.fecha_limite_oficial >= CURRENT_DATE OR OLD.estado IN ('cerrado', 'pagado', 'rechazado'))
  THEN
    -- Verificar que no exista ya un seguimiento para esta tarea vencida
    IF NOT EXISTS (
      SELECT 1 FROM pendiente_seguimiento
      WHERE tarea_origen_id = NEW.tarea_id
        AND categoria = 'TRAMITE'
        AND estado = 'ABIERTO'
    ) THEN
      -- Obtener lider y equipo
      v_lider_id := get_lider_from_tarea(NEW.tarea_id);
      v_team_id := get_team_from_tarea(NEW.tarea_id);

      -- Crear descripcion del seguimiento
      v_descripcion := 'Tarea vencida - ' ||
        COALESCE(NEW.id_obligacion, 'Sin obligacion') ||
        ' - Periodo: ' || NEW.periodo_fiscal ||
        ' - Fecha limite: ' || TO_CHAR(NEW.fecha_limite_oficial, 'DD/MM/YYYY');

      -- Crear el seguimiento
      INSERT INTO pendiente_seguimiento (
        descripcion,
        cliente_id,
        tarea_origen_id,
        categoria,
        prioridad,
        responsable_id,
        lider_id,
        team_id,
        notas
      ) VALUES (
        v_descripcion,
        NEW.cliente_id,
        NEW.tarea_id,
        'TRAMITE',
        'ALTA',  -- Tareas vencidas tienen prioridad alta
        NEW.responsable_usuario_id,
        v_lider_id,
        v_team_id,
        'Seguimiento creado automaticamente por tarea vencida.'
      )
      RETURNING id INTO v_seguimiento_id;

      -- Notificar al lider del equipo
      IF v_lider_id IS NOT NULL THEN
        v_titulo_notif := 'Tarea vencida requiere atencion';
        v_mensaje_notif := 'La tarea de ' || COALESCE(NEW.id_obligacion, 'obligacion') ||
          ' para el periodo ' || NEW.periodo_fiscal ||
          ' ha vencido. Se ha creado un seguimiento automatico.';

        PERFORM crear_notificacion(
          v_lider_id,
          'TAREA_VENCIDA',
          v_titulo_notif,
          v_mensaje_notif,
          'SEGUIMIENTO',
          v_seguimiento_id
        );
      END IF;

      -- Notificar al responsable si es diferente del lider
      IF NEW.responsable_usuario_id IS NOT NULL
         AND NEW.responsable_usuario_id != COALESCE(v_lider_id, '00000000-0000-0000-0000-000000000000'::UUID)
      THEN
        v_titulo_notif := 'Tu tarea ha vencido';
        v_mensaje_notif := 'La tarea de ' || COALESCE(NEW.id_obligacion, 'obligacion') ||
          ' para el periodo ' || NEW.periodo_fiscal ||
          ' ha vencido. Por favor atiende a la brevedad.';

        PERFORM crear_notificacion(
          NEW.responsable_usuario_id,
          'TAREA_VENCIDA',
          v_titulo_notif,
          v_mensaje_notif,
          'TAREA',
          NEW.tarea_id
        );
      END IF;

      -- Registrar en log del sistema
      INSERT INTO system_log (tipo, mensaje, metadata)
      VALUES (
        'SEGUIMIENTO_AUTO',
        'Seguimiento creado automaticamente por tarea vencida',
        jsonb_build_object(
          'tarea_id', NEW.tarea_id,
          'seguimiento_id', v_seguimiento_id,
          'fecha_limite', NEW.fecha_limite_oficial,
          'estado_tarea', NEW.estado
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION fn_crear_seguimiento_tarea_vencida() SET search_path = public;

-- Crear trigger para detectar tareas vencidas
DROP TRIGGER IF EXISTS trg_auto_seguimiento_tarea_vencida ON tarea;
CREATE TRIGGER trg_auto_seguimiento_tarea_vencida
  AFTER UPDATE ON tarea
  FOR EACH ROW
  EXECUTE FUNCTION fn_crear_seguimiento_tarea_vencida();

-- ============================================
-- SECCION 3: TRIGGER 2 - PRESENTADO sin pago despues de 3 dias
-- Crea seguimiento cuando una tarea esta en PRESENTADO
-- y no pasa a PAGADO despues de 3 dias
-- ============================================

-- Funcion para crear seguimiento por pago pendiente
CREATE OR REPLACE FUNCTION fn_crear_seguimiento_pago_pendiente()
RETURNS TRIGGER AS $$
DECLARE
  v_seguimiento_id UUID;
  v_lider_id UUID;
  v_team_id UUID;
  v_descripcion TEXT;
BEGIN
  -- Cuando una tarea cambia a estado 'presentado'
  -- Registrar el timestamp para seguimiento posterior
  IF NEW.estado = 'presentado' AND OLD.estado != 'presentado' THEN
    -- El seguimiento real se creara mediante la funcion batch
    -- Solo registramos el evento de cambio de estado
    INSERT INTO tarea_evento (
      tarea_id,
      tipo_evento,
      estado_anterior,
      estado_nuevo,
      actor_usuario_id,
      metadata_json
    ) VALUES (
      NEW.tarea_id,
      'CAMBIO_ESTADO_PRESENTADO',
      OLD.estado,
      NEW.estado,
      auth.uid(),
      jsonb_build_object(
        'fecha_presentacion', NOW(),
        'fecha_limite_pago', CURRENT_DATE + INTERVAL '3 days'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION fn_crear_seguimiento_pago_pendiente() SET search_path = public;

-- Crear trigger para registrar estado presentado
DROP TRIGGER IF EXISTS trg_registrar_estado_presentado ON tarea;
CREATE TRIGGER trg_registrar_estado_presentado
  AFTER UPDATE ON tarea
  FOR EACH ROW
  EXECUTE FUNCTION fn_crear_seguimiento_pago_pendiente();

-- ============================================
-- SECCION 4: FUNCION BATCH para verificar pagos pendientes
-- Esta funcion debe ser llamada por un cron job o Edge Function
-- ============================================

CREATE OR REPLACE FUNCTION verificar_pagos_pendientes()
RETURNS TABLE (
  seguimientos_creados INTEGER,
  tareas_verificadas INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_seguimientos_creados INTEGER := 0;
  v_tareas_verificadas INTEGER := 0;
  v_errores TEXT[] := ARRAY[]::TEXT[];
  v_tarea RECORD;
  v_seguimiento_id UUID;
  v_lider_id UUID;
  v_team_id UUID;
  v_descripcion TEXT;
BEGIN
  -- Buscar tareas en estado 'presentado' por mas de 3 dias sin seguimiento de pago
  FOR v_tarea IN
    SELECT t.*, te.metadata_json->>'fecha_presentacion' as fecha_presentacion
    FROM tarea t
    JOIN tarea_evento te ON te.tarea_id = t.tarea_id
    WHERE t.estado = 'presentado'
      AND te.tipo_evento = 'CAMBIO_ESTADO_PRESENTADO'
      AND te.occurred_at < NOW() - INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM pendiente_seguimiento ps
        WHERE ps.tarea_origen_id = t.tarea_id
          AND ps.categoria = 'PAGO'
          AND ps.estado = 'ABIERTO'
      )
  LOOP
    v_tareas_verificadas := v_tareas_verificadas + 1;

    BEGIN
      -- Obtener lider y equipo
      v_lider_id := get_lider_from_tarea(v_tarea.tarea_id);
      v_team_id := get_team_from_tarea(v_tarea.tarea_id);

      -- Crear descripcion
      v_descripcion := 'Pago pendiente - ' ||
        COALESCE(v_tarea.id_obligacion, 'Sin obligacion') ||
        ' - Periodo: ' || v_tarea.periodo_fiscal ||
        ' - Presentado hace mas de 3 dias';

      -- Crear seguimiento
      INSERT INTO pendiente_seguimiento (
        descripcion,
        cliente_id,
        tarea_origen_id,
        categoria,
        prioridad,
        responsable_id,
        lider_id,
        team_id,
        notas
      ) VALUES (
        v_descripcion,
        v_tarea.cliente_id,
        v_tarea.tarea_id,
        'PAGO',
        'MEDIA',
        v_tarea.responsable_usuario_id,
        v_lider_id,
        v_team_id,
        'Seguimiento creado automaticamente - Tarea presentada sin confirmar pago despues de 3 dias.'
      )
      RETURNING id INTO v_seguimiento_id;

      v_seguimientos_creados := v_seguimientos_creados + 1;

      -- Notificar al lider
      IF v_lider_id IS NOT NULL THEN
        PERFORM crear_notificacion(
          v_lider_id,
          'PAGO_PENDIENTE',
          'Pago pendiente de confirmacion',
          'La tarea de ' || COALESCE(v_tarea.id_obligacion, 'obligacion') ||
            ' fue presentada hace mas de 3 dias y no se ha confirmado el pago.',
          'SEGUIMIENTO',
          v_seguimiento_id
        );
      END IF;

      -- Registrar en log
      INSERT INTO system_log (tipo, mensaje, metadata)
      VALUES (
        'SEGUIMIENTO_AUTO',
        'Seguimiento de pago pendiente creado automaticamente',
        jsonb_build_object(
          'tarea_id', v_tarea.tarea_id,
          'seguimiento_id', v_seguimiento_id,
          'dias_en_presentado', EXTRACT(DAY FROM NOW() - v_tarea.fecha_presentacion::timestamptz)
        )
      );

    EXCEPTION WHEN OTHERS THEN
      v_errores := array_append(v_errores, 'Tarea ' || v_tarea.tarea_id || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN QUERY SELECT v_seguimientos_creados, v_tareas_verificadas, v_errores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION verificar_pagos_pendientes() SET search_path = public;

-- ============================================
-- SECCION 5: FUNCION BATCH para verificar tareas vencidas
-- Para ejecutar periodicamente via cron
-- ============================================

CREATE OR REPLACE FUNCTION verificar_tareas_vencidas()
RETURNS TABLE (
  seguimientos_creados INTEGER,
  tareas_verificadas INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_seguimientos_creados INTEGER := 0;
  v_tareas_verificadas INTEGER := 0;
  v_errores TEXT[] := ARRAY[]::TEXT[];
  v_tarea RECORD;
  v_seguimiento_id UUID;
  v_lider_id UUID;
  v_team_id UUID;
  v_descripcion TEXT;
BEGIN
  -- Buscar tareas vencidas sin seguimiento existente
  FOR v_tarea IN
    SELECT t.*
    FROM tarea t
    WHERE t.fecha_limite_oficial < CURRENT_DATE
      AND t.estado NOT IN ('cerrado', 'pagado', 'rechazado')
      AND NOT EXISTS (
        SELECT 1 FROM pendiente_seguimiento ps
        WHERE ps.tarea_origen_id = t.tarea_id
          AND ps.categoria = 'TRAMITE'
          AND ps.estado = 'ABIERTO'
      )
  LOOP
    v_tareas_verificadas := v_tareas_verificadas + 1;

    BEGIN
      -- Obtener lider y equipo
      v_lider_id := get_lider_from_tarea(v_tarea.tarea_id);
      v_team_id := get_team_from_tarea(v_tarea.tarea_id);

      -- Crear descripcion
      v_descripcion := 'Tarea vencida - ' ||
        COALESCE(v_tarea.id_obligacion, 'Sin obligacion') ||
        ' - Periodo: ' || v_tarea.periodo_fiscal ||
        ' - Vencio el: ' || TO_CHAR(v_tarea.fecha_limite_oficial, 'DD/MM/YYYY');

      -- Crear seguimiento
      INSERT INTO pendiente_seguimiento (
        descripcion,
        cliente_id,
        tarea_origen_id,
        categoria,
        prioridad,
        responsable_id,
        lider_id,
        team_id,
        notas
      ) VALUES (
        v_descripcion,
        v_tarea.cliente_id,
        v_tarea.tarea_id,
        'TRAMITE',
        'ALTA',
        v_tarea.responsable_usuario_id,
        v_lider_id,
        v_team_id,
        'Seguimiento creado automaticamente por verificacion batch de tareas vencidas.'
      )
      RETURNING id INTO v_seguimiento_id;

      v_seguimientos_creados := v_seguimientos_creados + 1;

      -- Notificar al lider
      IF v_lider_id IS NOT NULL THEN
        PERFORM crear_notificacion(
          v_lider_id,
          'TAREA_VENCIDA',
          'Tarea vencida detectada',
          'La tarea de ' || COALESCE(v_tarea.id_obligacion, 'obligacion') ||
            ' para el periodo ' || v_tarea.periodo_fiscal ||
            ' ha vencido y requiere atencion inmediata.',
          'SEGUIMIENTO',
          v_seguimiento_id
        );
      END IF;

      -- Notificar al responsable si existe y es diferente
      IF v_tarea.responsable_usuario_id IS NOT NULL
         AND v_tarea.responsable_usuario_id != COALESCE(v_lider_id, '00000000-0000-0000-0000-000000000000'::UUID)
      THEN
        PERFORM crear_notificacion(
          v_tarea.responsable_usuario_id,
          'TAREA_VENCIDA',
          'Tu tarea ha vencido',
          'La tarea de ' || COALESCE(v_tarea.id_obligacion, 'obligacion') ||
            ' para el periodo ' || v_tarea.periodo_fiscal ||
            ' ha vencido. Por favor atiende a la brevedad.',
          'TAREA',
          v_tarea.tarea_id
        );
      END IF;

      -- Registrar en log
      INSERT INTO system_log (tipo, mensaje, metadata)
      VALUES (
        'SEGUIMIENTO_AUTO',
        'Seguimiento por tarea vencida creado via batch',
        jsonb_build_object(
          'tarea_id', v_tarea.tarea_id,
          'seguimiento_id', v_seguimiento_id,
          'fecha_limite', v_tarea.fecha_limite_oficial,
          'dias_vencido', CURRENT_DATE - v_tarea.fecha_limite_oficial
        )
      );

    EXCEPTION WHEN OTHERS THEN
      v_errores := array_append(v_errores, 'Tarea ' || v_tarea.tarea_id || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN QUERY SELECT v_seguimientos_creados, v_tareas_verificadas, v_errores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION verificar_tareas_vencidas() SET search_path = public;

-- ============================================
-- SECCION 6: FUNCION COMBINADA para ejecutar todas las verificaciones
-- ============================================

CREATE OR REPLACE FUNCTION ejecutar_verificaciones_seguimiento()
RETURNS TABLE (
  tipo_verificacion TEXT,
  seguimientos_creados INTEGER,
  registros_verificados INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_result_vencidas RECORD;
  v_result_pagos RECORD;
BEGIN
  -- Verificar tareas vencidas
  SELECT * INTO v_result_vencidas FROM verificar_tareas_vencidas();

  RETURN QUERY SELECT
    'TAREAS_VENCIDAS'::TEXT,
    v_result_vencidas.seguimientos_creados,
    v_result_vencidas.tareas_verificadas,
    v_result_vencidas.errores;

  -- Verificar pagos pendientes
  SELECT * INTO v_result_pagos FROM verificar_pagos_pendientes();

  RETURN QUERY SELECT
    'PAGOS_PENDIENTES'::TEXT,
    v_result_pagos.seguimientos_creados,
    v_result_pagos.tareas_verificadas,
    v_result_pagos.errores;

  -- Registrar ejecucion en log
  INSERT INTO system_log (tipo, mensaje, metadata)
  VALUES (
    'VERIFICACION_SEGUIMIENTO',
    'Ejecucion de verificaciones automaticas de seguimiento',
    jsonb_build_object(
      'fecha_ejecucion', NOW(),
      'vencidas_creadas', v_result_vencidas.seguimientos_creados,
      'pagos_creados', v_result_pagos.seguimientos_creados
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION ejecutar_verificaciones_seguimiento() SET search_path = public;

-- ============================================
-- SECCION 7: COMENTARIOS
-- ============================================

COMMENT ON FUNCTION get_lider_from_tarea IS 'Obtiene el ID del lider del equipo asociado a una tarea';
COMMENT ON FUNCTION get_team_from_tarea IS 'Obtiene el ID del equipo asociado a una tarea';
COMMENT ON FUNCTION fn_crear_seguimiento_tarea_vencida IS 'Trigger que crea seguimiento automatico cuando una tarea se vence';
COMMENT ON FUNCTION fn_crear_seguimiento_pago_pendiente IS 'Trigger que registra cuando una tarea pasa a estado presentado';
COMMENT ON FUNCTION verificar_pagos_pendientes IS 'Funcion batch para verificar tareas presentadas sin pago despues de 3 dias';
COMMENT ON FUNCTION verificar_tareas_vencidas IS 'Funcion batch para verificar tareas vencidas sin seguimiento';
COMMENT ON FUNCTION ejecutar_verificaciones_seguimiento IS 'Funcion principal que ejecuta todas las verificaciones de seguimiento';

COMMENT ON TRIGGER trg_auto_seguimiento_tarea_vencida ON tarea IS 'Trigger que crea seguimiento automatico cuando una tarea se detecta como vencida';
COMMENT ON TRIGGER trg_registrar_estado_presentado ON tarea IS 'Trigger que registra el cambio a estado presentado para seguimiento de pago';

-- ============================================
-- FIN DE MIGRACION T2A.6 - Triggers auto seguimiento
-- ============================================
