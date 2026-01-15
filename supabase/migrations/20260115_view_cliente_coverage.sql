-- ============================================
-- SGR CBC - FASE 1: VIEW v_cliente_coverage
-- Fecha: 2026-01-15
-- Descripción: Vista de cobertura de clientes con métricas agregadas
-- Proporciona conteos de servicios, tareas activas, vencidas y contribuyentes
-- ============================================

-- Eliminar vista existente para idempotencia
DROP VIEW IF EXISTS v_cliente_coverage;

-- Crear VIEW con métricas de cobertura por cliente
-- SECURITY INVOKER: Respeta las políticas RLS del usuario que consulta
CREATE OR REPLACE VIEW v_cliente_coverage
WITH (security_invoker = true)
AS
SELECT
    -- Datos del cliente
    c.cliente_id,
    c.nombre_comercial,
    c.razon_social_principal,
    c.segmento,
    c.estado,
    -- Campo computado: activo como booleano derivado de estado='ACTIVO'
    (c.estado = 'ACTIVO') AS activo,
    c.contacto_nombre,
    c.contacto_email,
    c.created_at,
    c.updated_at,

    -- Equipo(s) asociado(s) - derivado de los contribuyentes del cliente
    -- Un cliente puede tener contribuyentes en diferentes equipos
    (
        SELECT array_agg(DISTINCT cont.team_id)
        FROM cliente_contribuyente cc
        JOIN contribuyente cont ON cc.contribuyente_id = cont.contribuyente_id
        WHERE cc.cliente_id = c.cliente_id
        AND cc.activo = true
        AND cont.team_id IS NOT NULL
    ) AS teams_ids,

    -- Nombre del equipo principal (primer equipo encontrado)
    (
        SELECT t.nombre
        FROM cliente_contribuyente cc
        JOIN contribuyente cont ON cc.contribuyente_id = cont.contribuyente_id
        JOIN teams t ON cont.team_id = t.team_id
        WHERE cc.cliente_id = c.cliente_id
        AND cc.activo = true
        LIMIT 1
    ) AS equipo_nombre,

    -- Conteo de servicios contratados
    (
        SELECT COUNT(*)
        FROM cliente_servicio cs
        WHERE cs.cliente_id = c.cliente_id
        AND cs.activo = true
    ) AS servicios_count,

    -- Conteo de tareas activas (no completadas ni canceladas)
    (
        SELECT COUNT(*)
        FROM tarea ta
        WHERE ta.cliente_id = c.cliente_id
        AND ta.estado NOT IN ('cerrado', 'rechazado', 'pagado')
    ) AS tareas_activas,

    -- Conteo de tareas vencidas (fecha límite pasada y no cerradas)
    (
        SELECT COUNT(*)
        FROM tarea ta
        WHERE ta.cliente_id = c.cliente_id
        AND ta.fecha_limite_oficial < CURRENT_DATE
        AND ta.estado NOT IN ('cerrado', 'rechazado', 'pagado', 'presentado')
    ) AS tareas_vencidas,

    -- Conteo de tareas en riesgo alto
    (
        SELECT COUNT(*)
        FROM tarea ta
        WHERE ta.cliente_id = c.cliente_id
        AND ta.riesgo = 'ALTO'
        AND ta.estado NOT IN ('cerrado', 'rechazado', 'pagado')
    ) AS tareas_en_riesgo,

    -- Conteo de contribuyentes (RFCs) asociados
    (
        SELECT COUNT(*)
        FROM cliente_contribuyente cc
        WHERE cc.cliente_id = c.cliente_id
        AND cc.activo = true
    ) AS contribuyentes_count,

    -- Conteo de tareas pendientes de evidencia
    (
        SELECT COUNT(*)
        FROM tarea ta
        WHERE ta.cliente_id = c.cliente_id
        AND ta.estado = 'pendiente_evidencia'
    ) AS tareas_pendiente_evidencia,

    -- Conteo de tareas bloqueadas por cliente
    (
        SELECT COUNT(*)
        FROM tarea ta
        WHERE ta.cliente_id = c.cliente_id
        AND ta.estado = 'bloqueado_cliente'
    ) AS tareas_bloqueadas

FROM cliente c;

-- Comentarios descriptivos
COMMENT ON VIEW v_cliente_coverage IS
  'Vista de cobertura de clientes con métricas agregadas pre-calculadas.
   Incluye: conteos de servicios, tareas (activas, vencidas, en riesgo), contribuyentes.
   SECURITY INVOKER activo para respetar RLS.';

COMMENT ON COLUMN v_cliente_coverage.activo IS 'Campo computado: TRUE si estado = ACTIVO';
COMMENT ON COLUMN v_cliente_coverage.teams_ids IS 'Array de team_ids asociados vía contribuyentes';
COMMENT ON COLUMN v_cliente_coverage.equipo_nombre IS 'Nombre del equipo principal del cliente';
COMMENT ON COLUMN v_cliente_coverage.tareas_activas IS 'Tareas no cerradas/rechazadas/pagadas';
COMMENT ON COLUMN v_cliente_coverage.tareas_vencidas IS 'Tareas con fecha límite pasada y no presentadas';

-- ============================================
-- FIN DE MIGRACIÓN: VIEW v_cliente_coverage
-- ============================================
