-- ============================================
-- SEED: Usuario LIDER de prueba
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- PASO 1: Verificar/Obtener el user_id del LIDER
-- Primero necesitamos saber el user_id del usuario lider.prueba@sgrcbc.test
DO $$
DECLARE
    v_lider_user_id UUID;
    v_team_id UUID;
    v_contribuyente_id UUID;
    v_cliente_id UUID;
    v_obligacion_id UUID;
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
        -- Crear el equipo si no existe
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
        -- Crear un contribuyente de prueba
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
        -- Crear un cliente de prueba
        INSERT INTO cliente (nombre_comercial, estado)
        VALUES ('Cliente Prueba LIDER', 'ACTIVO')
        RETURNING cliente_id INTO v_cliente_id;

        -- Vincular cliente con contribuyente
        INSERT INTO cliente_contribuyente (cliente_id, contribuyente_id)
        VALUES (v_cliente_id, v_contribuyente_id)
        ON CONFLICT DO NOTHING;

        RAISE NOTICE 'Cliente de prueba creado y vinculado: %', v_cliente_id;
    ELSE
        RAISE NOTICE 'Cliente encontrado: %', v_cliente_id;
    END IF;

    -- PASO 7: Obtener una obligación fiscal para crear tareas
    SELECT id_obligacion INTO v_obligacion_id
    FROM obligacion_fiscal
    WHERE activo = true
    LIMIT 1;

    IF v_obligacion_id IS NULL THEN
        RAISE NOTICE 'No hay obligaciones fiscales. Creando una de prueba...';
        INSERT INTO obligacion_fiscal (nombre_corto, nombre_largo, periodicidad, activo)
        VALUES ('ISR-PRUEBA', 'Impuesto Sobre la Renta - Prueba', 'MENSUAL', true)
        RETURNING id_obligacion INTO v_obligacion_id;
    END IF;

    -- PASO 8: Crear tareas de prueba para el equipo del LIDER
    -- Tarea 1: Pendiente
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        estado, periodo_fiscal, fecha_limite_oficial,
        responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        'pendiente', '2026-01', CURRENT_DATE + INTERVAL '7 days',
        v_lider_user_id, 'MEDIA'
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE cliente_id = v_cliente_id
        AND periodo_fiscal = '2026-01'
        AND id_obligacion = v_obligacion_id
    );

    -- Tarea 2: En curso
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        estado, periodo_fiscal, fecha_limite_oficial,
        responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        'en_curso', '2026-02', CURRENT_DATE + INTERVAL '14 days',
        v_lider_user_id, 'ALTA'
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE cliente_id = v_cliente_id
        AND periodo_fiscal = '2026-02'
        AND id_obligacion = v_obligacion_id
    );

    -- Tarea 3: En validación (para que aparezca en Validaciones)
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        estado, periodo_fiscal, fecha_limite_oficial,
        responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        'en_validacion', '2026-03', CURRENT_DATE + INTERVAL '5 days',
        v_lider_user_id, 'ALTA'
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE cliente_id = v_cliente_id
        AND periodo_fiscal = '2026-03'
        AND id_obligacion = v_obligacion_id
    );

    -- ============================================
    -- TAREAS PARA ALERTAS
    -- ============================================

    -- Tarea 4: VENCIDA (para que aparezca en Alertas como vencida)
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        estado, periodo_fiscal, fecha_limite_oficial,
        responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        'pendiente', '2025-12', CURRENT_DATE - INTERVAL '5 days',
        v_lider_user_id, 'ALTA'
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE cliente_id = v_cliente_id
        AND periodo_fiscal = '2025-12'
        AND id_obligacion = v_obligacion_id
    );

    -- Tarea 5: POR VENCER HOY (para que aparezca en Alertas)
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        estado, periodo_fiscal, fecha_limite_oficial,
        responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        'en_curso', '2026-01-HOY', CURRENT_DATE,
        v_lider_user_id, 'ALTA'
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE cliente_id = v_cliente_id
        AND periodo_fiscal = '2026-01-HOY'
        AND id_obligacion = v_obligacion_id
    );

    -- Tarea 6: POR VENCER EN 2 DIAS (para que aparezca en Alertas)
    INSERT INTO tarea (
        cliente_id, contribuyente_id, id_obligacion,
        estado, periodo_fiscal, fecha_limite_oficial,
        responsable_usuario_id, prioridad
    )
    SELECT
        v_cliente_id, v_contribuyente_id, v_obligacion_id,
        'pendiente', '2026-01-PROX', CURRENT_DATE + INTERVAL '2 days',
        v_lider_user_id, 'MEDIA'
    WHERE NOT EXISTS (
        SELECT 1 FROM tarea
        WHERE cliente_id = v_cliente_id
        AND periodo_fiscal = '2026-01-PROX'
        AND id_obligacion = v_obligacion_id
    );

    RAISE NOTICE '✅ Seed completado para LIDER';
    RAISE NOTICE 'Usuario: lider.prueba@sgrcbc.test';
    RAISE NOTICE 'Equipo: ISIS (team_id: %)', v_team_id;
    RAISE NOTICE 'Cliente: Cliente Prueba LIDER';
    RAISE NOTICE 'Tareas creadas: 6 (pendiente, en_curso, en_validacion, vencida, por_vencer_hoy, por_vencer_2dias)';
END $$;

-- ============================================
-- VERIFICACIÓN: Ejecuta estas consultas para verificar
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

-- Ver tareas del equipo del LIDER
SELECT t.tarea_id, t.estado, t.periodo_fiscal, c.nombre_comercial as cliente
FROM tarea t
JOIN cliente c ON c.cliente_id = t.cliente_id
JOIN contribuyente co ON co.contribuyente_id = t.contribuyente_id
JOIN team_members tm ON tm.team_id = co.team_id
JOIN users u ON u.user_id = tm.user_id
WHERE u.email = 'lider.prueba@sgrcbc.test'
AND tm.rol_en_equipo = 'LIDER';
