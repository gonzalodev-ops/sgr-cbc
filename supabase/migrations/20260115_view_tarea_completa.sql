-- ============================================
-- SGR CBC - FASE 1: VIEW v_tarea_completa
-- Fecha: 2026-01-15
-- Descripción: Vista optimizada para eliminar N+1 queries en tareas
-- Incluye información de cliente, contribuyente, obligación, usuarios y equipo
-- ============================================

-- Eliminar vista existente para idempotencia
DROP VIEW IF EXISTS v_tarea_completa;

-- Crear VIEW con todos los datos relacionados de tarea
-- SECURITY INVOKER: Respeta las políticas RLS del usuario que consulta
CREATE OR REPLACE VIEW v_tarea_completa
WITH (security_invoker = true)
AS
SELECT
    -- Datos de la tarea
    t.tarea_id,
    t.cliente_id,
    t.contribuyente_id,
    t.id_obligacion,
    t.ejercicio,
    t.estado,
    t.periodo_fiscal,
    t.fecha_limite_oficial,
    t.fecha_limite_interna,
    t.riesgo,
    -- Campo computado: en_riesgo como booleano derivado de riesgo='ALTO'
    (t.riesgo = 'ALTO') AS en_riesgo,
    t.prioridad,
    t.responsable_usuario_id,
    t.revisor_usuario_id,
    -- team_id derivado del contribuyente (el equipo se asigna al RFC)
    cont.team_id,
    t.comentarios,
    t.origen,
    t.created_at,
    t.updated_at,

    -- Información del cliente
    c.nombre_comercial AS cliente_nombre,
    c.razon_social_principal AS cliente_razon_social,
    c.segmento AS cliente_segmento,
    c.estado AS cliente_estado,

    -- Información del contribuyente (RFC)
    cont.rfc,
    cont.razon_social,
    cont.tipo_persona,
    cont.nombre_comercial AS contribuyente_nombre_comercial,

    -- Información de la obligación fiscal
    o.nombre_corto AS obligacion_nombre,
    o.descripcion AS obligacion_descripcion,
    o.periodicidad,
    o.nivel AS obligacion_nivel,
    o.impuesto,
    o.es_informativa,

    -- Usuario responsable
    u.nombre AS responsable_nombre,
    u.email AS responsable_email,
    u.rol_global AS responsable_rol,

    -- Usuario revisor
    rev.nombre AS revisor_nombre,
    rev.email AS revisor_email,

    -- Información del equipo (derivado del contribuyente)
    tm.nombre AS equipo_nombre

FROM tarea t
LEFT JOIN cliente c ON t.cliente_id = c.cliente_id
LEFT JOIN contribuyente cont ON t.contribuyente_id = cont.contribuyente_id
LEFT JOIN obligacion_fiscal o ON t.id_obligacion = o.id_obligacion
LEFT JOIN users u ON t.responsable_usuario_id = u.user_id
LEFT JOIN users rev ON t.revisor_usuario_id = rev.user_id
LEFT JOIN teams tm ON cont.team_id = tm.team_id;

-- Comentarios descriptivos
COMMENT ON VIEW v_tarea_completa IS
  'Vista completa de tareas con JOINs pre-calculados para eliminar N+1 queries.
   Incluye: cliente, contribuyente (RFC), obligación fiscal, usuarios responsable/revisor y equipo.
   SECURITY INVOKER activo para respetar RLS.';

COMMENT ON COLUMN v_tarea_completa.en_riesgo IS 'Campo computado: TRUE si riesgo = ALTO';
COMMENT ON COLUMN v_tarea_completa.team_id IS 'team_id derivado del contribuyente (RFC), no de la tarea';
COMMENT ON COLUMN v_tarea_completa.equipo_nombre IS 'Nombre del equipo asignado al RFC';

-- ============================================
-- FIN DE MIGRACIÓN: VIEW v_tarea_completa
-- ============================================
