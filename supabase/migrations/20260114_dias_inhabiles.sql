-- Tabla de días inhábiles (feriados, puentes, etc.)
CREATE TABLE IF NOT EXISTS dia_inhabil (
  dia_inhabil_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('FERIADO', 'PUENTE', 'ESPECIAL')),
  anio INTEGER NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el performance
CREATE INDEX IF NOT EXISTS idx_dia_inhabil_fecha ON dia_inhabil(fecha);
CREATE INDEX IF NOT EXISTS idx_dia_inhabil_anio ON dia_inhabil(anio);
CREATE INDEX IF NOT EXISTS idx_dia_inhabil_activo ON dia_inhabil(activo);

-- Comentarios
COMMENT ON TABLE dia_inhabil IS 'Catálogo de días inhábiles: feriados oficiales, puentes y días especiales';
COMMENT ON COLUMN dia_inhabil.tipo IS 'Tipo de día inhábil: FERIADO (oficial SAT), PUENTE, ESPECIAL';
COMMENT ON COLUMN dia_inhabil.anio IS 'Año al que corresponde el día inhábil';
COMMENT ON COLUMN dia_inhabil.activo IS 'Indica si el día inhábil está activo en el sistema';
