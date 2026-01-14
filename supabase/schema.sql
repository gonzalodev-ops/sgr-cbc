-- SGR CBC - Schema SQL para Supabase
-- Modelo v2 completo con scoring y telemetría base
-- Generado: 2026-01-07

-- ============================================
-- EXTENSIONES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATÁLOGOS FISCALES
-- ============================================

CREATE TABLE regimen_fiscal (
  c_regimen TEXT PRIMARY KEY,
  descripcion TEXT NOT NULL,
  tipo_persona TEXT NOT NULL CHECK (tipo_persona IN ('PF', 'PM', 'AMBOS')),
  vigencia_inicio DATE,
  vigencia_fin DATE,
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE obligacion_fiscal (
  id_obligacion TEXT PRIMARY KEY,
  nombre_corto TEXT NOT NULL,
  descripcion TEXT,
  nivel TEXT NOT NULL CHECK (nivel IN ('FEDERAL', 'ESTATAL', 'SEGURIDAD_SOCIAL')),
  impuesto TEXT NOT NULL,
  periodicidad TEXT NOT NULL CHECK (periodicidad IN ('MENSUAL', 'ANUAL', 'EVENTUAL', 'POR_OPERACION', 'PERMANENTE')),
  es_informativa BOOLEAN NOT NULL DEFAULT false,
  vigencia_desde DATE,
  vigencia_hasta DATE,
  fundamento_resumen TEXT,
  tags TEXT,
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE regimen_obligacion (
  c_regimen TEXT NOT NULL REFERENCES regimen_fiscal(c_regimen),
  id_obligacion TEXT NOT NULL REFERENCES obligacion_fiscal(id_obligacion),
  es_obligatoria BOOLEAN NOT NULL DEFAULT true,
  condicion_texto TEXT,
  condicion_json JSONB,
  riesgo_default TEXT CHECK (riesgo_default IN ('ALTO', 'MEDIO', 'BAJO')),
  prioridad_default INTEGER DEFAULT 50,
  vigencia_desde DATE,
  vigencia_hasta DATE,
  PRIMARY KEY (c_regimen, id_obligacion)
);

-- ============================================
-- COMERCIAL
-- ============================================

CREATE TABLE cliente (
  cliente_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_comercial TEXT NOT NULL,
  razon_social_principal TEXT,
  segmento TEXT,
  contacto_nombre TEXT,
  contacto_email TEXT,
  contacto_telefono TEXT,
  notas TEXT,
  estado TEXT NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'INACTIVO')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE contribuyente (
  contribuyente_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rfc TEXT NOT NULL UNIQUE,
  tipo_persona TEXT NOT NULL CHECK (tipo_persona IN ('PF', 'PM')),
  razon_social TEXT NOT NULL,
  nombre_comercial TEXT,
  estado_fiscal TEXT,
  team_id UUID REFERENCES teams(team_id),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contribuyente_team ON contribuyente(team_id);

CREATE TABLE cliente_contribuyente (
  cliente_id UUID NOT NULL REFERENCES cliente(cliente_id),
  contribuyente_id UUID NOT NULL REFERENCES contribuyente(contribuyente_id),
  rol_en_cliente TEXT,
  vigencia_desde DATE,
  vigencia_hasta DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (cliente_id, contribuyente_id)
);

CREATE TABLE contribuyente_regimen (
  contribuyente_id UUID NOT NULL REFERENCES contribuyente(contribuyente_id),
  c_regimen TEXT NOT NULL REFERENCES regimen_fiscal(c_regimen),
  vigencia_desde DATE,
  vigencia_hasta DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (contribuyente_id, c_regimen)
);

-- ============================================
-- SERVICIOS
-- ============================================

CREATE TABLE servicio (
  servicio_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE servicio_obligacion (
  servicio_id UUID NOT NULL REFERENCES servicio(servicio_id),
  id_obligacion TEXT NOT NULL REFERENCES obligacion_fiscal(id_obligacion),
  obligatorio_en_servicio BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  PRIMARY KEY (servicio_id, id_obligacion)
);

CREATE TABLE cliente_servicio (
  cliente_id UUID NOT NULL REFERENCES cliente(cliente_id),
  servicio_id UUID NOT NULL REFERENCES servicio(servicio_id),
  talla_id TEXT REFERENCES talla(talla_id),
  vigencia_desde DATE,
  vigencia_hasta DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  notas_comerciales TEXT,
  PRIMARY KEY (cliente_id, servicio_id)
);

-- ============================================
-- SCORING (Camino A)
-- ============================================

CREATE TABLE entregable (
  entregable_id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('OBLIGACION', 'OPERATIVO', 'OTRO')),
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE entregable_obligacion (
  entregable_id TEXT NOT NULL REFERENCES entregable(entregable_id),
  id_obligacion TEXT NOT NULL REFERENCES obligacion_fiscal(id_obligacion),
  peso_relativo DECIMAL,
  PRIMARY KEY (entregable_id, id_obligacion)
);

CREATE TABLE regimen_entregable_peso (
  regimen_entregable_peso_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  c_regimen TEXT NOT NULL REFERENCES regimen_fiscal(c_regimen),
  entregable_id TEXT NOT NULL REFERENCES entregable(entregable_id),
  peso_pct DECIMAL NOT NULL CHECK (peso_pct >= 0 AND peso_pct <= 100),
  vigencia_desde DATE,
  vigencia_hasta DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  notas TEXT,
  UNIQUE (c_regimen, entregable_id, vigencia_desde)
);

CREATE TABLE talla (
  talla_id TEXT PRIMARY KEY CHECK (talla_id IN ('EXTRA_CHICA', 'CHICA', 'MEDIANA', 'GRANDE', 'EXTRA_GRANDE')),
  ponderacion INTEGER NOT NULL CHECK (ponderacion IN (50, 75, 100, 150, 200)),
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE cliente_talla (
  cliente_talla_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES cliente(cliente_id),
  dominio_talla TEXT NOT NULL CHECK (dominio_talla IN ('FISCAL', 'NOMINA', 'IMSS')),
  talla_id TEXT NOT NULL REFERENCES talla(talla_id),
  vigencia_desde DATE,
  vigencia_hasta DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (cliente_id, dominio_talla, vigencia_desde)
);

-- ============================================
-- PROCESOS OPERATIVOS
-- ============================================

CREATE TABLE proceso_operativo (
  proceso_id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria_default TEXT NOT NULL DEFAULT 'RECURRENTE' CHECK (categoria_default IN ('RECURRENTE', 'EXTRAORDINARIO')),
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE proceso_paso (
  proceso_id TEXT NOT NULL REFERENCES proceso_operativo(proceso_id),
  paso_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL,
  peso_pct DECIMAL NOT NULL CHECK (peso_pct >= 0 AND peso_pct <= 100),
  tipo_colaborador TEXT CHECK (tipo_colaborador IN ('A', 'B', 'C')),
  grupo_concurrencia INTEGER,
  evidencia_requerida BOOLEAN NOT NULL DEFAULT false,
  tipo_evidencia_sugerida TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (proceso_id, paso_id)
);

-- ============================================
-- CALENDARIO
-- ============================================

CREATE TABLE calendario_regla (
  calendario_regla_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_evento_calendario TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN ('MENSUAL', 'ANUAL')),
  dia_base INTEGER,
  mes_base INTEGER,
  regla_texto TEXT NOT NULL,
  motor_version INTEGER NOT NULL DEFAULT 1,
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE calendario_regla_obligacion (
  calendario_regla_id UUID NOT NULL REFERENCES calendario_regla(calendario_regla_id),
  id_obligacion TEXT NOT NULL REFERENCES obligacion_fiscal(id_obligacion),
  nota TEXT,
  PRIMARY KEY (calendario_regla_id, id_obligacion)
);

CREATE TABLE calendario_deadline (
  calendario_deadline_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendario_regla_id UUID NOT NULL REFERENCES calendario_regla(calendario_regla_id),
  ejercicio INTEGER NOT NULL,
  periodo_fiscal TEXT NOT NULL,
  fecha_limite DATE NOT NULL,
  ambito TEXT NOT NULL DEFAULT 'SAT' CHECK (ambito IN ('SAT', 'ESTATAL', 'IMSS')),
  estado TEXT,
  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_calendario_deadline_fecha ON calendario_deadline(fecha_limite);
CREATE INDEX idx_calendario_deadline_periodo ON calendario_deadline(ejercicio, periodo_fiscal);

-- ============================================
-- OPERACIÓN
-- ============================================

CREATE TABLE tarea (
  tarea_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES cliente(cliente_id),
  contribuyente_id UUID NOT NULL REFERENCES contribuyente(contribuyente_id),
  id_obligacion TEXT NOT NULL REFERENCES obligacion_fiscal(id_obligacion),
  ejercicio INTEGER NOT NULL,
  periodo_fiscal TEXT NOT NULL,
  fecha_limite_oficial DATE NOT NULL,
  fecha_limite_interna DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_curso', 'pendiente_evidencia', 'en_validacion', 'bloqueado_cliente', 'presentado', 'pagado', 'cerrado', 'rechazado')),
  riesgo TEXT NOT NULL DEFAULT 'MEDIO' CHECK (riesgo IN ('ALTO', 'MEDIO', 'BAJO')),
  prioridad INTEGER NOT NULL DEFAULT 50,
  responsable_usuario_id UUID,
  revisor_usuario_id UUID,
  comentarios TEXT,
  origen TEXT NOT NULL DEFAULT 'MANUAL' CHECK (origen IN ('AUTO_CALENDARIO', 'MANUAL', 'IMPORTACION')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contribuyente_id, id_obligacion, periodo_fiscal)
);

CREATE INDEX idx_tarea_cliente ON tarea(cliente_id);
CREATE INDEX idx_tarea_responsable ON tarea(responsable_usuario_id);
CREATE INDEX idx_tarea_fecha ON tarea(fecha_limite_oficial);
CREATE INDEX idx_tarea_estado ON tarea(estado);

CREATE TABLE tarea_step (
  tarea_step_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID NOT NULL REFERENCES tarea(tarea_id) ON DELETE CASCADE,
  proceso_paso_id TEXT,
  orden INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  peso_pct DECIMAL,
  tipo_colaborador TEXT CHECK (tipo_colaborador IN ('A', 'B', 'C')),
  completado BOOLEAN NOT NULL DEFAULT false,
  completado_por UUID,
  completado_at TIMESTAMPTZ,
  comentarios TEXT
);


CREATE INDEX idx_tarea_step_tarea ON tarea_step(tarea_id, orden);

-- Telemetría (base para Camino B)
CREATE TABLE tarea_evento (
  tarea_evento_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID NOT NULL REFERENCES tarea(tarea_id) ON DELETE CASCADE,
  tipo_evento TEXT NOT NULL,
  estado_anterior TEXT,
  estado_nuevo TEXT,
  actor_usuario_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata_json JSONB
);

CREATE INDEX idx_tarea_evento_tarea ON tarea_evento(tarea_id, occurred_at);

-- ============================================
-- DOCUMENTOS
-- ============================================

CREATE TABLE documento (
  documento_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  tipo_documento TEXT NOT NULL CHECK (tipo_documento IN ('ACUSE', 'PAPEL_TRABAJO', 'XML', 'PDF', 'ESTADO_CUENTA', 'COMPROBANTE_PAGO', 'OTRO')),
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  hash_sha256 TEXT,
  origen TEXT CHECK (origen IN ('SAT', 'IMSS', 'CLIENTE', 'INTERNO')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID
);

CREATE TABLE tarea_documento (
  tarea_documento_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID NOT NULL REFERENCES tarea(tarea_id) ON DELETE CASCADE,
  documento_id UUID NOT NULL REFERENCES documento(documento_id),
  rol TEXT,
  requerido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tarea_documento_tarea ON tarea_documento(tarea_id);

-- ============================================
-- SLA Y CONFIGURACIÓN OPERATIVA
-- ============================================

CREATE TABLE sla_config (
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

CREATE TABLE obligacion_proceso (
  id_obligacion TEXT NOT NULL REFERENCES obligacion_fiscal(id_obligacion),
  proceso_id TEXT NOT NULL REFERENCES proceso_operativo(proceso_id),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_obligacion, proceso_id)
);

CREATE TABLE obligacion_calendario (
  id_obligacion TEXT NOT NULL REFERENCES obligacion_fiscal(id_obligacion),
  calendario_regla_id UUID NOT NULL REFERENCES calendario_regla(calendario_regla_id),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id_obligacion, calendario_regla_id)
);

-- ============================================
-- USUARIOS Y EQUIPOS
-- ============================================

CREATE TABLE users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rol_global TEXT NOT NULL DEFAULT 'COLABORADOR' CHECK (rol_global IN ('ADMIN', 'SOCIO', 'LIDER', 'COLABORADOR')),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE teams (
  team_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE team_members (
  team_id UUID NOT NULL REFERENCES teams(team_id),
  user_id UUID NOT NULL REFERENCES users(user_id),
  rol_en_equipo TEXT NOT NULL CHECK (rol_en_equipo IN ('LIDER', 'AUXILIAR_A', 'AUXILIAR_B', 'AUXILIAR_C')),
  es_suplente BOOLEAN NOT NULL DEFAULT false,
  suplente_de UUID REFERENCES users(user_id),
  activo BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (team_id, user_id)
);

-- ============================================
-- PLACEHOLDER FASE 2 (sin lógica)
-- ============================================

CREATE TABLE audits (
  audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID REFERENCES tarea(tarea_id),
  estado_auditoria TEXT,
  auditor_usuario_id UUID,
  fecha_auditoria TIMESTAMPTZ,
  comentarios TEXT
);

CREATE TABLE findings (
  finding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID REFERENCES audits(audit_id),
  tipo TEXT,
  gravedad TEXT,
  descripcion TEXT,
  genera_retrabajo BOOLEAN DEFAULT false
);

CREATE TABLE retrabajo (
  retrabajo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  finding_id UUID REFERENCES findings(finding_id),
  tarea_id UUID REFERENCES tarea(tarea_id),
  responsable_id UUID,
  estado TEXT,
  fecha_limite DATE
);

-- ============================================
-- CONFIGURACIÓN DEL SISTEMA
-- ============================================

CREATE TABLE config_sistema (
  config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave TEXT NOT NULL UNIQUE,
  valor JSONB NOT NULL DEFAULT '{}',
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE system_log (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_log_tipo ON system_log(tipo, created_at DESC);
CREATE INDEX idx_config_sistema_clave ON config_sistema(clave);

-- ============================================
-- DATOS INICIALES (SEED)
-- ============================================

-- Tallas
INSERT INTO talla (talla_id, ponderacion) VALUES
  ('EXTRA_CHICA', 50),
  ('CHICA', 75),
  ('MEDIANA', 100),
  ('GRANDE', 150),
  ('EXTRA_GRANDE', 200);

-- Procesos operativos
INSERT INTO proceso_operativo (proceso_id, nombre) VALUES
  ('NOMINA', 'Nómina'),
  ('IMSS', 'IMSS');

-- Pasos de Nómina (Recurrente)
INSERT INTO proceso_paso (proceso_id, paso_id, nombre, orden, peso_pct, tipo_colaborador, grupo_concurrencia) VALUES
  ('NOMINA', 'CONSULTA_INCIDENCIAS', 'Consulta de incidencias', 1, 30, 'C', 1),
  ('NOMINA', 'CAPTURA_INCIDENCIAS', 'Captura de incidencias', 2, 30, 'C', 1),
  ('NOMINA', 'PROCESAR_NOMINA', 'Procesar nómina', 3, 30, 'C', 2),
  ('NOMINA', 'TIMBRAR_NOMINA', 'Timbrar nómina', 4, 5, 'C', 3),
  ('NOMINA', 'ENVIAR_NOMINA', 'Enviar nómina', 5, 5, 'C', 3);

-- Pasos de IMSS (Recurrente)
INSERT INTO proceso_paso (proceso_id, paso_id, nombre, orden, peso_pct, tipo_colaborador, grupo_concurrencia) VALUES
  ('IMSS', 'CAPTURA_MOV_IDSE', 'Captura de mov. ante IDSE', 1, 20, 'B', 1),
  ('IMSS', 'CAPTURA_MOV_NOMINAX', 'Captura de mov. ante Nominax', 2, 15, 'B', 1),
  ('IMSS', 'CAPTURA_MOV_SUA', 'Captura de mov. ante SUA', 3, 15, 'B', 1),
  ('IMSS', 'DESCARGA_IDSE', 'Descarga de IDSE', 4, 15, 'C', 2),
  ('IMSS', 'DESCARGA_SIPARE', 'Descarga de SIPARE', 5, 5, 'C', 2),
  ('IMSS', 'DESCARGA_REPORTES_NOMINAX', 'Descarga de reportes de Nominax', 6, 5, 'C', 2),
  ('IMSS', 'COTEJO', 'Cotejo entre IDSE, SIPARE, SUA, Nominax', 7, 25, 'A', 3);

-- Regímenes fiscales principales
INSERT INTO regimen_fiscal (c_regimen, descripcion, tipo_persona) VALUES
  ('601', 'Régimen General de Ley Personas Morales', 'PM'),
  ('612', 'Personas Físicas con Actividades Empresariales y Profesionales', 'PF'),
  ('625', 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', 'PF'),
  ('626', 'Régimen Simplificado de Confianza', 'AMBOS');

-- Configuración SLA por estado
INSERT INTO sla_config (estado, descripcion, sla_activo, sla_pausado, dias_sla_default, orden_flujo, es_estado_final, color_ui) VALUES
  ('pendiente', 'No iniciado', true, false, NULL, 1, false, 'slate'),
  ('en_curso', 'Trabajo activo', true, false, NULL, 2, false, 'blue'),
  ('pendiente_evidencia', 'Falta subir comprobantes', true, false, 2, 3, false, 'amber'),
  ('en_validacion', 'Revisión líder', true, false, 1, 4, false, 'purple'),
  ('bloqueado_cliente', 'Falta info/pago cliente', false, true, NULL, 5, false, 'red'),
  ('presentado', 'Enviado a autoridad', true, false, NULL, 6, false, 'teal'),
  ('pagado', 'Pago confirmado', false, false, NULL, 7, true, 'green'),
  ('cerrado', 'Completado', false, false, NULL, 8, true, 'green'),
  ('rechazado', 'Rechazado/Error', false, false, NULL, 9, true, 'red');

-- Vinculación obligación → proceso operativo
INSERT INTO obligacion_proceso (id_obligacion, proceso_id) VALUES
  ('OBL-NOMINA-Q', 'NOMINA'),
  ('OBL-IMSS-M', 'IMSS');
