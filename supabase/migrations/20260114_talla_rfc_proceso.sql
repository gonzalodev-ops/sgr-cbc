-- Tabla de configuración granular: Talla por RFC + Proceso
-- Permite establecer tallas específicas por combinación contribuyente-proceso
-- que sobrescriben la talla default del contribuyente

CREATE TABLE IF NOT EXISTS contribuyente_proceso_talla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contribuyente_id UUID NOT NULL REFERENCES contribuyente(contribuyente_id),
  proceso_id TEXT NOT NULL REFERENCES proceso_operativo(proceso_id),
  talla_id TEXT NOT NULL REFERENCES talla(talla_id),
  vigencia_inicio DATE DEFAULT CURRENT_DATE,
  vigencia_fin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(user_id),
  UNIQUE(contribuyente_id, proceso_id, vigencia_inicio)
);

-- Índices para mejorar performance en consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_cpt_contribuyente ON contribuyente_proceso_talla(contribuyente_id);
CREATE INDEX IF NOT EXISTS idx_cpt_proceso ON contribuyente_proceso_talla(proceso_id);
CREATE INDEX IF NOT EXISTS idx_cpt_vigencia ON contribuyente_proceso_talla(vigencia_fin) WHERE vigencia_fin IS NULL;

-- Comentarios
COMMENT ON TABLE contribuyente_proceso_talla IS 'Configuración granular de talla por RFC + Proceso operativo. Sobrescribe talla default del contribuyente.';
COMMENT ON COLUMN contribuyente_proceso_talla.vigencia_inicio IS 'Fecha desde la cual aplica esta configuración de talla';
COMMENT ON COLUMN contribuyente_proceso_talla.vigencia_fin IS 'Fecha hasta la cual aplica. NULL = vigente';
COMMENT ON COLUMN contribuyente_proceso_talla.talla_id IS 'Talla específica para este contribuyente en este proceso: EXTRA_CHICA, CHICA, MEDIANA, GRANDE, EXTRA_GRANDE';
