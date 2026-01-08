-- ============================================
-- SGR CBC - Seed Data CORREGIDO v2
-- UUIDs válidos (solo hex: 0-9, a-f)
-- ============================================

-- PASO 1: Quitar FK temporal para permitir insertar usuarios
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_id_fkey;

-- PASO 2: USUARIOS
INSERT INTO users (user_id, email, nombre, rol_global) VALUES
  ('11111111-1111-1111-1111-111111111101', 'isidora.lider@cbc.mx', 'Isidora Méndez', 'LIDER'),
  ('11111111-1111-1111-1111-111111111102', 'diego.garcia@cbc.mx', 'Diego García', 'COLABORADOR'),
  ('11111111-1111-1111-1111-111111111103', 'ulises.romo@cbc.mx', 'Ulises Romo', 'COLABORADOR'),
  ('22222222-2222-2222-2222-222222222201', 'noelia.lider@cbc.mx', 'Noelia Reyes', 'LIDER'),
  ('22222222-2222-2222-2222-222222222202', 'hannia.lopez@cbc.mx', 'Hannia López', 'COLABORADOR'),
  ('33333333-3333-3333-3333-333333333301', 'vianey.lider@cbc.mx', 'Vianey Torres', 'LIDER'),
  ('33333333-3333-3333-3333-333333333302', 'karla.mendez@cbc.mx', 'Karla Méndez', 'COLABORADOR'),
  ('44444444-4444-4444-4444-444444444401', 'qro.lider@cbc.mx', 'Patricia Ruiz', 'LIDER'),
  ('44444444-4444-4444-4444-444444444402', 'ana.torres@cbc.mx', 'Ana Torres', 'COLABORADOR'),
  ('55555555-5555-5555-5555-555555555501', 'auditor@cbc.mx', 'Carlos Auditor', 'AUDITOR'),
  ('66666666-6666-6666-6666-666666666601', 'socio@cbc.mx', 'Gonzalo León', 'SOCIO')
ON CONFLICT (user_id) DO NOTHING;

-- PASO 3: CLIENTES
INSERT INTO cliente (cliente_id, razon_social_principal, nombre_comercial) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Abarrotes Lupita SA de CV', 'Abarrotes Lupita'),
  ('c1111111-1111-1111-1111-111111111112', 'Ferretería El Tornillo SA de CV', 'Ferretería El Tornillo'),
  ('c2222222-2222-2222-2222-222222222221', 'Consultorio Dr. Simi SC', 'Consultorio Dr. Simi'),
  ('c3333333-3333-3333-3333-333333333331', 'Tienda La Esquina', 'Tienda La Esquina'),
  ('c4444444-4444-4444-4444-444444444441', 'Industrias Querétaro SA de CV', 'Industrias Querétaro')
ON CONFLICT DO NOTHING;

-- PASO 4: CONTRIBUYENTES (RFCs formato SAT válido)
-- PM: 3 letras + AAMMDD + 3 homoclave = 12 chars
-- PF: 4 letras + AAMMDD + 3 homoclave = 13 chars
INSERT INTO contribuyente (contribuyente_id, rfc, tipo_persona, razon_social) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'ALU150101AB1', 'PM', 'Abarrotes Lupita SA de CV'),
  ('a1111111-1111-1111-1111-111111111112', 'FET180315CD2', 'PM', 'Ferretería El Tornillo SA de CV'),
  ('a2222222-2222-2222-2222-222222222221', 'CDS200720EF3', 'PM', 'Consultorio Dr. Simi SC'),
  ('a3333333-3333-3333-3333-333333333331', 'TILE850515GH4', 'PF', 'Tienda La Esquina'),
  ('a4444444-4444-4444-4444-444444444441', 'IQU100101IJ5', 'PM', 'Industrias Querétaro SA de CV')
ON CONFLICT DO NOTHING;

-- PASO 5: CLIENTE-CONTRIBUYENTE
INSERT INTO cliente_contribuyente (cliente_id, contribuyente_id) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
  ('c1111111-1111-1111-1111-111111111112', 'a1111111-1111-1111-1111-111111111112'),
  ('c2222222-2222-2222-2222-222222222221', 'a2222222-2222-2222-2222-222222222221'),
  ('c3333333-3333-3333-3333-333333333331', 'a3333333-3333-3333-3333-333333333331'),
  ('c4444444-4444-4444-4444-444444444441', 'a4444444-4444-4444-4444-444444444441')
ON CONFLICT DO NOTHING;

-- PASO 6: CONTRIBUYENTE-RÉGIMEN
INSERT INTO contribuyente_regimen (contribuyente_id, c_regimen) VALUES
  ('a1111111-1111-1111-1111-111111111111', '601'),
  ('a1111111-1111-1111-1111-111111111112', '601'),
  ('a2222222-2222-2222-2222-222222222221', '601'),
  ('a3333333-3333-3333-3333-333333333331', '612'),
  ('a4444444-4444-4444-4444-444444444441', '601')
ON CONFLICT DO NOTHING;

-- PASO 7: SERVICIOS (sin periodicidad - no existe en schema)
INSERT INTO servicio (servicio_id, nombre, descripcion) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Nómina Quincenal', 'Servicio de nómina quincenal'),
  ('b0000001-0000-0000-0000-000000000002', 'IMSS Mensual', 'Servicio de gestión IMSS mensual')
ON CONFLICT DO NOTHING;

-- PASO 8: OBLIGACIONES
INSERT INTO obligacion_fiscal (id_obligacion, nombre_corto, periodicidad, nivel, impuesto) VALUES
  ('OBL-NOMINA-Q', 'Nómina Quincenal', 'MENSUAL', 'FEDERAL', 'ISR'),
  ('OBL-IMSS-M', 'IMSS Mensual', 'MENSUAL', 'SEGURIDAD_SOCIAL', 'IMSS')
ON CONFLICT DO NOTHING;

-- PASO 9: RÉGIMEN-OBLIGACIÓN
INSERT INTO regimen_obligacion (c_regimen, id_obligacion) VALUES
  ('601', 'OBL-NOMINA-Q'),
  ('601', 'OBL-IMSS-M'),
  ('612', 'OBL-NOMINA-Q')
ON CONFLICT DO NOTHING;

-- PASO 10: SERVICIO-OBLIGACIÓN
INSERT INTO servicio_obligacion (servicio_id, id_obligacion) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'OBL-NOMINA-Q'),
  ('b0000001-0000-0000-0000-000000000002', 'OBL-IMSS-M')
ON CONFLICT DO NOTHING;

-- PASO 11: CLIENTE-SERVICIO
INSERT INTO cliente_servicio (cliente_id, servicio_id) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000001'),
  ('c1111111-1111-1111-1111-111111111111', 'b0000001-0000-0000-0000-000000000002'),
  ('c1111111-1111-1111-1111-111111111112', 'b0000001-0000-0000-0000-000000000001'),
  ('c2222222-2222-2222-2222-222222222221', 'b0000001-0000-0000-0000-000000000001'),
  ('c2222222-2222-2222-2222-222222222221', 'b0000001-0000-0000-0000-000000000002'),
  ('c3333333-3333-3333-3333-333333333331', 'b0000001-0000-0000-0000-000000000001'),
  ('c4444444-4444-4444-4444-444444444441', 'b0000001-0000-0000-0000-000000000001'),
  ('c4444444-4444-4444-4444-444444444441', 'b0000001-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- PASO 12: PROCESOS OPERATIVOS
INSERT INTO proceso_operativo (proceso_id, nombre, activo) VALUES
  ('NOMINA', 'Nómina Quincenal', true),
  ('IMSS', 'IMSS Mensual', true)
ON CONFLICT (proceso_id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- PASO 13: PASOS DE PROCESO
-- Limpiar pasos previos para evitar duplicados del schema.sql
DELETE FROM proceso_paso WHERE proceso_id IN ('NOMINA', 'IMSS');

INSERT INTO proceso_paso (proceso_id, paso_id, nombre, orden, peso_pct, tipo_colaborador, evidencia_requerida, activo) VALUES
  ('NOMINA', 'NOM-01', 'Recepción incidencias', 1, 10, 'C', false, true),
  ('NOMINA', 'NOM-02', 'Cálculo nómina', 2, 30, 'B', true, true),
  ('NOMINA', 'NOM-03', 'Revisión líder', 3, 15, 'A', true, true),
  ('NOMINA', 'NOM-04', 'Timbrado CFDI', 4, 25, 'A', true, true),
  ('NOMINA', 'NOM-05', 'Dispersión banco', 5, 20, 'C', true, true),
  ('IMSS', 'IMSS-01', 'Captura movimientos', 1, 25, 'B', true, true),
  ('IMSS', 'IMSS-02', 'Generación SUA', 2, 30, 'A', true, true),
  ('IMSS', 'IMSS-03', 'Revisión líder', 3, 20, 'A', true, true),
  ('IMSS', 'IMSS-04', 'Pago IMSS', 4, 25, 'C', true, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- RESUMEN: UUIDs ahora usan solo hex (a,b,c,d,e,f)
-- 11 usuarios, 5 clientes, 5 RFCs, 2 servicios, 2 procesos
-- ============================================
