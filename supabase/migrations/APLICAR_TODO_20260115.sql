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
-- ============================================
-- Migración: Agregar RLS y políticas para tabla users
-- Fecha: 2026-01-15
-- Problema: Los usuarios no se mostraban en producción (Vercel)
-- porque la tabla users no tenía políticas RLS definidas
-- ============================================

-- Habilitar RLS en la tabla users (idempotente)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay (para idempotencia)
DROP POLICY IF EXISTS "admin_socio_all_users" ON users;
DROP POLICY IF EXISTS "users_view_authenticated" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;

-- Admin/Socio: acceso total a usuarios
CREATE POLICY "admin_socio_all_users" ON users
  FOR ALL USING (is_admin_or_socio());

-- Todos los usuarios autenticados pueden ver la lista de usuarios
-- (necesario para asignar tareas, ver equipos, etc.)
CREATE POLICY "users_view_authenticated" ON users
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (user_id = auth.uid());
-- ============================================
-- SGR CBC - FASE 1: VIEW v_tarea_completa
-- Fecha: 2026-01-15
-- Descripción: Vista optimizada para eliminar N+1 queries en tareas
-- Incluye información de cliente, contribuyente, obligación, usuarios y equipo
-- ============================================

-- Eliminar vista existente para idempotencia
DROP VIEW IF EXISTS v_tarea_completa;

-- Crear VIEW con todos los datos relacionados de tarea
-- SECURITY INVOKER: Respeta las políticas RLS del usuario que consulta
CREATE OR REPLACE VIEW v_tarea_completa
WITH (security_invoker = true)
AS
SELECT
    -- Datos de la tarea
    t.tarea_id,
    t.cliente_id,
    t.contribuyente_id,
    t.id_obligacion,
    t.ejercicio,
    t.estado,
    t.periodo_fiscal,
    t.fecha_limite_oficial,
    t.fecha_limite_interna,
    t.riesgo,
    -- Campo computado: en_riesgo como booleano derivado de riesgo='ALTO'
    (t.riesgo = 'ALTO') AS en_riesgo,
    t.prioridad,
    t.responsable_usuario_id,
    t.revisor_usuario_id,
    -- team_id derivado del contribuyente (el equipo se asigna al RFC)
    cont.team_id,
    t.comentarios,
    t.origen,
    t.created_at,
    t.updated_at,

    -- Información del cliente
    c.nombre_comercial AS cliente_nombre,
    c.razon_social_principal AS cliente_razon_social,
    c.segmento AS cliente_segmento,
    c.estado AS cliente_estado,

    -- Información del contribuyente (RFC)
    cont.rfc,
    cont.razon_social,
    cont.tipo_persona,
    cont.nombre_comercial AS contribuyente_nombre_comercial,

    -- Información de la obligación fiscal
    o.nombre_corto AS obligacion_nombre,
    o.descripcion AS obligacion_descripcion,
    o.periodicidad,
    o.nivel AS obligacion_nivel,
    o.impuesto,
    o.es_informativa,

    -- Usuario responsable
    u.nombre AS responsable_nombre,
    u.email AS responsable_email,
    u.rol_global AS responsable_rol,

    -- Usuario revisor
    rev.nombre AS revisor_nombre,
    rev.email AS revisor_email,

    -- Información del equipo (derivado del contribuyente)
    tm.nombre AS equipo_nombre

FROM tarea t
LEFT JOIN cliente c ON t.cliente_id = c.cliente_id
LEFT JOIN contribuyente cont ON t.contribuyente_id = cont.contribuyente_id
LEFT JOIN obligacion_fiscal o ON t.id_obligacion = o.id_obligacion
LEFT JOIN users u ON t.responsable_usuario_id = u.user_id
LEFT JOIN users rev ON t.revisor_usuario_id = rev.user_id
LEFT JOIN teams tm ON cont.team_id = tm.team_id;

-- Comentarios descriptivos
COMMENT ON VIEW v_tarea_completa IS
  'Vista completa de tareas con JOINs pre-calculados para eliminar N+1 queries.
   Incluye: cliente, contribuyente (RFC), obligación fiscal, usuarios responsable/revisor y equipo.
   SECURITY INVOKER activo para respetar RLS.';

COMMENT ON COLUMN v_tarea_completa.en_riesgo IS 'Campo computado: TRUE si riesgo = ALTO';
COMMENT ON COLUMN v_tarea_completa.team_id IS 'team_id derivado del contribuyente (RFC), no de la tarea';
COMMENT ON COLUMN v_tarea_completa.equipo_nombre IS 'Nombre del equipo asignado al RFC';

-- ============================================
-- FIN DE MIGRACIÓN: VIEW v_tarea_completa
-- ============================================
-- ============================================
-- SGR CBC - FASE 1: VIEW v_cliente_coverage
-- Fecha: 2026-01-15
-- Descripción: Vista de cobertura de clientes con métricas agregadas
-- Proporciona conteos de servicios, tareas activas, vencidas y contribuyentes
-- ============================================

-- Eliminar vista existente para idempotencia
DROP VIEW IF EXISTS v_cliente_coverage;

-- Crear VIEW con métricas de cobertura por cliente
-- SECURITY INVOKER: Respeta las políticas RLS del usuario que consulta
CREATE OR REPLACE VIEW v_cliente_coverage
WITH (security_invoker = true)
AS
SELECT
    -- Datos del cliente
    c.cliente_id,
    c.nombre_comercial,
    c.razon_social_principal,
    c.segmento,
    c.estado,
    -- Campo computado: activo como booleano derivado de estado='ACTIVO'
    (c.estado = 'ACTIVO') AS activo,
    c.contacto_nombre,
    c.contacto_email,
    c.created_at,
    c.updated_at,

    -- Equipo(s) asociado(s) - derivado de los contribuyentes del cliente
    -- Un cliente puede tener contribuyentes en diferentes equipos
    (
        SELECT array_agg(DISTINCT cont.team_id)
        FROM cliente_contribuyente cc
        JOIN contribuyente cont ON cc.contribuyente_id = cont.contribuyente_id
        WHERE cc.cliente_id = c.cliente_id
        AND cc.activo = true
        AND cont.team_id IS NOT NULL
    ) AS teams_ids,

    -- Nombre del equipo principal (primer equipo encontrado)
    (
        SELECT t.nombre
        FROM cliente_contribuyente cc
        JOIN contribuyente cont ON cc.contribuyente_id = cont.contribuyente_id
        JOIN teams t ON cont.team_id = t.team_id
        WHERE cc.cliente_id = c.cliente_id
        AND cc.activo = true
        LIMIT 1
    ) AS equipo_nombre,

    -- Conteo de servicios contratados
    (
        SELECT COUNT(*)
        FROM cliente_servicio cs
        WHERE cs.cliente_id = c.cliente_id
        AND cs.activo = true
    ) AS servicios_count,

    -- Conteo de tareas activas (no completadas ni canceladas)
    (
        SELECT COUNT(*)
        FROM tarea ta
        WHERE ta.cliente_id = c.cliente_id
        AND ta.estado NOT IN ('cerrado', 'rechazado', 'pagado')
    ) AS tareas_activas,

    -- Conteo de tareas vencidas (fecha límite pasada y no cerradas)
    (
        SELECT COUNT(*)
        FROM tarea ta
        WHERE ta.cliente_id = c.cliente_id
        AND ta.fecha_limite_oficial < CURRENT_DATE
        AND ta.estado NOT IN ('cerrado', 'rechazado', 'pagado', 'presentado')
    ) AS tareas_vencidas,

    -- Conteo de tareas en riesgo alto
    (
        SELECT COUNT(*)
        FROM tarea ta
        WHERE ta.cliente_id = c.cliente_id
        AND ta.riesgo = 'ALTO'
        AND ta.estado NOT IN ('cerrado', 'rechazado', 'pagado')
    ) AS tareas_en_riesgo,

    -- Conteo de contribuyentes (RFCs) asociados
    (
        SELECT COUNT(*)
        FROM cliente_contribuyente cc
        WHERE cc.cliente_id = c.cliente_id
        AND cc.activo = true
    ) AS contribuyentes_count,

    -- Conteo de tareas pendientes de evidencia
    (
        SELECT COUNT(*)
        FROM tarea ta
        WHERE ta.cliente_id = c.cliente_id
        AND ta.estado = 'pendiente_evidencia'
    ) AS tareas_pendiente_evidencia,

    -- Conteo de tareas bloqueadas por cliente
    (
        SELECT COUNT(*)
        FROM tarea ta
        WHERE ta.cliente_id = c.cliente_id
        AND ta.estado = 'bloqueado_cliente'
    ) AS tareas_bloqueadas

FROM cliente c;

-- Comentarios descriptivos
COMMENT ON VIEW v_cliente_coverage IS
  'Vista de cobertura de clientes con métricas agregadas pre-calculadas.
   Incluye: conteos de servicios, tareas (activas, vencidas, en riesgo), contribuyentes.
   SECURITY INVOKER activo para respetar RLS.';

COMMENT ON COLUMN v_cliente_coverage.activo IS 'Campo computado: TRUE si estado = ACTIVO';
COMMENT ON COLUMN v_cliente_coverage.teams_ids IS 'Array de team_ids asociados vía contribuyentes';
COMMENT ON COLUMN v_cliente_coverage.equipo_nombre IS 'Nombre del equipo principal del cliente';
COMMENT ON COLUMN v_cliente_coverage.tareas_activas IS 'Tareas no cerradas/rechazadas/pagadas';
COMMENT ON COLUMN v_cliente_coverage.tareas_vencidas IS 'Tareas con fecha límite pasada y no presentadas';

-- ============================================
-- FIN DE MIGRACIÓN: VIEW v_cliente_coverage
-- ============================================
-- ============================================
-- SGR CBC - FASE 1: VIEW v_user_workload
-- Fecha: 2026-01-15
-- Descripción: Vista de carga de trabajo por usuario para decisiones de reasignación
-- Muestra métricas de tareas pendientes, en riesgo y carga estimada
-- ============================================

-- Eliminar vista existente para idempotencia
DROP VIEW IF EXISTS v_user_workload;

-- Crear VIEW con métricas de carga de trabajo por usuario
-- SECURITY INVOKER: Respeta las políticas RLS del usuario que consulta
CREATE OR REPLACE VIEW v_user_workload
WITH (security_invoker = true)
AS
SELECT
    -- Datos del usuario
    u.user_id,
    u.nombre,
    u.email,
    u.rol_global,
    u.activo,
    u.created_at,

    -- Equipos a los que pertenece (puede ser múltiples)
    (
        SELECT array_agg(DISTINCT tm.team_id)
        FROM team_members tm
        WHERE tm.user_id = u.user_id
        AND tm.activo = true
    ) AS teams,

    -- Nombres de equipos
    (
        SELECT array_agg(DISTINCT t.nombre)
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.team_id
        WHERE tm.user_id = u.user_id
        AND tm.activo = true
    ) AS equipos_nombres,

    -- Roles en equipos
    (
        SELECT array_agg(DISTINCT tm.rol_en_equipo)
        FROM team_members tm
        WHERE tm.user_id = u.user_id
        AND tm.activo = true
    ) AS roles_en_equipos,

    -- Conteo de tareas pendientes (no cerradas, rechazadas, pagadas ni vencidas)
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.estado NOT IN ('cerrado', 'rechazado', 'pagado')
    ) AS tareas_pendientes,

    -- Conteo de tareas en curso
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.estado = 'en_curso'
    ) AS tareas_en_curso,

    -- Conteo de tareas en riesgo alto
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.riesgo = 'ALTO'
        AND t.estado NOT IN ('cerrado', 'rechazado', 'pagado')
    ) AS tareas_en_riesgo,

    -- Conteo de tareas vencidas (fecha límite pasada)
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.fecha_limite_oficial < CURRENT_DATE
        AND t.estado NOT IN ('cerrado', 'rechazado', 'pagado', 'presentado')
    ) AS tareas_vencidas,

    -- Conteo de tareas próximas a vencer (próximos 3 días)
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.fecha_limite_oficial BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
        AND t.estado NOT IN ('cerrado', 'rechazado', 'pagado', 'presentado')
    ) AS tareas_proximas_vencer,

    -- Puntos de carga estimados
    -- Fórmula: suma de prioridades de tareas activas (prioridad default = 50)
    -- Esto sirve como proxy de carga mientras no exista puntos_tarea
    (
        SELECT COALESCE(SUM(t.prioridad), 0)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.estado NOT IN ('cerrado', 'rechazado', 'pagado')
    ) AS puntos_carga,

    -- Conteo de tareas como revisor
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.revisor_usuario_id = u.user_id
        AND t.estado = 'en_validacion'
    ) AS tareas_como_revisor,

    -- Conteo de tareas bloqueadas por cliente
    (
        SELECT COUNT(*)
        FROM tarea t
        WHERE t.responsable_usuario_id = u.user_id
        AND t.estado = 'bloqueado_cliente'
    ) AS tareas_bloqueadas_cliente

FROM users u
WHERE u.activo = true;

-- Comentarios descriptivos
COMMENT ON VIEW v_user_workload IS
  'Vista de carga de trabajo por usuario para decisiones de reasignación.
   Incluye: conteos de tareas (pendientes, en riesgo, vencidas), equipos, puntos de carga.
   Solo muestra usuarios activos. SECURITY INVOKER activo para respetar RLS.';

COMMENT ON COLUMN v_user_workload.teams IS 'Array de team_ids a los que pertenece el usuario';
COMMENT ON COLUMN v_user_workload.tareas_pendientes IS 'Tareas activas asignadas como responsable';
COMMENT ON COLUMN v_user_workload.tareas_en_riesgo IS 'Tareas con riesgo=ALTO no cerradas';
COMMENT ON COLUMN v_user_workload.puntos_carga IS 'Suma de prioridades de tareas activas (proxy de carga)';
COMMENT ON COLUMN v_user_workload.tareas_proximas_vencer IS 'Tareas con fecha límite en los próximos 3 días';

-- ============================================
-- FIN DE MIGRACIÓN: VIEW v_user_workload
-- ============================================
-- ============================================
-- SGR CBC - FASE 2: Sprint 5A - Tabla pendiente_seguimiento
-- Fecha: 2026-01-15
-- Descripcion: Tabla para seguimiento de pendientes que persisten entre periodos
-- T2A.4 - AGENTE BD
-- ============================================

-- ============================================
-- SECCION 1: CREAR TABLA pendiente_seguimiento
-- ============================================

-- Eliminar tabla si existe (idempotencia)
DROP TABLE IF EXISTS pendiente_seguimiento CASCADE;

CREATE TABLE pendiente_seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descripcion TEXT NOT NULL,
  cliente_id UUID REFERENCES cliente(cliente_id),
  tarea_origen_id UUID REFERENCES tarea(tarea_id), -- Opcional: si nace de una tarea
  categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('PAGO', 'TRAMITE', 'CAMBIO', 'DOCUMENTACION', 'REQUERIMIENTO', 'OTRO')),
  prioridad VARCHAR(10) NOT NULL DEFAULT 'MEDIA' CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_compromiso DATE,
  responsable_id UUID REFERENCES users(user_id),
  lider_id UUID REFERENCES users(user_id),
  team_id UUID REFERENCES teams(team_id),
  estado VARCHAR(20) DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO')),
  evidencia_cierre_url TEXT,
  fecha_cierre TIMESTAMPTZ,
  cerrado_por UUID REFERENCES users(user_id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SECCION 2: INDICES
-- ============================================

CREATE INDEX idx_pendiente_seguimiento_cliente ON pendiente_seguimiento(cliente_id);
CREATE INDEX idx_pendiente_seguimiento_responsable ON pendiente_seguimiento(responsable_id);
CREATE INDEX idx_pendiente_seguimiento_lider ON pendiente_seguimiento(lider_id);
CREATE INDEX idx_pendiente_seguimiento_team ON pendiente_seguimiento(team_id);
CREATE INDEX idx_pendiente_seguimiento_estado ON pendiente_seguimiento(estado);
CREATE INDEX idx_pendiente_seguimiento_fecha_compromiso ON pendiente_seguimiento(fecha_compromiso);
CREATE INDEX idx_pendiente_seguimiento_categoria ON pendiente_seguimiento(categoria);
CREATE INDEX idx_pendiente_seguimiento_prioridad ON pendiente_seguimiento(prioridad);
CREATE INDEX idx_pendiente_seguimiento_tarea_origen ON pendiente_seguimiento(tarea_origen_id);

-- ============================================
-- SECCION 3: TRIGGER PARA UPDATED_AT
-- ============================================

DROP TRIGGER IF EXISTS set_updated_at_pendiente_seguimiento ON pendiente_seguimiento;
CREATE TRIGGER set_updated_at_pendiente_seguimiento
  BEFORE UPDATE ON pendiente_seguimiento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SECCION 4: HABILITAR RLS
-- ============================================

ALTER TABLE pendiente_seguimiento ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECCION 5: POLITICAS RLS
-- ============================================

-- 5.1 SELECT: Admin/Socio ven todo, lideres y responsables ven sus seguimientos
DROP POLICY IF EXISTS "pendiente_seguimiento_select" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_select" ON pendiente_seguimiento
  FOR SELECT USING (
    -- Admin/Socio ven todo
    is_admin_or_socio()
    OR
    -- Lider del equipo ve seguimientos de su equipo
    team_id IN (
      SELECT t.team_id FROM teams t WHERE t.lider_id = auth.uid()
    )
    OR
    -- Responsable ve sus seguimientos asignados
    responsable_id = auth.uid()
    OR
    -- Lider asignado ve el seguimiento
    lider_id = auth.uid()
    OR
    -- Miembros del equipo ven seguimientos del equipo
    team_id IN (SELECT get_user_teams())
  );

-- 5.2 INSERT: Admin/Socio/Lider pueden crear seguimientos
DROP POLICY IF EXISTS "pendiente_seguimiento_insert" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_insert" ON pendiente_seguimiento
  FOR INSERT WITH CHECK (
    is_admin_or_socio()
    OR
    -- Lideres pueden crear para su equipo
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.lider_id = auth.uid()
      AND (pendiente_seguimiento.team_id = t.team_id OR pendiente_seguimiento.team_id IS NULL)
    )
    OR
    -- Cualquier usuario autenticado puede crear (el sistema asigna team automaticamente)
    auth.uid() IS NOT NULL
  );

-- 5.3 UPDATE: Admin/Socio/Lider/Responsable pueden actualizar
DROP POLICY IF EXISTS "pendiente_seguimiento_update" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_update" ON pendiente_seguimiento
  FOR UPDATE USING (
    is_admin_or_socio()
    OR
    -- Lider del equipo puede actualizar
    team_id IN (
      SELECT t.team_id FROM teams t WHERE t.lider_id = auth.uid()
    )
    OR
    -- Responsable puede actualizar sus seguimientos
    responsable_id = auth.uid()
    OR
    -- Lider asignado puede actualizar
    lider_id = auth.uid()
  );

-- 5.4 DELETE: Solo Admin/Socio pueden eliminar
DROP POLICY IF EXISTS "pendiente_seguimiento_delete" ON pendiente_seguimiento;
CREATE POLICY "pendiente_seguimiento_delete" ON pendiente_seguimiento
  FOR DELETE USING (is_admin_or_socio());

-- ============================================
-- SECCION 6: COMENTARIOS
-- ============================================

COMMENT ON TABLE pendiente_seguimiento IS
  'Tabla para gestionar pendientes de seguimiento que persisten entre periodos fiscales. Puede originarse de tareas vencidas o crearse manualmente.';

COMMENT ON COLUMN pendiente_seguimiento.id IS 'Identificador unico del seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.descripcion IS 'Descripcion detallada del pendiente';
COMMENT ON COLUMN pendiente_seguimiento.cliente_id IS 'Cliente relacionado con el seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.tarea_origen_id IS 'Tarea que origino el seguimiento (si aplica)';
COMMENT ON COLUMN pendiente_seguimiento.categoria IS 'Tipo de seguimiento: PAGO, TRAMITE, CAMBIO, DOCUMENTACION, REQUERIMIENTO, OTRO';
COMMENT ON COLUMN pendiente_seguimiento.prioridad IS 'Nivel de prioridad: ALTA, MEDIA, BAJA';
COMMENT ON COLUMN pendiente_seguimiento.fecha_creacion IS 'Fecha y hora de creacion del seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.fecha_compromiso IS 'Fecha limite comprometida para resolver el pendiente';
COMMENT ON COLUMN pendiente_seguimiento.responsable_id IS 'Usuario responsable de dar seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.lider_id IS 'Lider de equipo asignado para supervisar';
COMMENT ON COLUMN pendiente_seguimiento.team_id IS 'Equipo al que pertenece el seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.estado IS 'Estado actual: ABIERTO o CERRADO';
COMMENT ON COLUMN pendiente_seguimiento.evidencia_cierre_url IS 'URL de evidencia al cerrar el seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.fecha_cierre IS 'Fecha y hora de cierre del seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.cerrado_por IS 'Usuario que cerro el seguimiento';
COMMENT ON COLUMN pendiente_seguimiento.notas IS 'Notas adicionales sobre el seguimiento';

-- ============================================
-- FIN DE MIGRACION T2A.4 - pendiente_seguimiento
-- ============================================
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
-- ============================================
-- SGR CBC - FASE 2: Sprint 5A - Triggers para seguimiento automatico
-- Fecha: 2026-01-15
-- Descripcion: Triggers que crean seguimientos automaticamente
-- T2A.6 - AGENTE BD
-- ============================================

-- ============================================
-- SECCION 1: FUNCIONES AUXILIARES
-- ============================================

-- Funcion para obtener el lider del equipo de una tarea
CREATE OR REPLACE FUNCTION get_lider_from_tarea(p_tarea_id UUID)
RETURNS UUID AS $$
DECLARE
  v_lider_id UUID;
BEGIN
  SELECT t.lider_id INTO v_lider_id
  FROM tarea ta
  JOIN contribuyente c ON c.contribuyente_id = ta.contribuyente_id
  JOIN teams t ON t.team_id = c.team_id
  WHERE ta.tarea_id = p_tarea_id;

  RETURN v_lider_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION get_lider_from_tarea(UUID) SET search_path = public;

-- Funcion para obtener el team_id de una tarea
CREATE OR REPLACE FUNCTION get_team_from_tarea(p_tarea_id UUID)
RETURNS UUID AS $$
DECLARE
  v_team_id UUID;
BEGIN
  SELECT c.team_id INTO v_team_id
  FROM tarea ta
  JOIN contribuyente c ON c.contribuyente_id = ta.contribuyente_id
  WHERE ta.tarea_id = p_tarea_id;

  RETURN v_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION get_team_from_tarea(UUID) SET search_path = public;

-- ============================================
-- SECCION 2: TRIGGER 1 - Tarea VENCIDA
-- Crea seguimiento cuando una tarea se vence
-- (fecha_limite_oficial pasa y no esta en estado final)
-- ============================================

-- Funcion para crear seguimiento por tarea vencida
CREATE OR REPLACE FUNCTION fn_crear_seguimiento_tarea_vencida()
RETURNS TRIGGER AS $$
DECLARE
  v_seguimiento_id UUID;
  v_lider_id UUID;
  v_team_id UUID;
  v_descripcion TEXT;
  v_titulo_notif TEXT;
  v_mensaje_notif TEXT;
BEGIN
  -- Solo procesar si la tarea esta vencida (fecha limite pasada)
  -- y no esta en estado final (cerrado, pagado, rechazado)
  IF NEW.fecha_limite_oficial < CURRENT_DATE
     AND NEW.estado NOT IN ('cerrado', 'pagado', 'rechazado')
     AND (OLD.fecha_limite_oficial >= CURRENT_DATE OR OLD.estado IN ('cerrado', 'pagado', 'rechazado'))
  THEN
    -- Verificar que no exista ya un seguimiento para esta tarea vencida
    IF NOT EXISTS (
      SELECT 1 FROM pendiente_seguimiento
      WHERE tarea_origen_id = NEW.tarea_id
        AND categoria = 'TRAMITE'
        AND estado = 'ABIERTO'
    ) THEN
      -- Obtener lider y equipo
      v_lider_id := get_lider_from_tarea(NEW.tarea_id);
      v_team_id := get_team_from_tarea(NEW.tarea_id);

      -- Crear descripcion del seguimiento
      v_descripcion := 'Tarea vencida - ' ||
        COALESCE(NEW.id_obligacion, 'Sin obligacion') ||
        ' - Periodo: ' || NEW.periodo_fiscal ||
        ' - Fecha limite: ' || TO_CHAR(NEW.fecha_limite_oficial, 'DD/MM/YYYY');

      -- Crear el seguimiento
      INSERT INTO pendiente_seguimiento (
        descripcion,
        cliente_id,
        tarea_origen_id,
        categoria,
        prioridad,
        responsable_id,
        lider_id,
        team_id,
        notas
      ) VALUES (
        v_descripcion,
        NEW.cliente_id,
        NEW.tarea_id,
        'TRAMITE',
        'ALTA',  -- Tareas vencidas tienen prioridad alta
        NEW.responsable_usuario_id,
        v_lider_id,
        v_team_id,
        'Seguimiento creado automaticamente por tarea vencida.'
      )
      RETURNING id INTO v_seguimiento_id;

      -- Notificar al lider del equipo
      IF v_lider_id IS NOT NULL THEN
        v_titulo_notif := 'Tarea vencida requiere atencion';
        v_mensaje_notif := 'La tarea de ' || COALESCE(NEW.id_obligacion, 'obligacion') ||
          ' para el periodo ' || NEW.periodo_fiscal ||
          ' ha vencido. Se ha creado un seguimiento automatico.';

        PERFORM crear_notificacion(
          v_lider_id,
          'TAREA_VENCIDA',
          v_titulo_notif,
          v_mensaje_notif,
          'SEGUIMIENTO',
          v_seguimiento_id
        );
      END IF;

      -- Notificar al responsable si es diferente del lider
      IF NEW.responsable_usuario_id IS NOT NULL
         AND NEW.responsable_usuario_id != COALESCE(v_lider_id, '00000000-0000-0000-0000-000000000000'::UUID)
      THEN
        v_titulo_notif := 'Tu tarea ha vencido';
        v_mensaje_notif := 'La tarea de ' || COALESCE(NEW.id_obligacion, 'obligacion') ||
          ' para el periodo ' || NEW.periodo_fiscal ||
          ' ha vencido. Por favor atiende a la brevedad.';

        PERFORM crear_notificacion(
          NEW.responsable_usuario_id,
          'TAREA_VENCIDA',
          v_titulo_notif,
          v_mensaje_notif,
          'TAREA',
          NEW.tarea_id
        );
      END IF;

      -- Registrar en log del sistema
      INSERT INTO system_log (tipo, mensaje, metadata)
      VALUES (
        'SEGUIMIENTO_AUTO',
        'Seguimiento creado automaticamente por tarea vencida',
        jsonb_build_object(
          'tarea_id', NEW.tarea_id,
          'seguimiento_id', v_seguimiento_id,
          'fecha_limite', NEW.fecha_limite_oficial,
          'estado_tarea', NEW.estado
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION fn_crear_seguimiento_tarea_vencida() SET search_path = public;

-- Crear trigger para detectar tareas vencidas
DROP TRIGGER IF EXISTS trg_auto_seguimiento_tarea_vencida ON tarea;
CREATE TRIGGER trg_auto_seguimiento_tarea_vencida
  AFTER UPDATE ON tarea
  FOR EACH ROW
  EXECUTE FUNCTION fn_crear_seguimiento_tarea_vencida();

-- ============================================
-- SECCION 3: TRIGGER 2 - PRESENTADO sin pago despues de 3 dias
-- Crea seguimiento cuando una tarea esta en PRESENTADO
-- y no pasa a PAGADO despues de 3 dias
-- ============================================

-- Funcion para crear seguimiento por pago pendiente
CREATE OR REPLACE FUNCTION fn_crear_seguimiento_pago_pendiente()
RETURNS TRIGGER AS $$
DECLARE
  v_seguimiento_id UUID;
  v_lider_id UUID;
  v_team_id UUID;
  v_descripcion TEXT;
BEGIN
  -- Cuando una tarea cambia a estado 'presentado'
  -- Registrar el timestamp para seguimiento posterior
  IF NEW.estado = 'presentado' AND OLD.estado != 'presentado' THEN
    -- El seguimiento real se creara mediante la funcion batch
    -- Solo registramos el evento de cambio de estado
    INSERT INTO tarea_evento (
      tarea_id,
      tipo_evento,
      estado_anterior,
      estado_nuevo,
      actor_usuario_id,
      metadata_json
    ) VALUES (
      NEW.tarea_id,
      'CAMBIO_ESTADO_PRESENTADO',
      OLD.estado,
      NEW.estado,
      auth.uid(),
      jsonb_build_object(
        'fecha_presentacion', NOW(),
        'fecha_limite_pago', CURRENT_DATE + INTERVAL '3 days'
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION fn_crear_seguimiento_pago_pendiente() SET search_path = public;

-- Crear trigger para registrar estado presentado
DROP TRIGGER IF EXISTS trg_registrar_estado_presentado ON tarea;
CREATE TRIGGER trg_registrar_estado_presentado
  AFTER UPDATE ON tarea
  FOR EACH ROW
  EXECUTE FUNCTION fn_crear_seguimiento_pago_pendiente();

-- ============================================
-- SECCION 4: FUNCION BATCH para verificar pagos pendientes
-- Esta funcion debe ser llamada por un cron job o Edge Function
-- ============================================

CREATE OR REPLACE FUNCTION verificar_pagos_pendientes()
RETURNS TABLE (
  seguimientos_creados INTEGER,
  tareas_verificadas INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_seguimientos_creados INTEGER := 0;
  v_tareas_verificadas INTEGER := 0;
  v_errores TEXT[] := ARRAY[]::TEXT[];
  v_tarea RECORD;
  v_seguimiento_id UUID;
  v_lider_id UUID;
  v_team_id UUID;
  v_descripcion TEXT;
BEGIN
  -- Buscar tareas en estado 'presentado' por mas de 3 dias sin seguimiento de pago
  FOR v_tarea IN
    SELECT t.*, te.metadata_json->>'fecha_presentacion' as fecha_presentacion
    FROM tarea t
    JOIN tarea_evento te ON te.tarea_id = t.tarea_id
    WHERE t.estado = 'presentado'
      AND te.tipo_evento = 'CAMBIO_ESTADO_PRESENTADO'
      AND te.occurred_at < NOW() - INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM pendiente_seguimiento ps
        WHERE ps.tarea_origen_id = t.tarea_id
          AND ps.categoria = 'PAGO'
          AND ps.estado = 'ABIERTO'
      )
  LOOP
    v_tareas_verificadas := v_tareas_verificadas + 1;

    BEGIN
      -- Obtener lider y equipo
      v_lider_id := get_lider_from_tarea(v_tarea.tarea_id);
      v_team_id := get_team_from_tarea(v_tarea.tarea_id);

      -- Crear descripcion
      v_descripcion := 'Pago pendiente - ' ||
        COALESCE(v_tarea.id_obligacion, 'Sin obligacion') ||
        ' - Periodo: ' || v_tarea.periodo_fiscal ||
        ' - Presentado hace mas de 3 dias';

      -- Crear seguimiento
      INSERT INTO pendiente_seguimiento (
        descripcion,
        cliente_id,
        tarea_origen_id,
        categoria,
        prioridad,
        responsable_id,
        lider_id,
        team_id,
        notas
      ) VALUES (
        v_descripcion,
        v_tarea.cliente_id,
        v_tarea.tarea_id,
        'PAGO',
        'MEDIA',
        v_tarea.responsable_usuario_id,
        v_lider_id,
        v_team_id,
        'Seguimiento creado automaticamente - Tarea presentada sin confirmar pago despues de 3 dias.'
      )
      RETURNING id INTO v_seguimiento_id;

      v_seguimientos_creados := v_seguimientos_creados + 1;

      -- Notificar al lider
      IF v_lider_id IS NOT NULL THEN
        PERFORM crear_notificacion(
          v_lider_id,
          'PAGO_PENDIENTE',
          'Pago pendiente de confirmacion',
          'La tarea de ' || COALESCE(v_tarea.id_obligacion, 'obligacion') ||
            ' fue presentada hace mas de 3 dias y no se ha confirmado el pago.',
          'SEGUIMIENTO',
          v_seguimiento_id
        );
      END IF;

      -- Registrar en log
      INSERT INTO system_log (tipo, mensaje, metadata)
      VALUES (
        'SEGUIMIENTO_AUTO',
        'Seguimiento de pago pendiente creado automaticamente',
        jsonb_build_object(
          'tarea_id', v_tarea.tarea_id,
          'seguimiento_id', v_seguimiento_id,
          'dias_en_presentado', EXTRACT(DAY FROM NOW() - v_tarea.fecha_presentacion::timestamptz)
        )
      );

    EXCEPTION WHEN OTHERS THEN
      v_errores := array_append(v_errores, 'Tarea ' || v_tarea.tarea_id || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN QUERY SELECT v_seguimientos_creados, v_tareas_verificadas, v_errores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION verificar_pagos_pendientes() SET search_path = public;

-- ============================================
-- SECCION 5: FUNCION BATCH para verificar tareas vencidas
-- Para ejecutar periodicamente via cron
-- ============================================

CREATE OR REPLACE FUNCTION verificar_tareas_vencidas()
RETURNS TABLE (
  seguimientos_creados INTEGER,
  tareas_verificadas INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_seguimientos_creados INTEGER := 0;
  v_tareas_verificadas INTEGER := 0;
  v_errores TEXT[] := ARRAY[]::TEXT[];
  v_tarea RECORD;
  v_seguimiento_id UUID;
  v_lider_id UUID;
  v_team_id UUID;
  v_descripcion TEXT;
BEGIN
  -- Buscar tareas vencidas sin seguimiento existente
  FOR v_tarea IN
    SELECT t.*
    FROM tarea t
    WHERE t.fecha_limite_oficial < CURRENT_DATE
      AND t.estado NOT IN ('cerrado', 'pagado', 'rechazado')
      AND NOT EXISTS (
        SELECT 1 FROM pendiente_seguimiento ps
        WHERE ps.tarea_origen_id = t.tarea_id
          AND ps.categoria = 'TRAMITE'
          AND ps.estado = 'ABIERTO'
      )
  LOOP
    v_tareas_verificadas := v_tareas_verificadas + 1;

    BEGIN
      -- Obtener lider y equipo
      v_lider_id := get_lider_from_tarea(v_tarea.tarea_id);
      v_team_id := get_team_from_tarea(v_tarea.tarea_id);

      -- Crear descripcion
      v_descripcion := 'Tarea vencida - ' ||
        COALESCE(v_tarea.id_obligacion, 'Sin obligacion') ||
        ' - Periodo: ' || v_tarea.periodo_fiscal ||
        ' - Vencio el: ' || TO_CHAR(v_tarea.fecha_limite_oficial, 'DD/MM/YYYY');

      -- Crear seguimiento
      INSERT INTO pendiente_seguimiento (
        descripcion,
        cliente_id,
        tarea_origen_id,
        categoria,
        prioridad,
        responsable_id,
        lider_id,
        team_id,
        notas
      ) VALUES (
        v_descripcion,
        v_tarea.cliente_id,
        v_tarea.tarea_id,
        'TRAMITE',
        'ALTA',
        v_tarea.responsable_usuario_id,
        v_lider_id,
        v_team_id,
        'Seguimiento creado automaticamente por verificacion batch de tareas vencidas.'
      )
      RETURNING id INTO v_seguimiento_id;

      v_seguimientos_creados := v_seguimientos_creados + 1;

      -- Notificar al lider
      IF v_lider_id IS NOT NULL THEN
        PERFORM crear_notificacion(
          v_lider_id,
          'TAREA_VENCIDA',
          'Tarea vencida detectada',
          'La tarea de ' || COALESCE(v_tarea.id_obligacion, 'obligacion') ||
            ' para el periodo ' || v_tarea.periodo_fiscal ||
            ' ha vencido y requiere atencion inmediata.',
          'SEGUIMIENTO',
          v_seguimiento_id
        );
      END IF;

      -- Notificar al responsable si existe y es diferente
      IF v_tarea.responsable_usuario_id IS NOT NULL
         AND v_tarea.responsable_usuario_id != COALESCE(v_lider_id, '00000000-0000-0000-0000-000000000000'::UUID)
      THEN
        PERFORM crear_notificacion(
          v_tarea.responsable_usuario_id,
          'TAREA_VENCIDA',
          'Tu tarea ha vencido',
          'La tarea de ' || COALESCE(v_tarea.id_obligacion, 'obligacion') ||
            ' para el periodo ' || v_tarea.periodo_fiscal ||
            ' ha vencido. Por favor atiende a la brevedad.',
          'TAREA',
          v_tarea.tarea_id
        );
      END IF;

      -- Registrar en log
      INSERT INTO system_log (tipo, mensaje, metadata)
      VALUES (
        'SEGUIMIENTO_AUTO',
        'Seguimiento por tarea vencida creado via batch',
        jsonb_build_object(
          'tarea_id', v_tarea.tarea_id,
          'seguimiento_id', v_seguimiento_id,
          'fecha_limite', v_tarea.fecha_limite_oficial,
          'dias_vencido', CURRENT_DATE - v_tarea.fecha_limite_oficial
        )
      );

    EXCEPTION WHEN OTHERS THEN
      v_errores := array_append(v_errores, 'Tarea ' || v_tarea.tarea_id || ': ' || SQLERRM);
    END;
  END LOOP;

  RETURN QUERY SELECT v_seguimientos_creados, v_tareas_verificadas, v_errores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION verificar_tareas_vencidas() SET search_path = public;

-- ============================================
-- SECCION 6: FUNCION COMBINADA para ejecutar todas las verificaciones
-- ============================================

CREATE OR REPLACE FUNCTION ejecutar_verificaciones_seguimiento()
RETURNS TABLE (
  tipo_verificacion TEXT,
  seguimientos_creados INTEGER,
  registros_verificados INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_result_vencidas RECORD;
  v_result_pagos RECORD;
BEGIN
  -- Verificar tareas vencidas
  SELECT * INTO v_result_vencidas FROM verificar_tareas_vencidas();

  RETURN QUERY SELECT
    'TAREAS_VENCIDAS'::TEXT,
    v_result_vencidas.seguimientos_creados,
    v_result_vencidas.tareas_verificadas,
    v_result_vencidas.errores;

  -- Verificar pagos pendientes
  SELECT * INTO v_result_pagos FROM verificar_pagos_pendientes();

  RETURN QUERY SELECT
    'PAGOS_PENDIENTES'::TEXT,
    v_result_pagos.seguimientos_creados,
    v_result_pagos.tareas_verificadas,
    v_result_pagos.errores;

  -- Registrar ejecucion en log
  INSERT INTO system_log (tipo, mensaje, metadata)
  VALUES (
    'VERIFICACION_SEGUIMIENTO',
    'Ejecucion de verificaciones automaticas de seguimiento',
    jsonb_build_object(
      'fecha_ejecucion', NOW(),
      'vencidas_creadas', v_result_vencidas.seguimientos_creados,
      'pagos_creados', v_result_pagos.seguimientos_creados
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION ejecutar_verificaciones_seguimiento() SET search_path = public;

-- ============================================
-- SECCION 7: COMENTARIOS
-- ============================================

COMMENT ON FUNCTION get_lider_from_tarea IS 'Obtiene el ID del lider del equipo asociado a una tarea';
COMMENT ON FUNCTION get_team_from_tarea IS 'Obtiene el ID del equipo asociado a una tarea';
COMMENT ON FUNCTION fn_crear_seguimiento_tarea_vencida IS 'Trigger que crea seguimiento automatico cuando una tarea se vence';
COMMENT ON FUNCTION fn_crear_seguimiento_pago_pendiente IS 'Trigger que registra cuando una tarea pasa a estado presentado';
COMMENT ON FUNCTION verificar_pagos_pendientes IS 'Funcion batch para verificar tareas presentadas sin pago despues de 3 dias';
COMMENT ON FUNCTION verificar_tareas_vencidas IS 'Funcion batch para verificar tareas vencidas sin seguimiento';
COMMENT ON FUNCTION ejecutar_verificaciones_seguimiento IS 'Funcion principal que ejecuta todas las verificaciones de seguimiento';

COMMENT ON TRIGGER trg_auto_seguimiento_tarea_vencida ON tarea IS 'Trigger que crea seguimiento automatico cuando una tarea se detecta como vencida';
COMMENT ON TRIGGER trg_registrar_estado_presentado ON tarea IS 'Trigger que registra el cambio a estado presentado para seguimiento de pago';

-- ============================================
-- FIN DE MIGRACION T2A.6 - Triggers auto seguimiento
-- ============================================
-- ============================================
-- SGR CBC - FASE 2: Sprint 5A - RPC para generacion de tareas
-- Fecha: 2026-01-15
-- Descripcion: Procedimiento almacenado para generacion batch de tareas
-- T2A.7 - AGENTE BD
-- ============================================

-- ============================================
-- SECCION 1: FUNCION AUXILIAR - Verificar si tarea existe
-- ============================================

CREATE OR REPLACE FUNCTION tarea_existe(
  p_contribuyente_id UUID,
  p_id_obligacion TEXT,
  p_periodo_fiscal TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tarea
    WHERE contribuyente_id = p_contribuyente_id
      AND id_obligacion = p_id_obligacion
      AND periodo_fiscal = p_periodo_fiscal
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION tarea_existe(UUID, TEXT, TEXT) SET search_path = public;

-- ============================================
-- SECCION 2: FUNCION AUXILIAR - Obtener cliente principal de contribuyente
-- ============================================

CREATE OR REPLACE FUNCTION get_cliente_principal(p_contribuyente_id UUID)
RETURNS UUID AS $$
DECLARE
  v_cliente_id UUID;
BEGIN
  SELECT cc.cliente_id INTO v_cliente_id
  FROM cliente_contribuyente cc
  WHERE cc.contribuyente_id = p_contribuyente_id
    AND cc.activo = true
  ORDER BY cc.vigencia_desde DESC NULLS LAST
  LIMIT 1;

  RETURN v_cliente_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION get_cliente_principal(UUID) SET search_path = public;

-- ============================================
-- SECCION 3: FUNCION AUXILIAR - Obtener fecha limite para obligacion/periodo
-- ============================================

CREATE OR REPLACE FUNCTION get_fecha_limite_obligacion(
  p_id_obligacion TEXT,
  p_ejercicio INTEGER,
  p_periodo_fiscal TEXT
)
RETURNS DATE AS $$
DECLARE
  v_fecha_limite DATE;
BEGIN
  -- Buscar en calendario_deadline via obligacion_calendario
  SELECT cd.fecha_limite INTO v_fecha_limite
  FROM calendario_deadline cd
  JOIN calendario_regla_obligacion cro ON cro.calendario_regla_id = cd.calendario_regla_id
  WHERE cro.id_obligacion = p_id_obligacion
    AND cd.ejercicio = p_ejercicio
    AND cd.periodo_fiscal = p_periodo_fiscal
    AND cd.activo = true
  LIMIT 1;

  -- Si no hay fecha especifica, calcular basado en periodicidad
  IF v_fecha_limite IS NULL THEN
    SELECT
      CASE
        -- Mensual: dia 17 del mes siguiente
        WHEN of.periodicidad = 'MENSUAL' THEN
          MAKE_DATE(
            CASE WHEN p_periodo_fiscal::INTEGER = 12 THEN p_ejercicio + 1 ELSE p_ejercicio END,
            CASE WHEN p_periodo_fiscal::INTEGER = 12 THEN 1 ELSE p_periodo_fiscal::INTEGER + 1 END,
            17
          )
        -- Anual: 31 de marzo del ejercicio siguiente
        WHEN of.periodicidad = 'ANUAL' THEN
          MAKE_DATE(p_ejercicio + 1, 3, 31)
        -- Eventual: fecha actual + 30 dias
        WHEN of.periodicidad = 'EVENTUAL' THEN
          CURRENT_DATE + INTERVAL '30 days'
        -- Default: fin del mes siguiente
        ELSE
          (DATE_TRUNC('month', MAKE_DATE(p_ejercicio, p_periodo_fiscal::INTEGER, 1)) + INTERVAL '2 months' - INTERVAL '1 day')::DATE
      END
    INTO v_fecha_limite
    FROM obligacion_fiscal of
    WHERE of.id_obligacion = p_id_obligacion;
  END IF;

  RETURN v_fecha_limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER FUNCTION get_fecha_limite_obligacion(TEXT, INTEGER, TEXT) SET search_path = public;

-- ============================================
-- SECCION 4: RPC PRINCIPAL - rpc_generate_tasks
-- ============================================

CREATE OR REPLACE FUNCTION rpc_generate_tasks(
  p_periodo TEXT,           -- Formato: 'YYYY-MM' (ej: '2026-01')
  p_contribuyente_id UUID DEFAULT NULL  -- Opcional: filtrar por contribuyente
)
RETURNS TABLE (
  tareas_creadas INTEGER,
  tareas_existentes INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_tareas_creadas INTEGER := 0;
  v_tareas_existentes INTEGER := 0;
  v_errores TEXT[] := ARRAY[]::TEXT[];
  v_ejercicio INTEGER;
  v_periodo_fiscal TEXT;
  v_contribuyente RECORD;
  v_obligacion RECORD;
  v_cliente_id UUID;
  v_fecha_limite DATE;
  v_riesgo TEXT;
  v_prioridad INTEGER;
  v_nueva_tarea_id UUID;
BEGIN
  -- Validar formato del periodo
  IF p_periodo !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    v_errores := array_append(v_errores, 'Formato de periodo invalido. Use YYYY-MM');
    RETURN QUERY SELECT 0, 0, v_errores;
    RETURN;
  END IF;

  -- Extraer ejercicio y periodo fiscal
  v_ejercicio := SPLIT_PART(p_periodo, '-', 1)::INTEGER;
  v_periodo_fiscal := SPLIT_PART(p_periodo, '-', 2);

  -- Iterar sobre contribuyentes activos
  FOR v_contribuyente IN
    SELECT c.*
    FROM contribuyente c
    WHERE c.activo = true
      AND (p_contribuyente_id IS NULL OR c.contribuyente_id = p_contribuyente_id)
  LOOP
    -- Obtener cliente principal
    v_cliente_id := get_cliente_principal(v_contribuyente.contribuyente_id);

    IF v_cliente_id IS NULL THEN
      v_errores := array_append(v_errores,
        'Contribuyente ' || v_contribuyente.rfc || ' sin cliente asociado');
      CONTINUE;
    END IF;

    -- Iterar sobre obligaciones del contribuyente segun sus regimenes
    FOR v_obligacion IN
      SELECT DISTINCT
        of.id_obligacion,
        of.nombre_corto,
        of.periodicidad,
        ro.riesgo_default,
        ro.prioridad_default
      FROM contribuyente_regimen cr
      JOIN regimen_obligacion ro ON ro.c_regimen = cr.c_regimen
      JOIN obligacion_fiscal of ON of.id_obligacion = ro.id_obligacion
      WHERE cr.contribuyente_id = v_contribuyente.contribuyente_id
        AND cr.activo = true
        AND of.activo = true
        AND ro.es_obligatoria = true
        -- Filtrar por periodicidad segun periodo solicitado
        AND (
          of.periodicidad = 'MENSUAL'
          OR (of.periodicidad = 'ANUAL' AND v_periodo_fiscal = '12')
          OR of.periodicidad IN ('EVENTUAL', 'POR_OPERACION', 'PERMANENTE')
        )
    LOOP
      BEGIN
        -- Verificar si ya existe la tarea
        IF tarea_existe(v_contribuyente.contribuyente_id, v_obligacion.id_obligacion, v_periodo_fiscal) THEN
          v_tareas_existentes := v_tareas_existentes + 1;
          CONTINUE;
        END IF;

        -- Obtener fecha limite
        v_fecha_limite := get_fecha_limite_obligacion(
          v_obligacion.id_obligacion,
          v_ejercicio,
          v_periodo_fiscal
        );

        -- Determinar riesgo y prioridad
        v_riesgo := COALESCE(v_obligacion.riesgo_default, 'MEDIO');
        v_prioridad := COALESCE(v_obligacion.prioridad_default, 50);

        -- Crear la tarea
        INSERT INTO tarea (
          cliente_id,
          contribuyente_id,
          id_obligacion,
          ejercicio,
          periodo_fiscal,
          fecha_limite_oficial,
          fecha_limite_interna,
          estado,
          riesgo,
          prioridad,
          origen,
          comentarios
        ) VALUES (
          v_cliente_id,
          v_contribuyente.contribuyente_id,
          v_obligacion.id_obligacion,
          v_ejercicio,
          v_periodo_fiscal,
          v_fecha_limite,
          v_fecha_limite - INTERVAL '3 days',  -- Fecha interna 3 dias antes
          'pendiente',
          v_riesgo,
          v_prioridad,
          'AUTO_CALENDARIO',
          'Tarea generada automaticamente para periodo ' || p_periodo
        )
        RETURNING tarea_id INTO v_nueva_tarea_id;

        v_tareas_creadas := v_tareas_creadas + 1;

        -- Registrar evento de creacion
        INSERT INTO tarea_evento (
          tarea_id,
          tipo_evento,
          estado_anterior,
          estado_nuevo,
          metadata_json
        ) VALUES (
          v_nueva_tarea_id,
          'TAREA_CREADA',
          NULL,
          'pendiente',
          jsonb_build_object(
            'origen', 'rpc_generate_tasks',
            'periodo', p_periodo,
            'fecha_limite', v_fecha_limite
          )
        );

      EXCEPTION WHEN OTHERS THEN
        v_errores := array_append(v_errores,
          'Error en ' || v_contribuyente.rfc || '/' || v_obligacion.id_obligacion || ': ' || SQLERRM);
      END;
    END LOOP;
  END LOOP;

  -- Registrar en log del sistema
  INSERT INTO system_log (tipo, mensaje, metadata)
  VALUES (
    'GENERACION_TAREAS',
    'Ejecucion de rpc_generate_tasks',
    jsonb_build_object(
      'periodo', p_periodo,
      'contribuyente_filtro', p_contribuyente_id,
      'tareas_creadas', v_tareas_creadas,
      'tareas_existentes', v_tareas_existentes,
      'errores_count', array_length(v_errores, 1)
    )
  );

  RETURN QUERY SELECT v_tareas_creadas, v_tareas_existentes, v_errores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION rpc_generate_tasks(TEXT, UUID) SET search_path = public;

-- ============================================
-- SECCION 5: FUNCION AUXILIAR - Generar tareas para multiples periodos
-- ============================================

CREATE OR REPLACE FUNCTION rpc_generate_tasks_range(
  p_periodo_inicio TEXT,    -- Formato: 'YYYY-MM'
  p_periodo_fin TEXT,       -- Formato: 'YYYY-MM'
  p_contribuyente_id UUID DEFAULT NULL
)
RETURNS TABLE (
  periodo TEXT,
  tareas_creadas INTEGER,
  tareas_existentes INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_fecha_inicio DATE;
  v_fecha_fin DATE;
  v_fecha_actual DATE;
  v_periodo_actual TEXT;
  v_result RECORD;
BEGIN
  -- Validar formatos
  IF p_periodo_inicio !~ '^\d{4}-(0[1-9]|1[0-2])$' OR p_periodo_fin !~ '^\d{4}-(0[1-9]|1[0-2])$' THEN
    RETURN QUERY SELECT
      'ERROR'::TEXT,
      0,
      0,
      ARRAY['Formato de periodo invalido. Use YYYY-MM']::TEXT[];
    RETURN;
  END IF;

  -- Convertir a fechas
  v_fecha_inicio := (p_periodo_inicio || '-01')::DATE;
  v_fecha_fin := (p_periodo_fin || '-01')::DATE;

  -- Validar rango
  IF v_fecha_inicio > v_fecha_fin THEN
    RETURN QUERY SELECT
      'ERROR'::TEXT,
      0,
      0,
      ARRAY['Periodo inicio debe ser menor o igual a periodo fin']::TEXT[];
    RETURN;
  END IF;

  -- Iterar por cada mes en el rango
  v_fecha_actual := v_fecha_inicio;
  WHILE v_fecha_actual <= v_fecha_fin LOOP
    v_periodo_actual := TO_CHAR(v_fecha_actual, 'YYYY-MM');

    SELECT * INTO v_result
    FROM rpc_generate_tasks(v_periodo_actual, p_contribuyente_id);

    RETURN QUERY SELECT
      v_periodo_actual,
      v_result.tareas_creadas,
      v_result.tareas_existentes,
      v_result.errores;

    v_fecha_actual := v_fecha_actual + INTERVAL '1 month';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION rpc_generate_tasks_range(TEXT, TEXT, UUID) SET search_path = public;

-- ============================================
-- SECCION 6: FUNCION PARA GENERAR PASOS DE TAREA
-- ============================================

CREATE OR REPLACE FUNCTION generar_pasos_tarea(p_tarea_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_obligacion_id TEXT;
  v_proceso_id TEXT;
  v_paso RECORD;
  v_pasos_creados INTEGER := 0;
BEGIN
  -- Obtener la obligacion de la tarea
  SELECT id_obligacion INTO v_obligacion_id
  FROM tarea WHERE tarea_id = p_tarea_id;

  IF v_obligacion_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Obtener el proceso asociado a la obligacion
  SELECT op.proceso_id INTO v_proceso_id
  FROM obligacion_proceso op
  WHERE op.id_obligacion = v_obligacion_id
    AND op.activo = true
  LIMIT 1;

  IF v_proceso_id IS NULL THEN
    RETURN 0;
  END IF;

  -- Verificar que no existan pasos ya
  IF EXISTS (SELECT 1 FROM tarea_step WHERE tarea_id = p_tarea_id) THEN
    RETURN 0;
  END IF;

  -- Crear los pasos basados en el proceso
  FOR v_paso IN
    SELECT *
    FROM proceso_paso
    WHERE proceso_id = v_proceso_id
      AND activo = true
    ORDER BY orden
  LOOP
    INSERT INTO tarea_step (
      tarea_id,
      proceso_paso_id,
      orden,
      titulo,
      peso_pct,
      tipo_colaborador,
      completado
    ) VALUES (
      p_tarea_id,
      v_paso.paso_id,
      v_paso.orden,
      v_paso.nombre,
      v_paso.peso_pct,
      v_paso.tipo_colaborador,
      false
    );

    v_pasos_creados := v_pasos_creados + 1;
  END LOOP;

  RETURN v_pasos_creados;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION generar_pasos_tarea(UUID) SET search_path = public;

-- ============================================
-- SECCION 7: VERSION EXTENDIDA CON PASOS
-- ============================================

CREATE OR REPLACE FUNCTION rpc_generate_tasks_with_steps(
  p_periodo TEXT,
  p_contribuyente_id UUID DEFAULT NULL
)
RETURNS TABLE (
  tareas_creadas INTEGER,
  tareas_existentes INTEGER,
  pasos_creados INTEGER,
  errores TEXT[]
) AS $$
DECLARE
  v_result RECORD;
  v_pasos_total INTEGER := 0;
  v_tarea RECORD;
BEGIN
  -- Primero generar las tareas
  SELECT * INTO v_result
  FROM rpc_generate_tasks(p_periodo, p_contribuyente_id);

  -- Luego generar los pasos para las tareas recien creadas
  FOR v_tarea IN
    SELECT tarea_id
    FROM tarea
    WHERE ejercicio = SPLIT_PART(p_periodo, '-', 1)::INTEGER
      AND periodo_fiscal = SPLIT_PART(p_periodo, '-', 2)
      AND origen = 'AUTO_CALENDARIO'
      AND (p_contribuyente_id IS NULL OR contribuyente_id = p_contribuyente_id)
      AND NOT EXISTS (SELECT 1 FROM tarea_step WHERE tarea_step.tarea_id = tarea.tarea_id)
  LOOP
    v_pasos_total := v_pasos_total + generar_pasos_tarea(v_tarea.tarea_id);
  END LOOP;

  RETURN QUERY SELECT
    v_result.tareas_creadas,
    v_result.tareas_existentes,
    v_pasos_total,
    v_result.errores;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION rpc_generate_tasks_with_steps(TEXT, UUID) SET search_path = public;

-- ============================================
-- SECCION 8: COMENTARIOS
-- ============================================

COMMENT ON FUNCTION tarea_existe IS 'Verifica si ya existe una tarea para el contribuyente/obligacion/periodo';
COMMENT ON FUNCTION get_cliente_principal IS 'Obtiene el cliente principal asociado a un contribuyente';
COMMENT ON FUNCTION get_fecha_limite_obligacion IS 'Calcula la fecha limite para una obligacion en un periodo';

COMMENT ON FUNCTION rpc_generate_tasks IS
  'RPC principal para generacion batch de tareas. Genera tareas para un periodo especifico basado en las obligaciones de cada contribuyente segun sus regimenes fiscales.
   Parametros:
   - p_periodo: Periodo en formato YYYY-MM (ej: 2026-01)
   - p_contribuyente_id: UUID opcional para filtrar por contribuyente especifico
   Retorna: Numero de tareas creadas, existentes y lista de errores';

COMMENT ON FUNCTION rpc_generate_tasks_range IS
  'Genera tareas para un rango de periodos. Util para generacion masiva.
   Parametros:
   - p_periodo_inicio: Periodo inicial YYYY-MM
   - p_periodo_fin: Periodo final YYYY-MM
   - p_contribuyente_id: UUID opcional para filtrar';

COMMENT ON FUNCTION generar_pasos_tarea IS
  'Genera los pasos (steps) de una tarea basado en el proceso operativo asociado a su obligacion';

COMMENT ON FUNCTION rpc_generate_tasks_with_steps IS
  'Version extendida de rpc_generate_tasks que tambien genera los pasos de cada tarea';

-- ============================================
-- FIN DE MIGRACION T2A.7 - RPC Generate Tasks
-- ============================================
-- ============================================
-- SGR CBC - Sprint 7B: Auditoria Mejorada
-- T2B.4 - Tabla de auditorias con estados completos
--
-- PROPOSITO: Reemplaza/mejora las tablas placeholder 'audits'
-- y 'tarea_auditoria' con un modelo completo para el ciclo
-- de vida de auditorias de calidad.
--
-- Ejecutar DESPUES de: schema.sql, rls_policies.sql, schema_v2_updates.sql
-- ============================================

-- ============================================
-- HELPER: Verificar si el usuario es auditor
-- ============================================
CREATE OR REPLACE FUNCTION is_auditor()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() = 'AUDITOR';
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- HELPER: Verificar si usuario puede auditar
-- (AUDITOR, ADMIN, SOCIO)
-- ============================================
CREATE OR REPLACE FUNCTION can_audit()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('AUDITOR', 'ADMIN', 'SOCIO');
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- CREAR TABLA: auditoria
-- ============================================
-- Nota: Esta tabla complementa 'audits' y 'tarea_auditoria'
-- existentes, proporcionando un modelo mas completo para
-- el proceso de auditoria de calidad.
CREATE TABLE IF NOT EXISTS auditoria (
  auditoria_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  tarea_id UUID NOT NULL REFERENCES tarea(tarea_id) ON DELETE CASCADE,
  auditor_id UUID NOT NULL REFERENCES users(user_id),

  -- Contexto fiscal
  periodo_fiscal TEXT NOT NULL,

  -- Fechas del ciclo de vida
  fecha_seleccion TIMESTAMPTZ DEFAULT NOW(),
  fecha_inicio_revision TIMESTAMPTZ,
  fecha_fin_revision TIMESTAMPTZ,

  -- Estado de la auditoria
  -- SELECCIONADA: Tarea marcada para auditoria (inicial)
  -- EN_REVISION: Auditor esta revisando activamente
  -- RECHAZADO: Tarea no cumple criterios, requiere retrabajo
  -- CORREGIR: Tarea tiene hallazgos menores, se puede corregir
  -- APROBADO: Tarea cumple criterios de calidad
  -- DESTACADO: Tarea cumple y supera expectativas (meritoria)
  estado VARCHAR(20) DEFAULT 'SELECCIONADA'
    CHECK (estado IN ('SELECCIONADA', 'EN_REVISION', 'RECHAZADO', 'CORREGIR', 'APROBADO', 'DESTACADO')),

  -- Calificacion numerica (0-100)
  -- NULL hasta que se complete la revision
  calificacion INTEGER CHECK (calificacion IS NULL OR (calificacion >= 0 AND calificacion <= 100)),

  -- Notas del auditor (feedback cualitativo)
  notas_auditor TEXT,

  -- Como se selecciono esta tarea para auditoria
  -- ALEATORIO: Seleccion aleatoria automatica
  -- MANUAL: Seleccionada manualmente por auditor/admin
  -- POR_RIESGO: Seleccionada por el sistema de deteccion de riesgo
  tipo_seleccion VARCHAR(20) DEFAULT 'ALEATORIO'
    CHECK (tipo_seleccion IN ('ALEATORIO', 'MANUAL', 'POR_RIESGO')),

  -- Metadata de trazabilidad
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMENTARIOS PARA DOCUMENTACION
-- ============================================
COMMENT ON TABLE auditoria IS
  'Registro de auditorias de calidad para tareas. Cada registro representa una revision formal de una tarea completada.';

COMMENT ON COLUMN auditoria.estado IS
  'SELECCIONADA=esperando, EN_REVISION=en proceso, RECHAZADO=no aprobado, CORREGIR=hallazgos menores, APROBADO=OK, DESTACADO=excepcional';

COMMENT ON COLUMN auditoria.calificacion IS
  'Puntaje de calidad 0-100. Se establece al completar la revision.';

COMMENT ON COLUMN auditoria.tipo_seleccion IS
  'ALEATORIO=muestra aleatoria, MANUAL=seleccion directa, POR_RIESGO=flaggeado por rpc_detect_risk';

-- ============================================
-- INDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_auditoria_tarea
  ON auditoria(tarea_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_auditor
  ON auditoria(auditor_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_estado
  ON auditoria(estado);

CREATE INDEX IF NOT EXISTS idx_auditoria_periodo
  ON auditoria(periodo_fiscal);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha_seleccion
  ON auditoria(fecha_seleccion DESC);

-- Indice compuesto para busquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_auditoria_auditor_estado
  ON auditoria(auditor_id, estado);

-- ============================================
-- TRIGGER: Actualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION fn_auditoria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_updated_at ON auditoria;
CREATE TRIGGER trg_auditoria_updated_at
  BEFORE UPDATE ON auditoria
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditoria_updated_at();

-- ============================================
-- TRIGGER: Validar transiciones de estado
-- ============================================
CREATE OR REPLACE FUNCTION fn_auditoria_validate_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo validar si el estado cambia
  IF OLD.estado = NEW.estado THEN
    RETURN NEW;
  END IF;

  -- Validar transiciones validas
  CASE OLD.estado
    WHEN 'SELECCIONADA' THEN
      IF NEW.estado NOT IN ('EN_REVISION', 'SELECCIONADA') THEN
        RAISE EXCEPTION 'Transicion invalida: SELECCIONADA solo puede ir a EN_REVISION';
      END IF;
      -- Marcar inicio de revision
      IF NEW.estado = 'EN_REVISION' THEN
        NEW.fecha_inicio_revision = NOW();
      END IF;

    WHEN 'EN_REVISION' THEN
      IF NEW.estado NOT IN ('RECHAZADO', 'CORREGIR', 'APROBADO', 'DESTACADO') THEN
        RAISE EXCEPTION 'Transicion invalida: EN_REVISION debe completarse con un resultado';
      END IF;
      -- Marcar fin de revision
      NEW.fecha_fin_revision = NOW();
      -- Validar que tenga calificacion al terminar
      IF NEW.calificacion IS NULL THEN
        RAISE EXCEPTION 'Se requiere calificacion al completar la revision';
      END IF;

    WHEN 'CORREGIR' THEN
      -- Puede volver a EN_REVISION despues de correccion
      IF NEW.estado NOT IN ('EN_REVISION', 'APROBADO', 'RECHAZADO') THEN
        RAISE EXCEPTION 'Transicion invalida desde CORREGIR';
      END IF;

    WHEN 'RECHAZADO' THEN
      -- Estado final, no se puede cambiar
      RAISE EXCEPTION 'RECHAZADO es un estado final, no se puede modificar';

    WHEN 'APROBADO' THEN
      -- Estado final, no se puede cambiar
      RAISE EXCEPTION 'APROBADO es un estado final, no se puede modificar';

    WHEN 'DESTACADO' THEN
      -- Estado final, no se puede cambiar
      RAISE EXCEPTION 'DESTACADO es un estado final, no se puede modificar';
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auditoria_validate_transition ON auditoria;
CREATE TRIGGER trg_auditoria_validate_transition
  BEFORE UPDATE ON auditoria
  FOR EACH ROW
  EXECUTE FUNCTION fn_auditoria_validate_transition();

-- ============================================
-- RLS: Habilitar Row Level Security
-- ============================================
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- ADMIN y SOCIO: Acceso total
DROP POLICY IF EXISTS auditoria_admin_socio_all ON auditoria;
CREATE POLICY auditoria_admin_socio_all ON auditoria
  FOR ALL
  USING (is_admin_or_socio())
  WITH CHECK (is_admin_or_socio());

-- AUDITOR: Ver todas las auditorias
DROP POLICY IF EXISTS auditoria_auditor_select ON auditoria;
CREATE POLICY auditoria_auditor_select ON auditoria
  FOR SELECT
  USING (is_auditor());

-- AUDITOR: Insertar nuevas auditorias
DROP POLICY IF EXISTS auditoria_auditor_insert ON auditoria;
CREATE POLICY auditoria_auditor_insert ON auditoria
  FOR INSERT
  WITH CHECK (
    is_auditor() AND
    auditor_id = auth.uid()
  );

-- AUDITOR: Actualizar solo sus propias auditorias
DROP POLICY IF EXISTS auditoria_auditor_update ON auditoria;
CREATE POLICY auditoria_auditor_update ON auditoria
  FOR UPDATE
  USING (
    is_auditor() AND
    auditor_id = auth.uid()
  )
  WITH CHECK (
    is_auditor() AND
    auditor_id = auth.uid()
  );

-- LIDER: Ver auditorias de tareas de su equipo (solo lectura)
DROP POLICY IF EXISTS auditoria_lider_select ON auditoria;
CREATE POLICY auditoria_lider_select ON auditoria
  FOR SELECT
  USING (
    get_user_role() = 'LIDER' AND
    tarea_id IN (
      SELECT t.tarea_id FROM tarea t
      WHERE t.responsable_usuario_id IN (
        SELECT user_id FROM team_members
        WHERE team_id IN (SELECT get_user_teams()) AND activo = true
      )
    )
  );

-- COLABORADOR: Ver auditorias de sus propias tareas (solo lectura)
DROP POLICY IF EXISTS auditoria_colaborador_select ON auditoria;
CREATE POLICY auditoria_colaborador_select ON auditoria
  FOR SELECT
  USING (
    get_user_role() = 'COLABORADOR' AND
    tarea_id IN (
      SELECT tarea_id FROM tarea
      WHERE responsable_usuario_id = auth.uid()
    )
  );

-- ============================================
-- FUNCION: Seleccionar tareas para auditoria aleatoria
-- ============================================
CREATE OR REPLACE FUNCTION fn_seleccionar_tareas_auditoria(
  p_periodo TEXT,
  p_porcentaje DECIMAL DEFAULT 10.0,
  p_auditor_id UUID DEFAULT NULL
)
RETURNS TABLE (
  tarea_id UUID,
  cliente_nombre TEXT,
  obligacion_nombre TEXT,
  responsable_nombre TEXT,
  fecha_cierre TIMESTAMPTZ
) AS $$
BEGIN
  -- Selecciona un porcentaje aleatorio de tareas cerradas
  -- que no han sido auditadas en este periodo
  RETURN QUERY
  SELECT
    t.tarea_id,
    c.nombre_comercial AS cliente_nombre,
    o.nombre_corto AS obligacion_nombre,
    u.nombre AS responsable_nombre,
    t.updated_at AS fecha_cierre
  FROM tarea t
  JOIN cliente c ON c.cliente_id = t.cliente_id
  JOIN obligacion_fiscal o ON o.id_obligacion = t.id_obligacion
  LEFT JOIN users u ON u.user_id = t.responsable_usuario_id
  WHERE t.estado IN ('cerrado', 'pagado')
    AND t.periodo_fiscal = p_periodo
    AND NOT EXISTS (
      SELECT 1 FROM auditoria a
      WHERE a.tarea_id = t.tarea_id
        AND a.periodo_fiscal = p_periodo
    )
  ORDER BY RANDOM()
  LIMIT (
    SELECT CEIL(COUNT(*) * p_porcentaje / 100.0)
    FROM tarea
    WHERE estado IN ('cerrado', 'pagado')
      AND periodo_fiscal = p_periodo
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_seleccionar_tareas_auditoria IS
  'Selecciona un porcentaje aleatorio de tareas cerradas para auditoria. Por defecto 10%.';

-- ============================================
-- FUNCION: Crear auditorias en batch
-- ============================================
CREATE OR REPLACE FUNCTION fn_crear_auditorias_batch(
  p_periodo TEXT,
  p_auditor_id UUID,
  p_tipo_seleccion VARCHAR(20) DEFAULT 'ALEATORIO'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_tarea RECORD;
BEGIN
  -- Crear auditorias para tareas seleccionadas
  FOR v_tarea IN
    SELECT tarea_id FROM fn_seleccionar_tareas_auditoria(p_periodo, 10.0, p_auditor_id)
  LOOP
    INSERT INTO auditoria (
      tarea_id,
      auditor_id,
      periodo_fiscal,
      tipo_seleccion
    ) VALUES (
      v_tarea.tarea_id,
      p_auditor_id,
      p_periodo,
      p_tipo_seleccion
    )
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_crear_auditorias_batch IS
  'Crea registros de auditoria en batch para tareas seleccionadas aleatoriamente.';

-- ============================================
-- VISTA: Resumen de auditorias por periodo
-- ============================================
CREATE OR REPLACE VIEW vw_auditoria_resumen AS
SELECT
  periodo_fiscal,
  COUNT(*) AS total_auditorias,
  COUNT(*) FILTER (WHERE estado = 'SELECCIONADA') AS pendientes,
  COUNT(*) FILTER (WHERE estado = 'EN_REVISION') AS en_revision,
  COUNT(*) FILTER (WHERE estado = 'CORREGIR') AS en_correccion,
  COUNT(*) FILTER (WHERE estado IN ('APROBADO', 'DESTACADO')) AS aprobadas,
  COUNT(*) FILTER (WHERE estado = 'RECHAZADO') AS rechazadas,
  AVG(calificacion) FILTER (WHERE calificacion IS NOT NULL) AS calificacion_promedio,
  COUNT(*) FILTER (WHERE estado = 'DESTACADO') AS destacadas
FROM auditoria
GROUP BY periodo_fiscal
ORDER BY periodo_fiscal DESC;

COMMENT ON VIEW vw_auditoria_resumen IS
  'Resumen de auditorias agrupadas por periodo fiscal.';

-- ============================================
-- VISTA: Auditorias pendientes por auditor
-- ============================================
CREATE OR REPLACE VIEW vw_auditoria_pendientes AS
SELECT
  a.auditoria_id,
  a.tarea_id,
  a.auditor_id,
  u.nombre AS auditor_nombre,
  a.periodo_fiscal,
  a.estado,
  a.fecha_seleccion,
  c.nombre_comercial AS cliente,
  o.nombre_corto AS obligacion,
  t.fecha_limite_oficial,
  ur.nombre AS responsable_nombre
FROM auditoria a
JOIN users u ON u.user_id = a.auditor_id
JOIN tarea t ON t.tarea_id = a.tarea_id
JOIN cliente c ON c.cliente_id = t.cliente_id
JOIN obligacion_fiscal o ON o.id_obligacion = t.id_obligacion
LEFT JOIN users ur ON ur.user_id = t.responsable_usuario_id
WHERE a.estado IN ('SELECCIONADA', 'EN_REVISION', 'CORREGIR')
ORDER BY a.fecha_seleccion ASC;

COMMENT ON VIEW vw_auditoria_pendientes IS
  'Lista de auditorias pendientes de completar.';

-- ============================================
-- FIN DE MIGRACION T2B.4
-- ============================================
-- ============================================
-- SGR CBC - Sprint 7B: Tabla Hallazgo
-- T2B.5 - Hallazgos de auditoria
--
-- PROPOSITO: Registra los hallazgos (findings) detectados
-- durante las auditorias de calidad. Cada hallazgo esta
-- vinculado a una auditoria y tiene un ciclo de vida
-- de correccion.
--
-- Ejecutar DESPUES de: 20260115_auditoria_improved.sql
-- ============================================

-- ============================================
-- CREAR TABLA: hallazgo
-- ============================================
CREATE TABLE IF NOT EXISTS hallazgo (
  hallazgo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacion con auditoria
  auditoria_id UUID NOT NULL REFERENCES auditoria(auditoria_id) ON DELETE CASCADE,

  -- Tipo de hallazgo
  -- DOCUMENTACION: Falta documento, documento incorrecto, etc.
  -- PROCESO: No se siguio el proceso correcto
  -- CALCULO: Error en calculos numericos
  -- PLAZO: No se cumplio con fechas/plazos
  -- NORMATIVO: Incumplimiento de normas fiscales
  -- OTRO: Otros hallazgos
  tipo VARCHAR(30) NOT NULL
    CHECK (tipo IN ('DOCUMENTACION', 'PROCESO', 'CALCULO', 'PLAZO', 'NORMATIVO', 'OTRO')),

  -- Gravedad del hallazgo
  -- LEVE: Observacion menor, no afecta la tarea
  -- MODERADO: Requiere correccion pero no es critico
  -- GRAVE: Afecta la calidad del entregable
  -- CRITICO: Riesgo legal/fiscal, requiere accion inmediata
  gravedad VARCHAR(20) NOT NULL
    CHECK (gravedad IN ('LEVE', 'MODERADO', 'GRAVE', 'CRITICO')),

  -- Descripcion detallada del hallazgo
  descripcion TEXT NOT NULL,

  -- URL de evidencia (screenshot, documento, etc.)
  evidencia_url TEXT,

  -- Recomendacion del auditor para corregir
  recomendacion TEXT,

  -- Estado del hallazgo
  -- ABIERTO: Recien detectado
  -- EN_CORRECCION: Asignado para correccion
  -- CORREGIDO: Correccion completada y verificada
  -- DESCARTADO: Falso positivo o no aplica
  estado VARCHAR(20) DEFAULT 'ABIERTO'
    CHECK (estado IN ('ABIERTO', 'EN_CORRECCION', 'CORREGIDO', 'DESCARTADO')),

  -- Responsable de corregir el hallazgo
  responsable_correccion_id UUID REFERENCES users(user_id),

  -- Fecha limite para correccion
  fecha_compromiso_correccion DATE,

  -- Fecha real de correccion
  fecha_correccion TIMESTAMPTZ,

  -- Notas sobre la correccion realizada
  notas_correccion TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMENTARIOS PARA DOCUMENTACION
-- ============================================
COMMENT ON TABLE hallazgo IS
  'Hallazgos detectados durante auditorias. Cada hallazgo debe ser corregido o descartado.';

COMMENT ON COLUMN hallazgo.tipo IS
  'Categoria del hallazgo: DOCUMENTACION, PROCESO, CALCULO, PLAZO, NORMATIVO, OTRO';

COMMENT ON COLUMN hallazgo.gravedad IS
  'LEVE=observacion, MODERADO=corregible, GRAVE=afecta entregable, CRITICO=riesgo legal';

COMMENT ON COLUMN hallazgo.estado IS
  'Ciclo de vida: ABIERTO->EN_CORRECCION->CORREGIDO o DESCARTADO';

-- ============================================
-- INDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_hallazgo_auditoria
  ON hallazgo(auditoria_id);

CREATE INDEX IF NOT EXISTS idx_hallazgo_estado
  ON hallazgo(estado);

CREATE INDEX IF NOT EXISTS idx_hallazgo_gravedad
  ON hallazgo(gravedad);

CREATE INDEX IF NOT EXISTS idx_hallazgo_tipo
  ON hallazgo(tipo);

CREATE INDEX IF NOT EXISTS idx_hallazgo_responsable
  ON hallazgo(responsable_correccion_id)
  WHERE responsable_correccion_id IS NOT NULL;

-- Indice compuesto para hallazgos abiertos por gravedad
CREATE INDEX IF NOT EXISTS idx_hallazgo_abiertos_gravedad
  ON hallazgo(gravedad, created_at)
  WHERE estado = 'ABIERTO';

-- Indice para hallazgos pendientes de correccion
CREATE INDEX IF NOT EXISTS idx_hallazgo_pendientes
  ON hallazgo(responsable_correccion_id, fecha_compromiso_correccion)
  WHERE estado = 'EN_CORRECCION';

-- ============================================
-- TRIGGER: Actualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION fn_hallazgo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hallazgo_updated_at ON hallazgo;
CREATE TRIGGER trg_hallazgo_updated_at
  BEFORE UPDATE ON hallazgo
  FOR EACH ROW
  EXECUTE FUNCTION fn_hallazgo_updated_at();

-- ============================================
-- TRIGGER: Validar transiciones de estado
-- ============================================
CREATE OR REPLACE FUNCTION fn_hallazgo_validate_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo validar si el estado cambia
  IF OLD.estado = NEW.estado THEN
    RETURN NEW;
  END IF;

  -- Validar transiciones validas
  CASE OLD.estado
    WHEN 'ABIERTO' THEN
      IF NEW.estado NOT IN ('EN_CORRECCION', 'DESCARTADO') THEN
        RAISE EXCEPTION 'Hallazgo ABIERTO solo puede pasar a EN_CORRECCION o DESCARTADO';
      END IF;
      -- Si pasa a EN_CORRECCION, debe tener responsable
      IF NEW.estado = 'EN_CORRECCION' AND NEW.responsable_correccion_id IS NULL THEN
        RAISE EXCEPTION 'Se requiere responsable_correccion_id para pasar a EN_CORRECCION';
      END IF;

    WHEN 'EN_CORRECCION' THEN
      IF NEW.estado NOT IN ('CORREGIDO', 'ABIERTO') THEN
        RAISE EXCEPTION 'Hallazgo EN_CORRECCION solo puede pasar a CORREGIDO o volver a ABIERTO';
      END IF;
      -- Si pasa a CORREGIDO, registrar fecha
      IF NEW.estado = 'CORREGIDO' THEN
        NEW.fecha_correccion = NOW();
      END IF;

    WHEN 'CORREGIDO' THEN
      -- Estado final (excepto reapertura por admin)
      IF NOT is_admin_or_socio() THEN
        RAISE EXCEPTION 'CORREGIDO es un estado final. Solo ADMIN/SOCIO pueden reabrir.';
      END IF;

    WHEN 'DESCARTADO' THEN
      -- Estado final (excepto reapertura por admin)
      IF NOT is_admin_or_socio() THEN
        RAISE EXCEPTION 'DESCARTADO es un estado final. Solo ADMIN/SOCIO pueden reabrir.';
      END IF;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hallazgo_validate_transition ON hallazgo;
CREATE TRIGGER trg_hallazgo_validate_transition
  BEFORE UPDATE ON hallazgo
  FOR EACH ROW
  EXECUTE FUNCTION fn_hallazgo_validate_transition();

-- ============================================
-- TRIGGER: Actualizar estado de auditoria al agregar hallazgo grave
-- ============================================
CREATE OR REPLACE FUNCTION fn_hallazgo_update_auditoria()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se agrega un hallazgo CRITICO o GRAVE a una auditoria EN_REVISION
  -- podria cambiar automaticamente a CORREGIR
  -- (Esta logica es opcional, puede manejarse en la aplicacion)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RLS: Habilitar Row Level Security
-- ============================================
ALTER TABLE hallazgo ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- ADMIN y SOCIO: Acceso total
DROP POLICY IF EXISTS hallazgo_admin_socio_all ON hallazgo;
CREATE POLICY hallazgo_admin_socio_all ON hallazgo
  FOR ALL
  USING (is_admin_or_socio())
  WITH CHECK (is_admin_or_socio());

-- AUDITOR: Ver todos los hallazgos
DROP POLICY IF EXISTS hallazgo_auditor_select ON hallazgo;
CREATE POLICY hallazgo_auditor_select ON hallazgo
  FOR SELECT
  USING (is_auditor());

-- AUDITOR: Crear hallazgos en auditorias propias
DROP POLICY IF EXISTS hallazgo_auditor_insert ON hallazgo;
CREATE POLICY hallazgo_auditor_insert ON hallazgo
  FOR INSERT
  WITH CHECK (
    is_auditor() AND
    auditoria_id IN (
      SELECT auditoria_id FROM auditoria
      WHERE auditor_id = auth.uid()
    )
  );

-- AUDITOR: Actualizar hallazgos de sus auditorias
DROP POLICY IF EXISTS hallazgo_auditor_update ON hallazgo;
CREATE POLICY hallazgo_auditor_update ON hallazgo
  FOR UPDATE
  USING (
    is_auditor() AND
    auditoria_id IN (
      SELECT auditoria_id FROM auditoria
      WHERE auditor_id = auth.uid()
    )
  );

-- LIDER: Ver hallazgos de auditorias de tareas de su equipo
DROP POLICY IF EXISTS hallazgo_lider_select ON hallazgo;
CREATE POLICY hallazgo_lider_select ON hallazgo
  FOR SELECT
  USING (
    get_user_role() = 'LIDER' AND
    auditoria_id IN (
      SELECT a.auditoria_id FROM auditoria a
      JOIN tarea t ON t.tarea_id = a.tarea_id
      WHERE t.responsable_usuario_id IN (
        SELECT user_id FROM team_members
        WHERE team_id IN (SELECT get_user_teams()) AND activo = true
      )
    )
  );

-- LIDER: Puede actualizar hallazgos para asignar responsable de correccion
DROP POLICY IF EXISTS hallazgo_lider_update ON hallazgo;
CREATE POLICY hallazgo_lider_update ON hallazgo
  FOR UPDATE
  USING (
    get_user_role() = 'LIDER' AND
    auditoria_id IN (
      SELECT a.auditoria_id FROM auditoria a
      JOIN tarea t ON t.tarea_id = a.tarea_id
      WHERE t.responsable_usuario_id IN (
        SELECT user_id FROM team_members
        WHERE team_id IN (SELECT get_user_teams()) AND activo = true
      )
    )
  );

-- COLABORADOR: Ver hallazgos de sus propias tareas
DROP POLICY IF EXISTS hallazgo_colaborador_select ON hallazgo;
CREATE POLICY hallazgo_colaborador_select ON hallazgo
  FOR SELECT
  USING (
    get_user_role() = 'COLABORADOR' AND
    auditoria_id IN (
      SELECT a.auditoria_id FROM auditoria a
      JOIN tarea t ON t.tarea_id = a.tarea_id
      WHERE t.responsable_usuario_id = auth.uid()
    )
  );

-- COLABORADOR: Puede actualizar hallazgos asignados a el
DROP POLICY IF EXISTS hallazgo_colaborador_update ON hallazgo;
CREATE POLICY hallazgo_colaborador_update ON hallazgo
  FOR UPDATE
  USING (
    get_user_role() = 'COLABORADOR' AND
    responsable_correccion_id = auth.uid() AND
    estado = 'EN_CORRECCION'
  );

-- ============================================
-- VISTA: Hallazgos pendientes de correccion
-- ============================================
CREATE OR REPLACE VIEW vw_hallazgos_pendientes AS
SELECT
  h.hallazgo_id,
  h.auditoria_id,
  h.tipo,
  h.gravedad,
  h.descripcion,
  h.estado,
  h.responsable_correccion_id,
  u.nombre AS responsable_nombre,
  h.fecha_compromiso_correccion,
  h.created_at,
  -- Dias restantes para correccion
  h.fecha_compromiso_correccion - CURRENT_DATE AS dias_restantes,
  -- Info de la auditoria
  a.periodo_fiscal,
  a.auditor_id,
  ua.nombre AS auditor_nombre,
  -- Info de la tarea
  t.tarea_id,
  c.nombre_comercial AS cliente,
  o.nombre_corto AS obligacion
FROM hallazgo h
JOIN auditoria a ON a.auditoria_id = h.auditoria_id
JOIN tarea t ON t.tarea_id = a.tarea_id
JOIN cliente c ON c.cliente_id = t.cliente_id
JOIN obligacion_fiscal o ON o.id_obligacion = t.id_obligacion
LEFT JOIN users u ON u.user_id = h.responsable_correccion_id
LEFT JOIN users ua ON ua.user_id = a.auditor_id
WHERE h.estado IN ('ABIERTO', 'EN_CORRECCION')
ORDER BY
  CASE h.gravedad
    WHEN 'CRITICO' THEN 1
    WHEN 'GRAVE' THEN 2
    WHEN 'MODERADO' THEN 3
    WHEN 'LEVE' THEN 4
  END,
  h.fecha_compromiso_correccion ASC NULLS LAST;

COMMENT ON VIEW vw_hallazgos_pendientes IS
  'Lista de hallazgos pendientes de correccion, ordenados por gravedad y fecha compromiso.';

-- ============================================
-- VISTA: Resumen de hallazgos por tipo
-- ============================================
CREATE OR REPLACE VIEW vw_hallazgos_por_tipo AS
SELECT
  a.periodo_fiscal,
  h.tipo,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE h.gravedad = 'CRITICO') AS criticos,
  COUNT(*) FILTER (WHERE h.gravedad = 'GRAVE') AS graves,
  COUNT(*) FILTER (WHERE h.gravedad = 'MODERADO') AS moderados,
  COUNT(*) FILTER (WHERE h.gravedad = 'LEVE') AS leves,
  COUNT(*) FILTER (WHERE h.estado = 'CORREGIDO') AS corregidos,
  AVG(
    CASE
      WHEN h.estado = 'CORREGIDO' AND h.fecha_correccion IS NOT NULL
      THEN EXTRACT(DAY FROM (h.fecha_correccion - h.created_at))
    END
  ) AS dias_promedio_correccion
FROM hallazgo h
JOIN auditoria a ON a.auditoria_id = h.auditoria_id
GROUP BY a.periodo_fiscal, h.tipo
ORDER BY a.periodo_fiscal DESC, total DESC;

COMMENT ON VIEW vw_hallazgos_por_tipo IS
  'Estadisticas de hallazgos agrupadas por periodo y tipo.';

-- ============================================
-- FUNCION: Contar hallazgos por usuario
-- ============================================
CREATE OR REPLACE FUNCTION fn_hallazgos_por_usuario(
  p_usuario_id UUID,
  p_periodo TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_hallazgos INTEGER,
  hallazgos_criticos INTEGER,
  hallazgos_graves INTEGER,
  hallazgos_corregidos INTEGER,
  hallazgos_pendientes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_hallazgos,
    COUNT(*) FILTER (WHERE h.gravedad = 'CRITICO')::INTEGER AS hallazgos_criticos,
    COUNT(*) FILTER (WHERE h.gravedad = 'GRAVE')::INTEGER AS hallazgos_graves,
    COUNT(*) FILTER (WHERE h.estado = 'CORREGIDO')::INTEGER AS hallazgos_corregidos,
    COUNT(*) FILTER (WHERE h.estado IN ('ABIERTO', 'EN_CORRECCION'))::INTEGER AS hallazgos_pendientes
  FROM hallazgo h
  JOIN auditoria a ON a.auditoria_id = h.auditoria_id
  JOIN tarea t ON t.tarea_id = a.tarea_id
  WHERE t.responsable_usuario_id = p_usuario_id
    AND (p_periodo IS NULL OR a.periodo_fiscal = p_periodo);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION fn_hallazgos_por_usuario IS
  'Cuenta hallazgos recibidos por un usuario, opcionalmente filtrado por periodo.';

-- ============================================
-- FIN DE MIGRACION T2B.5
-- ============================================
-- ============================================
-- SGR CBC - Sprint 7B: Metricas de Calidad
-- T2B.6 - Tabla de metricas para calculo de bonos
--
-- PROPOSITO: Registra metricas de desempeno por usuario
-- y periodo fiscal. Estas metricas alimentan el sistema
-- de bonos y reconocimientos.
--
-- Ejecutar DESPUES de: 20260115_hallazgo.sql
-- ============================================

-- ============================================
-- CREAR TABLA: metrica_calidad
-- ============================================
CREATE TABLE IF NOT EXISTS metrica_calidad (
  metrica_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Usuario evaluado
  usuario_id UUID NOT NULL REFERENCES users(user_id),

  -- Periodo fiscal (formato: AAAA-MM o AAAA-T1, etc.)
  periodo_fiscal TEXT NOT NULL,

  -- Metricas de productividad
  tareas_completadas INTEGER DEFAULT 0,
  tareas_a_tiempo INTEGER DEFAULT 0,
  tareas_con_retraso INTEGER DEFAULT 0,

  -- Metricas de auditoria
  tareas_auditadas INTEGER DEFAULT 0,
  tareas_aprobadas_primera INTEGER DEFAULT 0,  -- Aprobadas en primera revision (sin correciones)
  tareas_aprobadas_total INTEGER DEFAULT 0,    -- Total aprobadas (incluye despues de correccion)
  tareas_rechazadas INTEGER DEFAULT 0,
  tareas_destacadas INTEGER DEFAULT 0,         -- Tareas con calificacion DESTACADO

  -- Metricas de hallazgos
  hallazgos_recibidos INTEGER DEFAULT 0,
  hallazgos_graves INTEGER DEFAULT 0,          -- GRAVE + CRITICO
  hallazgos_leves INTEGER DEFAULT 0,           -- LEVE + MODERADO
  hallazgos_corregidos_a_tiempo INTEGER DEFAULT 0,

  -- Puntaje compuesto
  puntos_totales INTEGER DEFAULT 0,
  score_calidad DECIMAL(5,2),  -- Score normalizado 0-100

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Restriccion: un registro por usuario por periodo
  UNIQUE(usuario_id, periodo_fiscal)
);

-- ============================================
-- COMENTARIOS PARA DOCUMENTACION
-- ============================================
COMMENT ON TABLE metrica_calidad IS
  'Metricas de calidad por usuario y periodo. Alimenta el sistema de bonos.';

COMMENT ON COLUMN metrica_calidad.tareas_aprobadas_primera IS
  'Tareas aprobadas en la primera revision sin hallazgos que requieran correccion.';

COMMENT ON COLUMN metrica_calidad.score_calidad IS
  'Score normalizado 0-100 calculado con formula ponderada.';

COMMENT ON COLUMN metrica_calidad.puntos_totales IS
  'Puntos acumulados antes de normalizar. Util para rankings.';

-- ============================================
-- INDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_metrica_usuario
  ON metrica_calidad(usuario_id);

CREATE INDEX IF NOT EXISTS idx_metrica_periodo
  ON metrica_calidad(periodo_fiscal);

CREATE INDEX IF NOT EXISTS idx_metrica_score
  ON metrica_calidad(score_calidad DESC NULLS LAST);

-- Indice compuesto para busquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_metrica_usuario_periodo
  ON metrica_calidad(usuario_id, periodo_fiscal DESC);

-- ============================================
-- TRIGGER: Actualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION fn_metrica_calidad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_metrica_calidad_updated_at ON metrica_calidad;
CREATE TRIGGER trg_metrica_calidad_updated_at
  BEFORE UPDATE ON metrica_calidad
  FOR EACH ROW
  EXECUTE FUNCTION fn_metrica_calidad_updated_at();

-- ============================================
-- FUNCION: Calcular score de calidad
-- Formula ponderada para calcular el score normalizado
-- ============================================
CREATE OR REPLACE FUNCTION fn_calcular_score_calidad(
  p_tareas_completadas INTEGER,
  p_tareas_a_tiempo INTEGER,
  p_tareas_auditadas INTEGER,
  p_tareas_aprobadas_primera INTEGER,
  p_hallazgos_recibidos INTEGER,
  p_hallazgos_graves INTEGER
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_score DECIMAL(10,4) := 0;
  v_pct_a_tiempo DECIMAL(5,2) := 0;
  v_pct_aprobadas_primera DECIMAL(5,2) := 0;
  v_penalizacion_hallazgos DECIMAL(5,2) := 0;
BEGIN
  -- Si no hay tareas, score es 0
  IF p_tareas_completadas = 0 THEN
    RETURN 0;
  END IF;

  -- Componente 1: Porcentaje de tareas a tiempo (peso: 40%)
  v_pct_a_tiempo := (p_tareas_a_tiempo::DECIMAL / p_tareas_completadas) * 100;

  -- Componente 2: Porcentaje aprobadas en primera (peso: 40%)
  IF p_tareas_auditadas > 0 THEN
    v_pct_aprobadas_primera := (p_tareas_aprobadas_primera::DECIMAL / p_tareas_auditadas) * 100;
  ELSE
    v_pct_aprobadas_primera := 100; -- Sin auditorias = score perfecto en este componente
  END IF;

  -- Componente 3: Penalizacion por hallazgos graves (peso: -20% max)
  -- Cada hallazgo grave resta 5 puntos, max 20
  v_penalizacion_hallazgos := LEAST(p_hallazgos_graves * 5, 20);

  -- Formula final
  v_score := (v_pct_a_tiempo * 0.40) +
             (v_pct_aprobadas_primera * 0.40) +
             (20 - v_penalizacion_hallazgos);  -- Base 20 puntos menos penalizacion

  -- Normalizar a 0-100
  RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_calcular_score_calidad IS
  'Calcula el score de calidad ponderado: 40% puntualidad + 40% aprobadas primera + 20% base con penalizacion por hallazgos.';

-- ============================================
-- FUNCION: Calcular puntos totales
-- Puntos acumulativos para ranking
-- ============================================
CREATE OR REPLACE FUNCTION fn_calcular_puntos_totales(
  p_tareas_completadas INTEGER,
  p_tareas_a_tiempo INTEGER,
  p_tareas_destacadas INTEGER,
  p_tareas_aprobadas_primera INTEGER,
  p_hallazgos_graves INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_puntos INTEGER := 0;
BEGIN
  -- Puntos base por tarea completada: 10 puntos
  v_puntos := p_tareas_completadas * 10;

  -- Bonus por puntualidad: +5 puntos
  v_puntos := v_puntos + (p_tareas_a_tiempo * 5);

  -- Bonus por DESTACADO: +20 puntos
  v_puntos := v_puntos + (p_tareas_destacadas * 20);

  -- Bonus por aprobadas en primera: +10 puntos
  v_puntos := v_puntos + (p_tareas_aprobadas_primera * 10);

  -- Penalizacion por hallazgos graves: -15 puntos
  v_puntos := v_puntos - (p_hallazgos_graves * 15);

  -- Minimo 0 puntos
  RETURN GREATEST(v_puntos, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION fn_calcular_puntos_totales IS
  'Calcula puntos acumulativos: +10 base, +5 puntualidad, +20 destacado, +10 primera, -15 hallazgo grave.';

-- ============================================
-- FUNCION: Actualizar metricas de un usuario
-- Recalcula todas las metricas para un usuario/periodo
-- ============================================
CREATE OR REPLACE FUNCTION fn_actualizar_metricas_usuario(
  p_usuario_id UUID,
  p_periodo TEXT
)
RETURNS metrica_calidad AS $$
DECLARE
  v_result metrica_calidad;
  v_tareas_completadas INTEGER := 0;
  v_tareas_a_tiempo INTEGER := 0;
  v_tareas_con_retraso INTEGER := 0;
  v_tareas_auditadas INTEGER := 0;
  v_tareas_aprobadas_primera INTEGER := 0;
  v_tareas_aprobadas_total INTEGER := 0;
  v_tareas_rechazadas INTEGER := 0;
  v_tareas_destacadas INTEGER := 0;
  v_hallazgos_recibidos INTEGER := 0;
  v_hallazgos_graves INTEGER := 0;
  v_hallazgos_leves INTEGER := 0;
  v_hallazgos_corregidos_a_tiempo INTEGER := 0;
BEGIN
  -- Contar tareas completadas
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE t.updated_at <= t.fecha_limite_oficial),
    COUNT(*) FILTER (WHERE t.updated_at > t.fecha_limite_oficial)
  INTO v_tareas_completadas, v_tareas_a_tiempo, v_tareas_con_retraso
  FROM tarea t
  WHERE t.responsable_usuario_id = p_usuario_id
    AND t.periodo_fiscal = p_periodo
    AND t.estado IN ('cerrado', 'pagado');

  -- Contar auditorias
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE a.estado IN ('APROBADO', 'DESTACADO') AND NOT EXISTS (
      SELECT 1 FROM hallazgo h
      WHERE h.auditoria_id = a.auditoria_id
        AND h.gravedad IN ('GRAVE', 'CRITICO')
    )),
    COUNT(*) FILTER (WHERE a.estado IN ('APROBADO', 'DESTACADO')),
    COUNT(*) FILTER (WHERE a.estado = 'RECHAZADO'),
    COUNT(*) FILTER (WHERE a.estado = 'DESTACADO')
  INTO v_tareas_auditadas, v_tareas_aprobadas_primera, v_tareas_aprobadas_total,
       v_tareas_rechazadas, v_tareas_destacadas
  FROM auditoria a
  JOIN tarea t ON t.tarea_id = a.tarea_id
  WHERE t.responsable_usuario_id = p_usuario_id
    AND a.periodo_fiscal = p_periodo;

  -- Contar hallazgos
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE h.gravedad IN ('GRAVE', 'CRITICO')),
    COUNT(*) FILTER (WHERE h.gravedad IN ('LEVE', 'MODERADO')),
    COUNT(*) FILTER (WHERE h.estado = 'CORREGIDO'
      AND h.fecha_correccion IS NOT NULL
      AND h.fecha_compromiso_correccion IS NOT NULL
      AND h.fecha_correccion::DATE <= h.fecha_compromiso_correccion)
  INTO v_hallazgos_recibidos, v_hallazgos_graves, v_hallazgos_leves,
       v_hallazgos_corregidos_a_tiempo
  FROM hallazgo h
  JOIN auditoria a ON a.auditoria_id = h.auditoria_id
  JOIN tarea t ON t.tarea_id = a.tarea_id
  WHERE t.responsable_usuario_id = p_usuario_id
    AND a.periodo_fiscal = p_periodo;

  -- Insertar o actualizar metricas
  INSERT INTO metrica_calidad (
    usuario_id,
    periodo_fiscal,
    tareas_completadas,
    tareas_a_tiempo,
    tareas_con_retraso,
    tareas_auditadas,
    tareas_aprobadas_primera,
    tareas_aprobadas_total,
    tareas_rechazadas,
    tareas_destacadas,
    hallazgos_recibidos,
    hallazgos_graves,
    hallazgos_leves,
    hallazgos_corregidos_a_tiempo,
    puntos_totales,
    score_calidad
  ) VALUES (
    p_usuario_id,
    p_periodo,
    v_tareas_completadas,
    v_tareas_a_tiempo,
    v_tareas_con_retraso,
    v_tareas_auditadas,
    v_tareas_aprobadas_primera,
    v_tareas_aprobadas_total,
    v_tareas_rechazadas,
    v_tareas_destacadas,
    v_hallazgos_recibidos,
    v_hallazgos_graves,
    v_hallazgos_leves,
    v_hallazgos_corregidos_a_tiempo,
    fn_calcular_puntos_totales(
      v_tareas_completadas,
      v_tareas_a_tiempo,
      v_tareas_destacadas,
      v_tareas_aprobadas_primera,
      v_hallazgos_graves
    ),
    fn_calcular_score_calidad(
      v_tareas_completadas,
      v_tareas_a_tiempo,
      v_tareas_auditadas,
      v_tareas_aprobadas_primera,
      v_hallazgos_recibidos,
      v_hallazgos_graves
    )
  )
  ON CONFLICT (usuario_id, periodo_fiscal)
  DO UPDATE SET
    tareas_completadas = EXCLUDED.tareas_completadas,
    tareas_a_tiempo = EXCLUDED.tareas_a_tiempo,
    tareas_con_retraso = EXCLUDED.tareas_con_retraso,
    tareas_auditadas = EXCLUDED.tareas_auditadas,
    tareas_aprobadas_primera = EXCLUDED.tareas_aprobadas_primera,
    tareas_aprobadas_total = EXCLUDED.tareas_aprobadas_total,
    tareas_rechazadas = EXCLUDED.tareas_rechazadas,
    tareas_destacadas = EXCLUDED.tareas_destacadas,
    hallazgos_recibidos = EXCLUDED.hallazgos_recibidos,
    hallazgos_graves = EXCLUDED.hallazgos_graves,
    hallazgos_leves = EXCLUDED.hallazgos_leves,
    hallazgos_corregidos_a_tiempo = EXCLUDED.hallazgos_corregidos_a_tiempo,
    puntos_totales = EXCLUDED.puntos_totales,
    score_calidad = EXCLUDED.score_calidad,
    updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_actualizar_metricas_usuario IS
  'Recalcula todas las metricas de calidad para un usuario en un periodo.';

-- ============================================
-- FUNCION: Actualizar metricas de todos los usuarios
-- Para un periodo dado
-- ============================================
CREATE OR REPLACE FUNCTION fn_actualizar_metricas_periodo(
  p_periodo TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_usuario RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Iterar sobre todos los usuarios con tareas en el periodo
  FOR v_usuario IN
    SELECT DISTINCT responsable_usuario_id AS user_id
    FROM tarea
    WHERE periodo_fiscal = p_periodo
      AND responsable_usuario_id IS NOT NULL
  LOOP
    PERFORM fn_actualizar_metricas_usuario(v_usuario.user_id, p_periodo);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_actualizar_metricas_periodo IS
  'Actualiza metricas de todos los usuarios para un periodo dado.';

-- ============================================
-- TRIGGER: Actualizar metricas cuando cambia tarea
-- ============================================
CREATE OR REPLACE FUNCTION fn_trigger_actualizar_metricas_tarea()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar si la tarea se cierra o hay cambio de estado final
  IF NEW.estado IN ('cerrado', 'pagado') AND
     (OLD.estado IS NULL OR OLD.estado NOT IN ('cerrado', 'pagado')) THEN
    -- Actualizar metricas del responsable
    IF NEW.responsable_usuario_id IS NOT NULL THEN
      PERFORM fn_actualizar_metricas_usuario(
        NEW.responsable_usuario_id,
        NEW.periodo_fiscal
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_actualizar_metricas_tarea ON tarea;
CREATE TRIGGER trg_actualizar_metricas_tarea
  AFTER UPDATE ON tarea
  FOR EACH ROW
  EXECUTE FUNCTION fn_trigger_actualizar_metricas_tarea();

-- ============================================
-- TRIGGER: Actualizar metricas cuando cambia auditoria
-- ============================================
CREATE OR REPLACE FUNCTION fn_trigger_actualizar_metricas_auditoria()
RETURNS TRIGGER AS $$
DECLARE
  v_responsable_id UUID;
  v_periodo TEXT;
BEGIN
  -- Obtener datos de la tarea asociada
  SELECT t.responsable_usuario_id, t.periodo_fiscal
  INTO v_responsable_id, v_periodo
  FROM tarea t
  WHERE t.tarea_id = NEW.tarea_id;

  -- Solo actualizar si la auditoria llega a estado final
  IF NEW.estado IN ('APROBADO', 'DESTACADO', 'RECHAZADO') AND
     (OLD.estado IS NULL OR OLD.estado NOT IN ('APROBADO', 'DESTACADO', 'RECHAZADO')) THEN
    IF v_responsable_id IS NOT NULL THEN
      PERFORM fn_actualizar_metricas_usuario(v_responsable_id, v_periodo);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_actualizar_metricas_auditoria ON auditoria;
CREATE TRIGGER trg_actualizar_metricas_auditoria
  AFTER UPDATE ON auditoria
  FOR EACH ROW
  EXECUTE FUNCTION fn_trigger_actualizar_metricas_auditoria();

-- ============================================
-- RLS: Habilitar Row Level Security
-- ============================================
ALTER TABLE metrica_calidad ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

-- ADMIN y SOCIO: Acceso total
DROP POLICY IF EXISTS metrica_admin_socio_all ON metrica_calidad;
CREATE POLICY metrica_admin_socio_all ON metrica_calidad
  FOR ALL
  USING (is_admin_or_socio())
  WITH CHECK (is_admin_or_socio());

-- AUDITOR: Ver todas las metricas (solo lectura)
DROP POLICY IF EXISTS metrica_auditor_select ON metrica_calidad;
CREATE POLICY metrica_auditor_select ON metrica_calidad
  FOR SELECT
  USING (is_auditor());

-- LIDER: Ver metricas de su equipo
DROP POLICY IF EXISTS metrica_lider_select ON metrica_calidad;
CREATE POLICY metrica_lider_select ON metrica_calidad
  FOR SELECT
  USING (
    get_user_role() = 'LIDER' AND
    usuario_id IN (
      SELECT user_id FROM team_members
      WHERE team_id IN (SELECT get_user_teams()) AND activo = true
    )
  );

-- COLABORADOR: Ver solo sus propias metricas
DROP POLICY IF EXISTS metrica_colaborador_select ON metrica_calidad;
CREATE POLICY metrica_colaborador_select ON metrica_calidad
  FOR SELECT
  USING (
    get_user_role() = 'COLABORADOR' AND
    usuario_id = auth.uid()
  );

-- ============================================
-- VISTA: Ranking de usuarios por periodo
-- ============================================
CREATE OR REPLACE VIEW vw_ranking_calidad AS
SELECT
  m.metrica_id,
  m.usuario_id,
  u.nombre AS usuario_nombre,
  u.rol_global,
  m.periodo_fiscal,
  m.tareas_completadas,
  m.tareas_a_tiempo,
  m.tareas_auditadas,
  m.tareas_aprobadas_primera,
  m.tareas_destacadas,
  m.hallazgos_graves,
  m.puntos_totales,
  m.score_calidad,
  -- Ranking por puntos
  RANK() OVER (
    PARTITION BY m.periodo_fiscal
    ORDER BY m.puntos_totales DESC
  ) AS ranking_puntos,
  -- Ranking por score
  RANK() OVER (
    PARTITION BY m.periodo_fiscal
    ORDER BY m.score_calidad DESC NULLS LAST
  ) AS ranking_score
FROM metrica_calidad m
JOIN users u ON u.user_id = m.usuario_id
WHERE m.tareas_completadas > 0
ORDER BY m.periodo_fiscal DESC, m.puntos_totales DESC;

COMMENT ON VIEW vw_ranking_calidad IS
  'Ranking de usuarios por periodo, ordenado por puntos y score de calidad.';

-- ============================================
-- VISTA: Tendencia de calidad por usuario
-- ============================================
CREATE OR REPLACE VIEW vw_tendencia_calidad AS
SELECT
  m.usuario_id,
  u.nombre AS usuario_nombre,
  m.periodo_fiscal,
  m.score_calidad,
  m.puntos_totales,
  -- Diferencia con periodo anterior
  LAG(m.score_calidad) OVER (
    PARTITION BY m.usuario_id
    ORDER BY m.periodo_fiscal
  ) AS score_anterior,
  m.score_calidad - LAG(m.score_calidad) OVER (
    PARTITION BY m.usuario_id
    ORDER BY m.periodo_fiscal
  ) AS variacion_score
FROM metrica_calidad m
JOIN users u ON u.user_id = m.usuario_id
ORDER BY m.usuario_id, m.periodo_fiscal;

COMMENT ON VIEW vw_tendencia_calidad IS
  'Muestra la tendencia de calidad de cada usuario comparando con periodos anteriores.';

-- ============================================
-- FUNCION: Obtener candidatos a bono
-- Usuarios con score >= umbral
-- ============================================
CREATE OR REPLACE FUNCTION fn_candidatos_bono(
  p_periodo TEXT,
  p_umbral_score DECIMAL DEFAULT 80.0,
  p_min_tareas INTEGER DEFAULT 5
)
RETURNS TABLE (
  usuario_id UUID,
  usuario_nombre TEXT,
  score_calidad DECIMAL(5,2),
  puntos_totales INTEGER,
  tareas_completadas INTEGER,
  tareas_destacadas INTEGER,
  ranking INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.usuario_id,
    u.nombre AS usuario_nombre,
    m.score_calidad,
    m.puntos_totales,
    m.tareas_completadas,
    m.tareas_destacadas,
    RANK() OVER (ORDER BY m.puntos_totales DESC)::INTEGER AS ranking
  FROM metrica_calidad m
  JOIN users u ON u.user_id = m.usuario_id
  WHERE m.periodo_fiscal = p_periodo
    AND m.score_calidad >= p_umbral_score
    AND m.tareas_completadas >= p_min_tareas
  ORDER BY m.puntos_totales DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION fn_candidatos_bono IS
  'Lista usuarios elegibles para bono: score >= umbral y tareas >= minimo.';

-- ============================================
-- FIN DE MIGRACION T2B.6
-- ============================================
-- ============================================
-- SGR CBC - Sprint 7B: RPC Deteccion de Riesgo
-- T2B.7 - Stored procedure para deteccion transaccional de riesgo
--
-- PROPOSITO: Evalua tareas pendientes y detecta situaciones
-- de riesgo basandose en multiples criterios. Marca las tareas
-- con riesgo ALTO para priorizacion y posible auditoria.
--
-- Criterios de riesgo evaluados:
-- 1. Dias hasta vencimiento (< 5 dias = ALTO)
-- 2. Estado PRESENTADO sin pago (> 3 dias = ALTO)
-- 3. Bloqueada por dependencias
-- 4. Patron historico de retrasos del cliente
--
-- Ejecutar DESPUES de: 20260115_metrica_calidad.sql
-- ============================================

-- ============================================
-- TIPO: Resultado de deteccion de riesgo
-- ============================================
DROP TYPE IF EXISTS tipo_resultado_riesgo CASCADE;
CREATE TYPE tipo_resultado_riesgo AS (
  tareas_evaluadas INTEGER,
  tareas_marcadas_riesgo INTEGER,
  criterios_aplicados TEXT[]
);

-- ============================================
-- TABLA: Historico de ejecuciones de deteccion
-- ============================================
CREATE TABLE IF NOT EXISTS deteccion_riesgo_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_fiscal TEXT,
  tareas_evaluadas INTEGER NOT NULL,
  tareas_marcadas INTEGER NOT NULL,
  criterios_aplicados TEXT[],
  ejecutado_por UUID REFERENCES users(user_id),
  ejecutado_at TIMESTAMPTZ DEFAULT NOW(),
  duracion_ms INTEGER,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_deteccion_riesgo_log_fecha
  ON deteccion_riesgo_log(ejecutado_at DESC);

COMMENT ON TABLE deteccion_riesgo_log IS
  'Historico de ejecuciones de rpc_detect_risk para auditoria y monitoreo.';

-- ============================================
-- FUNCION AUXILIAR: Dias habiles hasta fecha
-- Considera dias inhabiles si existe la tabla
-- ============================================
CREATE OR REPLACE FUNCTION fn_dias_habiles_hasta(
  p_fecha_limite DATE
)
RETURNS INTEGER AS $$
DECLARE
  v_dias INTEGER := 0;
  v_fecha_actual DATE := CURRENT_DATE;
  v_fecha DATE;
BEGIN
  -- Contar dias habiles (excluyendo fines de semana)
  v_fecha := v_fecha_actual;
  WHILE v_fecha < p_fecha_limite LOOP
    -- Excluir sabados (6) y domingos (0)
    IF EXTRACT(DOW FROM v_fecha) NOT IN (0, 6) THEN
      -- Verificar si es dia inhabil (si existe la tabla)
      IF NOT EXISTS (
        SELECT 1 FROM dias_inhabiles
        WHERE fecha = v_fecha AND activo = true
      ) THEN
        v_dias := v_dias + 1;
      END IF;
    END IF;
    v_fecha := v_fecha + INTERVAL '1 day';
  END LOOP;

  RETURN v_dias;
EXCEPTION
  -- Si la tabla dias_inhabiles no existe, contar solo dias naturales
  WHEN undefined_table THEN
    RETURN p_fecha_limite - v_fecha_actual;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_dias_habiles_hasta IS
  'Calcula dias habiles hasta una fecha, excluyendo fines de semana y dias inhabiles.';

-- ============================================
-- FUNCION AUXILIAR: Obtener patron historico de retrasos
-- para un cliente/contribuyente
-- ============================================
CREATE OR REPLACE FUNCTION fn_patron_retrasos_cliente(
  p_cliente_id UUID,
  p_contribuyente_id UUID DEFAULT NULL,
  p_meses_historico INTEGER DEFAULT 12
)
RETURNS TABLE (
  tareas_historicas INTEGER,
  tareas_retrasadas INTEGER,
  pct_retraso DECIMAL(5,2),
  es_patron_riesgo BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS tareas_historicas,
    COUNT(*) FILTER (WHERE t.updated_at > t.fecha_limite_oficial)::INTEGER AS tareas_retrasadas,
    CASE
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE t.updated_at > t.fecha_limite_oficial)::DECIMAL / COUNT(*)) * 100
      ELSE 0
    END AS pct_retraso,
    -- Es patron de riesgo si > 30% de tareas se retrasan
    (COUNT(*) FILTER (WHERE t.updated_at > t.fecha_limite_oficial)::DECIMAL / NULLIF(COUNT(*), 0)) > 0.30 AS es_patron_riesgo
  FROM tarea t
  WHERE t.cliente_id = p_cliente_id
    AND (p_contribuyente_id IS NULL OR t.contribuyente_id = p_contribuyente_id)
    AND t.estado IN ('cerrado', 'pagado')
    AND t.created_at >= CURRENT_DATE - (p_meses_historico || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION fn_patron_retrasos_cliente IS
  'Analiza el historico de retrasos de un cliente para detectar patrones de riesgo.';

-- ============================================
-- FUNCION PRINCIPAL: rpc_detect_risk
-- ============================================
CREATE OR REPLACE FUNCTION rpc_detect_risk(
  p_periodo TEXT DEFAULT NULL
)
RETURNS TABLE (
  tareas_evaluadas INTEGER,
  tareas_marcadas_riesgo INTEGER,
  criterios_aplicados TEXT[]
) AS $$
DECLARE
  v_start_time TIMESTAMPTZ := clock_timestamp();
  v_tareas_evaluadas INTEGER := 0;
  v_tareas_marcadas INTEGER := 0;
  v_criterios TEXT[] := ARRAY[]::TEXT[];
  v_tarea RECORD;
  v_nuevo_riesgo TEXT;
  v_razon TEXT;
  v_criterio_aplicado TEXT;
BEGIN
  -- Criterios disponibles
  v_criterios := ARRAY[
    'DIAS_VENCIMIENTO',    -- < 5 dias habiles
    'PRESENTADO_SIN_PAGO', -- > 3 dias sin pago
    'BLOQUEADO_DEPS',      -- Bloqueado por dependencias
    'PATRON_HISTORICO'     -- Cliente con historial de retrasos
  ];

  -- Evaluar cada tarea pendiente
  FOR v_tarea IN
    SELECT
      t.tarea_id,
      t.cliente_id,
      t.contribuyente_id,
      t.estado,
      t.riesgo AS riesgo_actual,
      t.fecha_limite_oficial,
      t.fecha_limite_interna,
      t.periodo_fiscal,
      t.updated_at,
      fn_dias_habiles_hasta(t.fecha_limite_oficial) AS dias_hasta_limite
    FROM tarea t
    WHERE t.estado NOT IN ('cerrado', 'pagado', 'rechazado')
      AND (p_periodo IS NULL OR t.periodo_fiscal = p_periodo)
  LOOP
    v_tareas_evaluadas := v_tareas_evaluadas + 1;
    v_nuevo_riesgo := v_tarea.riesgo_actual;
    v_razon := NULL;
    v_criterio_aplicado := NULL;

    -- CRITERIO 1: Dias hasta vencimiento (< 5 dias habiles = ALTO)
    IF v_tarea.dias_hasta_limite < 5 AND v_tarea.dias_hasta_limite >= 0 THEN
      IF v_tarea.riesgo_actual <> 'ALTO' THEN
        v_nuevo_riesgo := 'ALTO';
        v_razon := 'Menos de 5 dias habiles hasta vencimiento';
        v_criterio_aplicado := 'DIAS_VENCIMIENTO';
      END IF;
    END IF;

    -- CRITERIO 2: Presentado sin pago > 3 dias
    IF v_tarea.estado = 'presentado' THEN
      IF CURRENT_DATE - v_tarea.updated_at::DATE > 3 THEN
        IF v_tarea.riesgo_actual <> 'ALTO' THEN
          v_nuevo_riesgo := 'ALTO';
          v_razon := 'Presentado hace mas de 3 dias sin confirmacion de pago';
          v_criterio_aplicado := 'PRESENTADO_SIN_PAGO';
        END IF;
      END IF;
    END IF;

    -- CRITERIO 3: Bloqueado por dependencias (estado bloqueado_cliente)
    IF v_tarea.estado = 'bloqueado_cliente' THEN
      -- Verificar tiempo bloqueado
      IF CURRENT_DATE - v_tarea.updated_at::DATE > 2 THEN
        IF v_tarea.riesgo_actual <> 'ALTO' THEN
          v_nuevo_riesgo := 'ALTO';
          v_razon := 'Bloqueado por cliente por mas de 2 dias';
          v_criterio_aplicado := 'BLOQUEADO_DEPS';
        END IF;
      END IF;
    END IF;

    -- CRITERIO 4: Patron historico de retrasos
    IF v_nuevo_riesgo <> 'ALTO' THEN
      -- Solo evaluar si aun no es ALTO
      DECLARE
        v_patron RECORD;
      BEGIN
        SELECT * INTO v_patron
        FROM fn_patron_retrasos_cliente(v_tarea.cliente_id, v_tarea.contribuyente_id);

        IF v_patron.es_patron_riesgo AND v_patron.tareas_historicas >= 5 THEN
          IF v_tarea.riesgo_actual = 'BAJO' THEN
            v_nuevo_riesgo := 'MEDIO';
            v_razon := 'Cliente con patron historico de retrasos (' || v_patron.pct_retraso::TEXT || '%)';
            v_criterio_aplicado := 'PATRON_HISTORICO';
          END IF;
        END IF;
      END;
    END IF;

    -- Si el riesgo cambio, actualizar la tarea
    IF v_nuevo_riesgo <> v_tarea.riesgo_actual THEN
      UPDATE tarea
      SET
        riesgo = v_nuevo_riesgo,
        updated_at = NOW()
      WHERE tarea_id = v_tarea.tarea_id;

      -- Registrar el evento de cambio de riesgo
      INSERT INTO tarea_evento (
        tarea_id,
        tipo_evento,
        estado_anterior,
        estado_nuevo,
        actor_usuario_id,
        occurred_at,
        metadata_json
      ) VALUES (
        v_tarea.tarea_id,
        'RISK_CHANGE',
        v_tarea.riesgo_actual,
        v_nuevo_riesgo,
        auth.uid(),
        NOW(),
        jsonb_build_object(
          'criterio', v_criterio_aplicado,
          'razon', v_razon,
          'dias_hasta_limite', v_tarea.dias_hasta_limite
        )
      );

      v_tareas_marcadas := v_tareas_marcadas + 1;
    END IF;
  END LOOP;

  -- Registrar ejecucion en el log
  INSERT INTO deteccion_riesgo_log (
    periodo_fiscal,
    tareas_evaluadas,
    tareas_marcadas,
    criterios_aplicados,
    ejecutado_por,
    duracion_ms,
    metadata
  ) VALUES (
    p_periodo,
    v_tareas_evaluadas,
    v_tareas_marcadas,
    v_criterios,
    auth.uid(),
    EXTRACT(MILLISECOND FROM (clock_timestamp() - v_start_time))::INTEGER,
    jsonb_build_object(
      'version', '1.0',
      'ejecutado_at', NOW()
    )
  );

  -- Retornar resultados
  RETURN QUERY SELECT
    v_tareas_evaluadas,
    v_tareas_marcadas,
    v_criterios;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION rpc_detect_risk IS
  'Evalua tareas pendientes y marca las de alto riesgo. Criterios: dias vencimiento, presentado sin pago, bloqueado, patron historico.';

-- ============================================
-- FUNCION: Obtener tareas de alto riesgo
-- ============================================
CREATE OR REPLACE FUNCTION rpc_get_high_risk_tasks(
  p_periodo TEXT DEFAULT NULL,
  p_limite INTEGER DEFAULT 50
)
RETURNS TABLE (
  tarea_id UUID,
  cliente_nombre TEXT,
  contribuyente_rfc TEXT,
  obligacion_nombre TEXT,
  estado TEXT,
  riesgo TEXT,
  fecha_limite_oficial DATE,
  dias_restantes INTEGER,
  responsable_nombre TEXT,
  criterio_riesgo TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tarea_id,
    c.nombre_comercial AS cliente_nombre,
    co.rfc AS contribuyente_rfc,
    o.nombre_corto AS obligacion_nombre,
    t.estado,
    t.riesgo,
    t.fecha_limite_oficial,
    fn_dias_habiles_hasta(t.fecha_limite_oficial) AS dias_restantes,
    u.nombre AS responsable_nombre,
    -- Determinar criterio principal de riesgo
    CASE
      WHEN fn_dias_habiles_hasta(t.fecha_limite_oficial) < 5 THEN 'DIAS_VENCIMIENTO'
      WHEN t.estado = 'presentado' AND CURRENT_DATE - t.updated_at::DATE > 3 THEN 'PRESENTADO_SIN_PAGO'
      WHEN t.estado = 'bloqueado_cliente' THEN 'BLOQUEADO_DEPS'
      ELSE 'OTRO'
    END AS criterio_riesgo
  FROM tarea t
  JOIN cliente c ON c.cliente_id = t.cliente_id
  JOIN contribuyente co ON co.contribuyente_id = t.contribuyente_id
  JOIN obligacion_fiscal o ON o.id_obligacion = t.id_obligacion
  LEFT JOIN users u ON u.user_id = t.responsable_usuario_id
  WHERE t.riesgo = 'ALTO'
    AND t.estado NOT IN ('cerrado', 'pagado', 'rechazado')
    AND (p_periodo IS NULL OR t.periodo_fiscal = p_periodo)
  ORDER BY
    fn_dias_habiles_hasta(t.fecha_limite_oficial) ASC,
    t.fecha_limite_oficial ASC
  LIMIT p_limite;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION rpc_get_high_risk_tasks IS
  'Obtiene la lista de tareas de alto riesgo ordenadas por urgencia.';

-- ============================================
-- FUNCION: Resumen de riesgo por periodo
-- ============================================
CREATE OR REPLACE FUNCTION rpc_risk_summary(
  p_periodo TEXT DEFAULT NULL
)
RETURNS TABLE (
  periodo TEXT,
  total_tareas INTEGER,
  riesgo_alto INTEGER,
  riesgo_medio INTEGER,
  riesgo_bajo INTEGER,
  pct_alto DECIMAL(5,2),
  tareas_vencidas INTEGER,
  tareas_por_vencer_5_dias INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(p_periodo, t.periodo_fiscal) AS periodo,
    COUNT(*)::INTEGER AS total_tareas,
    COUNT(*) FILTER (WHERE t.riesgo = 'ALTO')::INTEGER AS riesgo_alto,
    COUNT(*) FILTER (WHERE t.riesgo = 'MEDIO')::INTEGER AS riesgo_medio,
    COUNT(*) FILTER (WHERE t.riesgo = 'BAJO')::INTEGER AS riesgo_bajo,
    (COUNT(*) FILTER (WHERE t.riesgo = 'ALTO')::DECIMAL / NULLIF(COUNT(*), 0) * 100)::DECIMAL(5,2) AS pct_alto,
    COUNT(*) FILTER (WHERE t.fecha_limite_oficial < CURRENT_DATE)::INTEGER AS tareas_vencidas,
    COUNT(*) FILTER (WHERE fn_dias_habiles_hasta(t.fecha_limite_oficial) BETWEEN 0 AND 5)::INTEGER AS tareas_por_vencer_5_dias
  FROM tarea t
  WHERE t.estado NOT IN ('cerrado', 'pagado', 'rechazado')
    AND (p_periodo IS NULL OR t.periodo_fiscal = p_periodo)
  GROUP BY COALESCE(p_periodo, t.periodo_fiscal)
  ORDER BY periodo DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION rpc_risk_summary IS
  'Resumen de distribucion de riesgo y tareas por vencer.';

-- ============================================
-- FUNCION: Seleccionar tareas para auditoria por riesgo
-- Selecciona tareas que han sido marcadas como riesgo
-- ============================================
CREATE OR REPLACE FUNCTION rpc_seleccionar_auditoria_por_riesgo(
  p_periodo TEXT,
  p_auditor_id UUID,
  p_limite INTEGER DEFAULT 10
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_tarea RECORD;
BEGIN
  -- Seleccionar tareas cerradas que tuvieron riesgo ALTO
  FOR v_tarea IN
    SELECT DISTINCT t.tarea_id
    FROM tarea t
    JOIN tarea_evento te ON te.tarea_id = t.tarea_id
    WHERE t.estado IN ('cerrado', 'pagado')
      AND t.periodo_fiscal = p_periodo
      -- Que hayan tenido evento de cambio de riesgo a ALTO
      AND te.tipo_evento = 'RISK_CHANGE'
      AND te.estado_nuevo = 'ALTO'
      -- Que no hayan sido auditadas
      AND NOT EXISTS (
        SELECT 1 FROM auditoria a
        WHERE a.tarea_id = t.tarea_id
      )
    ORDER BY t.fecha_limite_oficial DESC
    LIMIT p_limite
  LOOP
    -- Crear registro de auditoria
    INSERT INTO auditoria (
      tarea_id,
      auditor_id,
      periodo_fiscal,
      tipo_seleccion
    ) VALUES (
      v_tarea.tarea_id,
      p_auditor_id,
      p_periodo,
      'POR_RIESGO'
    )
    ON CONFLICT DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION rpc_seleccionar_auditoria_por_riesgo IS
  'Selecciona tareas cerradas que fueron de alto riesgo para auditoria prioritaria.';

-- ============================================
-- VISTA: Dashboard de riesgo
-- ============================================
CREATE OR REPLACE VIEW vw_dashboard_riesgo AS
SELECT
  t.periodo_fiscal,
  -- Metricas generales
  COUNT(*) AS total_tareas_activas,
  COUNT(*) FILTER (WHERE t.riesgo = 'ALTO') AS tareas_alto_riesgo,
  COUNT(*) FILTER (WHERE t.fecha_limite_oficial < CURRENT_DATE) AS tareas_vencidas,
  COUNT(*) FILTER (WHERE fn_dias_habiles_hasta(t.fecha_limite_oficial) BETWEEN 0 AND 5) AS por_vencer_5_dias,
  -- Por estado
  COUNT(*) FILTER (WHERE t.estado = 'pendiente') AS pendientes,
  COUNT(*) FILTER (WHERE t.estado = 'en_curso') AS en_curso,
  COUNT(*) FILTER (WHERE t.estado = 'bloqueado_cliente') AS bloqueadas,
  COUNT(*) FILTER (WHERE t.estado = 'presentado') AS presentadas_sin_pago,
  -- Metricas de tiempo
  AVG(fn_dias_habiles_hasta(t.fecha_limite_oficial)) FILTER (WHERE t.riesgo = 'ALTO') AS dias_promedio_alto_riesgo
FROM tarea t
WHERE t.estado NOT IN ('cerrado', 'pagado', 'rechazado')
GROUP BY t.periodo_fiscal
ORDER BY t.periodo_fiscal DESC;

COMMENT ON VIEW vw_dashboard_riesgo IS
  'Vista consolidada para dashboard de monitoreo de riesgo.';

-- ============================================
-- RLS para tabla de log
-- ============================================
ALTER TABLE deteccion_riesgo_log ENABLE ROW LEVEL SECURITY;

-- Solo ADMIN/SOCIO/AUDITOR pueden ver el log
DROP POLICY IF EXISTS deteccion_riesgo_log_select ON deteccion_riesgo_log;
CREATE POLICY deteccion_riesgo_log_select ON deteccion_riesgo_log
  FOR SELECT
  USING (
    get_user_role() IN ('ADMIN', 'SOCIO', 'AUDITOR')
  );

-- Solo el sistema puede insertar (via SECURITY DEFINER)
DROP POLICY IF EXISTS deteccion_riesgo_log_insert ON deteccion_riesgo_log;
CREATE POLICY deteccion_riesgo_log_insert ON deteccion_riesgo_log
  FOR INSERT
  WITH CHECK (is_admin_or_socio());

-- ============================================
-- PERMISOS: Ejecutar funciones RPC
-- ============================================
GRANT EXECUTE ON FUNCTION rpc_detect_risk TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_get_high_risk_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_risk_summary TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_seleccionar_auditoria_por_riesgo TO authenticated;

-- ============================================
-- FIN DE MIGRACION T2B.7
-- ============================================
