# SGR-CBC Runbook

Guía de procedimientos operacionales y scripts de mantenimiento para el sistema SGR-CBC.

## Índice

1. [Base de Datos](#base-de-datos)
   - [Asignar equipos a contribuyentes](#asignar-equipos-a-contribuyentes)
   - [Verificar integridad de datos](#verificar-integridad-de-datos)
2. [Usuarios y Roles](#usuarios-y-roles)
   - [Crear usuario de prueba LIDER](#crear-usuario-de-prueba-lider)
3. [Mantenimiento Periódico](#mantenimiento-periódico)
   - [Inicio de mes](#inicio-de-mes)

---

## Base de Datos

### Asignar equipos a contribuyentes

**Archivo:** `supabase/migrations/20260120_assign_team_to_contribuyentes.sql`

**Cuándo usar:**
- Migración inicial de datos históricos
- Inicio de mes para asignar nuevos contribuyentes
- Después de importar datos masivos
- Cuando contribuyentes no aparecen en "Mi Equipo" o "Alertas"

**Qué hace:**
Asigna `team_id` a contribuyentes basándose en las tareas que tienen asignadas a miembros de equipos.

```sql
-- Ejecutar en Supabase SQL Editor
UPDATE contribuyente c
SET team_id = subq.team_id,
    updated_at = NOW()
FROM (
    SELECT DISTINCT ON (t.contribuyente_id)
        t.contribuyente_id,
        tm.team_id
    FROM tarea t
    JOIN team_members tm ON tm.user_id = t.responsable_usuario_id
    WHERE tm.activo = true
    AND t.contribuyente_id IS NOT NULL
    ORDER BY t.contribuyente_id, t.created_at DESC
) subq
WHERE c.contribuyente_id = subq.contribuyente_id
AND (c.team_id IS NULL OR c.team_id IS DISTINCT FROM subq.team_id);
```

**Verificación posterior:**
```sql
-- Ver contribuyentes por equipo
SELECT
    t.nombre AS equipo,
    COUNT(c.contribuyente_id) AS contribuyentes
FROM teams t
LEFT JOIN contribuyente c ON c.team_id = t.team_id AND c.activo = true
WHERE t.activo = true
GROUP BY t.team_id, t.nombre
ORDER BY t.nombre;

-- Contribuyentes sin equipo que tienen tareas (revisar manualmente)
SELECT DISTINCT
    c.rfc,
    c.nombre_comercial,
    COUNT(t.tarea_id) AS total_tareas
FROM contribuyente c
JOIN tarea t ON t.contribuyente_id = c.contribuyente_id
WHERE c.team_id IS NULL AND c.activo = true
GROUP BY c.contribuyente_id, c.rfc, c.nombre_comercial
ORDER BY total_tareas DESC;
```

---

### Verificar integridad de datos

**Cuándo usar:**
- Antes de migraciones importantes
- Cuando hay comportamiento inesperado en la aplicación
- Auditorías periódicas

```sql
-- Tareas sin responsable asignado
SELECT COUNT(*) as tareas_sin_responsable
FROM tarea
WHERE responsable_usuario_id IS NULL
AND estado NOT IN ('cerrado', 'pagado');

-- Tareas con contribuyente inactivo
SELECT COUNT(*) as tareas_contrib_inactivo
FROM tarea t
JOIN contribuyente c ON c.contribuyente_id = t.contribuyente_id
WHERE c.activo = false
AND t.estado NOT IN ('cerrado', 'pagado');

-- Usuarios en múltiples equipos (puede ser válido, verificar)
SELECT u.email, COUNT(tm.team_id) as equipos
FROM users u
JOIN team_members tm ON tm.user_id = u.user_id
WHERE tm.activo = true
GROUP BY u.user_id, u.email
HAVING COUNT(tm.team_id) > 1;

-- Equipos sin líder
SELECT t.nombre as equipo
FROM teams t
WHERE t.activo = true
AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = t.team_id
    AND tm.rol_en_equipo = 'LIDER'
    AND tm.activo = true
);
```

---

## Usuarios y Roles

### Crear usuario de prueba LIDER

**Archivo:** `supabase/seeds/seed_lider_test_user.sql`

**Cuándo usar:**
- Configurar ambiente de pruebas E2E
- Probar funcionalidad de rol LIDER

**Prerequisitos:**
1. Crear usuario en Supabase Auth con email `lider.prueba@sgrcbc.test`
2. El usuario debe existir en la tabla `users`

**Qué hace:**
1. Asigna rol `LIDER` al usuario
2. Lo agrega al equipo ISIS (o lo crea si no existe)
3. Actualiza `team_id` en contribuyentes relacionados
4. Crea tareas de prueba (vencidas, por vencer, etc.)

---

## Mantenimiento Periódico

### Inicio de mes

**Frecuencia:** Primer día hábil de cada mes

**Pasos:**

1. **Asignar equipos a nuevos contribuyentes**
   ```sql
   -- Ejecutar: supabase/migrations/20260120_assign_team_to_contribuyentes.sql
   ```

2. **Verificar tareas huérfanas**
   ```sql
   -- Tareas sin responsable que vencen este mes
   SELECT
       t.tarea_id,
       c.nombre_comercial as cliente,
       t.fecha_limite_oficial
   FROM tarea t
   JOIN cliente c ON c.cliente_id = t.cliente_id
   WHERE t.responsable_usuario_id IS NULL
   AND t.estado IN ('no_iniciado', 'en_curso')
   AND t.fecha_limite_oficial BETWEEN DATE_TRUNC('month', CURRENT_DATE)
                                   AND DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
   ORDER BY t.fecha_limite_oficial;
   ```

3. **Revisar carga de trabajo por equipo**
   ```sql
   SELECT
       te.nombre as equipo,
       COUNT(CASE WHEN ta.estado = 'no_iniciado' THEN 1 END) as pendientes,
       COUNT(CASE WHEN ta.estado = 'en_curso' THEN 1 END) as en_curso,
       COUNT(CASE WHEN ta.fecha_limite_oficial < CURRENT_DATE
                  AND ta.estado IN ('no_iniciado', 'en_curso') THEN 1 END) as vencidas
   FROM teams te
   JOIN contribuyente co ON co.team_id = te.team_id
   JOIN tarea ta ON ta.contribuyente_id = co.contribuyente_id
   WHERE te.activo = true
   AND ta.estado NOT IN ('cerrado', 'pagado', 'presentado')
   GROUP BY te.team_id, te.nombre
   ORDER BY vencidas DESC, pendientes DESC;
   ```

---

## Estados de Tareas

Referencia rápida de estados válidos (según `schema_v2_updates.sql`):

| Estado | Descripción |
|--------|-------------|
| `no_iniciado` | Tarea creada, pendiente de iniciar |
| `en_curso` | En proceso de trabajo |
| `revision` | Pendiente de validación por líder |
| `terminado` | Completada internamente |
| `bloqueado_cliente` | Esperando información del cliente |
| `rechazado` | Rechazada en validación |
| `presentado` | Presentada ante autoridad |
| `pagado` | Pago confirmado |
| `cerrado` | Ciclo completo |

---

## Contacto

Para dudas sobre estos procedimientos, contactar al equipo de desarrollo.
