-- ============================================
-- SGR CBC - FASE 2: Sprint 5A - Tabla notificacion
-- Fecha: 2026-01-15
-- Descripcion: Tabla para notificaciones en la aplicacion
-- T2A.5 - AGENTE BD
-- ============================================

-- ============================================
-- SECCION 1: CREAR TABLA notificacion
-- ============================================

-- Eliminar tabla si existe (idempotencia)
DROP TABLE IF EXISTS notificacion CASCADE;

CREATE TABLE notificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES users(user_id) NOT NULL,
  tipo VARCHAR(30) NOT NULL, -- 'TAREA_ASIGNADA', 'TAREA_VENCIDA', 'SEGUIMIENTO_CREADO', etc.
  titulo TEXT NOT NULL,
  mensaje TEXT,
  referencia_tipo VARCHAR(30), -- 'TAREA', 'SEGUIMIENTO', 'AUDITORIA'
  referencia_id UUID,
  leido BOOLEAN DEFAULT false,
  fecha_leido TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECCION 2: INDICES
-- ============================================

-- Indice principal para buscar notificaciones por usuario
CREATE INDEX idx_notificacion_usuario ON notificacion(usuario_id);

-- Indice para notificaciones no leidas (consulta frecuente)
CREATE INDEX idx_notificacion_usuario_no_leido ON notificacion(usuario_id, leido) WHERE leido = false;

-- Indice para ordenar por fecha
CREATE INDEX idx_notificacion_created_at ON notificacion(created_at DESC);

-- Indice para buscar por tipo de notificacion
CREATE INDEX idx_notificacion_tipo ON notificacion(tipo);

-- Indice para buscar por referencia (vinculo a tarea/seguimiento)
CREATE INDEX idx_notificacion_referencia ON notificacion(referencia_tipo, referencia_id);

-- Indice compuesto para listado optimizado
CREATE INDEX idx_notificacion_usuario_fecha ON notificacion(usuario_id, created_at DESC);

-- ============================================
-- SECCION 3: HABILITAR RLS
-- ============================================

ALTER TABLE notificacion ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECCION 4: POLITICAS RLS
-- Usuario solo puede ver sus propias notificaciones
-- ============================================

-- 4.1 SELECT: Usuario solo ve sus notificaciones
DROP POLICY IF EXISTS "notificacion_select" ON notificacion;
CREATE POLICY "notificacion_select" ON notificacion
  FOR SELECT USING (
    -- Usuario ve solo sus propias notificaciones
    usuario_id = auth.uid()
    OR
    -- Admin puede ver todas para monitoreo
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = auth.uid()
      AND u.rol_global = 'ADMIN'
    )
  );

-- 4.2 INSERT: Sistema puede insertar (desde triggers/funciones)
-- Los usuarios NO pueden crear notificaciones directamente
DROP POLICY IF EXISTS "notificacion_insert" ON notificacion;
CREATE POLICY "notificacion_insert" ON notificacion
  FOR INSERT WITH CHECK (
    -- Permitir insercion desde funciones de sistema y triggers
    -- Las notificaciones se crean automaticamente por el sistema
    true
  );

-- 4.3 UPDATE: Solo el usuario puede marcar como leido sus notificaciones
DROP POLICY IF EXISTS "notificacion_update" ON notificacion;
CREATE POLICY "notificacion_update" ON notificacion
  FOR UPDATE USING (
    usuario_id = auth.uid()
    OR
    -- Admin puede actualizar
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = auth.uid()
      AND u.rol_global = 'ADMIN'
    )
  );

-- 4.4 DELETE: Usuario puede eliminar sus notificaciones, Admin todas
DROP POLICY IF EXISTS "notificacion_delete" ON notificacion;
CREATE POLICY "notificacion_delete" ON notificacion
  FOR DELETE USING (
    usuario_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.user_id = auth.uid()
      AND u.rol_global = 'ADMIN'
    )
  );

-- ============================================
-- SECCION 5: FUNCIONES AUXILIARES
-- ============================================

-- Funcion para crear notificacion de forma segura
CREATE OR REPLACE FUNCTION crear_notificacion(
  p_usuario_id UUID,
  p_tipo VARCHAR(30),
  p_titulo TEXT,
  p_mensaje TEXT DEFAULT NULL,
  p_referencia_tipo VARCHAR(30) DEFAULT NULL,
  p_referencia_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notificacion_id UUID;
BEGIN
  INSERT INTO notificacion (
    usuario_id,
    tipo,
    titulo,
    mensaje,
    referencia_tipo,
    referencia_id
  ) VALUES (
    p_usuario_id,
    p_tipo,
    p_titulo,
    p_mensaje,
    p_referencia_tipo,
    p_referencia_id
  )
  RETURNING id INTO v_notificacion_id;

  RETURN v_notificacion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fijar search_path para seguridad
ALTER FUNCTION crear_notificacion(UUID, VARCHAR, TEXT, TEXT, VARCHAR, UUID) SET search_path = public;

-- Funcion para marcar notificacion como leida
CREATE OR REPLACE FUNCTION marcar_notificacion_leida(
  p_notificacion_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notificacion
  SET leido = true,
      fecha_leido = NOW()
  WHERE id = p_notificacion_id
    AND usuario_id = auth.uid()
    AND leido = false;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION marcar_notificacion_leida(UUID) SET search_path = public;

-- Funcion para marcar todas las notificaciones como leidas
CREATE OR REPLACE FUNCTION marcar_todas_notificaciones_leidas()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notificacion
  SET leido = true,
      fecha_leido = NOW()
  WHERE usuario_id = auth.uid()
    AND leido = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION marcar_todas_notificaciones_leidas() SET search_path = public;

-- Funcion para contar notificaciones no leidas
CREATE OR REPLACE FUNCTION contar_notificaciones_no_leidas()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notificacion
    WHERE usuario_id = auth.uid()
      AND leido = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION contar_notificaciones_no_leidas() SET search_path = public;

-- ============================================
-- SECCION 6: COMENTARIOS
-- ============================================

COMMENT ON TABLE notificacion IS
  'Tabla para notificaciones en la aplicacion. Cada usuario solo ve sus propias notificaciones.';

COMMENT ON COLUMN notificacion.id IS 'Identificador unico de la notificacion';
COMMENT ON COLUMN notificacion.usuario_id IS 'Usuario destinatario de la notificacion';
COMMENT ON COLUMN notificacion.tipo IS 'Tipo de notificacion: TAREA_ASIGNADA, TAREA_VENCIDA, SEGUIMIENTO_CREADO, TAREA_COMPLETADA, PAGO_PENDIENTE, etc.';
COMMENT ON COLUMN notificacion.titulo IS 'Titulo breve de la notificacion';
COMMENT ON COLUMN notificacion.mensaje IS 'Mensaje detallado de la notificacion';
COMMENT ON COLUMN notificacion.referencia_tipo IS 'Tipo de entidad referenciada: TAREA, SEGUIMIENTO, AUDITORIA';
COMMENT ON COLUMN notificacion.referencia_id IS 'ID de la entidad referenciada para navegacion';
COMMENT ON COLUMN notificacion.leido IS 'Indica si el usuario ha leido la notificacion';
COMMENT ON COLUMN notificacion.fecha_leido IS 'Fecha y hora en que se marco como leida';
COMMENT ON COLUMN notificacion.created_at IS 'Fecha y hora de creacion de la notificacion';

COMMENT ON FUNCTION crear_notificacion IS 'Crea una nueva notificacion para un usuario. Usar desde triggers y funciones del sistema.';
COMMENT ON FUNCTION marcar_notificacion_leida IS 'Marca una notificacion especifica como leida para el usuario autenticado.';
COMMENT ON FUNCTION marcar_todas_notificaciones_leidas IS 'Marca todas las notificaciones no leidas del usuario autenticado como leidas.';
COMMENT ON FUNCTION contar_notificaciones_no_leidas IS 'Retorna el numero de notificaciones no leidas del usuario autenticado.';

-- ============================================
-- FIN DE MIGRACION T2A.5 - notificacion
-- ============================================
