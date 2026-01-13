-- ============================================
-- Migración: Team en RFC, SLA Config, Talla por Servicio
-- Fecha: 2026-01-13
-- ============================================

-- 1. Agregar team_id a contribuyente (RFC)
-- El equipo se asigna al RFC, no al cliente
ALTER TABLE contribuyente
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(team_id);

CREATE INDEX IF NOT EXISTS idx_contribuyente_team ON contribuyente(team_id);

COMMENT ON COLUMN contribuyente.team_id IS 'Equipo/Tribu asignado para trabajar este RFC';

-- 2. Agregar talla_id a cliente_servicio
-- La talla es por servicio contratado (XS en IMSS, G en Nómina)
ALTER TABLE cliente_servicio
ADD COLUMN IF NOT EXISTS talla_id TEXT REFERENCES talla(talla_id);

COMMENT ON COLUMN cliente_servicio.talla_id IS 'Talla del cliente para este servicio específico (afecta ponderación de puntos)';

-- 3. Crear tabla de configuración SLA
CREATE TABLE IF NOT EXISTS sla_config (
  sla_config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estado TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  sla_activo BOOLEAN NOT NULL DEFAULT true,
  sla_pausado BOOLEAN NOT NULL DEFAULT false,
  dias_sla_default INTEGER,
  orden_flujo INTEGER NOT NULL,
  es_estado_final BOOLEAN NOT NULL DEFAULT false,
  color_ui TEXT,
  icono_ui TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sla_config IS 'Configuración de SLA por estado de tarea';
COMMENT ON COLUMN sla_config.sla_activo IS 'TRUE = cuenta tiempo de SLA';
COMMENT ON COLUMN sla_config.sla_pausado IS 'TRUE = pausa el conteo de SLA (ej: bloqueado_cliente)';
COMMENT ON COLUMN sla_config.dias_sla_default IS 'Días límite para permanecer en este estado';
COMMENT ON COLUMN sla_config.es_estado_final IS 'TRUE = estado terminal (pagado, cerrado, rechazado)';

-- 4. Insertar configuración inicial de SLA
INSERT INTO sla_config (estado, descripcion, sla_activo, sla_pausado, dias_sla_default, orden_flujo, es_estado_final, color_ui) VALUES
('pendiente', 'No iniciado', true, false, NULL, 1, false, 'slate'),
('en_curso', 'Trabajo activo', true, false, NULL, 2, false, 'blue'),
('pendiente_evidencia', 'Falta subir comprobantes', true, false, 2, 3, false, 'amber'),
('en_validacion', 'Revisión líder', true, false, 1, 4, false, 'purple'),
('bloqueado_cliente', 'Falta info/pago cliente', false, true, NULL, 5, false, 'red'),
('presentado', 'Enviado a autoridad', true, false, NULL, 6, false, 'teal'),
('pagado', 'Pago confirmado', false, false, NULL, 7, true, 'green'),
('cerrado', 'Completado', false, false, NULL, 8, true, 'green'),
('rechazado', 'Rechazado/Error', false, false, NULL, 9, true, 'red')
ON CONFLICT (estado) DO UPDATE SET
  descripcion = EXCLUDED.descripcion,
  sla_activo = EXCLUDED.sla_activo,
  sla_pausado = EXCLUDED.sla_pausado,
  dias_sla_default = EXCLUDED.dias_sla_default,
  orden_flujo = EXCLUDED.orden_flujo,
  es_estado_final = EXCLUDED.es_estado_final,
  color_ui = EXCLUDED.color_ui;

-- 5. Crear tabla para vincular obligación con proceso operativo
CREATE TABLE IF NOT EXISTS obligacion_proceso (
  id_obligacion TEXT NOT NULL REFERENCES obligacion_fiscal(id_obligacion),
  proceso_id TEXT NOT NULL REFERENCES proceso_operativo(proceso_id),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_obligacion, proceso_id)
);

COMMENT ON TABLE obligacion_proceso IS 'Vincula cada obligación fiscal con su proceso operativo';

-- 6. Crear tabla para vincular obligación con regla de calendario
CREATE TABLE IF NOT EXISTS obligacion_calendario (
  id_obligacion TEXT NOT NULL REFERENCES obligacion_fiscal(id_obligacion),
  calendario_regla_id UUID NOT NULL REFERENCES calendario_regla(calendario_regla_id),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_obligacion, calendario_regla_id)
);

COMMENT ON TABLE obligacion_calendario IS 'Vincula cada obligación fiscal con su regla de calendario para deadline';

-- 7. Vincular obligaciones existentes con procesos (seed data MVP)
INSERT INTO obligacion_proceso (id_obligacion, proceso_id) VALUES
('OBL-NOMINA-Q', 'NOMINA'),
('OBL-IMSS-M', 'IMSS')
ON CONFLICT DO NOTHING;
