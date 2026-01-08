-- SGR CBC - Migración: Agregar peso_pct a tarea_step
-- Fecha: 2026-01-08
-- Propósito: Permitir calcular avance ponderado y puntos por paso

-- 1. Agregar columna peso_pct
ALTER TABLE tarea_step ADD COLUMN IF NOT EXISTS peso_pct DECIMAL;

-- 2. Comentario explicativo
COMMENT ON COLUMN tarea_step.peso_pct IS 'Peso porcentual del paso heredado de proceso_paso. Suma de todos los pasos de una tarea debe = 100.';

-- 3. Migrar datos existentes (llenar peso_pct desde proceso_paso si hay datos)
UPDATE tarea_step ts
SET peso_pct = (
    SELECT pp.peso_pct 
    FROM proceso_paso pp 
    WHERE pp.paso_id = ts.proceso_paso_id
    LIMIT 1
)
WHERE ts.peso_pct IS NULL AND ts.proceso_paso_id IS NOT NULL;
