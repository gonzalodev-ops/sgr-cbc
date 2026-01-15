# Análisis de Gaps y Plan de Implementación

**Fecha de Análisis:** Enero 2026
**Documento Base:** Propuesta Sgr Cbc V0 2.md
**Estado del Proyecto:** MVP en desarrollo

---

## Resumen Ejecutivo

Este documento presenta un análisis detallado de las funcionalidades acordadas en la propuesta original versus lo implementado actualmente en el sistema SGR-CBC. Se identifican los gaps pendientes y se propone un plan de implementación para completar el alcance del MVP.

### Estadísticas Generales

| Categoría | Total | Implementado | Parcial | Pendiente |
|-----------|-------|--------------|---------|-----------|
| Conceptos Clave (Sección 4) | 6 módulos | 4 | 2 | 0 |
| Vistas de Gestión (Sección 5) | 4 vistas | 2 | 2 | 0 |
| Integración M365 (Sección 7) | 3 componentes | 0 | 0 | 3 |
| Experiencia día a día (Sección 6) | 3 perfiles | 1 | 2 | 0 |

---

## PARTE I: GAPS IDENTIFICADOS POR SECCIÓN

---

### 4.3 Flujos de Trabajo por Pasos

#### GAP 4.3.1: Diferenciación Declaración Presentada vs Impuestos Pagados

**Estado:** Parcialmente implementado

**Lo que dice la propuesta:**
> "En procesos como impuestos, el sistema diferencia explícitamente entre **declaración presentada** e **impuestos pagados**. Mientras no exista evidencia de pago del cliente, el entregable se considera 'en riesgo'."

**Estado actual:**
- Existen estados separados (`presentado`, `pagado`, `cerrado`)
- NO hay workflow automático que marque "en riesgo" cuando falta evidencia de pago
- NO hay alertas específicas para esta condición

**Trabajo pendiente:**
1. Implementar lógica de detección automática de riesgo por falta de evidencia de pago
2. Agregar indicador visual "en riesgo" en el TMR
3. Incluir alertas en Dashboard Ejecutivo

**Prioridad:** ALTA
**Esfuerzo estimado:** Mediano (4-6 horas)

---

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

### 5.1 Vista por Colaborador

#### GAP 5.1.1: Visualización de Bloqueos

**Estado:** Parcialmente implementado

**Lo que dice la propuesta:**
> "Pasos donde está bloqueado o donde bloquea a otros."

**Estado actual:**
- Estado `bloqueado_cliente` existe
- NO hay visualización clara de bloqueos
- NO hay identificación de "a quién bloquea"

**Trabajo pendiente:**
1. Query para identificar tareas bloqueadas y bloqueantes
2. Componente visual de bloqueos
3. Notificación al bloqueante

**Prioridad:** MEDIA
**Esfuerzo estimado:** Mediano (4-6 horas)

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

### 6. Experiencia del Día a Día

#### GAP 6.1: Agenda Priorizada para Colaborador

**Estado:** Parcialmente implementado

**Lo que dice la propuesta:**
> "Ve una agenda de pasos que le corresponde atender... Puede organizar su día con base en prioridades reales y no solo en lo que 'suena más urgente'."

**Estado actual:**
- TMR muestra tareas filtradas por responsable
- NO hay vista de "agenda del día" específica
- NO hay ordenamiento automático por prioridad/urgencia

**Trabajo pendiente:**
1. Crear vista "Mi Día" o "Agenda" para colaborador
2. Algoritmo de priorización (fecha límite + riesgo + bloqueos)
3. Vista tipo Kanban personal

**Prioridad:** MEDIA
**Esfuerzo estimado:** Alto (10-12 horas)

---

#### GAP 6.2: Detección de Tareas Críticas para Líder

**Estado:** Parcialmente implementado

**Lo que dice la propuesta:**
> "Detecta tareas críticas o en riesgo."

**Estado actual:**
- `AlertasRiesgo.tsx` existe en dashboard ejecutivo
- NO está disponible específicamente para líderes de tribu
- Alertas limitadas (vencidas, por vencer)

**Trabajo pendiente:**
1. Integrar AlertasRiesgo en vista de tribu
2. Agregar alertas específicas: sin asignar, bloqueadas, rechazadas
3. Notificaciones push para líder

**Prioridad:** MEDIA
**Esfuerzo estimado:** Bajo (3-4 horas)

---

### 7. Integración Microsoft 365

#### GAP 7.1: Integración SharePoint / Microsoft Lists

**Estado:** NO implementado

**Lo que dice la propuesta:**
> "SharePoint / Microsoft Lists para registrar y organizar datos"

**Estado actual:**
- Sistema usa Supabase/PostgreSQL como backend
- NO hay sincronización con SharePoint

**Trabajo pendiente:**
- **DECISIÓN ARQUITECTÓNICA:** Se optó por Supabase en lugar de SharePoint para mayor control y flexibilidad.
- Si se requiere integración futura:
  1. Microsoft Graph API para sincronización bidireccional
  2. Webhooks para mantener datos sincronizados

**Prioridad:** MUY BAJA (descartada en MVP)
**Esfuerzo estimado:** Muy Alto (40+ horas)

---

#### GAP 7.2: Integración Planner / Teams / To Do

**Estado:** NO implementado

**Lo que dice la propuesta:**
> "Planner, Microsoft Teams y To Do para gestionar tareas y trabajo diario... Integrar la agenda de pasos con las herramientas de tareas de Microsoft 365."

**Estado actual:**
- Sistema tiene su propio gestor de tareas
- NO hay sincronización con Microsoft 365

**Trabajo pendiente:**
- **DECISIÓN ARQUITECTÓNICA:** Esta integración se pospone para Fase 2.
- Si se implementa:
  1. Microsoft Graph API para crear tareas en Planner
  2. Sincronización de estados
  3. Notificaciones vía Teams

**Prioridad:** BAJA (Fase 2)
**Esfuerzo estimado:** Muy Alto (30+ horas)

---

#### GAP 7.3: Power Automate

**Estado:** NO implementado

**Lo que dice la propuesta:**
> "Automatizaciones internas (por ejemplo, Power Automate) para mover información entre estos componentes."

**Estado actual:**
- Sistema usa APIs propias para automatización
- Cron job en Vercel para generación de tareas
- NO hay integración con Power Automate

**Trabajo pendiente:**
- **DECISIÓN ARQUITECTÓNICA:** Se implementó automatización nativa en lugar de Power Automate.
- El motor de generación de tareas (`/api/engine/generate-tasks`) cumple esta función.

**Prioridad:** NO APLICA (resuelto de otra forma)

---

## PARTE II: RESUMEN DE GAPS POR PRIORIDAD

### PRIORIDAD ALTA

| Gap | Descripción | Esfuerzo |
|-----|-------------|----------|
| 4.3.1 | Diferenciación presentado vs pagado con indicador de riesgo | 4-6 hrs |

### PRIORIDAD MEDIA

| Gap | Descripción | Esfuerzo |
|-----|-------------|----------|
| 4.3.2 | Evidencias requeridas por paso | 6-8 hrs |
| 4.4.1 | Sistema de suplentes automático | 8-12 hrs |
| 5.1.1 | Visualización de bloqueos | 4-6 hrs |
| 5.3.2 | Vista externa para cliente | 15-20 hrs |
| 5.4.1 | Dashboard completo por proceso | 6-8 hrs |
| 6.1 | Agenda priorizada para colaborador | 10-12 hrs |
| 6.2 | Detección de tareas críticas para líder | 3-4 hrs |

### PRIORIDAD BAJA

| Gap | Descripción | Esfuerzo |
|-----|-------------|----------|
| 4.5.1 | Responsable del calendario | 4-6 hrs |
| 5.3.1 | Participación en esfuerzo total | 2-3 hrs |
| 4.6.1 | Encuesta de satisfacción (Fase 2) | 10-15 hrs |
| 7.2 | Integración Microsoft 365 (Fase 2) | 30+ hrs |

---

## PARTE III: PLAN DE IMPLEMENTACIÓN PROPUESTO

### Sprint 1: Funcionalidades Críticas (Alta Prioridad)

**Objetivo:** Completar funcionalidades que impactan directamente la operación diaria.

**Tareas:**
1. **Gap 4.3.1 - Indicador de Riesgo por Falta de Pago**
   - Agregar campo `en_riesgo` a tabla `tarea`
   - Lógica: si estado = `presentado` y han pasado X días sin evidencia de pago → marcar en_riesgo
   - Badge visual en TMR
   - Alerta en Dashboard Ejecutivo

### Sprint 2: Experiencia de Usuario (Media Prioridad)

**Objetivo:** Mejorar la experiencia diaria de colaboradores y líderes.

**Tareas:**
1. **Gap 6.1 - Agenda Priorizada**
   - Nueva página `/dashboard/mi-dia`
   - Algoritmo de priorización
   - Vista tipo lista ordenada

2. **Gap 5.1.1 - Visualización de Bloqueos**
   - Componente `BloqueosList.tsx`
   - Integrar en vista colaborador

3. **Gap 6.2 - Alertas para Líder**
   - Integrar AlertasRiesgo en `/dashboard/tribu`

### Sprint 3: Automatización (Media Prioridad)

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

### Sprint 4: Métricas y Reportes (Media Prioridad)

**Objetivo:** Completar vistas analíticas.

**Tareas:**
1. **Gap 5.4.1 - Dashboard por Proceso**
   - Completar métricas
   - Gráficos de distribución

2. **Gap 5.3.1 - Participación en Esfuerzo**
   - Calcular y mostrar %

### Sprint 5 (Fase 2): Portal de Cliente

**Objetivo:** Habilitar acceso externo para clientes.

**Tareas:**
1. **Gap 5.3.2 - Vista Externa**
   - Nuevo rol CLIENTE
   - Portal simplificado
   - Autenticación separada

---

## PARTE IV: DECISIONES ARQUITECTÓNICAS

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

## Conclusión

El sistema SGR-CBC tiene implementada la mayoría de la funcionalidad core del MVP. Los gaps identificados son principalmente:

1. **Mejoras de UX:** Agenda priorizada, visualización de bloqueos, alertas para líderes
2. **Automatizaciones:** Sistema de suplentes, validación de evidencias
3. **Métricas adicionales:** Dashboard por proceso, participación en esfuerzo
4. **Fase 2:** Portal de cliente, encuestas de satisfacción, integración M365

Se recomienda priorizar el **Sprint 1** (indicador de riesgo) ya que es una funcionalidad explícitamente mencionada en la propuesta y de alto valor operativo.
