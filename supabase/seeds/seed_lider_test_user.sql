-- ============================================
-- SEED: Usuario LIDER de prueba
-- Ejecutar en Supabase SQL Editor
-- ============================================

DO $$
DECLARE
    v_lider_user_id UUID;
    v_team_id UUID;
    v_contribuyente_id UUID;
    v_cliente_id UUID;
    v_obligacion_id TEXT;
    v_updated_count INTEGER;
BEGIN
    -- ============================================
    -- PASO 1: Obtener el user_id del LIDER
    -- ============================================
    SELECT user_id INTO v_lider_user_id
    FROM users
    WHERE email = 'lider.prueba@sgrcbc.test';

    IF v_lider_user_id IS NULL THEN
        RAISE NOTICE '❌ Usuario lider.prueba@sgrcbc.test no encontrado. Créalo primero en Auth.';
        RETURN;
    END IF;

    RAISE NOTICE '✓ LIDER user_id: %', v_lider_user_id;

    -- ============================================
    -- PASO 2: Asegurar que el usuario tiene rol LIDER
    -- ============================================
    UPDATE users
    SET rol_global = 'LIDER'
    WHERE user_id = v_lider_user_id;

    -- ============================================
    -- PASO 3: Obtener o crear el equipo ISIS
    -- ============================================
    SELECT team_id INTO v_team_id
    FROM teams
    WHERE nombre ILIKE '%ISIS%' OR nombre ILIKE '%Isis%'
    LIMIT 1;

    IF v_team_id IS NULL THEN
        INSERT INTO teams (nombre, descripcion, activo)
        VALUES ('Equipo ISIS', 'Equipo de pruebas para E2E', true)
        RETURNING team_id INTO v_team_id;
        RAISE NOTICE '✓ Equipo ISIS creado: %', v_team_id;
    ELSE
        RAISE NOTICE '✓ Equipo ISIS encontrado: %', v_team_id;
    END IF;

    -- ============================================
    -- PASO 4: Asignar LIDER al equipo
    -- ============================================
    INSERT INTO team_members (team_id, user_id, rol_en_equipo, activo)
    VALUES (v_team_id, v_lider_user_id, 'LIDER', true)
    ON CONFLICT (team_id, user_id)
    DO UPDATE SET rol_en_equipo = 'LIDER', activo = true;

    RAISE NOTICE '✓ LIDER asignado al equipo ISIS';

    -- ============================================
    -- PASO 5: CRÍTICO - Actualizar team_id en contribuyentes existentes
    -- Esto asocia los contribuyentes con el equipo basándose en
    -- las tareas asignadas a los miembros del equipo
    -- ============================================
    UPDATE contribuyente c
    SET team_id = v_team_id
    WHERE c.contribuyente_id IN (
        -- Contribuyentes que tienen tareas asignadas a miembros del equipo
        SELECT DISTINCT t.contribuyente_id
        FROM tarea t
        JOIN team_members tm ON tm.user_id = t.responsable_usuario_id
        WHERE tm.team_id = v_team_id
        AND tm.activo = true
    )
    AND (c.team_id IS NULL OR c.team_id != v_team_id);

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RAISE NOTICE '✓ Contribuyentes actualizados con team_id: %', v_updated_count;

    -- ============================================
    -- PASO 6: Buscar o crear contribuyente del equipo
    -- ============================================
    SELECT contribuyente_id INTO v_contribuyente_id
    FROM contribuyente
    WHERE team_id = v_team_id
    LIMIT 1;

    IF v_contribuyente_id IS NULL THEN
        -- No hay contribuyentes con este team_id, crear uno de prueba
        INSERT INTO contribuyente (rfc, razon_social, nombre_comercial, tipo_persona, team_id, activo)
        VALUES ('TEST123456ABC', 'Empresa de Prueba SA de CV', 'Empresa Prueba', 'PM', v_team_id, true)
        ON CONFLICT (rfc) DO UPDATE SET team_id = v_team_id
        RETURNING contribuyente_id INTO v_contribuyente_id;

        -- Si RETURNING no funcionó (por el DO UPDATE), obtenerlo
        IF v_contribuyente_id IS NULL THEN
            SELECT contribuyente_id INTO v_contribuyente_id
            FROM contribuyente
            WHERE rfc = 'TEST123456ABC';
        END IF;

        RAISE NOTICE '✓ Contribuyente de prueba creado/actualizado: %', v_contribuyente_id;
    ELSE
        RAISE NOTICE '✓ Contribuyente del equipo encontrado: %', v_contribuyente_id;
    END IF;

    -- ============================================
    -- PASO 7: Asegurar cliente vinculado
    -- ============================================
    SELECT c.cliente_id INTO v_cliente_id
    FROM cliente c
    JOIN cliente_contribuyente cc ON cc.cliente_id = c.cliente_id
    WHERE cc.contribuyente_id = v_contribuyente_id
    LIMIT 1;

    IF v_cliente_id IS NULL THEN
        INSERT INTO cliente (nombre_comercial, estado)
        VALUES ('Cliente Prueba LIDER', 'ACTIVO')
        RETURNING cliente_id INTO v_cliente_id;

        INSERT INTO cliente_contribuyente (cliente_id, contribuyente_id)
        VALUES (v_cliente_id, v_contribuyente_id)
        ON CONFLICT DO NOTHING;

        RAISE NOTICE '✓ Cliente de prueba creado: %', v_cliente_id;
    ELSE
        RAISE NOTICE '✓ Cliente encontrado: %', v_cliente_id;
    END IF;

    -- ============================================
    -- PASO 8: Obtener obligación fiscal
    -- ============================================
    SELECT id_obligacion INTO v_obligacion_id
    FROM obligacion_fiscal
    WHERE activo = true
    LIMIT 1;

    IF v_obligacion_id IS NULL THEN
        INSERT INTO obligacion_fiscal (
            id_obligacion, nombre_corto, descripcion,
            nivel, impuesto, periodicidad, activo
        )
        VALUES (
            'OBL-TEST-LIDER', 'ISR Prueba', 'Obligación de prueba para E2E',
            'FEDERAL', 'ISR', 'MENSUAL', true
        )
        ON CONFLICT (id_obligacion) DO NOTHING;
        v_obligacion_id := 'OBL-TEST-LIDER';
        RAISE NOTICE '✓ Obligación fiscal creada: %', v_obligacion_id;
    ELSE
        RAISE NOTICE '✓ Obligación fiscal encontrada: %', v_obligacion_id;
    END IF;

    -- ============================================
    -- PASO 9: Crear tareas de prueba
    -- ============================================

    -- Tarea 1: No iniciado (vence en 7 días)
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        ejercicio, periodo_fiscal, fecha_limite_oficial,
        estado, responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        2026, '2026-01', CURRENT_DATE + INTERVAL '7 days',
        'no_iniciado', v_lider_user_id, 50
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE contribuyente_id = v_contribuyente_id
        AND periodo_fiscal = '2026-01'
        AND id_obligacion = v_obligacion_id
    );

    -- Tarea 2: En curso (vence en 14 días)
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        ejercicio, periodo_fiscal, fecha_limite_oficial,
        estado, responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        2026, '2026-02', CURRENT_DATE + INTERVAL '14 days',
        'en_curso', v_lider_user_id, 70
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE contribuyente_id = v_contribuyente_id
        AND periodo_fiscal = '2026-02'
        AND id_obligacion = v_obligacion_id
    );

    -- Tarea 3: En revisión (para Validaciones)
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        ejercicio, periodo_fiscal, fecha_limite_oficial,
        estado, responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        2026, '2026-03', CURRENT_DATE + INTERVAL '5 days',
        'revision', v_lider_user_id, 80
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE contribuyente_id = v_contribuyente_id
        AND periodo_fiscal = '2026-03'
        AND id_obligacion = v_obligacion_id
    );

    -- Tarea 4: VENCIDA (2 días - para Alertas)
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        ejercicio, periodo_fiscal, fecha_limite_oficial,
        estado, responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        2025, '2025-12', CURRENT_DATE - INTERVAL '2 days',
        'no_iniciado', v_lider_user_id, 90
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE contribuyente_id = v_contribuyente_id
        AND periodo_fiscal = '2025-12'
        AND id_obligacion = v_obligacion_id
    );

    -- Tarea 5: VENCE HOY (para Alertas)
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        ejercicio, periodo_fiscal, fecha_limite_oficial,
        estado, responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        2026, '2026-01-HOY', CURRENT_DATE,
        'en_curso', v_lider_user_id, 100
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE contribuyente_id = v_contribuyente_id
        AND periodo_fiscal = '2026-01-HOY'
        AND id_obligacion = v_obligacion_id
    );

    -- Tarea 6: VENCE EN 2 DÍAS (para Alertas)
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        ejercicio, periodo_fiscal, fecha_limite_oficial,
        estado, responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        2026, '2026-01-PROX', CURRENT_DATE + INTERVAL '2 days',
        'no_iniciado', v_lider_user_id, 85
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE contribuyente_id = v_contribuyente_id
        AND periodo_fiscal = '2026-01-PROX'
        AND id_obligacion = v_obligacion_id
    );

    RAISE NOTICE '';
    RAISE NOTICE '══════════════════════════════════════════';
    RAISE NOTICE '✅ SEED COMPLETADO';
    RAISE NOTICE '══════════════════════════════════════════';
    RAISE NOTICE 'Usuario: lider.prueba@sgrcbc.test';
    RAISE NOTICE 'Equipo: ISIS (team_id: %)', v_team_id;
    RAISE NOTICE 'Contribuyentes actualizados: %', v_updated_count;
    RAISE NOTICE 'Tareas de prueba: 6';
    RAISE NOTICE '══════════════════════════════════════════';
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver contribuyentes del equipo
SELECT
    c.contribuyente_id,
    c.rfc,
    c.nombre_comercial,
    c.team_id,
    t.nombre as equipo
FROM contribuyente c
LEFT JOIN teams t ON t.team_id = c.team_id
WHERE c.team_id IN (
    SELECT team_id FROM teams WHERE nombre ILIKE '%ISIS%'
);

-- Ver tareas del equipo (filtradas por contribuyente.team_id)
SELECT
    ta.tarea_id,
    ta.estado,
    ta.periodo_fiscal,
    ta.fecha_limite_oficial,
    cl.nombre_comercial as cliente,
    co.rfc as contribuyente,
    u.nombre as responsable
FROM tarea ta
JOIN cliente cl ON cl.cliente_id = ta.cliente_id
JOIN contribuyente co ON co.contribuyente_id = ta.contribuyente_id
LEFT JOIN users u ON u.user_id = ta.responsable_usuario_id
WHERE co.team_id IN (
    SELECT team_id FROM teams WHERE nombre ILIKE '%ISIS%'
)
ORDER BY ta.fecha_limite_oficial;
