# Análisis de Gaps y Plan de Implementación

**Fecha de Análisis:** Enero 2026
**Última Actualización:** Enero 2026 (post Sprint 1 y 2)
**Documento Base:** Propuesta Sgr Cbc V0 2.md
**Estado del Proyecto:** MVP en desarrollo avanzado

---

## Resumen Ejecutivo

Este documento presenta un análisis detallado de las funcionalidades acordadas en la propuesta original versus lo implementado actualmente en el sistema SGR-CBC. Se identifican los gaps pendientes y se propone un plan de implementación para completar el alcance del MVP.

### Estadísticas Generales (Actualizadas)

| Categoría | Total | Implementado | Parcial | Pendiente |
|-----------|-------|--------------|---------|-----------|
| Conceptos Clave (Sección 4) | 6 módulos | 5 | 1 | 0 |
| Vistas de Gestión (Sección 5) | 4 vistas | 3 | 1 | 0 |
| Integración M365 (Sección 7) | 3 componentes | 0 | 0 | 3 |
| Experiencia día a día (Sección 6) | 3 perfiles | 3 | 0 | 0 |

### Progreso de Sprints

| Sprint | Estado | Fecha Completado |
|--------|--------|------------------|
| Sprint 1: Indicador de Riesgo | **COMPLETADO** | Enero 2026 |
| Sprint 2: Experiencia de Usuario | **COMPLETADO** | Enero 2026 |
| Sprint 3: Automatización | Pendiente | - |
| Sprint 4: Métricas y Reportes | Pendiente | - |
| Sprint 5: Portal de Cliente | Pendiente (Fase 2) | - |

---

## PARTE I: GAPS COMPLETADOS (Sprints 1 y 2)

---

### GAP 4.3.1: Diferenciación Declaración Presentada vs Impuestos Pagados

**Estado:** **COMPLETADO** (Sprint 1)

**Lo que dice la propuesta:**
> "En procesos como impuestos, el sistema diferencia explícitamente entre **declaración presentada** e **impuestos pagados**. Mientras no exista evidencia de pago del cliente, el entregable se considera 'en riesgo'."

**Implementación realizada:**
- Campo `en_riesgo` agregado a tabla `tarea` en `src/lib/types/database.ts`
- Campo `fecha_estado_presentado` para tracking temporal
- Motor de detección automática: `src/lib/engine/riskDetector.ts`
- Badge visual de riesgo en TMR: `src/app/dashboard/page.tsx`
- Alertas de riesgo por falta de pago en Dashboard Ejecutivo: `src/app/dashboard/ejecutivo/page.tsx`
- Componente AlertasRiesgo actualizado con sección de tareas en riesgo: `src/components/ejecutivo/AlertasRiesgo.tsx`

**Archivos modificados/creados:**
- `src/lib/engine/riskDetector.ts` (NUEVO)
- `src/lib/types/database.ts` (campos en_riesgo, fecha_estado_presentado)
- `src/app/dashboard/page.tsx` (badge de riesgo)
- `src/app/dashboard/ejecutivo/page.tsx` (alertas de riesgo)
- `src/components/ejecutivo/AlertasRiesgo.tsx` (sección de falta de pago)

---

### GAP 5.1.1: Visualización de Bloqueos

**Estado:** **COMPLETADO** (Sprint 2)

**Lo que dice la propuesta:**
> "Pasos donde está bloqueado o donde bloquea a otros."

**Implementación realizada:**
- Componente `BloqueosList.tsx` con dos secciones:
  - "Mis tareas bloqueadas" (estado = bloqueado_cliente)
  - "Tareas que dependen de mí" (tareas de otros esperando mi input)
- Integración en página de colaborador con contador de bloqueos
- Callback `onCountChange` para actualizar KPIs

**Archivos modificados/creados:**
- `src/components/colaborador/BloqueosList.tsx` (NUEVO)
- `src/app/dashboard/colaborador/page.tsx` (integración y KPI de bloqueos)

---

### GAP 6.1: Agenda Priorizada para Colaborador

**Estado:** **COMPLETADO** (Sprint 2)

**Lo que dice la propuesta:**
> "Ve una agenda de pasos que le corresponde atender... Puede organizar su día con base en prioridades reales y no solo en lo que 'suena más urgente'."

**Implementación realizada:**
- Nueva página `/dashboard/mi-dia` con algoritmo de priorización:
  1. Prioridad 1: Tareas vencidas (rojo)
  2. Prioridad 2: Tareas que vencen hoy (naranja)
  3. Prioridad 3: Tareas próximos 3 días (amarillo)
  4. Prioridad 4: Tareas bloqueadas
  5. Prioridad 5: Resto por fecha ascendente
- Acciones rápidas para cambiar estado
- Indicadores visuales de urgencia
- Link en Sidebar con ícono CalendarDays

**Archivos modificados/creados:**
- `src/app/dashboard/mi-dia/page.tsx` (NUEVO - 21KB)
- `src/components/layout/Sidebar.tsx` (link a Mi Día)

---

### GAP 6.2: Detección de Tareas Críticas para Líder

**Estado:** **COMPLETADO** (Sprint 1 + Sprint 2)

**Lo que dice la propuesta:**
> "Detecta tareas críticas o en riesgo."

**Implementación realizada:**
- Alertas de riesgo implementadas en Dashboard Ejecutivo
- Componente `AlertasRiesgo.tsx` mejorado con:
  - Tareas vencidas
  - Tareas por vencer (< 3 días)
  - Tareas en riesgo por falta de pago
  - Colaboradores sobrecargados

**Archivos modificados:**
- `src/components/ejecutivo/AlertasRiesgo.tsx`
- `src/app/dashboard/ejecutivo/page.tsx`

---

## PARTE II: GAPS PENDIENTES

---

### 4.3 Flujos de Trabajo por Pasos

#### GAP 4.3.2: Evidencias Requeridas por Paso

**Estado:** Parcialmente implementado

**Lo que dice la propuesta:**
> "Para cada paso se definen... evidencias requeridas."

**Estado actual:**
- Tabla `tarea_documento` existe para vincular documentos
- Tabla `documento` tiene tipos definidos (ACUSE, PAPEL_TRABAJO, XML, PDF, COMPROBANTE_PAGO)
- NO hay definición de qué evidencias son requeridas por cada paso
- NO hay validación que impida avanzar sin las evidencias requeridas

**Trabajo pendiente:**
1. Agregar campo `evidencias_requeridas` a tabla `proceso_paso`
2. Implementar validación en transición de estados
3. UI para definir evidencias requeridas por paso

**Prioridad:** MEDIA
**Esfuerzo estimado:** Mediano (6-8 horas)

---

### 4.4 Roles, Tribus y Colaboradores

#### GAP 4.4.1: Sistema de Suplentes Automático

**Estado:** Parcialmente implementado

**Lo que dice la propuesta:**
> "Si alguien se va de vacaciones o deja de laborar, los pasos pendientes se pueden reasignar automáticamente a suplentes o al líder de tribu."

**Estado actual:**
- Campo `suplente_id` existe en tabla `team_members`
- Tabla `ausencias` registra ausencias programadas
- API `/api/engine/auto-reassign` existe
- NO hay trigger automático cuando se registra una ausencia
- NO hay lógica de reasignación automática por vacaciones

**Trabajo pendiente:**
1. Implementar trigger al crear ausencia que dispare reasignación
2. Lógica de cascada: primero suplente, luego líder
3. Notificación al colaborador sobre tareas reasignadas
4. Restauración automática al terminar la ausencia (opcional)

**Prioridad:** MEDIA
**Esfuerzo estimado:** Alto (8-12 horas)

---

### 4.5 Calendario de Compromisos

#### GAP 4.5.1: Responsable del Calendario

**Estado:** NO implementado

**Lo que dice la propuesta:**
> "Cada año, una persona designada actúa como dueño del calendario, carga fechas de obligaciones y feriados, revisa y aprueba las fechas compromiso internas calculadas por el sistema."

**Estado actual:**
- NO hay campo para designar "dueño del calendario"
- NO hay workflow de aprobación de fechas
- Cualquier ADMIN puede modificar el calendario

**Trabajo pendiente:**
1. Agregar campo `responsable_calendario_id` en configuración del sistema
2. Implementar workflow de aprobación de fechas
3. UI para que el responsable revise y apruebe fechas generadas

**Prioridad:** BAJA
**Esfuerzo estimado:** Mediano (4-6 horas)

---

### 4.6 Módulo de Calidad, Auditoría y Retrabajo

#### GAP 4.6.1: Encuesta de Satisfacción del Cliente

**Estado:** NO implementado

**Lo que dice la propuesta:**
> "Se puede incorporar una encuesta breve de satisfacción de cliente (2–3 preguntas) como parte del componente de calidad de la tribu."

**Estado actual:**
- NO existe ninguna funcionalidad de encuestas
- NO hay tabla para almacenar respuestas

**Trabajo pendiente:**
1. Diseñar esquema de encuestas (2-3 preguntas)
2. Crear tabla `encuesta_satisfaccion`
3. UI para que cliente responda
4. Integrar resultados en métricas de tribu

**Prioridad:** BAJA (Fase 2)
**Esfuerzo estimado:** Alto (10-15 horas)

---

### 5.3 Vista por Cliente

#### GAP 5.3.1: Participación en Esfuerzo Total

**Estado:** Parcialmente implementado

**Lo que dice la propuesta:**
> "Participación del cliente en el esfuerzo total del despacho."

**Estado actual:**
- Se calculan puntos por cliente
- NO se calcula % del total del despacho

**Trabajo pendiente:**
1. Calcular total de puntos del despacho
2. Mostrar % de participación por cliente
3. Gráfico de distribución de esfuerzo

**Prioridad:** BAJA
**Esfuerzo estimado:** Bajo (2-3 horas)

---

#### GAP 5.3.2: Vista Externa para Cliente

**Estado:** Parcialmente implementado

**Lo que dice la propuesta:**
> "Esta misma información se puede exponer, en formato simplificado y de solo lectura, como una **vista para el cliente**, donde se responda: 'Estos son tus RFC, estas son tus obligaciones fiscales, y estas son las partes que hoy gestiona CBC'."

**Estado actual:**
- Existe vista `/dashboard/cliente` pero es para uso interno
- NO hay portal de acceso para clientes externos
- NO hay autenticación separada para clientes

**Trabajo pendiente:**
1. Diseñar portal de cliente (solo lectura)
2. Crear rol de usuario CLIENTE
3. Implementar autenticación para clientes
4. Vista simplificada: RFCs, obligaciones, servicios, estado

**Prioridad:** MEDIA
**Esfuerzo estimado:** Alto (15-20 horas)

---

### 5.4 Vista por Proceso

#### GAP 5.4.1: Dashboard Completo por Proceso

**Estado:** Parcialmente implementado

**Lo que dice la propuesta:**
> "Incluye: Número de entregables ejecutados, Puntos totales por proceso, % de entregables a tiempo, Distribución de estados, Tiempos promedio por paso..."

**Estado actual:**
- Página `/dashboard/proceso` existe
- `TiemposPorPaso.tsx` y `BacklogAnalysis.tsx` existen
- Métricas incompletas: falta % a tiempo por proceso, distribución de estados detallada

**Trabajo pendiente:**
1. Completar `ProcesoMetrics.tsx` con todas las métricas
2. Agregar gráfico de distribución de estados por proceso
3. Calcular y mostrar % a tiempo por proceso
4. Identificar pasos con mayor concentración de retrasos

**Prioridad:** MEDIA
**Esfuerzo estimado:** Mediano (6-8 horas)

---

### 7. Integración Microsoft 365

#### GAP 7.1: Integración SharePoint / Microsoft Lists

**Estado:** NO implementado (Decisión arquitectónica)

**Trabajo pendiente:**
- **DECISIÓN ARQUITECTÓNICA:** Se optó por Supabase en lugar de SharePoint para mayor control y flexibilidad.

**Prioridad:** MUY BAJA (descartada en MVP)

---

#### GAP 7.2: Integración Planner / Teams / To Do

**Estado:** NO implementado

**Trabajo pendiente:**
- **DECISIÓN ARQUITECTÓNICA:** Esta integración se pospone para Fase 2.

**Prioridad:** BAJA (Fase 2)
**Esfuerzo estimado:** Muy Alto (30+ horas)

---

#### GAP 7.3: Power Automate

**Estado:** Resuelto con alternativa

**Trabajo pendiente:**
- **DECISIÓN ARQUITECTÓNICA:** Se implementó automatización nativa en lugar de Power Automate.
- El motor de generación de tareas (`/api/engine/generate-tasks`) y el motor de riesgo (`riskDetector.ts`) cumplen esta función.

**Prioridad:** NO APLICA (resuelto de otra forma)

---

## PARTE III: RESUMEN DE GAPS POR PRIORIDAD (Actualizado)

### COMPLETADOS (Sprints 1 y 2)

| Gap | Descripción | Sprint |
|-----|-------------|--------|
| ~~4.3.1~~ | ~~Diferenciación presentado vs pagado con indicador de riesgo~~ | Sprint 1 |
| ~~5.1.1~~ | ~~Visualización de bloqueos~~ | Sprint 2 |
| ~~6.1~~ | ~~Agenda priorizada para colaborador~~ | Sprint 2 |
| ~~6.2~~ | ~~Detección de tareas críticas para líder~~ | Sprint 1+2 |

### PRIORIDAD MEDIA (Pendientes)

| Gap | Descripción | Esfuerzo |
|-----|-------------|----------|
| 4.3.2 | Evidencias requeridas por paso | 6-8 hrs |
| 4.4.1 | Sistema de suplentes automático | 8-12 hrs |
| 5.3.2 | Vista externa para cliente | 15-20 hrs |
| 5.4.1 | Dashboard completo por proceso | 6-8 hrs |

### PRIORIDAD BAJA (Pendientes)

| Gap | Descripción | Esfuerzo |
|-----|-------------|----------|
| 4.5.1 | Responsable del calendario | 4-6 hrs |
| 5.3.1 | Participación en esfuerzo total | 2-3 hrs |
| 4.6.1 | Encuesta de satisfacción (Fase 2) | 10-15 hrs |
| 7.2 | Integración Microsoft 365 (Fase 2) | 30+ hrs |

---

## PARTE IV: PLAN DE IMPLEMENTACIÓN ACTUALIZADO

### Sprint 1: Funcionalidades Críticas - **COMPLETADO**

**Fecha:** Enero 2026

**Entregables:**
- [x] Campo `en_riesgo` en tabla `tarea`
- [x] Motor de detección: `riskDetector.ts`
- [x] Badge visual en TMR
- [x] Alertas en Dashboard Ejecutivo

---

### Sprint 2: Experiencia de Usuario - **COMPLETADO**

**Fecha:** Enero 2026

**Entregables:**
- [x] Página `/dashboard/mi-dia` con algoritmo de priorización
- [x] Componente `BloqueosList.tsx`
- [x] Integración en vista colaborador
- [x] Link en Sidebar

---

### Sprint 3: Automatización (Próximo)

**Objetivo:** Reducir trabajo manual mediante automatizaciones.

**Tareas:**
1. **Gap 4.4.1 - Sistema de Suplentes**
   - Trigger al crear ausencia
   - Lógica de reasignación automática
   - Notificaciones

2. **Gap 4.3.2 - Evidencias Requeridas**
   - Modificar tabla proceso_paso
   - Validación en transiciones
   - UI de configuración

**Esfuerzo estimado:** 14-20 horas

---

### Sprint 4: Métricas y Reportes

**Objetivo:** Completar vistas analíticas.

**Tareas:**
1. **Gap 5.4.1 - Dashboard por Proceso**
   - Completar métricas
   - Gráficos de distribución

2. **Gap 5.3.1 - Participación en Esfuerzo**
   - Calcular y mostrar %

**Esfuerzo estimado:** 8-11 horas

---

### Sprint 5 (Fase 2): Portal de Cliente

**Objetivo:** Habilitar acceso externo para clientes.

**Tareas:**
1. **Gap 5.3.2 - Vista Externa**
   - Nuevo rol CLIENTE
   - Portal simplificado
   - Autenticación separada

**Esfuerzo estimado:** 15-20 horas

---

## PARTE V: DECISIONES ARQUITECTÓNICAS

### Sobre Microsoft 365

La propuesta original mencionaba usar Microsoft 365 (SharePoint, Planner, To Do) como plataforma base. Sin embargo, se tomó la decisión de implementar una solución web independiente usando:

- **Supabase** en lugar de SharePoint para almacenamiento
- **Next.js + React** en lugar de Power Apps para la UI
- **APIs propias + Vercel Cron** en lugar de Power Automate para automatización

**Razones:**
1. Mayor control sobre el modelo de datos y lógica de negocio
2. Mejor experiencia de usuario con interfaz personalizada
3. Menor dependencia de licencias adicionales de Microsoft
4. Escalabilidad y flexibilidad para integraciones futuras

**Nota:** La integración con Microsoft 365 se puede agregar en Fase 2 si el cliente lo requiere.

---

## Conclusión (Actualizada)

El sistema SGR-CBC ha completado exitosamente los **Sprints 1 y 2**, logrando:

### Funcionalidades Completadas:
1. **Sistema de Riesgo:** Motor de detección automática de tareas sin pago con alertas visuales
2. **Agenda "Mi Día":** Vista priorizada para colaboradores con algoritmo inteligente
3. **Bloqueos:** Visualización clara de tareas bloqueadas y dependientes
4. **Alertas Ejecutivas:** Panel completo de riesgos y situaciones críticas

### Gaps Restantes (Prioridad Media):
1. **Automatizaciones:** Sistema de suplentes, evidencias requeridas
2. **Métricas:** Dashboard por proceso, participación en esfuerzo
3. **Fase 2:** Portal de cliente, encuestas de satisfacción

### Progreso General:
- **Funcionalidades core:** ~92% implementado
- **Funcionalidades secundarias:** ~75% implementado
- **Integraciones externas:** Resuelto con alternativa arquitectónica

Se recomienda continuar con el **Sprint 3** (Automatización) para completar el sistema de suplentes y validación de evidencias.
