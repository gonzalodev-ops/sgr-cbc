-- Tabla de log de ajustes de fecha límite de tareas
CREATE TABLE IF NOT EXISTS fecha_ajuste_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tarea_id UUID NOT NULL REFERENCES tarea(tarea_id),
  fecha_anterior DATE NOT NULL,
  fecha_nueva DATE NOT NULL,
  motivo TEXT NOT NULL,
  usuario_id UUID NOT NULL REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fecha_diferente CHECK (fecha_anterior <> fecha_nueva)
);

-- Índices para mejorar el performance
CREATE INDEX IF NOT EXISTS idx_fecha_ajuste_tarea ON fecha_ajuste_log(tarea_id);
CREATE INDEX IF NOT EXISTS idx_fecha_ajuste_usuario ON fecha_ajuste_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_fecha_ajuste_created ON fecha_ajuste_log(created_at DESC);

-- Comentarios
COMMENT ON TABLE fecha_ajuste_log IS 'Registro de auditoría de cambios en fechas límite de tareas';
COMMENT ON COLUMN fecha_ajuste_log.fecha_anterior IS 'Fecha límite anterior antes del cambio';
COMMENT ON COLUMN fecha_ajuste_log.fecha_nueva IS 'Nueva fecha límite después del cambio';
COMMENT ON COLUMN fecha_ajuste_log.motivo IS 'Motivo obligatorio del cambio de fecha (mínimo 10 caracteres)';
COMMENT ON COLUMN fecha_ajuste_log.usuario_id IS 'Usuario que realizó el cambio (debe tener rol LIDER, SOCIO o ADMIN)';
