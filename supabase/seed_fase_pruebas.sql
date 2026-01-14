-- ============================================
-- SGR CBC - Seed Data para FASE DE PRUEBAS
-- Configuración validada con el equipo
-- Generado: Enero 2026
-- ============================================

-- ============================================
-- LIMPIAR DATOS PREVIOS (orden por FK)
-- ============================================
DELETE FROM regimen_entregable_peso;
DELETE FROM entregable_obligacion;
DELETE FROM regimen_obligacion;
DELETE FROM proceso_paso;
DELETE FROM proceso_operativo;
DELETE FROM obligacion_fiscal;
DELETE FROM entregable;
DELETE FROM regimen_fiscal WHERE c_regimen IN ('601', '612', '625', '626-PF', '626-PM');

-- ============================================
-- 1. TALLAS (ponderación relativa vs Mediana)
-- ============================================
INSERT INTO talla (talla_id, ponderacion, activo) VALUES
  ('EXTRA_CHICA', 50, true),
  ('CHICA', 75, true),
  ('MEDIANA', 100, true),
  ('GRANDE', 150, true),
  ('EXTRA_GRANDE', 200, true)
ON CONFLICT (talla_id) DO UPDATE SET ponderacion = EXCLUDED.ponderacion;

-- ============================================
-- 2. REGÍMENES FISCALES
-- ============================================
INSERT INTO regimen_fiscal (c_regimen, descripcion, tipo_persona, activo) VALUES
  ('601', 'Régimen General de Ley Personas Morales', 'PM', true),
  ('612', 'Personas Físicas con Actividades Empresariales y Profesionales', 'PF', true),
  ('625', 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', 'PF', true),
  ('626-PF', 'Régimen Simplificado de Confianza - Personas Físicas', 'PF', true),
  ('626-PM', 'Régimen Simplificado de Confianza - Personas Morales', 'PM', true)
ON CONFLICT (c_regimen) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  tipo_persona = EXCLUDED.tipo_persona;

-- ============================================
-- 3. ENTREGABLES (catálogo de obligaciones/entregables)
-- ============================================
INSERT INTO entregable (entregable_id, nombre, descripcion, tipo, activo) VALUES
  -- Obligaciones fiscales federales
  ('ENT-IVA', 'IVA', 'Impuesto al Valor Agregado mensual', 'OBLIGACION', true),
  ('ENT-ISR', 'ISR', 'Impuesto Sobre la Renta', 'OBLIGACION', true),
  ('ENT-RET-IVA', 'RET IVA', 'Retención de IVA', 'OBLIGACION', true),
  ('ENT-RET-ISR', 'RET ISR', 'Retención de ISR', 'OBLIGACION', true),
  ('ENT-RET-ISR-SS', 'RET ISR Sueldos y Salarios', 'Retención ISR por sueldos y salarios', 'OBLIGACION', true),
  ('ENT-DIOT', 'DIOT', 'Declaración Informativa de Operaciones con Terceros', 'OBLIGACION', true),
  -- Obligaciones estatales
  ('ENT-ISN', 'ISN', 'Impuesto Sobre Nóminas', 'OBLIGACION', true),
  ('ENT-IC', 'IC', 'Impuesto Cedular', 'OBLIGACION', true),
  ('ENT-ISH', 'ISH', 'Impuesto Sobre Hospedaje', 'OBLIGACION', true),
  ('ENT-RET-IC', 'RET IC Honorarios', 'Retención IC por honorarios', 'OBLIGACION', true),
  -- Seguridad social
  ('ENT-IMSS', 'IMSS', 'Cuotas IMSS mensual', 'SEGURIDAD_SOCIAL', true),
  -- Operativos
  ('ENT-NOMINA', 'Nóminas', 'Nóminas (incluye PTU, Aguinaldo)', 'OPERATIVO', true),
  ('ENT-FACTURACION', 'Facturación', 'Emisión y control de CFDI', 'OPERATIVO', true),
  ('ENT-CONTABILIDAD', 'Contabilidad Electrónica', 'Contabilidad electrónica SAT', 'OPERATIVO', true)
ON CONFLICT (entregable_id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion;

-- ============================================
-- 4. OBLIGACIONES FISCALES
-- ============================================
INSERT INTO obligacion_fiscal (id_obligacion, nombre_corto, descripcion, nivel, impuesto, periodicidad, es_informativa, activo) VALUES
  -- Federales
  ('OBL-IVA', 'IVA', 'Impuesto al Valor Agregado', 'FEDERAL', 'IVA', 'MENSUAL', false, true),
  ('OBL-ISR', 'ISR', 'Impuesto Sobre la Renta', 'FEDERAL', 'ISR', 'MENSUAL', false, true),
  ('OBL-RET-IVA', 'RET IVA', 'Retención de IVA', 'FEDERAL', 'IVA', 'MENSUAL', false, true),
  ('OBL-RET-ISR', 'RET ISR', 'Retención de ISR', 'FEDERAL', 'ISR', 'MENSUAL', false, true),
  ('OBL-RET-ISR-SS', 'RET ISR Sueldos', 'Retención ISR por sueldos y salarios', 'FEDERAL', 'ISR', 'MENSUAL', false, true),
  ('OBL-DIOT', 'DIOT', 'Declaración Informativa de Operaciones con Terceros', 'FEDERAL', 'IVA', 'MENSUAL', true, true),
  -- Estatales
  ('OBL-ISN', 'ISN', 'Impuesto Sobre Nóminas', 'ESTATAL', 'ISN', 'MENSUAL', false, true),
  ('OBL-IC', 'IC', 'Impuesto Cedular', 'ESTATAL', 'IC', 'MENSUAL', false, true),
  ('OBL-ISH', 'ISH', 'Impuesto Sobre Hospedaje', 'ESTATAL', 'ISH', 'MENSUAL', false, true),
  ('OBL-RET-IC', 'RET IC Honorarios', 'Retención IC por honorarios', 'ESTATAL', 'IC', 'MENSUAL', false, true),
  -- Seguridad Social
  ('OBL-IMSS', 'IMSS', 'Cuotas obrero patronales IMSS', 'SEGURIDAD_SOCIAL', 'IMSS', 'MENSUAL', false, true),
  -- Operativos (tratados como obligaciones para scoring)
  ('OBL-NOMINA', 'Nóminas', 'Proceso de nómina (incluye PTU, Aguinaldo)', 'FEDERAL', 'ISR', 'MENSUAL', false, true),
  ('OBL-FACTURACION', 'Facturación', 'Emisión y control de CFDI', 'FEDERAL', 'CFDI', 'MENSUAL', false, true),
  ('OBL-CONTABILIDAD', 'Contabilidad Electrónica', 'Contabilidad electrónica ante SAT', 'FEDERAL', 'CONTABILIDAD', 'MENSUAL', true, true)
ON CONFLICT (id_obligacion) DO UPDATE SET
  nombre_corto = EXCLUDED.nombre_corto,
  descripcion = EXCLUDED.descripcion;

-- ============================================
-- 5. VINCULACIÓN ENTREGABLE → OBLIGACIÓN
-- ============================================
INSERT INTO entregable_obligacion (entregable_id, id_obligacion, peso_relativo) VALUES
  ('ENT-IVA', 'OBL-IVA', 100),
  ('ENT-ISR', 'OBL-ISR', 100),
  ('ENT-RET-IVA', 'OBL-RET-IVA', 100),
  ('ENT-RET-ISR', 'OBL-RET-ISR', 100),
  ('ENT-RET-ISR-SS', 'OBL-RET-ISR-SS', 100),
  ('ENT-DIOT', 'OBL-DIOT', 100),
  ('ENT-ISN', 'OBL-ISN', 100),
  ('ENT-IC', 'OBL-IC', 100),
  ('ENT-ISH', 'OBL-ISH', 100),
  ('ENT-RET-IC', 'OBL-RET-IC', 100),
  ('ENT-IMSS', 'OBL-IMSS', 100),
  ('ENT-NOMINA', 'OBL-NOMINA', 100),
  ('ENT-FACTURACION', 'OBL-FACTURACION', 100),
  ('ENT-CONTABILIDAD', 'OBL-CONTABILIDAD', 100)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. MATRIZ RÉGIMEN → OBLIGACIÓN
-- Con peso % por entregable según especificación
-- ============================================

-- 6.1 Régimen 601 - General de Ley PM (Total: 100%)
INSERT INTO regimen_obligacion (c_regimen, id_obligacion, es_obligatoria, riesgo_default, prioridad_default) VALUES
  ('601', 'OBL-IVA', true, 'ALTO', 10),
  ('601', 'OBL-RET-IVA', true, 'ALTO', 15),
  ('601', 'OBL-RET-ISR', true, 'ALTO', 15),
  ('601', 'OBL-ISR', true, 'ALTO', 10),
  ('601', 'OBL-DIOT', true, 'MEDIO', 30),
  ('601', 'OBL-RET-ISR-SS', true, 'ALTO', 20),
  ('601', 'OBL-ISN', true, 'MEDIO', 40),
  ('601', 'OBL-RET-IC', true, 'MEDIO', 45),
  ('601', 'OBL-IMSS', true, 'ALTO', 5),
  ('601', 'OBL-NOMINA', true, 'ALTO', 8),
  ('601', 'OBL-FACTURACION', true, 'ALTO', 12),
  ('601', 'OBL-CONTABILIDAD', true, 'ALTO', 25)
ON CONFLICT (c_regimen, id_obligacion) DO UPDATE SET
  es_obligatoria = EXCLUDED.es_obligatoria,
  riesgo_default = EXCLUDED.riesgo_default;

-- 6.2 Régimen 612 - PF Actividades Empresariales (Total: 100%)
INSERT INTO regimen_obligacion (c_regimen, id_obligacion, es_obligatoria, riesgo_default, prioridad_default) VALUES
  ('612', 'OBL-ISR', true, 'ALTO', 10),
  ('612', 'OBL-IVA', true, 'ALTO', 10),
  ('612', 'OBL-RET-ISR-SS', true, 'ALTO', 20),
  ('612', 'OBL-DIOT', true, 'MEDIO', 30),
  ('612', 'OBL-ISN', true, 'MEDIO', 40),
  ('612', 'OBL-IC', true, 'MEDIO', 45),
  ('612', 'OBL-ISH', true, 'BAJO', 50),
  ('612', 'OBL-IMSS', true, 'ALTO', 5),
  ('612', 'OBL-NOMINA', true, 'ALTO', 8),
  ('612', 'OBL-FACTURACION', true, 'ALTO', 12),
  ('612', 'OBL-CONTABILIDAD', true, 'ALTO', 25)
ON CONFLICT (c_regimen, id_obligacion) DO UPDATE SET
  es_obligatoria = EXCLUDED.es_obligatoria,
  riesgo_default = EXCLUDED.riesgo_default;

-- 6.3 Régimen 626-PF - RESICO Personas Físicas (Total: 100%)
INSERT INTO regimen_obligacion (c_regimen, id_obligacion, es_obligatoria, riesgo_default, prioridad_default) VALUES
  ('626-PF', 'OBL-ISR', true, 'ALTO', 10),
  ('626-PF', 'OBL-IVA', true, 'ALTO', 10),
  ('626-PF', 'OBL-RET-ISR-SS', true, 'ALTO', 20),
  ('626-PF', 'OBL-DIOT', true, 'MEDIO', 30),
  ('626-PF', 'OBL-ISN', true, 'MEDIO', 40),
  ('626-PF', 'OBL-IC', true, 'MEDIO', 45),
  ('626-PF', 'OBL-ISH', true, 'BAJO', 50),
  ('626-PF', 'OBL-IMSS', true, 'ALTO', 5),
  ('626-PF', 'OBL-NOMINA', true, 'ALTO', 8),
  ('626-PF', 'OBL-FACTURACION', true, 'ALTO', 12)
ON CONFLICT (c_regimen, id_obligacion) DO UPDATE SET
  es_obligatoria = EXCLUDED.es_obligatoria,
  riesgo_default = EXCLUDED.riesgo_default;

-- 6.4 Régimen 626-PM - RESICO Personas Morales (Total: 100%)
INSERT INTO regimen_obligacion (c_regimen, id_obligacion, es_obligatoria, riesgo_default, prioridad_default) VALUES
  ('626-PM', 'OBL-IVA', true, 'ALTO', 10),
  ('626-PM', 'OBL-ISR', true, 'ALTO', 10),
  ('626-PM', 'OBL-RET-ISR', true, 'ALTO', 15),
  ('626-PM', 'OBL-RET-IVA', true, 'ALTO', 15),
  ('626-PM', 'OBL-DIOT', true, 'MEDIO', 30),
  ('626-PM', 'OBL-RET-ISR-SS', true, 'ALTO', 20),
  ('626-PM', 'OBL-ISN', true, 'MEDIO', 40),
  ('626-PM', 'OBL-IMSS', true, 'ALTO', 5),
  ('626-PM', 'OBL-NOMINA', true, 'ALTO', 8),
  ('626-PM', 'OBL-FACTURACION', true, 'ALTO', 12),
  ('626-PM', 'OBL-CONTABILIDAD', true, 'ALTO', 25)
ON CONFLICT (c_regimen, id_obligacion) DO UPDATE SET
  es_obligatoria = EXCLUDED.es_obligatoria,
  riesgo_default = EXCLUDED.riesgo_default;

-- 6.5 Régimen 625 - Plataformas Tecnológicas (Total: 100%)
INSERT INTO regimen_obligacion (c_regimen, id_obligacion, es_obligatoria, riesgo_default, prioridad_default) VALUES
  ('625', 'OBL-IVA', true, 'ALTO', 10),
  ('625', 'OBL-ISR', true, 'ALTO', 10),
  ('625', 'OBL-DIOT', true, 'MEDIO', 30),
  ('625', 'OBL-RET-ISR-SS', true, 'ALTO', 20),
  ('625', 'OBL-ISN', true, 'MEDIO', 40),
  ('625', 'OBL-ISH', true, 'BAJO', 50),
  ('625', 'OBL-IMSS', true, 'ALTO', 5),
  ('625', 'OBL-NOMINA', true, 'ALTO', 8),
  ('625', 'OBL-FACTURACION', true, 'ALTO', 12)
ON CONFLICT (c_regimen, id_obligacion) DO UPDATE SET
  es_obligatoria = EXCLUDED.es_obligatoria,
  riesgo_default = EXCLUDED.riesgo_default;

-- ============================================
-- 7. PESOS POR RÉGIMEN Y ENTREGABLE
-- Tabla regimen_entregable_peso para scoring
-- ============================================

-- 7.1 Régimen 601 - General de Ley PM (Total: 100%)
INSERT INTO regimen_entregable_peso (c_regimen, entregable_id, peso_pct, activo) VALUES
  ('601', 'ENT-IVA', 5, true),
  ('601', 'ENT-RET-IVA', 5, true),
  ('601', 'ENT-RET-ISR', 5, true),
  ('601', 'ENT-ISR', 5, true),
  ('601', 'ENT-DIOT', 7, true),
  ('601', 'ENT-RET-ISR-SS', 5, true),
  ('601', 'ENT-ISN', 4, true),
  ('601', 'ENT-RET-IC', 4, true),
  ('601', 'ENT-IMSS', 15, true),
  ('601', 'ENT-NOMINA', 10, true),
  ('601', 'ENT-FACTURACION', 15, true),
  ('601', 'ENT-CONTABILIDAD', 20, true);

-- 7.2 Régimen 612 - PF Actividades Empresariales (Total: 100%)
INSERT INTO regimen_entregable_peso (c_regimen, entregable_id, peso_pct, activo) VALUES
  ('612', 'ENT-ISR', 8, true),
  ('612', 'ENT-IVA', 8, true),
  ('612', 'ENT-RET-ISR-SS', 5, true),
  ('612', 'ENT-DIOT', 7, true),
  ('612', 'ENT-ISN', 4, true),
  ('612', 'ENT-IC', 4, true),
  ('612', 'ENT-ISH', 4, true),
  ('612', 'ENT-IMSS', 15, true),
  ('612', 'ENT-NOMINA', 10, true),
  ('612', 'ENT-FACTURACION', 15, true),
  ('612', 'ENT-CONTABILIDAD', 20, true);

-- 7.3 Régimen 626-PF - RESICO Personas Físicas (Total: 100%)
INSERT INTO regimen_entregable_peso (c_regimen, entregable_id, peso_pct, activo) VALUES
  ('626-PF', 'ENT-ISR', 10, true),
  ('626-PF', 'ENT-IVA', 10, true),
  ('626-PF', 'ENT-RET-ISR-SS', 5, true),
  ('626-PF', 'ENT-DIOT', 10, true),
  ('626-PF', 'ENT-ISN', 5, true),
  ('626-PF', 'ENT-IC', 5, true),
  ('626-PF', 'ENT-ISH', 5, true),
  ('626-PF', 'ENT-IMSS', 15, true),
  ('626-PF', 'ENT-NOMINA', 10, true),
  ('626-PF', 'ENT-FACTURACION', 25, true);

-- 7.4 Régimen 626-PM - RESICO Personas Morales (Total: 100%)
INSERT INTO regimen_entregable_peso (c_regimen, entregable_id, peso_pct, activo) VALUES
  ('626-PM', 'ENT-IVA', 5, true),
  ('626-PM', 'ENT-ISR', 5, true),
  ('626-PM', 'ENT-RET-ISR', 5, true),
  ('626-PM', 'ENT-RET-IVA', 5, true),
  ('626-PM', 'ENT-DIOT', 10, true),
  ('626-PM', 'ENT-RET-ISR-SS', 5, true),
  ('626-PM', 'ENT-ISN', 5, true),
  ('626-PM', 'ENT-IMSS', 15, true),
  ('626-PM', 'ENT-NOMINA', 10, true),
  ('626-PM', 'ENT-FACTURACION', 15, true),
  ('626-PM', 'ENT-CONTABILIDAD', 20, true);

-- 7.5 Régimen 625 - Plataformas Tecnológicas (Total: 100%)
INSERT INTO regimen_entregable_peso (c_regimen, entregable_id, peso_pct, activo) VALUES
  ('625', 'ENT-IVA', 10, true),
  ('625', 'ENT-ISR', 10, true),
  ('625', 'ENT-DIOT', 10, true),
  ('625', 'ENT-RET-ISR-SS', 5, true),
  ('625', 'ENT-ISN', 5, true),
  ('625', 'ENT-ISH', 5, true),
  ('625', 'ENT-IMSS', 15, true),
  ('625', 'ENT-NOMINA', 10, true),
  ('625', 'ENT-FACTURACION', 30, true);

-- ============================================
-- 8. PROCESOS OPERATIVOS
-- ============================================

-- Crear procesos
INSERT INTO proceso_operativo (proceso_id, nombre, categoria_default, activo) VALUES
  ('NOMINA', 'Nómina - Recurrente', 'RECURRENTE', true),
  ('IMSS', 'IMSS - Recurrente', 'RECURRENTE', true),
  ('GENERICO', 'Proceso Genérico', 'RECURRENTE', true)
ON CONFLICT (proceso_id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria_default = EXCLUDED.categoria_default;

-- Limpiar pasos previos
DELETE FROM proceso_paso WHERE proceso_id IN ('NOMINA', 'IMSS', 'GENERICO');

-- 8.1 Pasos de NÓMINA (Total: 100%)
INSERT INTO proceso_paso (proceso_id, paso_id, nombre, orden, peso_pct, tipo_colaborador, evidencia_requerida, activo) VALUES
  ('NOMINA', 'NOM-01', 'Consulta de incidencias', 1, 30, 'C', false, true),
  ('NOMINA', 'NOM-02', 'Captura de incidencias', 2, 30, 'C', true, true),
  ('NOMINA', 'NOM-03', 'Procesar nómina', 3, 30, 'C', true, true),
  ('NOMINA', 'NOM-04', 'Timbrar nómina', 4, 5, 'C', true, true),
  ('NOMINA', 'NOM-05', 'Enviar nómina', 5, 5, 'C', true, true);

-- 8.2 Pasos de IMSS (Total: 100%)
INSERT INTO proceso_paso (proceso_id, paso_id, nombre, orden, peso_pct, tipo_colaborador, evidencia_requerida, activo) VALUES
  ('IMSS', 'IMSS-01', 'Captura de mov. ante IDSE', 1, 20, 'B', true, true),
  ('IMSS', 'IMSS-02', 'Captura de mov. ante Nominax', 2, 15, 'B', false, true),
  ('IMSS', 'IMSS-03', 'Captura de mov. ante SUA', 3, 15, 'B', false, true),
  ('IMSS', 'IMSS-04', 'Descarga de IDSE', 4, 15, 'C', true, true),
  ('IMSS', 'IMSS-05', 'Descarga de SIPARE', 5, 5, 'C', true, true),
  ('IMSS', 'IMSS-06', 'Descarga de reportes de Nominax', 6, 5, 'C', false, true),
  ('IMSS', 'IMSS-07', 'Cotejo entre IDSE, SIPARE, SUA, Nominax', 7, 25, 'A', true, true);

-- 8.3 Pasos de Proceso GENÉRICO (Total: 100%)
-- Para obligaciones que aún no tienen proceso específico
INSERT INTO proceso_paso (proceso_id, paso_id, nombre, orden, peso_pct, tipo_colaborador, evidencia_requerida, activo) VALUES
  ('GENERICO', 'GEN-01', 'Recopilación de información', 1, 20, 'C', false, true),
  ('GENERICO', 'GEN-02', 'Procesamiento', 2, 40, 'B', true, true),
  ('GENERICO', 'GEN-03', 'Revisión y validación', 3, 25, 'A', true, true),
  ('GENERICO', 'GEN-04', 'Presentación/Envío', 4, 15, 'C', true, true);

-- ============================================
-- 9. VINCULACIÓN OBLIGACIÓN → PROCESO
-- ============================================
INSERT INTO obligacion_proceso (id_obligacion, proceso_id, activo) VALUES
  ('OBL-NOMINA', 'NOMINA', true),
  ('OBL-IMSS', 'IMSS', true),
  -- Las demás obligaciones usan proceso genérico
  ('OBL-IVA', 'GENERICO', true),
  ('OBL-ISR', 'GENERICO', true),
  ('OBL-RET-IVA', 'GENERICO', true),
  ('OBL-RET-ISR', 'GENERICO', true),
  ('OBL-RET-ISR-SS', 'GENERICO', true),
  ('OBL-DIOT', 'GENERICO', true),
  ('OBL-ISN', 'GENERICO', true),
  ('OBL-IC', 'GENERICO', true),
  ('OBL-ISH', 'GENERICO', true),
  ('OBL-RET-IC', 'GENERICO', true),
  ('OBL-FACTURACION', 'GENERICO', true),
  ('OBL-CONTABILIDAD', 'GENERICO', true)
ON CONFLICT (id_obligacion, proceso_id) DO NOTHING;

-- ============================================
-- 10. CONFIGURACIÓN SLA
-- ============================================
INSERT INTO sla_config (estado, descripcion, sla_activo, sla_pausado, dias_sla_default, orden_flujo, es_estado_final, activo) VALUES
  ('pendiente', 'No iniciado', true, false, NULL, 1, false, true),
  ('en_curso', 'Trabajo activo', true, false, NULL, 2, false, true),
  ('pendiente_evidencia', 'Falta subir comprobantes', true, false, 2, 3, false, true),
  ('en_validacion', 'Revisión líder', true, false, 1, 4, false, true),
  ('bloqueado_cliente', 'Falta info/pago cliente', false, true, NULL, 5, false, true),
  ('presentado', 'Enviado a autoridad', true, false, NULL, 6, false, true),
  ('pagado', 'Pago confirmado', false, false, NULL, 7, true, true),
  ('cerrado', 'Completado', false, false, NULL, 8, true, true),
  ('rechazado', 'Rechazado/Error', false, false, NULL, 9, true, true)
ON CONFLICT (estado) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  sla_activo = EXCLUDED.sla_activo,
  sla_pausado = EXCLUDED.sla_pausado,
  dias_sla_default = EXCLUDED.dias_sla_default;

-- ============================================
-- RESUMEN DE CONFIGURACIÓN
-- ============================================
-- 5 Regímenes fiscales: 601, 612, 625, 626-PF, 626-PM
-- 14 Entregables/Obligaciones con pesos por régimen
-- 5 Tallas: Extra chica (50) a Extra grande (200)
-- 3 Procesos: NOMINA (5 pasos), IMSS (7 pasos), GENERICO (4 pasos)
-- 9 Estados SLA configurados
-- ============================================

-- Verificar sumas de pesos por régimen (debe ser 100 cada uno)
SELECT c_regimen, SUM(peso_pct) as total_peso
FROM regimen_entregable_peso
WHERE activo = true
GROUP BY c_regimen
ORDER BY c_regimen;

-- Verificar sumas de pasos por proceso (debe ser 100 cada uno)
SELECT proceso_id, SUM(peso_pct) as total_peso
FROM proceso_paso
WHERE activo = true
GROUP BY proceso_id
ORDER BY proceso_id;
