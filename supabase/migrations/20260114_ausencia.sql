-- Tabla de ausencias de colaboradores
CREATE TABLE IF NOT EXISTS ausencia (
  ausencia_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES users(user_id),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('VACACIONES', 'INCAPACIDAD', 'PERMISO', 'OTRO')),
  suplente_id UUID REFERENCES users(user_id),
  motivo TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(user_id),
  CONSTRAINT fecha_fin_mayor_inicio CHECK (fecha_fin >= fecha_inicio)
);

-- Índices para mejorar el performance
CREATE INDEX IF NOT EXISTS idx_ausencia_colaborador ON ausencia(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_ausencia_fechas ON ausencia(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_ausencia_suplente ON ausencia(suplente_id);
CREATE INDEX IF NOT EXISTS idx_ausencia_activo ON ausencia(activo);

-- Comentarios
COMMENT ON TABLE ausencia IS 'Registro de ausencias de colaboradores (vacaciones, incapacidades, permisos)';
COMMENT ON COLUMN ausencia.tipo IS 'Tipo de ausencia: VACACIONES, INCAPACIDAD, PERMISO, OTRO';
COMMENT ON COLUMN ausencia.suplente_id IS 'Colaborador que suplirá al ausente (opcional)';
COMMENT ON COLUMN ausencia.activo IS 'Indica si la ausencia está activa o fue cancelada';
