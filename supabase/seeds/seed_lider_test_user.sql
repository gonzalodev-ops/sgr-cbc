-- ============================================
-- SEED: Usuario LIDER de prueba
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- PASO 1: Verificar/Obtener el user_id del LIDER
DO $$
DECLARE
    v_lider_user_id UUID;
    v_team_id UUID;
    v_contribuyente_id UUID;
    v_cliente_id UUID;
    v_obligacion_id TEXT;  -- TEXT, no UUID
BEGIN
    -- Obtener el user_id del LIDER
    SELECT user_id INTO v_lider_user_id
    FROM users
    WHERE email = 'lider.prueba@sgrcbc.test';

    IF v_lider_user_id IS NULL THEN
        RAISE NOTICE 'Usuario lider.prueba@sgrcbc.test no encontrado. Créalo primero en Auth.';
        RETURN;
    END IF;

    RAISE NOTICE 'LIDER user_id: %', v_lider_user_id;

    -- PASO 2: Asegurar que el usuario tiene rol LIDER
    UPDATE users
    SET rol_global = 'LIDER'
    WHERE user_id = v_lider_user_id;

    -- PASO 3: Obtener o crear el equipo ISIS
    SELECT team_id INTO v_team_id
    FROM teams
    WHERE nombre ILIKE '%ISIS%' OR nombre ILIKE '%Isis%'
    LIMIT 1;

    IF v_team_id IS NULL THEN
        INSERT INTO teams (nombre, descripcion, activo)
        VALUES ('Equipo ISIS', 'Equipo de pruebas para E2E', true)
        RETURNING team_id INTO v_team_id;
        RAISE NOTICE 'Equipo ISIS creado: %', v_team_id;
    ELSE
        RAISE NOTICE 'Equipo ISIS encontrado: %', v_team_id;
    END IF;

    -- PASO 4: Asignar LIDER al equipo con rol LIDER
    INSERT INTO team_members (team_id, user_id, rol_en_equipo, activo)
    VALUES (v_team_id, v_lider_user_id, 'LIDER', true)
    ON CONFLICT (team_id, user_id)
    DO UPDATE SET rol_en_equipo = 'LIDER', activo = true;

    RAISE NOTICE 'LIDER asignado al equipo ISIS como LIDER';

    -- PASO 5: Asegurar que hay un contribuyente en el equipo
    SELECT contribuyente_id INTO v_contribuyente_id
    FROM contribuyente
    WHERE team_id = v_team_id
    LIMIT 1;

    IF v_contribuyente_id IS NULL THEN
        INSERT INTO contribuyente (rfc, razon_social, nombre_comercial, tipo_persona, team_id, activo)
        VALUES ('TEST123456ABC', 'Empresa de Prueba SA de CV', 'Empresa Prueba', 'PM', v_team_id, true)
        RETURNING contribuyente_id INTO v_contribuyente_id;
        RAISE NOTICE 'Contribuyente de prueba creado: %', v_contribuyente_id;
    ELSE
        RAISE NOTICE 'Contribuyente encontrado: %', v_contribuyente_id;
    END IF;

    -- PASO 6: Asegurar que hay un cliente vinculado al contribuyente
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

        RAISE NOTICE 'Cliente de prueba creado y vinculado: %', v_cliente_id;
    ELSE
        RAISE NOTICE 'Cliente encontrado: %', v_cliente_id;
    END IF;

    -- PASO 7: Obtener una obligación fiscal existente
    SELECT id_obligacion INTO v_obligacion_id
    FROM obligacion_fiscal
    WHERE activo = true
    LIMIT 1;

    IF v_obligacion_id IS NULL THEN
        -- Crear obligación con todos los campos requeridos
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
        RAISE NOTICE 'Obligación fiscal creada: %', v_obligacion_id;
    ELSE
        RAISE NOTICE 'Obligación fiscal encontrada: %', v_obligacion_id;
    END IF;

    -- PASO 8: Crear tareas de prueba para el equipo del LIDER
    -- Nota: prioridad es INTEGER, ejercicio es INTEGER requerido

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

    -- ============================================
    -- TAREAS PARA ALERTAS
    -- ============================================

    -- Tarea 4: VENCIDA (2 días vencida - para Alertas)
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

    RAISE NOTICE '✅ Seed completado para LIDER';
    RAISE NOTICE 'Usuario: lider.prueba@sgrcbc.test';
    RAISE NOTICE 'Equipo: ISIS (team_id: %)', v_team_id;
    RAISE NOTICE 'Cliente: Cliente Prueba LIDER';
    RAISE NOTICE 'Obligación: %', v_obligacion_id;
    RAISE NOTICE 'Tareas creadas: 6';
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver el usuario LIDER
SELECT user_id, email, nombre, rol_global
FROM users
WHERE email = 'lider.prueba@sgrcbc.test';

-- Ver membresía del equipo
SELECT tm.*, t.nombre as equipo_nombre
FROM team_members tm
JOIN teams t ON t.team_id = tm.team_id
JOIN users u ON u.user_id = tm.user_id
WHERE u.email = 'lider.prueba@sgrcbc.test';

-- Ver tareas creadas
SELECT
    t.tarea_id,
    t.estado,
    t.periodo_fiscal,
    t.fecha_limite_oficial,
    t.prioridad,
    c.nombre_comercial as cliente
FROM tarea t
JOIN cliente c ON c.cliente_id = t.cliente_id
JOIN contribuyente co ON co.contribuyente_id = t.contribuyente_id
JOIN team_members tm ON tm.team_id = co.team_id
JOIN users u ON u.user_id = tm.user_id
WHERE u.email = 'lider.prueba@sgrcbc.test'
AND tm.rol_en_equipo = 'LIDER'
ORDER BY t.fecha_limite_oficial;
