-- Migración: Agregar 'LIDER' como tipo de colaborador en pasos de proceso
-- Fecha: 2026-01-13
-- Descripción: Permite asignar pasos de proceso directamente al líder del equipo

-- 1. Actualizar constraint en proceso_paso
ALTER TABLE proceso_paso DROP CONSTRAINT IF EXISTS proceso_paso_tipo_colaborador_check;
ALTER TABLE proceso_paso ADD CONSTRAINT proceso_paso_tipo_colaborador_check
    CHECK (tipo_colaborador IN ('LIDER', 'A', 'B', 'C'));

-- 2. Actualizar constraint en tarea_step
ALTER TABLE tarea_step DROP CONSTRAINT IF EXISTS tarea_step_tipo_colaborador_check;
ALTER TABLE tarea_step ADD CONSTRAINT tarea_step_tipo_colaborador_check
    CHECK (tipo_colaborador IN ('LIDER', 'A', 'B', 'C'));
