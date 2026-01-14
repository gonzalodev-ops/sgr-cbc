# Tareas para Agentes - SGR-CBC

Este documento divide los gaps en tareas independientes que pueden ser ejecutadas por diferentes agentes de Claude Code en paralelo.

---

## Principios de División

1. **Sin conflictos de archivos** - Cada tarea trabaja en archivos/componentes distintos
2. **Independencia** - Las tareas no dependen unas de otras (salvo las marcadas)
3. **Alcance claro** - Cada tarea tiene entregables específicos

---

## BLOQUE A: Nuevas Páginas/Vistas (4 tareas independientes)

Estas tareas crean páginas nuevas, no modifican código existente.

### TAREA-A1: Vista de Calendario Visual
**Gaps:** GAP-CAL-01
**Prioridad:** P1
**Archivos a crear:**
- `src/app/dashboard/calendario/page.tsx` (reemplazar placeholder)
- `src/components/calendario/CalendarioMensual.tsx`
- `src/components/calendario/CalendarioSemanal.tsx`
- `src/components/calendario/DeadlineCard.tsx`

**Prompt para agente:**
```
Implementa la vista de calendario en /dashboard/calendario que muestre:
1. Vista mensual con deadlines de tareas
2. Vista semanal con detalle por día
3. Filtros por: tribu, cliente, proceso
4. Código de colores por estado (verde=completado, amarillo=en curso, rojo=vencido)
5. Click en deadline para ver detalle de la tarea

Usa los datos de las tablas: calendario_deadline, tarea, cliente, contribuyente.
El componente debe consultar Supabase directamente.
```

---

### TAREA-A2: Vista por Proceso/Flujo de Trabajo
**Gaps:** GAP-VIS-08
**Prioridad:** P1
**Archivos a crear:**
- `src/app/dashboard/proceso/page.tsx`
- `src/components/proceso/ProcesoMetrics.tsx`
- `src/components/proceso/ProcesoTable.tsx`

**Prompt para agente:**
```
Crea una nueva página /dashboard/proceso que muestre métricas por tipo de proceso:
1. Selector de proceso (NOMINA, IMSS, IMPUESTOS, etc.)
2. KPIs: total entregables, % a tiempo, puntos totales
3. Distribución de estados (pendiente, en curso, terminado, etc.)
4. Tabla de tareas filtradas por proceso seleccionado
5. Comparativa entre periodos (mes actual vs anterior)

Usa las tablas: proceso_operativo, tarea, tarea_step.
Agrega enlace en el Sidebar.tsx existente.
```

---

### TAREA-A3: Dashboard Ejecutivo para Socios
**Gaps:** GAP-EXE-01, GAP-EXE-02
**Prioridad:** P2
**Archivos a crear:**
- `src/app/dashboard/ejecutivo/page.tsx`
- `src/components/ejecutivo/KPICards.tsx`
- `src/components/ejecutivo/TrendCharts.tsx`
- `src/components/ejecutivo/AlertasRiesgo.tsx`

**Prompt para agente:**
```
Crea un dashboard ejecutivo en /dashboard/ejecutivo para socios con:
1. KPIs consolidados: tareas totales, % cumplimiento, puntos generados
2. Gráfico de tendencia mensual (últimos 6 meses)
3. Top 5 clientes por esfuerzo (puntos)
4. Top 5 procesos con más retrasos
5. Alertas de tareas en riesgo crítico
6. Solo visible para roles ADMIN y SOCIO

Solo lectura, sin funcionalidad de edición.
```

---

### TAREA-A4: UI de Gestión de Entregables
**Gaps:** GAP-ENT-01
**Prioridad:** P1
**Archivos a crear:**
- `src/app/dashboard/entregables/page.tsx` (reemplazar placeholder)
- `src/components/entregables/EntregableForm.tsx`
- `src/components/entregables/EntregableList.tsx`

**Prompt para agente:**
```
Implementa la página /dashboard/entregables para gestionar el catálogo:
1. Lista de entregables existentes con búsqueda
2. Formulario para crear/editar entregable (nombre, descripción, tipo)
3. Vincular entregable a obligaciones fiscales
4. Configurar peso % por régimen fiscal
5. Activar/desactivar entregables

CRUD completo usando tablas: entregable, entregable_obligacion, regimen_entregable_peso.
```

---

## BLOQUE B: Funcionalidades de Auditoría (2 tareas independientes)

### TAREA-B1: UI de Registro de Hallazgos
**Gaps:** GAP-AUD-02, GAP-AUD-01
**Prioridad:** P1
**Archivos a modificar:**
- `src/app/dashboard/auditor/page.tsx`
**Archivos a crear:**
- `src/components/auditor/HallazgoForm.tsx`
- `src/components/auditor/HallazgoList.tsx`

**Prompt para agente:**
```
Extiende el panel de auditor (/dashboard/auditor) para incluir:
1. Al rechazar una auditoría, formulario para registrar hallazgos:
   - Tipo: ERROR_TECNICO, DOCUMENTACION, PROCESO, COMUNICACION
   - Gravedad: BAJA, MEDIA, ALTA, CRITICA
   - Descripción del hallazgo
   - ¿Genera retrabajo? (sí/no)
2. Agregar estado "APROBADO_CON_OBSERVACIONES" además de APROBADO/RECHAZADO
3. Lista de hallazgos por tarea con filtros
4. Usar tablas: findings, tarea_auditoria

Lee primero el archivo actual src/app/dashboard/auditor/page.tsx antes de modificar.
```

---

### TAREA-B2: Retrabajo en Agenda del Colaborador
**Gaps:** GAP-AUD-03
**Prioridad:** P1
**Archivos a modificar:**
- `src/app/dashboard/colaborador/page.tsx`
**Archivos a crear:**
- `src/components/colaborador/RetrabajoList.tsx`

**Prompt para agente:**
```
Modifica la vista de colaborador (/dashboard/colaborador) para mostrar:
1. Nueva sección "Retrabajos Pendientes" destacada en rojo/naranja
2. Lista de tareas de retrabajo asignadas al colaborador
3. Para cada retrabajo: tarea origen, hallazgo, fecha límite, estado
4. Permitir marcar retrabajo como completado
5. Contador de retrabajos en el header de la página

Usar tabla: retrabajo (con joins a findings y tarea).
Lee primero el archivo actual antes de modificar.
```

---

## BLOQUE C: Gestión de Equipo (2 tareas con dependencia)

### TAREA-C1: Panel de Reasignación para Líder
**Gaps:** GAP-ROL-02
**Prioridad:** P1
**Archivos a modificar:**
- `src/app/dashboard/tribu/page.tsx`
**Archivos a crear:**
- `src/components/tribu/ReasignarModal.tsx`
- `src/components/tribu/CargaEquipo.tsx`

**Prompt para agente:**
```
Extiende la vista de tribu (/dashboard/tribu) para que el líder pueda:
1. Ver carga de trabajo por miembro (tareas asignadas, puntos)
2. Gráfico de balance de carga entre miembros
3. Botón "Reasignar" en cada tarea que abre modal
4. Modal de reasignación: seleccionar nuevo responsable del equipo
5. Registrar en tarea_evento el cambio de responsable

Solo visible para usuarios con rol LIDER en ese equipo.
Lee primero el archivo actual antes de modificar.
```

---

### TAREA-C2: Reasignación Automática y Gestión de Ausencias
**Gaps:** GAP-ROL-01, GAP-ROL-03
**Prioridad:** P1
**Depende de:** TAREA-C1 (usa misma lógica de reasignación)
**Archivos a crear:**
- `src/app/dashboard/configuracion/ausencias/page.tsx`
- `src/components/config/AusenciaForm.tsx`
- `src/lib/engine/autoReassign.ts`
- `src/app/api/engine/auto-reassign/route.ts`

**Prompt para agente:**
```
Implementa sistema de ausencias y reasignación automática:

1. Nueva sub-página en configuración para registrar ausencias:
   - Colaborador, fecha inicio, fecha fin, tipo (VACACIONES/INCAPACIDAD/OTRO)
   - Suplente asignado (opcional)

2. Motor de reasignación automática (src/lib/engine/autoReassign.ts):
   - Al activarse una ausencia, buscar tareas pendientes del colaborador
   - Si tiene suplente definido en team_members, reasignar a suplente
   - Si no tiene suplente, reasignar al líder del equipo
   - Registrar en tarea_evento

3. API endpoint que puede ejecutarse manualmente o por cron

Crear nueva tabla si es necesario: ausencia (colaborador_id, fecha_inicio, fecha_fin, tipo, suplente_id).
```

---

## BLOQUE D: Mejoras a Vistas Existentes (4 tareas independientes)

### TAREA-D1: Indicador "En Riesgo" por Falta de Pago
**Gaps:** GAP-FLU-03
**Prioridad:** P1
**Archivos a modificar:**
- `src/app/dashboard/page.tsx` (Tablero Maestro)
- `src/app/dashboard/cliente/page.tsx`

**Prompt para agente:**
```
Agrega indicadores visuales para tareas "presentadas sin pago":
1. En el Tablero Maestro: badge rojo "SIN PAGO" en tareas con estado='presentado'
2. En vista Cliente: sección destacada "Impuestos pendientes de pago"
3. Contador en KPIs: "X tareas esperando pago del cliente"
4. Tooltip explicando qué significa el estado

El estado 'presentado' ya existe en sla_config. Solo agregar visualización.
Lee los archivos actuales antes de modificar.
```

---

### TAREA-D2: Matriz Obligaciones vs Servicios CBC
**Gaps:** GAP-VIS-06
**Prioridad:** P1
**Archivos a modificar:**
- `src/app/dashboard/cliente/ClientePage.tsx`
**Archivos a crear:**
- `src/components/cliente/MatrizObligaciones.tsx`

**Prompt para agente:**
```
En el detalle de cliente, agregar matriz que muestre:
1. Por cada RFC del cliente:
   - Lista de obligaciones fiscales que aplican (por su régimen)
   - Cuáles están cubiertas por servicios CBC contratados
   - Cuáles NO están cubiertas (alerta)
2. Formato: tabla con checkmarks verdes (cubierta) y X rojas (no cubierta)
3. Resumen: "X de Y obligaciones cubiertas"

Usar tablas: contribuyente_regimen, regimen_obligacion, cliente_servicio, servicio_obligacion.
Lee ClientePage.tsx actual antes de modificar.
```

---

### TAREA-D3: Dashboard de Puntos Acumulados
**Gaps:** GAP-PTS-02
**Prioridad:** P2
**Archivos a crear:**
- `src/components/colaborador/PuntosChart.tsx`
- `src/components/tribu/PuntosTribu.tsx`
**Archivos a modificar:**
- `src/app/dashboard/colaborador/page.tsx`
- `src/app/dashboard/tribu/page.tsx`

**Prompt para agente:**
```
Agrega visualización detallada de puntos:
1. En vista Colaborador:
   - Gráfico de barras: puntos por mes (últimos 6 meses)
   - Desglose: puntos por proceso, por cliente
   - Meta vs real (si se define meta)

2. En vista Tribu:
   - Total puntos del equipo
   - Ranking de miembros por puntos
   - Comparativa con mes anterior

Calcular puntos desde tareas completadas usando la fórmula existente en mockData.ts.
```

---

### TAREA-D4: Balance de Carga y Distribución
**Gaps:** GAP-VIS-03, GAP-VIS-01
**Prioridad:** P2
**Archivos a crear:**
- `src/components/tribu/BalanceCarga.tsx`
- `src/components/colaborador/DistribucionTrabajo.tsx`
**Archivos a modificar:**
- `src/app/dashboard/tribu/page.tsx`
- `src/app/dashboard/colaborador/page.tsx`

**Prompt para agente:**
```
Implementa visualización de balance y distribución:
1. En vista Tribu - Balance de carga:
   - Gráfico de barras horizontal: tareas por miembro
   - Indicador de desbalance (si alguien tiene >30% más que promedio)
   - Sugerencia de redistribución

2. En vista Colaborador - Distribución:
   - Pie chart: distribución por cliente
   - Pie chart: distribución por proceso
   - Tabla: top 5 clientes por tiempo dedicado

Lee los archivos actuales antes de modificar.
```

---

## BLOQUE E: Backend y Configuración (3 tareas independientes)

### TAREA-E1: Catálogo de Días Inhábiles
**Gaps:** GAP-CAL-02
**Prioridad:** P2
**Archivos a crear:**
- `src/components/config/DiasInhabiles.tsx`
- `supabase/migrations/YYYYMMDD_dias_inhabiles.sql`
**Archivos a modificar:**
- `src/app/dashboard/configuracion/page.tsx` (agregar tab)

**Prompt para agente:**
```
Crea módulo de días inhábiles:
1. Nueva tabla: dia_inhabil (fecha, descripcion, tipo: FERIADO/PUENTE/ESPECIAL, año)
2. UI en configuración para:
   - Listar días inhábiles del año
   - Agregar/editar/eliminar días
   - Importar días del SAT (lista predefinida)
3. Modificar cálculo de deadlines para considerar días inhábiles

Crear migración SQL y componente React.
```

---

### TAREA-E2: Registro de Ajustes de Fecha (Auditoría)
**Gaps:** GAP-CAL-03
**Prioridad:** P2
**Archivos a crear:**
- `src/components/tarea/AjusteFechaModal.tsx`
- `supabase/migrations/YYYYMMDD_fecha_ajuste_log.sql`
**Archivos a modificar:**
- `src/app/dashboard/page.tsx` (agregar botón ajustar fecha)

**Prompt para agente:**
```
Implementa registro de cambios de fecha límite:
1. Nueva tabla: fecha_ajuste_log (tarea_id, fecha_anterior, fecha_nueva, motivo, usuario_id, created_at)
2. Modal para ajustar fecha de una tarea:
   - Nueva fecha
   - Motivo del cambio (campo obligatorio)
   - Solo para LIDER, SOCIO, ADMIN
3. En detalle de tarea: historial de ajustes de fecha

Crear migración y componentes necesarios.
```

---

### TAREA-E3: Configuración Granular Talla RFC-Proceso
**Gaps:** GAP-PTS-01
**Prioridad:** P2
**Archivos a crear:**
- `src/components/config/TallaRfcProceso.tsx`
- `supabase/migrations/YYYYMMDD_talla_rfc_proceso.sql`
**Archivos a modificar:**
- `src/app/dashboard/configuracion/page.tsx`
- `src/lib/data/mockData.ts` (función calcularPuntos)

**Prompt para agente:**
```
Permite configurar talla por combinación RFC-Proceso:
1. Nueva tabla: contribuyente_proceso_talla (contribuyente_id, proceso_id, talla_id, vigencia)
2. UI en configuración de cliente para asignar talla por proceso:
   - Al expandir un RFC, mostrar lista de procesos
   - Selector de talla para cada proceso
3. Actualizar cálculo de puntos para usar esta tabla (si existe) o el dominio general (fallback)

Crear migración y actualizar lógica de cálculo.
```

---

## BLOQUE F: Análisis y Reportes (2 tareas independientes)

### TAREA-F1: Análisis de Tiempos por Paso
**Gaps:** GAP-VIS-09
**Prioridad:** P2
**Archivos a crear:**
- `src/app/dashboard/analisis/page.tsx`
- `src/components/analisis/TiemposPorPaso.tsx`

**Prompt para agente:**
```
Crea página de análisis de tiempos:
1. Selector de proceso
2. Por cada paso del proceso:
   - Tiempo promedio de ejecución
   - Tiempo mínimo/máximo
   - Desviación estándar
3. Identificar pasos "cuello de botella" (tiempo > promedio + 1 std)
4. Gráfico de embudo mostrando dónde se pierde más tiempo

Calcular desde: tarea_step.completado_at - tarea_step.created_at (o paso anterior).
```

---

### TAREA-F2: Identificación de Rezagos/Backlog
**Gaps:** GAP-VIS-10
**Prioridad:** P2
**Archivos a crear:**
- `src/components/analisis/BacklogAnalysis.tsx`
**Archivos a modificar:**
- `src/app/dashboard/analisis/page.tsx` (si existe de F1)

**Prompt para agente:**
```
Agrega análisis de rezagos históricos:
1. Identificar tareas de periodos anteriores no completadas
2. Clasificar: trabajo recurrente (periodo actual) vs backlog (periodos pasados)
3. Métricas:
   - Total tareas en backlog
   - Antigüedad promedio del backlog
   - Backlog por cliente/proceso
4. Sugerencia: priorizar limpieza de backlog

Usar campo ejercicio y periodo_fiscal de la tabla tarea.
```

---

## Resumen de Tareas

| Bloque | Tarea | Gaps | Prioridad | Independiente |
|--------|-------|------|-----------|---------------|
| A | A1 - Calendario Visual | CAL-01 | P1 | ✅ |
| A | A2 - Vista Proceso | VIS-08 | P1 | ✅ |
| A | A3 - Dashboard Ejecutivo | EXE-01, EXE-02 | P2 | ✅ |
| A | A4 - UI Entregables | ENT-01 | P1 | ✅ |
| B | B1 - Hallazgos | AUD-02, AUD-01 | P1 | ✅ |
| B | B2 - Retrabajo | AUD-03 | P1 | ✅ |
| C | C1 - Reasignación Manual | ROL-02 | P1 | ✅ |
| C | C2 - Reasignación Auto | ROL-01, ROL-03 | P1 | ⚠️ Depende C1 |
| D | D1 - Indicador Sin Pago | FLU-03 | P1 | ✅ |
| D | D2 - Matriz Obligaciones | VIS-06 | P1 | ✅ |
| D | D3 - Dashboard Puntos | PTS-02 | P2 | ✅ |
| D | D4 - Balance Carga | VIS-03, VIS-01 | P2 | ✅ |
| E | E1 - Días Inhábiles | CAL-02 | P2 | ✅ |
| E | E2 - Log Ajuste Fechas | CAL-03 | P2 | ✅ |
| E | E3 - Talla RFC-Proceso | PTS-01 | P2 | ✅ |
| F | F1 - Tiempos por Paso | VIS-09 | P2 | ✅ |
| F | F2 - Backlog Analysis | VIS-10 | P2 | ⚠️ Depende F1 |

---

## Orden Sugerido de Ejecución

### Ronda 1 (P1 - Paralelo)
Ejecutar simultáneamente:
- TAREA-A1: Calendario
- TAREA-A2: Vista Proceso
- TAREA-A4: UI Entregables
- TAREA-B1: Hallazgos
- TAREA-B2: Retrabajo
- TAREA-C1: Reasignación Manual
- TAREA-D1: Indicador Sin Pago
- TAREA-D2: Matriz Obligaciones

### Ronda 2 (P1 dependiente)
Después de Ronda 1:
- TAREA-C2: Reasignación Automática (necesita C1)

### Ronda 3 (P2 - Paralelo)
Ejecutar simultáneamente:
- TAREA-A3: Dashboard Ejecutivo
- TAREA-D3: Dashboard Puntos
- TAREA-D4: Balance Carga
- TAREA-E1: Días Inhábiles
- TAREA-E2: Log Ajuste Fechas
- TAREA-E3: Talla RFC-Proceso
- TAREA-F1: Tiempos por Paso

### Ronda 4 (P2 dependiente)
Después de Ronda 3:
- TAREA-F2: Backlog Analysis (necesita F1)

---

## Instrucciones para Cada Agente

Al iniciar una tarea, el agente debe:

1. **Crear branch específico:**
   ```
   git checkout -b feature/TAREA-XX-descripcion
   ```

2. **Leer archivos existentes** antes de modificar

3. **Seguir patrones del proyecto:**
   - Componentes en `src/components/`
   - Páginas en `src/app/dashboard/`
   - Tipos en `src/lib/types/database.ts`
   - Supabase client en `src/lib/supabase/`

4. **Crear migración SQL** si modifica schema

5. **Probar la funcionalidad** antes de commit

6. **Commit con mensaje descriptivo:**
   ```
   feat(TAREA-XX): descripción breve del cambio
   ```

---

**Total: 17 tareas divididas en 4 rondas de ejecución**
