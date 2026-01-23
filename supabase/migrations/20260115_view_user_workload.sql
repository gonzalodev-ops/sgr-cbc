-- ============================================
-- SGR CBC - FASE 1: VIEW v_user_workload
-- Fecha: 2026-01-15
-- Descripción: Vista de carga de trabajo por usuario para decisiones de reasignación
-- Muestra métricas de tareas pendientes, en riesgo y carga estimada
-- ============================================

-- Eliminar vista existente para idempotencia
DROP VIEW IF EXISTS v_user_workload;

-- Crear VIEW con métricas de carga de trabajo por usuario
-- SECURITY INVOKER: Respeta las políticas RLS del usuario que consulta
CREATE OR REPLACE VIEW v_user_workload
WITH (security_invoker = true)
AS
SELECT
    -- Datos del usuario
    u.user_id,
    u.nombre,
    u.email,
    u.rol_global,
    u.activo,
    u.created_at,

    -- Equipos a los que pertenece (puede ser múltiples)
    (
        SELECT array_agg(DISTINCT tm.team_id)
        FROM team_members tm
        WHERE tm.user_id = u.user_id
        AND tm.activo = true
    ) AS teams,

    -- Nombres de equipos
    (
        SELECT array_agg(DISTINCT t.nombre)
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.team_id
        WHERE tm.user_id = u.user_id
        AND tm.activo = true
    ) AS equipos_nombres,

    -- Roles en equipos
    (
        SELECT array_agg(DISTINCT tm.rol_en_equipo)
        FROM team_members tm
        WHERE tm.user_id = u.user_id
        AND tm.activo = true
    ) AS roles_en_equipos,

    -- Conteo de tareas pendientes (no cerradas, rechazadas, pagadas ni vencidas)
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.estado NOT IN ('cerrado', 'rechazado', 'pagado')
    ) AS tareas_pendientes,

    -- Conteo de tareas en curso
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.estado = 'en_curso'
    ) AS tareas_en_curso,

    -- Conteo de tareas en riesgo alto
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.riesgo = 'ALTO'
        AND t.estado NOT IN ('cerrado', 'rechazado', 'pagado')
    ) AS tareas_en_riesgo,

    -- Conteo de tareas vencidas (fecha límite pasada)
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.fecha_limite_oficial < CURRENT_DATE
        AND t.estado NOT IN ('cerrado', 'rechazado', 'pagado', 'presentado')
    ) AS tareas_vencidas,

    -- Conteo de tareas próximas a vencer (próximos 3 días)
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.fecha_limite_oficial BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
        AND t.estado NOT IN ('cerrado', 'rechazado', 'pagado', 'presentado')
    ) AS tareas_proximas_vencer,

    -- Puntos de carga estimados
    -- Fórmula: suma de prioridades de tareas activas (prioridad default = 50)
    -- Esto sirve como proxy de carga mientras no exista puntos_tarea
    (
        SELECT COALESCE(SUM(t.prioridad), 0)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.estado NOT IN ('cerrado', 'rechazado', 'pagado')
    ) AS puntos_carga,

    -- Conteo de tareas como revisor
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.revisor_usuario_id = u.user_id
        AND t.estado = 'en_validacion'
    ) AS tareas_como_revisor,

    -- Conteo de tareas bloqueadas por cliente
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.estado = 'bloqueado_cliente'
    ) AS tareas_bloqueadas_cliente

FROM users u
WHERE u.activo = true;

-- Comentarios descriptivos
COMMENT ON VIEW v_user_workload IS
  'Vista de carga de trabajo por usuario para decisiones de reasignación.
   Incluye: conteos de tareas (pendientes, en riesgo, vencidas), equipos, puntos de carga.
   Solo muestra usuarios activos. SECURITY INVOKER activo para respetar RLS.';

COMMENT ON COLUMN v_user_workload.teams IS 'Array de team_ids a los que pertenece el usuario';
COMMENT ON COLUMN v_user_workload.tareas_pendientes IS 'Tareas activas asignadas como responsable';
COMMENT ON COLUMN v_user_workload.tareas_en_riesgo IS 'Tareas con riesgo=ALTO no cerradas';
COMMENT ON COLUMN v_user_workload.puntos_carga IS 'Suma de prioridades de tareas activas (proxy de carga)';
COMMENT ON COLUMN v_user_workload.tareas_proximas_vencer IS 'Tareas con fecha límite en los próximos 3 días';

-- ============================================
-- FIN DE MIGRACIÓN: VIEW v_user_workload
-- ============================================
