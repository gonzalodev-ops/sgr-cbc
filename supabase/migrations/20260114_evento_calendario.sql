-- Tabla de eventos personalizados para el calendario
CREATE TABLE IF NOT EXISTS evento_calendario (
  evento_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL,
  hora TIME,
  tipo TEXT CHECK (tipo IN ('REUNION', 'RECORDATORIO', 'OTRO')),
  usuario_id UUID REFERENCES users(user_id),
  equipo_id UUID REFERENCES teams(team_id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el performance
CREATE INDEX idx_evento_fecha ON evento_calendario(fecha);
CREATE INDEX idx_evento_usuario ON evento_calendario(usuario_id);
CREATE INDEX idx_evento_equipo ON evento_calendario(equipo_id);
CREATE INDEX idx_evento_activo ON evento_calendario(activo);

-- Trigger para actualizar updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON evento_calendario
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE evento_calendario IS 'Eventos personalizados para el calendario fiscal';
COMMENT ON COLUMN evento_calendario.tipo IS 'Tipo de evento: REUNION, RECORDATORIO, OTRO';
