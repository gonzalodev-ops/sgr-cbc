-- ============================================
-- MIGRACIÓN: Asignar team_id a contribuyentes
-- ============================================
--
-- Este script asigna el team_id correcto a contribuyentes basándose en:
-- 1. Las tareas que tienen asignadas
-- 2. Los miembros del equipo responsables de esas tareas
--
-- CASOS DE USO:
-- - Migración inicial de datos históricos sin team_id
-- - Mantenimiento periódico (ej: inicio de mes)
-- - Después de importar datos masivos
--
-- Es IDEMPOTENTE: puede ejecutarse múltiples veces sin problemas
-- ============================================

-- ============================================
-- PASO 1: Asignar team_id a contribuyentes que tienen tareas
--         asignadas a miembros de un equipo
-- ============================================
UPDATE contribuyente c
SET team_id = subq.team_id,
    updated_at = NOW()
FROM (
    SELECT DISTINCT ON (t.contribuyente_id)
        t.contribuyente_id,
        tm.team_id
    FROM tarea t
    JOIN team_members tm ON tm.user_id = t.responsable_usuario_id
    WHERE tm.activo = true
    AND t.contribuyente_id IS NOT NULL
    ORDER BY t.contribuyente_id, t.created_at DESC
) subq
WHERE c.contribuyente_id = subq.contribuyente_id
AND (c.team_id IS NULL OR c.team_id IS DISTINCT FROM subq.team_id);

-- Mostrar resultado
DO $$
DECLARE
    v_total_contribuyentes INTEGER;
    v_con_team INTEGER;
    v_sin_team INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_contribuyentes FROM contribuyente WHERE activo = true;
    SELECT COUNT(*) INTO v_con_team FROM contribuyente WHERE activo = true AND team_id IS NOT NULL;
    SELECT COUNT(*) INTO v_sin_team FROM contribuyente WHERE activo = true AND team_id IS NULL;

    RAISE NOTICE '';
    RAISE NOTICE '══════════════════════════════════════════';
    RAISE NOTICE 'RESULTADO DE MIGRACIÓN';
    RAISE NOTICE '══════════════════════════════════════════';
    RAISE NOTICE 'Total contribuyentes activos: %', v_total_contribuyentes;
    RAISE NOTICE 'Con team_id asignado: %', v_con_team;
    RAISE NOTICE 'Sin team_id (pendientes): %', v_sin_team;
    RAISE NOTICE '══════════════════════════════════════════';
END $$;

-- ============================================
-- VERIFICACIÓN: Contribuyentes por equipo
-- ============================================
SELECT
    t.nombre AS equipo,
    COUNT(c.contribuyente_id) AS contribuyentes
FROM teams t
LEFT JOIN contribuyente c ON c.team_id = t.team_id AND c.activo = true
WHERE t.activo = true
GROUP BY t.team_id, t.nombre
ORDER BY t.nombre;

-- ============================================
-- VERIFICACIÓN: Contribuyentes sin equipo asignado
-- que SÍ tienen tareas (necesitan revisión manual)
-- ============================================
SELECT DISTINCT
    c.contribuyente_id,
    c.rfc,
    c.nombre_comercial,
    COUNT(t.tarea_id) AS total_tareas
FROM contribuyente c
JOIN tarea t ON t.contribuyente_id = c.contribuyente_id
WHERE c.team_id IS NULL
AND c.activo = true
GROUP BY c.contribuyente_id, c.rfc, c.nombre_comercial
ORDER BY total_tareas DESC
LIMIT 20;
