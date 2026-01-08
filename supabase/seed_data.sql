-- ============================================
-- SGR CBC - Datos Seed para Piloto
-- Ejecutar después de schema_v2_updates.sql
-- ============================================

-- ==========================================
-- 1. USUARIOS (4 tribus × ~3 personas = 12)
-- ==========================================
INSERT INTO users (user_id, email, nombre, rol_global) VALUES
  -- Tribu Isidora
  ('11111111-1111-1111-1111-111111111101', 'isidora.lider@cbc.mx', 'Isidora Méndez', 'LIDER'),
  ('11111111-1111-1111-1111-111111111102', 'diego.garcia@cbc.mx', 'Diego García', 'COLABORADOR'),
  ('11111111-1111-1111-1111-111111111103', 'ulises.romo@cbc.mx', 'Ulises Romo', 'COLABORADOR'),
  -- Tribu Noelia
  ('22222222-2222-2222-2222-222222222201', 'noelia.lider@cbc.mx', 'Noelia Reyes', 'LIDER'),
  ('22222222-2222-2222-2222-222222222202', 'hannia.lopez@cbc.mx', 'Hannia López', 'COLABORADOR'),
  ('22222222-2222-2222-2222-222222222203', 'maria.sanchez@cbc.mx', 'María Sánchez', 'COLABORADOR'),
  -- Tribu Vianey
  ('33333333-3333-3333-3333-333333333301', 'vianey.lider@cbc.mx', 'Vianey Torres', 'LIDER'),
  ('33333333-3333-3333-3333-333333333302', 'karla.mendez@cbc.mx', 'Karla Méndez', 'COLABORADOR'),
  ('33333333-3333-3333-3333-333333333303', 'roberto.sanchez@cbc.mx', 'Roberto Sánchez', 'COLABORADOR'),
  -- Tribu Querétaro
  ('44444444-4444-4444-4444-444444444401', 'qro.lider@cbc.mx', 'Patricia Ruiz', 'LIDER'),
  ('44444444-4444-4444-4444-444444444402', 'ana.torres@cbc.mx', 'Ana Torres', 'COLABORADOR'),
  ('44444444-4444-4444-4444-444444444403', 'pedro.ramirez@cbc.mx', 'Pedro Ramírez', 'COLABORADOR'),
  -- Auditor
  ('55555555-5555-5555-5555-555555555501', 'auditor@cbc.mx', 'Carlos Auditor', 'AUDITOR'),
  -- Admin/Socio
  ('66666666-6666-6666-6666-666666666601', 'socio@cbc.mx', 'Gonzalo León', 'SOCIO')
ON CONFLICT (user_id) DO NOTHING;

-- ==========================================
-- 2. EQUIPOS (actualizar IDs de las 4 tribus)
-- ==========================================
-- Primero obtenemos los IDs de los equipos existentes y los actualizamos
UPDATE teams SET team_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE nombre = 'Isidora';
UPDATE teams SET team_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' WHERE nombre = 'Noelia';
UPDATE teams SET team_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' WHERE nombre = 'Vianey';
UPDATE teams SET team_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' WHERE nombre = 'Querétaro';

-- ==========================================
-- 3. MIEMBROS DE EQUIPO
-- ==========================================
INSERT INTO team_members (team_id, user_id, rol_en_equipo, es_suplente) VALUES
  -- Tribu Isidora
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111101', 'LIDER', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111102', 'AUXILIAR_C', false),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111103', 'AUXILIAR_B', false),
  -- Tribu Noelia
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222201', 'LIDER', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222202', 'AUXILIAR_A', false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222203', 'AUXILIAR_C', false),
  -- Tribu Vianey
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333301', 'LIDER', false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333302', 'AUXILIAR_C', false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333303', 'AUXILIAR_B', false),
  -- Tribu Querétaro
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444401', 'LIDER', false),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444402', 'AUXILIAR_A', false),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444403', 'AUXILIAR_B', false)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. CLIENTES (3 por tribu = 12 total)
-- ==========================================
INSERT INTO cliente (cliente_id, razon_social, nombre_comercial) VALUES
  -- Clientes Tribu Isidora
  ('c1111111-1111-1111-1111-111111111111', 'Abarrotes Lupita SA de CV', 'Abarrotes Lupita'),
  ('c1111111-1111-1111-1111-111111111112', 'Ferretería El Tornillo SA de CV', 'Ferretería El Tornillo'),
  ('c1111111-1111-1111-1111-111111111113', 'Papelería Central SA de CV', 'Papelería Central'),
  -- Clientes Tribu Noelia
  ('c2222222-2222-2222-2222-222222222221', 'Consultorio Dr. Simi SC', 'Consultorio Dr. Simi'),
  ('c2222222-2222-2222-2222-222222222222', 'Restaurante La Casona SA de CV', 'Restaurante La Casona'),
  ('c2222222-2222-2222-2222-222222222223', 'Boutique Elegancia SA de CV', 'Boutique Elegancia'),
  -- Clientes Tribu Vianey
  ('c3333333-3333-3333-3333-333333333331', 'Tienda La Esquina', 'Tienda La Esquina'),
  ('c3333333-3333-3333-3333-333333333332', 'Farmacia del Centro SA de CV', 'Farmacia del Centro'),
  ('c3333333-3333-3333-3333-333333333333', 'Taller Mecánico Express', 'Taller Mecánico Express'),
  -- Clientes Tribu Querétaro
  ('c4444444-4444-4444-4444-444444444441', 'Industrias Querétaro SA de CV', 'Industrias Querétaro'),
  ('c4444444-4444-4444-4444-444444444442', 'Constructora del Bajío SA de CV', 'Constructora del Bajío'),
  ('c4444444-4444-4444-4444-444444444443', 'Hotel Mirador QRO SA de CV', 'Hotel Mirador QRO')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 5. CONTRIBUYENTES (RFCs)
-- ==========================================
INSERT INTO contribuyente (contribuyente_id, rfc, tipo_persona) VALUES
  -- RFCs Tribu Isidora
  ('r1111111-1111-1111-1111-111111111111', 'ALU010101ABC', 'PM'),
  ('r1111111-1111-1111-1111-111111111112', 'FET020202DEF', 'PM'),
  ('r1111111-1111-1111-1111-111111111113', 'PCE030303GHI', 'PM'),
  -- RFCs Tribu Noelia
  ('r2222222-2222-2222-2222-222222222221', 'CDS040404JKL', 'PM'),
  ('r2222222-2222-2222-2222-222222222222', 'RLC050505MNO', 'PM'),
  ('r2222222-2222-2222-2222-222222222223', 'BEL060606PQR', 'PM'),
  -- RFCs Tribu Vianey
  ('r3333333-3333-3333-3333-333333333331', 'TLE070707STU', 'PF'),
  ('r3333333-3333-3333-3333-333333333332', 'FDC080808VWX', 'PM'),
  ('r3333333-3333-3333-3333-333333333333', 'TME090909YZA', 'PF'),
  -- RFCs Tribu Querétaro
  ('r4444444-4444-4444-4444-444444444441', 'IQR101010BCD', 'PM'),
  ('r4444444-4444-4444-4444-444444444442', 'CDB111111EFG', 'PM'),
  ('r4444444-4444-4444-4444-444444444443', 'HMQ121212HIJ', 'PM')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 6. CLIENTE-CONTRIBUYENTE (relación)
-- ==========================================
INSERT INTO cliente_contribuyente (cliente_id, contribuyente_id) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111'),
  ('c1111111-1111-1111-1111-111111111112', 'r1111111-1111-1111-1111-111111111112'),
  ('c1111111-1111-1111-1111-111111111113', 'r1111111-1111-1111-1111-111111111113'),
  ('c2222222-2222-2222-2222-222222222221', 'r2222222-2222-2222-2222-222222222221'),
  ('c2222222-2222-2222-2222-222222222222', 'r2222222-2222-2222-2222-222222222222'),
  ('c2222222-2222-2222-2222-222222222223', 'r2222222-2222-2222-2222-222222222223'),
  ('c3333333-3333-3333-3333-333333333331', 'r3333333-3333-3333-3333-333333333331'),
  ('c3333333-3333-3333-3333-333333333332', 'r3333333-3333-3333-3333-333333333332'),
  ('c3333333-3333-3333-3333-333333333333', 'r3333333-3333-3333-3333-333333333333'),
  ('c4444444-4444-4444-4444-444444444441', 'r4444444-4444-4444-4444-444444444441'),
  ('c4444444-4444-4444-4444-444444444442', 'r4444444-4444-4444-4444-444444444442'),
  ('c4444444-4444-4444-4444-444444444443', 'r4444444-4444-4444-4444-444444444443')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 7. CONTRIBUYENTE-RÉGIMEN
-- ==========================================
INSERT INTO contribuyente_regimen (contribuyente_id, c_regimen, vigencia_inicio) VALUES
  -- Todos en régimen 601 (General de Ley PM)
  ('r1111111-1111-1111-1111-111111111111', '601', '2023-01-01'),
  ('r1111111-1111-1111-1111-111111111112', '601', '2023-01-01'),
  ('r1111111-1111-1111-1111-111111111113', '601', '2023-01-01'),
  ('r2222222-2222-2222-2222-222222222221', '601', '2023-01-01'),
  ('r2222222-2222-2222-2222-222222222222', '601', '2023-01-01'),
  ('r2222222-2222-2222-2222-222222222223', '601', '2023-01-01'),
  ('r3333333-3333-3333-3333-333333333331', '612', '2023-01-01'), -- PF Actividad Empresarial
  ('r3333333-3333-3333-3333-333333333332', '601', '2023-01-01'),
  ('r3333333-3333-3333-3333-333333333333', '612', '2023-01-01'),
  ('r4444444-4444-4444-4444-444444444441', '601', '2023-01-01'),
  ('r4444444-4444-4444-4444-444444444442', '601', '2023-01-01'),
  ('r4444444-4444-4444-4444-444444444443', '601', '2023-01-01')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 8. SERVICIOS (Nómina, IMSS, Impuestos)
-- ==========================================
INSERT INTO servicio (servicio_id, nombre, periodicidad) VALUES
  ('s0000001-0000-0000-0000-000000000001', 'Nómina Quincenal', 'QUINCENAL'),
  ('s0000001-0000-0000-0000-000000000002', 'IMSS Mensual', 'MENSUAL'),
  ('s0000001-0000-0000-0000-000000000003', 'Impuestos Mensuales', 'MENSUAL'),
  ('s0000001-0000-0000-0000-000000000004', 'Contabilidad Electrónica', 'MENSUAL'),
  ('s0000001-0000-0000-0000-000000000005', 'DIOT', 'MENSUAL')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 9. OBLIGACIONES FISCALES
-- ==========================================
INSERT INTO obligacion_fiscal (id_obligacion, nombre, periodicidad, nivel) VALUES
  ('OBL-NOMINA-Q', 'Nómina Quincenal', 'QUINCENAL', 'RFC'),
  ('OBL-IMSS-M', 'IMSS Mensual', 'MENSUAL', 'RFC'),
  ('OBL-IMP-M', 'Impuestos Mensuales', 'MENSUAL', 'RFC'),
  ('OBL-CONT-E', 'Contabilidad Electrónica', 'MENSUAL', 'RFC'),
  ('OBL-DIOT', 'DIOT', 'MENSUAL', 'RFC')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 10. RÉGIMEN-OBLIGACIÓN (qué obligaciones aplican a cada régimen)
-- ==========================================
INSERT INTO regimen_obligacion (c_regimen, id_obligacion) VALUES
  ('601', 'OBL-NOMINA-Q'),
  ('601', 'OBL-IMSS-M'),
  ('601', 'OBL-IMP-M'),
  ('601', 'OBL-CONT-E'),
  ('601', 'OBL-DIOT'),
  ('612', 'OBL-NOMINA-Q'),
  ('612', 'OBL-IMP-M')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 11. SERVICIO-OBLIGACIÓN (qué obligaciones cubre cada servicio)
-- ==========================================
INSERT INTO servicio_obligacion (servicio_id, id_obligacion) VALUES
  ('s0000001-0000-0000-0000-000000000001', 'OBL-NOMINA-Q'),
  ('s0000001-0000-0000-0000-000000000002', 'OBL-IMSS-M'),
  ('s0000001-0000-0000-0000-000000000003', 'OBL-IMP-M'),
  ('s0000001-0000-0000-0000-000000000004', 'OBL-CONT-E'),
  ('s0000001-0000-0000-0000-000000000005', 'OBL-DIOT')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 12. CLIENTE-SERVICIO (qué servicios tiene contratados cada cliente)
-- ==========================================
INSERT INTO cliente_servicio (cliente_id, servicio_id) VALUES
  -- Todos tienen Nómina e IMSS
  ('c1111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000001'),
  ('c1111111-1111-1111-1111-111111111111', 's0000001-0000-0000-0000-000000000002'),
  ('c1111111-1111-1111-1111-111111111112', 's0000001-0000-0000-0000-000000000001'),
  ('c1111111-1111-1111-1111-111111111112', 's0000001-0000-0000-0000-000000000002'),
  ('c1111111-1111-1111-1111-111111111113', 's0000001-0000-0000-0000-000000000001'),
  ('c2222222-2222-2222-2222-222222222221', 's0000001-0000-0000-0000-000000000001'),
  ('c2222222-2222-2222-2222-222222222221', 's0000001-0000-0000-0000-000000000002'),
  ('c2222222-2222-2222-2222-222222222222', 's0000001-0000-0000-0000-000000000001'),
  ('c2222222-2222-2222-2222-222222222223', 's0000001-0000-0000-0000-000000000001'),
  ('c3333333-3333-3333-3333-333333333331', 's0000001-0000-0000-0000-000000000001'),
  ('c3333333-3333-3333-3333-333333333332', 's0000001-0000-0000-0000-000000000001'),
  ('c3333333-3333-3333-3333-333333333332', 's0000001-0000-0000-0000-000000000002'),
  ('c3333333-3333-3333-3333-333333333333', 's0000001-0000-0000-0000-000000000001'),
  ('c4444444-4444-4444-4444-444444444441', 's0000001-0000-0000-0000-000000000001'),
  ('c4444444-4444-4444-4444-444444444441', 's0000001-0000-0000-0000-000000000002'),
  ('c4444444-4444-4444-4444-444444444442', 's0000001-0000-0000-0000-000000000001'),
  ('c4444444-4444-4444-4444-444444444443', 's0000001-0000-0000-0000-000000000001'),
  ('c4444444-4444-4444-4444-444444444443', 's0000001-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 13. PROCESOS OPERATIVOS (Nómina e IMSS)
-- ==========================================
INSERT INTO proceso_operativo (proceso_id, nombre, descripcion, activo) VALUES
  ('NOMINA', 'Nómina Quincenal', 'Proceso de cálculo y pago de nómina quincenal', true),
  ('IMSS', 'IMSS Mensual', 'Proceso de movimientos y pagos IMSS mensuales', true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 14. PASOS DE PROCESO (Nómina: 5 pasos, IMSS: 7 pasos)
-- ==========================================
INSERT INTO proceso_paso (proceso_id, paso_id, nombre, orden, peso_pct, tipo_colaborador, evidencia_requerida, activo) VALUES
  -- NÓMINA (5 pasos)
  ('NOMINA', 'NOM-01', 'Recepción de incidencias', 1, 10, 'C', false, true),
  ('NOMINA', 'NOM-02', 'Cálculo de nómina', 2, 30, 'B', true, true),
  ('NOMINA', 'NOM-03', 'Revisión líder', 3, 15, 'LIDER', true, true),
  ('NOMINA', 'NOM-04', 'Timbrado CFDI', 4, 25, 'A', true, true),
  ('NOMINA', 'NOM-05', 'Dispersión bancaria', 5, 20, 'C', true, true),
  -- IMSS (7 pasos)
  ('IMSS', 'IMSS-01', 'Revisión movimientos pendientes', 1, 10, 'C', false, true),
  ('IMSS', 'IMSS-02', 'Captura de altas/bajas', 2, 15, 'B', true, true),
  ('IMSS', 'IMSS-03', 'Modificaciones salariales', 3, 15, 'B', true, true),
  ('IMSS', 'IMSS-04', 'Generación SUA', 4, 20, 'A', true, true),
  ('IMSS', 'IMSS-05', 'Revisión líder', 5, 10, 'LIDER', true, true),
  ('IMSS', 'IMSS-06', 'Pago IMSS', 6, 15, 'C', true, true),
  ('IMSS', 'IMSS-07', 'Archivo de comprobantes', 7, 15, 'C', true, true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 15. CALENDARIO DEADLINES (Enero 2026)
-- ==========================================
INSERT INTO calendario_deadline (calendario_regla_id, periodo, fecha_limite, aprobado) VALUES
  ('regla-nomina-q1', '2026-01', '2026-01-15', true),
  ('regla-nomina-q2', '2026-01', '2026-01-31', true),
  ('regla-imss', '2026-01', '2026-01-17', true),
  ('regla-impuestos', '2026-01', '2026-01-17', true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- RESUMEN DE DATOS INSERTADOS
-- ==========================================
-- 14 Usuarios (12 colaboradores + 1 auditor + 1 socio)
-- 4 Equipos/Tribus
-- 12 Clientes
-- 12 RFCs (Contribuyentes)
-- 5 Servicios
-- 5 Obligaciones Fiscales
-- 2 Procesos (Nómina, IMSS)
-- 12 Pasos de proceso
-- 4 Deadlines para Enero 2026
