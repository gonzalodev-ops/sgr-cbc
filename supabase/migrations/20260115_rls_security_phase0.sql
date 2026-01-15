-- ============================================
-- SGR CBC - FASE 0: Sprint 2.5a - Seguridad RLS
-- Fecha: 2026-01-15
-- Descripción: Habilitar RLS y crear políticas para todas las tablas
-- ============================================

-- ============================================
-- SECCIÓN 1: HABILITAR RLS EN TABLAS FALTANTES
-- ============================================

-- 1.1 CATÁLOGOS (16 tablas) - Ya tienen datos de referencia
ALTER TABLE IF EXISTS regimen_fiscal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS obligacion_fiscal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS regimen_obligacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS servicio_obligacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entregable ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entregable_obligacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS regimen_entregable_peso ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS talla ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proceso_operativo ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proceso_paso ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendario_regla ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendario_regla_obligacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS obligacion_proceso ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS obligacion_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sla_config ENABLE ROW LEVEL SECURITY;

-- 1.2 TABLAS OPERATIVAS (9 tablas)
ALTER TABLE IF EXISTS contribuyente_regimen ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cliente_servicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cliente_talla ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendario_deadline ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS evento_calendario ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ausencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dia_inhabil ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fecha_ajuste_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contribuyente_proceso_talla ENABLE ROW LEVEL SECURITY;

-- 1.3 TABLAS SENSIBLES (6 tablas)
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS retrabajo ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS config_sistema ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECCIÓN 2: POLÍTICAS PARA CATÁLOGOS
-- Patrón: Lectura pública, escritura solo ADMIN/SOCIO
-- ============================================

-- Helper function si no existe
CREATE OR REPLACE FUNCTION is_admin_or_socio()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = (SELECT auth.uid())
    AND rol_global IN ('ADMIN', 'SOCIO')
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 2.1 regimen_fiscal
DROP POLICY IF EXISTS "regimen_fiscal_select" ON regimen_fiscal;
DROP POLICY IF EXISTS "regimen_fiscal_insert" ON regimen_fiscal;
DROP POLICY IF EXISTS "regimen_fiscal_update" ON regimen_fiscal;
DROP POLICY IF EXISTS "regimen_fiscal_delete" ON regimen_fiscal;

CREATE POLICY "regimen_fiscal_select" ON regimen_fiscal
  FOR SELECT USING (true);
CREATE POLICY "regimen_fiscal_insert" ON regimen_fiscal
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "regimen_fiscal_update" ON regimen_fiscal
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "regimen_fiscal_delete" ON regimen_fiscal
  FOR DELETE USING (is_admin_or_socio());

-- 2.2 obligacion_fiscal
DROP POLICY IF EXISTS "obligacion_fiscal_select" ON obligacion_fiscal;
DROP POLICY IF EXISTS "obligacion_fiscal_insert" ON obligacion_fiscal;
DROP POLICY IF EXISTS "obligacion_fiscal_update" ON obligacion_fiscal;
DROP POLICY IF EXISTS "obligacion_fiscal_delete" ON obligacion_fiscal;

CREATE POLICY "obligacion_fiscal_select" ON obligacion_fiscal
  FOR SELECT USING (true);
CREATE POLICY "obligacion_fiscal_insert" ON obligacion_fiscal
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "obligacion_fiscal_update" ON obligacion_fiscal
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "obligacion_fiscal_delete" ON obligacion_fiscal
  FOR DELETE USING (is_admin_or_socio());

-- 2.3 regimen_obligacion
DROP POLICY IF EXISTS "regimen_obligacion_select" ON regimen_obligacion;
DROP POLICY IF EXISTS "regimen_obligacion_insert" ON regimen_obligacion;
DROP POLICY IF EXISTS "regimen_obligacion_update" ON regimen_obligacion;
DROP POLICY IF EXISTS "regimen_obligacion_delete" ON regimen_obligacion;

CREATE POLICY "regimen_obligacion_select" ON regimen_obligacion
  FOR SELECT USING (true);
CREATE POLICY "regimen_obligacion_insert" ON regimen_obligacion
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "regimen_obligacion_update" ON regimen_obligacion
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "regimen_obligacion_delete" ON regimen_obligacion
  FOR DELETE USING (is_admin_or_socio());

-- 2.4 servicio
DROP POLICY IF EXISTS "servicio_select" ON servicio;
DROP POLICY IF EXISTS "servicio_insert" ON servicio;
DROP POLICY IF EXISTS "servicio_update" ON servicio;
DROP POLICY IF EXISTS "servicio_delete" ON servicio;

CREATE POLICY "servicio_select" ON servicio
  FOR SELECT USING (true);
CREATE POLICY "servicio_insert" ON servicio
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "servicio_update" ON servicio
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "servicio_delete" ON servicio
  FOR DELETE USING (is_admin_or_socio());

-- 2.5 servicio_obligacion
DROP POLICY IF EXISTS "servicio_obligacion_select" ON servicio_obligacion;
DROP POLICY IF EXISTS "servicio_obligacion_insert" ON servicio_obligacion;
DROP POLICY IF EXISTS "servicio_obligacion_update" ON servicio_obligacion;
DROP POLICY IF EXISTS "servicio_obligacion_delete" ON servicio_obligacion;

CREATE POLICY "servicio_obligacion_select" ON servicio_obligacion
  FOR SELECT USING (true);
CREATE POLICY "servicio_obligacion_insert" ON servicio_obligacion
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "servicio_obligacion_update" ON servicio_obligacion
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "servicio_obligacion_delete" ON servicio_obligacion
  FOR DELETE USING (is_admin_or_socio());

-- 2.6 entregable
DROP POLICY IF EXISTS "entregable_select" ON entregable;
DROP POLICY IF EXISTS "entregable_insert" ON entregable;
DROP POLICY IF EXISTS "entregable_update" ON entregable;
DROP POLICY IF EXISTS "entregable_delete" ON entregable;

CREATE POLICY "entregable_select" ON entregable
  FOR SELECT USING (true);
CREATE POLICY "entregable_insert" ON entregable
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "entregable_update" ON entregable
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "entregable_delete" ON entregable
  FOR DELETE USING (is_admin_or_socio());

-- 2.7 entregable_obligacion
DROP POLICY IF EXISTS "entregable_obligacion_select" ON entregable_obligacion;
DROP POLICY IF EXISTS "entregable_obligacion_insert" ON entregable_obligacion;
DROP POLICY IF EXISTS "entregable_obligacion_update" ON entregable_obligacion;
DROP POLICY IF EXISTS "entregable_obligacion_delete" ON entregable_obligacion;

CREATE POLICY "entregable_obligacion_select" ON entregable_obligacion
  FOR SELECT USING (true);
CREATE POLICY "entregable_obligacion_insert" ON entregable_obligacion
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "entregable_obligacion_update" ON entregable_obligacion
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "entregable_obligacion_delete" ON entregable_obligacion
  FOR DELETE USING (is_admin_or_socio());

-- 2.8 regimen_entregable_peso
DROP POLICY IF EXISTS "regimen_entregable_peso_select" ON regimen_entregable_peso;
DROP POLICY IF EXISTS "regimen_entregable_peso_insert" ON regimen_entregable_peso;
DROP POLICY IF EXISTS "regimen_entregable_peso_update" ON regimen_entregable_peso;
DROP POLICY IF EXISTS "regimen_entregable_peso_delete" ON regimen_entregable_peso;

CREATE POLICY "regimen_entregable_peso_select" ON regimen_entregable_peso
  FOR SELECT USING (true);
CREATE POLICY "regimen_entregable_peso_insert" ON regimen_entregable_peso
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "regimen_entregable_peso_update" ON regimen_entregable_peso
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "regimen_entregable_peso_delete" ON regimen_entregable_peso
  FOR DELETE USING (is_admin_or_socio());

-- 2.9 talla
DROP POLICY IF EXISTS "talla_select" ON talla;
DROP POLICY IF EXISTS "talla_insert" ON talla;
DROP POLICY IF EXISTS "talla_update" ON talla;
DROP POLICY IF EXISTS "talla_delete" ON talla;

CREATE POLICY "talla_select" ON talla
  FOR SELECT USING (true);
CREATE POLICY "talla_insert" ON talla
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "talla_update" ON talla
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "talla_delete" ON talla
  FOR DELETE USING (is_admin_or_socio());

-- 2.10 proceso_operativo
DROP POLICY IF EXISTS "proceso_operativo_select" ON proceso_operativo;
DROP POLICY IF EXISTS "proceso_operativo_insert" ON proceso_operativo;
DROP POLICY IF EXISTS "proceso_operativo_update" ON proceso_operativo;
DROP POLICY IF EXISTS "proceso_operativo_delete" ON proceso_operativo;

CREATE POLICY "proceso_operativo_select" ON proceso_operativo
  FOR SELECT USING (true);
CREATE POLICY "proceso_operativo_insert" ON proceso_operativo
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "proceso_operativo_update" ON proceso_operativo
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "proceso_operativo_delete" ON proceso_operativo
  FOR DELETE USING (is_admin_or_socio());

-- 2.11 proceso_paso
DROP POLICY IF EXISTS "proceso_paso_select" ON proceso_paso;
DROP POLICY IF EXISTS "proceso_paso_insert" ON proceso_paso;
DROP POLICY IF EXISTS "proceso_paso_update" ON proceso_paso;
DROP POLICY IF EXISTS "proceso_paso_delete" ON proceso_paso;

CREATE POLICY "proceso_paso_select" ON proceso_paso
  FOR SELECT USING (true);
CREATE POLICY "proceso_paso_insert" ON proceso_paso
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "proceso_paso_update" ON proceso_paso
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "proceso_paso_delete" ON proceso_paso
  FOR DELETE USING (is_admin_or_socio());

-- 2.12 calendario_regla
DROP POLICY IF EXISTS "calendario_regla_select" ON calendario_regla;
DROP POLICY IF EXISTS "calendario_regla_insert" ON calendario_regla;
DROP POLICY IF EXISTS "calendario_regla_update" ON calendario_regla;
DROP POLICY IF EXISTS "calendario_regla_delete" ON calendario_regla;

CREATE POLICY "calendario_regla_select" ON calendario_regla
  FOR SELECT USING (true);
CREATE POLICY "calendario_regla_insert" ON calendario_regla
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "calendario_regla_update" ON calendario_regla
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "calendario_regla_delete" ON calendario_regla
  FOR DELETE USING (is_admin_or_socio());

-- 2.13 calendario_regla_obligacion
DROP POLICY IF EXISTS "calendario_regla_obligacion_select" ON calendario_regla_obligacion;
DROP POLICY IF EXISTS "calendario_regla_obligacion_insert" ON calendario_regla_obligacion;
DROP POLICY IF EXISTS "calendario_regla_obligacion_update" ON calendario_regla_obligacion;
DROP POLICY IF EXISTS "calendario_regla_obligacion_delete" ON calendario_regla_obligacion;

CREATE POLICY "calendario_regla_obligacion_select" ON calendario_regla_obligacion
  FOR SELECT USING (true);
CREATE POLICY "calendario_regla_obligacion_insert" ON calendario_regla_obligacion
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "calendario_regla_obligacion_update" ON calendario_regla_obligacion
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "calendario_regla_obligacion_delete" ON calendario_regla_obligacion
  FOR DELETE USING (is_admin_or_socio());

-- 2.14 obligacion_proceso
DROP POLICY IF EXISTS "obligacion_proceso_select" ON obligacion_proceso;
DROP POLICY IF EXISTS "obligacion_proceso_insert" ON obligacion_proceso;
DROP POLICY IF EXISTS "obligacion_proceso_update" ON obligacion_proceso;
DROP POLICY IF EXISTS "obligacion_proceso_delete" ON obligacion_proceso;

CREATE POLICY "obligacion_proceso_select" ON obligacion_proceso
  FOR SELECT USING (true);
CREATE POLICY "obligacion_proceso_insert" ON obligacion_proceso
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "obligacion_proceso_update" ON obligacion_proceso
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "obligacion_proceso_delete" ON obligacion_proceso
  FOR DELETE USING (is_admin_or_socio());

-- 2.15 obligacion_calendario
DROP POLICY IF EXISTS "obligacion_calendario_select" ON obligacion_calendario;
DROP POLICY IF EXISTS "obligacion_calendario_insert" ON obligacion_calendario;
DROP POLICY IF EXISTS "obligacion_calendario_update" ON obligacion_calendario;
DROP POLICY IF EXISTS "obligacion_calendario_delete" ON obligacion_calendario;

CREATE POLICY "obligacion_calendario_select" ON obligacion_calendario
  FOR SELECT USING (true);
CREATE POLICY "obligacion_calendario_insert" ON obligacion_calendario
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "obligacion_calendario_update" ON obligacion_calendario
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "obligacion_calendario_delete" ON obligacion_calendario
  FOR DELETE USING (is_admin_or_socio());

-- 2.16 sla_config
DROP POLICY IF EXISTS "sla_config_select" ON sla_config;
DROP POLICY IF EXISTS "sla_config_insert" ON sla_config;
DROP POLICY IF EXISTS "sla_config_update" ON sla_config;
DROP POLICY IF EXISTS "sla_config_delete" ON sla_config;

CREATE POLICY "sla_config_select" ON sla_config
  FOR SELECT USING (true);
CREATE POLICY "sla_config_insert" ON sla_config
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "sla_config_update" ON sla_config
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "sla_config_delete" ON sla_config
  FOR DELETE USING (is_admin_or_socio());

-- ============================================
-- SECCIÓN 3: POLÍTICAS PARA TABLAS OPERATIVAS
-- Patrón: RLS por equipo/usuario según contexto
-- ============================================

-- Helper function para obtener equipos del usuario
CREATE OR REPLACE FUNCTION get_user_teams()
RETURNS SETOF UUID AS $$
  SELECT team_id FROM team_members
  WHERE user_id = (SELECT auth.uid()) AND activo = true;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- 3.1 contribuyente_regimen - Acceso según contribuyente
DROP POLICY IF EXISTS "contribuyente_regimen_select" ON contribuyente_regimen;
DROP POLICY IF EXISTS "contribuyente_regimen_insert" ON contribuyente_regimen;
DROP POLICY IF EXISTS "contribuyente_regimen_update" ON contribuyente_regimen;
DROP POLICY IF EXISTS "contribuyente_regimen_delete" ON contribuyente_regimen;

CREATE POLICY "contribuyente_regimen_select" ON contribuyente_regimen
  FOR SELECT USING (
    -- Admin/Socio ven todo
    is_admin_or_socio()
    OR
    -- Usuarios ven contribuyentes de clientes accesibles
    EXISTS (
      SELECT 1 FROM cliente_contribuyente cc
      JOIN cliente c ON c.cliente_id = cc.cliente_id
      WHERE cc.contribuyente_id = contribuyente_regimen.contribuyente_id
      AND (
        c.team_id IN (SELECT get_user_teams())
        OR EXISTS (
          SELECT 1 FROM tarea t
          WHERE t.cliente_id = c.cliente_id
          AND t.responsable_usuario_id = (SELECT auth.uid())
        )
      )
    )
  );

CREATE POLICY "contribuyente_regimen_insert" ON contribuyente_regimen
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "contribuyente_regimen_update" ON contribuyente_regimen
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "contribuyente_regimen_delete" ON contribuyente_regimen
  FOR DELETE USING (is_admin_or_socio());

-- 3.2 cliente_servicio - Acceso según cliente
DROP POLICY IF EXISTS "cliente_servicio_select" ON cliente_servicio;
DROP POLICY IF EXISTS "cliente_servicio_insert" ON cliente_servicio;
DROP POLICY IF EXISTS "cliente_servicio_update" ON cliente_servicio;
DROP POLICY IF EXISTS "cliente_servicio_delete" ON cliente_servicio;

CREATE POLICY "cliente_servicio_select" ON cliente_servicio
  FOR SELECT USING (
    is_admin_or_socio()
    OR
    EXISTS (
      SELECT 1 FROM cliente c
      WHERE c.cliente_id = cliente_servicio.cliente_id
      AND (
        c.team_id IN (SELECT get_user_teams())
        OR EXISTS (
          SELECT 1 FROM tarea t
          WHERE t.cliente_id = c.cliente_id
          AND t.responsable_usuario_id = (SELECT auth.uid())
        )
      )
    )
  );

CREATE POLICY "cliente_servicio_insert" ON cliente_servicio
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "cliente_servicio_update" ON cliente_servicio
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "cliente_servicio_delete" ON cliente_servicio
  FOR DELETE USING (is_admin_or_socio());

-- 3.3 cliente_talla - Acceso según cliente
DROP POLICY IF EXISTS "cliente_talla_select" ON cliente_talla;
DROP POLICY IF EXISTS "cliente_talla_insert" ON cliente_talla;
DROP POLICY IF EXISTS "cliente_talla_update" ON cliente_talla;
DROP POLICY IF EXISTS "cliente_talla_delete" ON cliente_talla;

CREATE POLICY "cliente_talla_select" ON cliente_talla
  FOR SELECT USING (
    is_admin_or_socio()
    OR
    EXISTS (
      SELECT 1 FROM cliente c
      WHERE c.cliente_id = cliente_talla.cliente_id
      AND (
        c.team_id IN (SELECT get_user_teams())
        OR EXISTS (
          SELECT 1 FROM tarea t
          WHERE t.cliente_id = c.cliente_id
          AND t.responsable_usuario_id = (SELECT auth.uid())
        )
      )
    )
  );

CREATE POLICY "cliente_talla_insert" ON cliente_talla
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "cliente_talla_update" ON cliente_talla
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "cliente_talla_delete" ON cliente_talla
  FOR DELETE USING (is_admin_or_socio());

-- 3.4 calendario_deadline - Lectura para todos los autenticados
DROP POLICY IF EXISTS "calendario_deadline_select" ON calendario_deadline;
DROP POLICY IF EXISTS "calendario_deadline_insert" ON calendario_deadline;
DROP POLICY IF EXISTS "calendario_deadline_update" ON calendario_deadline;
DROP POLICY IF EXISTS "calendario_deadline_delete" ON calendario_deadline;

CREATE POLICY "calendario_deadline_select" ON calendario_deadline
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "calendario_deadline_insert" ON calendario_deadline
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "calendario_deadline_update" ON calendario_deadline
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "calendario_deadline_delete" ON calendario_deadline
  FOR DELETE USING (is_admin_or_socio());

-- 3.5 evento_calendario - Por usuario/equipo
DROP POLICY IF EXISTS "evento_calendario_select" ON evento_calendario;
DROP POLICY IF EXISTS "evento_calendario_insert" ON evento_calendario;
DROP POLICY IF EXISTS "evento_calendario_update" ON evento_calendario;
DROP POLICY IF EXISTS "evento_calendario_delete" ON evento_calendario;

CREATE POLICY "evento_calendario_select" ON evento_calendario
  FOR SELECT USING (
    is_admin_or_socio()
    OR
    usuario_id = (SELECT auth.uid())
    OR
    equipo_id IN (SELECT get_user_teams())
  );

CREATE POLICY "evento_calendario_insert" ON evento_calendario
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR
    usuario_id = (SELECT auth.uid())
  );

CREATE POLICY "evento_calendario_update" ON evento_calendario
  FOR UPDATE USING (
    is_admin_or_socio()
    OR
    usuario_id = (SELECT auth.uid())
  );

CREATE POLICY "evento_calendario_delete" ON evento_calendario
  FOR DELETE USING (
    is_admin_or_socio()
    OR
    usuario_id = (SELECT auth.uid())
  );

-- 3.6 ausencia - Por usuario/equipo/líder
DROP POLICY IF EXISTS "ausencia_select" ON ausencia;
DROP POLICY IF EXISTS "ausencia_insert" ON ausencia;
DROP POLICY IF EXISTS "ausencia_update" ON ausencia;
DROP POLICY IF EXISTS "ausencia_delete" ON ausencia;

CREATE POLICY "ausencia_select" ON ausencia
  FOR SELECT USING (
    is_admin_or_socio()
    OR
    colaborador_id = (SELECT auth.uid())
    OR
    suplente_id = (SELECT auth.uid())
    OR
    -- Líderes ven ausencias de su equipo
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = ausencia.colaborador_id
      AND tm.team_id IN (
        SELECT t.team_id FROM teams t WHERE t.lider_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "ausencia_insert" ON ausencia
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR
    colaborador_id = (SELECT auth.uid())
    OR
    -- Líder puede crear ausencia para su equipo
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.lider_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "ausencia_update" ON ausencia
  FOR UPDATE USING (
    is_admin_or_socio()
    OR
    colaborador_id = (SELECT auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.lider_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "ausencia_delete" ON ausencia
  FOR DELETE USING (is_admin_or_socio());

-- 3.7 dia_inhabil - Lectura para todos, escritura ADMIN
DROP POLICY IF EXISTS "dia_inhabil_select" ON dia_inhabil;
DROP POLICY IF EXISTS "dia_inhabil_insert" ON dia_inhabil;
DROP POLICY IF EXISTS "dia_inhabil_update" ON dia_inhabil;
DROP POLICY IF EXISTS "dia_inhabil_delete" ON dia_inhabil;

CREATE POLICY "dia_inhabil_select" ON dia_inhabil
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "dia_inhabil_insert" ON dia_inhabil
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "dia_inhabil_update" ON dia_inhabil
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "dia_inhabil_delete" ON dia_inhabil
  FOR DELETE USING (is_admin_or_socio());

-- 3.8 fecha_ajuste_log - Lectura autenticados, escritura restringida
DROP POLICY IF EXISTS "fecha_ajuste_log_select" ON fecha_ajuste_log;
DROP POLICY IF EXISTS "fecha_ajuste_log_insert" ON fecha_ajuste_log;
DROP POLICY IF EXISTS "fecha_ajuste_log_update" ON fecha_ajuste_log;
DROP POLICY IF EXISTS "fecha_ajuste_log_delete" ON fecha_ajuste_log;

CREATE POLICY "fecha_ajuste_log_select" ON fecha_ajuste_log
  FOR SELECT USING (
    is_admin_or_socio()
    OR
    usuario_id = (SELECT auth.uid())
    OR
    -- Ver logs de tareas propias o de equipo
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = fecha_ajuste_log.tarea_id
      AND (
        t.responsable_usuario_id = (SELECT auth.uid())
        OR t.team_id IN (SELECT get_user_teams())
      )
    )
  );

CREATE POLICY "fecha_ajuste_log_insert" ON fecha_ajuste_log
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR
    -- Solo crear para tareas propias o de equipo si es líder
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = fecha_ajuste_log.tarea_id
      AND (
        t.responsable_usuario_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM teams tm WHERE tm.lider_id = (SELECT auth.uid())
        )
      )
    )
  );

-- No se permite UPDATE ni DELETE de logs
CREATE POLICY "fecha_ajuste_log_update" ON fecha_ajuste_log
  FOR UPDATE USING (false);
CREATE POLICY "fecha_ajuste_log_delete" ON fecha_ajuste_log
  FOR DELETE USING (false);

-- 3.9 contribuyente_proceso_talla - Lectura autenticados
DROP POLICY IF EXISTS "contribuyente_proceso_talla_select" ON contribuyente_proceso_talla;
DROP POLICY IF EXISTS "contribuyente_proceso_talla_insert" ON contribuyente_proceso_talla;
DROP POLICY IF EXISTS "contribuyente_proceso_talla_update" ON contribuyente_proceso_talla;
DROP POLICY IF EXISTS "contribuyente_proceso_talla_delete" ON contribuyente_proceso_talla;

CREATE POLICY "contribuyente_proceso_talla_select" ON contribuyente_proceso_talla
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "contribuyente_proceso_talla_insert" ON contribuyente_proceso_talla
  FOR INSERT WITH CHECK (is_admin_or_socio());
CREATE POLICY "contribuyente_proceso_talla_update" ON contribuyente_proceso_talla
  FOR UPDATE USING (is_admin_or_socio());
CREATE POLICY "contribuyente_proceso_talla_delete" ON contribuyente_proceso_talla
  FOR DELETE USING (is_admin_or_socio());

-- ============================================
-- SECCIÓN 4: POLÍTICAS PARA TABLAS SENSIBLES
-- ============================================

-- 4.1 users - Solo el propio usuario, líderes de equipo, o ADMIN/SOCIO
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "users_delete" ON users;

CREATE POLICY "users_select" ON users
  FOR SELECT USING (
    is_admin_or_socio()
    OR
    id = (SELECT auth.uid())
    OR
    -- Líder ve usuarios de su equipo
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON t.team_id = tm.team_id
      WHERE tm.user_id = users.id
      AND t.lider_id = (SELECT auth.uid())
    )
    OR
    -- Colaborador ve a su líder y compañeros de equipo
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id IN (SELECT get_user_teams())
      AND tm.user_id = users.id
    )
  );

CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (is_admin_or_socio());

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (
    is_admin_or_socio()
    OR
    id = (SELECT auth.uid())  -- Solo puede actualizar su propio perfil
  );

CREATE POLICY "users_delete" ON users
  FOR DELETE USING (is_admin_or_socio());

-- 4.2 audits - Solo ADMIN/SOCIO/AUDITOR
DROP POLICY IF EXISTS "audits_select" ON audits;
DROP POLICY IF EXISTS "audits_insert" ON audits;
DROP POLICY IF EXISTS "audits_update" ON audits;
DROP POLICY IF EXISTS "audits_delete" ON audits;

CREATE POLICY "audits_select" ON audits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global IN ('ADMIN', 'SOCIO', 'AUDITOR')
    )
  );

CREATE POLICY "audits_insert" ON audits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global IN ('ADMIN', 'SOCIO', 'AUDITOR')
    )
  );

CREATE POLICY "audits_update" ON audits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global IN ('ADMIN', 'SOCIO', 'AUDITOR')
    )
  );

CREATE POLICY "audits_delete" ON audits
  FOR DELETE USING (is_admin_or_socio());

-- 4.3 findings - Solo ADMIN/SOCIO/AUDITOR y colaborador afectado (lectura)
DROP POLICY IF EXISTS "findings_select" ON findings;
DROP POLICY IF EXISTS "findings_insert" ON findings;
DROP POLICY IF EXISTS "findings_update" ON findings;
DROP POLICY IF EXISTS "findings_delete" ON findings;

CREATE POLICY "findings_select" ON findings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global IN ('ADMIN', 'SOCIO', 'AUDITOR')
    )
    OR
    -- Colaborador puede ver hallazgos de sus tareas
    EXISTS (
      SELECT 1 FROM audits a
      JOIN tarea t ON t.tarea_id = a.tarea_id
      WHERE a.audit_id = findings.audit_id
      AND t.responsable_usuario_id = (SELECT auth.uid())
    )
    OR
    -- Líder puede ver hallazgos de tareas de su equipo
    EXISTS (
      SELECT 1 FROM audits a
      JOIN tarea t ON t.tarea_id = a.tarea_id
      WHERE a.audit_id = findings.audit_id
      AND t.team_id IN (
        SELECT tm.team_id FROM teams tm WHERE tm.lider_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "findings_insert" ON findings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global IN ('ADMIN', 'SOCIO', 'AUDITOR')
    )
  );

CREATE POLICY "findings_update" ON findings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global IN ('ADMIN', 'SOCIO', 'AUDITOR')
    )
  );

CREATE POLICY "findings_delete" ON findings
  FOR DELETE USING (is_admin_or_socio());

-- 4.4 retrabajo - Similar a findings
DROP POLICY IF EXISTS "retrabajo_select" ON retrabajo;
DROP POLICY IF EXISTS "retrabajo_insert" ON retrabajo;
DROP POLICY IF EXISTS "retrabajo_update" ON retrabajo;
DROP POLICY IF EXISTS "retrabajo_delete" ON retrabajo;

CREATE POLICY "retrabajo_select" ON retrabajo
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global IN ('ADMIN', 'SOCIO', 'AUDITOR')
    )
    OR
    -- Colaborador puede ver retrabajo de sus tareas
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = retrabajo.tarea_id
      AND t.responsable_usuario_id = (SELECT auth.uid())
    )
    OR
    -- Líder puede ver retrabajo de tareas de su equipo
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = retrabajo.tarea_id
      AND t.team_id IN (
        SELECT tm.team_id FROM teams tm WHERE tm.lider_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "retrabajo_insert" ON retrabajo
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global IN ('ADMIN', 'SOCIO', 'AUDITOR')
    )
  );

CREATE POLICY "retrabajo_update" ON retrabajo
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global IN ('ADMIN', 'SOCIO', 'AUDITOR')
    )
  );

CREATE POLICY "retrabajo_delete" ON retrabajo
  FOR DELETE USING (is_admin_or_socio());

-- 4.5 system_log - Solo ADMIN
DROP POLICY IF EXISTS "system_log_select" ON system_log;
DROP POLICY IF EXISTS "system_log_insert" ON system_log;
DROP POLICY IF EXISTS "system_log_update" ON system_log;
DROP POLICY IF EXISTS "system_log_delete" ON system_log;

CREATE POLICY "system_log_select" ON system_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global = 'ADMIN'
    )
  );

-- System logs se insertan desde funciones de sistema
CREATE POLICY "system_log_insert" ON system_log
  FOR INSERT WITH CHECK (true);  -- Permite inserción desde triggers/funciones

CREATE POLICY "system_log_update" ON system_log
  FOR UPDATE USING (false);  -- Logs son inmutables

CREATE POLICY "system_log_delete" ON system_log
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global = 'ADMIN'
    )
  );

-- 4.6 config_sistema - Solo ADMIN
DROP POLICY IF EXISTS "config_sistema_select" ON config_sistema;
DROP POLICY IF EXISTS "config_sistema_insert" ON config_sistema;
DROP POLICY IF EXISTS "config_sistema_update" ON config_sistema;
DROP POLICY IF EXISTS "config_sistema_delete" ON config_sistema;

CREATE POLICY "config_sistema_select" ON config_sistema
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global IN ('ADMIN', 'SOCIO')
    )
  );

CREATE POLICY "config_sistema_insert" ON config_sistema
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global = 'ADMIN'
    )
  );

CREATE POLICY "config_sistema_update" ON config_sistema
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global = 'ADMIN'
    )
  );

CREATE POLICY "config_sistema_delete" ON config_sistema
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = (SELECT auth.uid())
      AND u.rol_global = 'ADMIN'
    )
  );

-- ============================================
-- SECCIÓN 5: POLÍTICAS PARA tarea_documento y tarea_evento
-- (Ya tienen RLS habilitado pero sin políticas)
-- ============================================

-- 5.1 tarea_documento - Acceso según tarea relacionada
DROP POLICY IF EXISTS "tarea_documento_select" ON tarea_documento;
DROP POLICY IF EXISTS "tarea_documento_insert" ON tarea_documento;
DROP POLICY IF EXISTS "tarea_documento_update" ON tarea_documento;
DROP POLICY IF EXISTS "tarea_documento_delete" ON tarea_documento;

CREATE POLICY "tarea_documento_select" ON tarea_documento
  FOR SELECT USING (
    is_admin_or_socio()
    OR
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_documento.tarea_id
      AND (
        t.responsable_usuario_id = (SELECT auth.uid())
        OR t.revisor_usuario_id = (SELECT auth.uid())
        OR t.team_id IN (
          SELECT tm.team_id FROM teams tm WHERE tm.lider_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM users u WHERE u.id = (SELECT auth.uid()) AND u.rol_global = 'AUDITOR'
        )
      )
    )
  );

CREATE POLICY "tarea_documento_insert" ON tarea_documento
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_documento.tarea_id
      AND (
        t.responsable_usuario_id = (SELECT auth.uid())
        OR t.revisor_usuario_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "tarea_documento_update" ON tarea_documento
  FOR UPDATE USING (
    is_admin_or_socio()
    OR
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_documento.tarea_id
      AND (
        t.responsable_usuario_id = (SELECT auth.uid())
        OR t.revisor_usuario_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "tarea_documento_delete" ON tarea_documento
  FOR DELETE USING (
    is_admin_or_socio()
    OR
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_documento.tarea_id
      AND t.responsable_usuario_id = (SELECT auth.uid())
    )
  );

-- 5.2 tarea_evento - Historial de cambios (solo lectura general)
DROP POLICY IF EXISTS "tarea_evento_select" ON tarea_evento;
DROP POLICY IF EXISTS "tarea_evento_insert" ON tarea_evento;
DROP POLICY IF EXISTS "tarea_evento_update" ON tarea_evento;
DROP POLICY IF EXISTS "tarea_evento_delete" ON tarea_evento;

CREATE POLICY "tarea_evento_select" ON tarea_evento
  FOR SELECT USING (
    is_admin_or_socio()
    OR
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = tarea_evento.tarea_id
      AND (
        t.responsable_usuario_id = (SELECT auth.uid())
        OR t.revisor_usuario_id = (SELECT auth.uid())
        OR t.team_id IN (
          SELECT tm.team_id FROM teams tm WHERE tm.lider_id = (SELECT auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM users u WHERE u.id = (SELECT auth.uid()) AND u.rol_global = 'AUDITOR'
        )
      )
    )
  );

-- Eventos se insertan desde triggers, no directamente
CREATE POLICY "tarea_evento_insert" ON tarea_evento
  FOR INSERT WITH CHECK (true);  -- Permite inserción desde triggers

CREATE POLICY "tarea_evento_update" ON tarea_evento
  FOR UPDATE USING (false);  -- Eventos son inmutables

CREATE POLICY "tarea_evento_delete" ON tarea_evento
  FOR DELETE USING (is_admin_or_socio());

-- ============================================
-- SECCIÓN 6: FIJAR search_path EN FUNCIONES
-- Previene ataques de inyección de esquema
-- ============================================

DO $$
BEGIN
  -- handle_new_user
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    ALTER FUNCTION handle_new_user() SET search_path = public;
  END IF;

  -- update_updated_at_column
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    ALTER FUNCTION update_updated_at_column() SET search_path = public;
  END IF;

  -- get_user_role
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role') THEN
    ALTER FUNCTION get_user_role() SET search_path = public;
  END IF;

  -- is_admin_or_socio
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin_or_socio') THEN
    ALTER FUNCTION is_admin_or_socio() SET search_path = public;
  END IF;

  -- get_user_teams
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_teams') THEN
    ALTER FUNCTION get_user_teams() SET search_path = public;
  END IF;

  -- get_user_clients
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_clients') THEN
    ALTER FUNCTION get_user_clients() SET search_path = public;
  END IF;

  -- fn_audit_tarea_changes
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_audit_tarea_changes') THEN
    ALTER FUNCTION fn_audit_tarea_changes() SET search_path = public;
  END IF;

  -- check_tarea_exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_tarea_exists') THEN
    ALTER FUNCTION check_tarea_exists(UUID, TEXT, TEXT) SET search_path = public;
  END IF;
END $$;

-- ============================================
-- SECCIÓN 7: CAMBIAR VISTA A SECURITY INVOKER
-- ============================================

-- Cambiar vw_pasos_bloqueados a SECURITY INVOKER para respetar RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'vw_pasos_bloqueados') THEN
    ALTER VIEW vw_pasos_bloqueados SET (security_invoker = true);
  END IF;
END $$;

-- ============================================
-- SECCIÓN 8: VERIFICACIÓN FINAL
-- ============================================

-- Crear función para verificar estado de RLS
CREATE OR REPLACE FUNCTION verificar_rls_status()
RETURNS TABLE (
  tabla TEXT,
  rls_habilitado BOOLEAN,
  tiene_politicas BOOLEAN,
  num_politicas INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT,
    t.rowsecurity,
    EXISTS (SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename),
    (SELECT COUNT(*)::INTEGER FROM pg_policies p WHERE p.tablename = t.tablename)
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario final
COMMENT ON FUNCTION verificar_rls_status() IS
  'Función de verificación para Sprint 2.5a - Muestra estado de RLS en todas las tablas';

-- ============================================
-- FIN DE MIGRACIÓN FASE 0: Sprint 2.5a
-- ============================================
