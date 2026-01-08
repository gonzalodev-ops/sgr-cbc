-- SGR CBC - Migración: Campos de contacto para cliente
-- Fecha: 2026-01-08

-- Agregar campos de contacto a cliente
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS contacto_nombre TEXT;
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS contacto_email TEXT;
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS contacto_telefono TEXT;
ALTER TABLE cliente ADD COLUMN IF NOT EXISTS notas TEXT;
