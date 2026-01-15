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
