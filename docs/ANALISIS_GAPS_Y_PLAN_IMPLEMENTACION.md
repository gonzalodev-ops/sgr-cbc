# Análisis de Gaps y Plan de Implementación
## SGR-CBC - Sistema de Gestión de Resultados

**Fecha:** Enero 2026
**Versión:** 1.0
**Referencia:** Propuesta Sgr Cbc V0 2.md

---

## Resumen Ejecutivo

Este documento compara los requerimientos acordados con el cliente (Propuesta V0.2) contra la implementación actual del sistema SGR-CBC, identificando gaps funcionales y proponiendo un plan de implementación para alcanzar el MVP completo.

**Estado general de completitud: ~70%**

| Categoría | Implementado | Parcial | Pendiente |
|-----------|-------------|---------|-----------|
| Base de datos | 95% | 5% | - |
| CRUD Clientes/RFC | 100% | - | - |
| Sistema de puntos/tallas | 100% | - | - |
| Flujos de trabajo | 90% | 10% | - |
| Vistas analíticas | 60% | 25% | 15% |
| Calendario de compromisos | 70% | 20% | 10% |
| Módulo de calidad/auditoría | 50% | 30% | 20% |
| Integración M365 | - | - | 100% |

---

## PARTE 1: ANÁLISIS DETALLADO DE GAPS

---

### 1. ENTREGABLES ESTÁNDAR (Sección 4.1 de la Propuesta)

#### Requerimientos del Cliente:
- Catálogo de entregables estándar (nómina, impuestos, DIOT, etc.)
- Instancias concretas por RFC, cliente y periodo
- Atributos: RFC, cliente, proceso, periodo, responsable, estado, evidencias, fecha compromiso, puntos

#### Estado Actual:
| Elemento | Estado | Detalles |
|----------|--------|----------|
| Catálogo de entregables | ✅ Implementado | Tabla `entregable` con tipos OBLIGACION/OPERATIVO/OTRO |
| Relación entregable-obligación | ✅ Implementado | Tabla `entregable_obligacion` con peso_relativo |
| Peso % por régimen | ✅ Implementado | Tabla `regimen_entregable_peso` |
| Instancias por periodo | 🟡 Parcial | Se generan como `tarea`, no como "entregable concreto" |
| UI para gestión del catálogo | ❌ Falta | Página placeholder en `/dashboard/entregables` |

#### GAPS IDENTIFICADOS:

**GAP-ENT-01: UI de Gestión de Catálogo de Entregables**
- **Descripción:** No existe interfaz para crear, editar o eliminar entregables estándar
- **Impacto:** Alto - Usuarios no pueden configurar entregables
- **Prioridad:** P1

**GAP-ENT-02: Visualización de Instancias de Entregables**
- **Descripción:** Las tareas generadas no se visualizan claramente como "entregables del cliente"
- **Impacto:** Medio - Afecta claridad conceptual
- **Prioridad:** P2

---

### 2. SISTEMA DE PUNTOS Y TALLAS (Sección 4.2 de la Propuesta)

#### Requerimientos del Cliente:
- Puntos base por proceso (referencia talla M = 100)
- Tallas: S/M/L/XL por combinación RFC-Proceso
- Fórmula: `Puntos = Puntos_base × Factor_talla`

#### Estado Actual:
| Elemento | Estado | Detalles |
|----------|--------|----------|
| Definición de tallas | ✅ Implementado | XS(50), S(75), M(100), L(150), XL(200) |
| Talla por dominio | ✅ Implementado | FISCAL, NOMINA, IMSS en `cliente_talla` |
| Cálculo de puntos | ✅ Implementado | Función en `mockData.ts` |
| Configuración RFC-Proceso | ❌ Falta | Solo existe talla por dominio, no por proceso específico |

#### GAPS IDENTIFICADOS:

**GAP-PTS-01: Configuración Granular Talla RFC-Proceso**
- **Descripción:** La propuesta indica que un RFC puede tener talla M en nómina y XL en impuestos, pero actualmente solo se puede configurar talla por dominio (FISCAL, NOMINA, IMSS), no por proceso específico
- **Impacto:** Medio - Menor precisión en scoring
- **Prioridad:** P2

**GAP-PTS-02: Dashboard de Puntos Acumulados**
- **Descripción:** Falta vista consolidada de puntos por colaborador/tribu/periodo con detalle
- **Impacto:** Medio - Visibilidad del desempeño
- **Prioridad:** P2

---

### 3. FLUJOS DE TRABAJO (Sección 4.3 de la Propuesta)

#### Requerimientos del Cliente:
- Pasos secuenciales y paralelos
- Dependencias entre pasos
- Diferenciación entre "declaración presentada" vs "impuesto pagado"
- Asignación por rol, no por persona
- Generación automática de flujo al crear entregable

#### Estado Actual:
| Elemento | Estado | Detalles |
|----------|--------|----------|
| Procesos con pasos | ✅ Implementado | NOMINA (5 pasos), IMSS (7 pasos) |
| Orden de pasos | ✅ Implementado | Campo `orden` |
| Pasos paralelos | ✅ Implementado | Campo `grupo_concurrencia` |
| Dependencias explícitas | ❌ Falta | No hay campo `dependencias[]` en `proceso_paso` |
| Estado "presentado" vs "pagado" | ✅ Implementado | Estados separados en `sla_config` |
| Asignación por tipo colaborador | ✅ Implementado | A/B/C en `proceso_paso` |
| Generación automática de pasos | ✅ Implementado | Motor en `taskGenerator.ts` + `stepAssigner.ts` |

#### GAPS IDENTIFICADOS:

**GAP-FLU-01: Dependencias Explícitas entre Pasos**
- **Descripción:** No existe forma de definir que "Paso 3 depende de Paso 1 y 2" más allá del orden secuencial
- **Impacto:** Bajo - El orden secuencial cubre mayoría de casos
- **Prioridad:** P3

**GAP-FLU-02: Visualización de Flujo con Estados**
- **Descripción:** No hay vista visual del flujo (tipo Kanban o diagrama) mostrando el progreso de cada paso
- **Impacto:** Medio - Usabilidad
- **Prioridad:** P2

**GAP-FLU-03: Indicador "En Riesgo" por Falta de Pago**
- **Descripción:** Aunque existe el estado "presentado sin pago", no hay alerta visual prominente cuando está pendiente el pago del cliente
- **Impacto:** Alto - Riesgo de cumplimiento
- **Prioridad:** P1

---

### 4. ROLES, TRIBUS Y COLABORADORES (Sección 4.4 de la Propuesta)

#### Requerimientos del Cliente:
- Roles por tipo de responsabilidad
- Asignación de pasos por rol, no por persona
- Suplentes para roles clave
- Reasignación automática en vacaciones/bajas
- Panel de líder para reasignar y balancear carga

#### Estado Actual:
| Elemento | Estado | Detalles |
|----------|--------|----------|
| Roles globales | ✅ Implementado | ADMIN, SOCIO, LIDER, COLABORADOR, AUDITOR |
| Roles en equipo | ✅ Implementado | LIDER, AUXILIAR_A/B/C |
| Asignación por tipo colaborador | ✅ Implementado | A/B/C en pasos |
| Sistema de suplentes | 🟡 Parcial | Campo `es_suplente` y `suplente_de` existe |
| Reasignación automática | ❌ Falta | No hay lógica implementada |
| Panel líder para reasignar | 🟡 Parcial | Vista tribu existe, pero no función de reasignar |

#### GAPS IDENTIFICADOS:

**GAP-ROL-01: Reasignación Automática de Tareas**
- **Descripción:** No hay lógica que reasigne automáticamente tareas cuando un colaborador está ausente
- **Impacto:** Alto - Continuidad operativa
- **Prioridad:** P1

**GAP-ROL-02: Panel de Reasignación Manual para Líder**
- **Descripción:** El líder no puede reasignar tareas/pasos desde la interfaz
- **Impacto:** Alto - Gestión de equipo
- **Prioridad:** P1

**GAP-ROL-03: Gestión de Ausencias/Vacaciones**
- **Descripción:** No existe módulo para registrar vacaciones y activar suplentes
- **Impacto:** Medio - Operación
- **Prioridad:** P2

---

### 5. CALENDARIO DE COMPROMISOS (Sección 4.5 de la Propuesta)

#### Requerimientos del Cliente:
- Reglas de vencimiento por proceso
- Calendario anual de fechas clave y días inhábiles
- Responsable del calendario
- Asignación automática de fechas compromiso
- Ajuste controlado con registro de quién/cuándo/por qué

#### Estado Actual:
| Elemento | Estado | Detalles |
|----------|--------|----------|
| Reglas de vencimiento | ✅ Implementado | Tabla `calendario_regla` |
| Tipos de evento | ✅ Implementado | MENSUAL, ANUAL |
| Deadlines calculadas | ✅ Implementado | Tabla `calendario_deadline` |
| Vinculación obligación-regla | ✅ Implementado | `calendario_regla_obligacion` |
| Días inhábiles | 🟡 Parcial | Campo en regla, no catálogo separado |
| Responsable del calendario | ❌ Falta | No hay rol/campo de "dueño del calendario" |
| UI de calendario | ❌ Falta | Página placeholder |
| Ajuste con registro | ❌ Falta | No hay log de cambios de fecha |

#### GAPS IDENTIFICADOS:

**GAP-CAL-01: Vista de Calendario Visual**
- **Descripción:** No existe interfaz visual del calendario (mes/semana) con deadlines
- **Impacto:** Alto - Visibilidad de compromisos
- **Prioridad:** P1

**GAP-CAL-02: Catálogo de Días Inhábiles**
- **Descripción:** No hay tabla separada para días inhábiles y feriados
- **Impacto:** Medio - Precisión en cálculos
- **Prioridad:** P2

**GAP-CAL-03: Registro de Ajustes de Fecha**
- **Descripción:** Cuando se modifica una fecha límite, no queda registro de quién lo hizo y por qué
- **Impacto:** Medio - Auditoría
- **Prioridad:** P2

**GAP-CAL-04: Rol de Dueño del Calendario**
- **Descripción:** No existe figura que apruebe/valide las fechas del calendario anual
- **Impacto:** Bajo - Proceso organizacional
- **Prioridad:** P3

---

### 6. MÓDULO DE CALIDAD, AUDITORÍA Y RETRABAJO (Sección 4.6 de la Propuesta)

#### Requerimientos del Cliente:
- Entregables auditables (por muestra o 100%)
- Estados de auditoría (No revisado, Aprobado, Aprobado con obs., Rechazado)
- Registro estructurado de hallazgos (tipo, gravedad, responsable, impacto)
- Tareas de retrabajo vinculadas al hallazgo
- Retrabajo visible en agenda del colaborador
- Base para vincular a compensación futura

#### Estado Actual:
| Elemento | Estado | Detalles |
|----------|--------|----------|
| Panel de auditor | ✅ Implementado | `/dashboard/auditor` |
| Estados de auditoría | ✅ Implementado | PENDIENTE, APROBADO, RECHAZADO |
| Tabla de auditorías | ✅ Implementado | `tarea_auditoria` |
| Comentarios de auditor | ✅ Implementado | `comentarios`, `comentarios_positivos` |
| Tabla de hallazgos | ✅ Implementado | `findings` (tipo, gravedad, genera_retrabajo) |
| Tabla de retrabajo | ✅ Implementado | `retrabajo` con estado y responsable |
| UI de hallazgos | ❌ Falta | No hay interfaz para registrar hallazgos |
| UI de retrabajo | ❌ Falta | No aparece en agenda del colaborador |
| Generación automática de auditorías | ❌ Falta | Se crean manualmente |
| "Aprobado con observaciones" | ❌ Falta | Solo APROBADO o RECHAZADO |

#### GAPS IDENTIFICADOS:

**GAP-AUD-01: Estado "Aprobado con Observaciones"**
- **Descripción:** No existe estado intermedio entre aprobado y rechazado
- **Impacto:** Medio - Granularidad de evaluación
- **Prioridad:** P2

**GAP-AUD-02: UI de Registro de Hallazgos**
- **Descripción:** No hay formulario para registrar hallazgos estructurados
- **Impacto:** Alto - Trazabilidad de errores
- **Prioridad:** P1

**GAP-AUD-03: Visualización de Retrabajo en Agenda**
- **Descripción:** Las tareas de retrabajo no aparecen en la vista del colaborador
- **Impacto:** Alto - Gestión de correcciones
- **Prioridad:** P1

**GAP-AUD-04: Generación Automática de Auditorías**
- **Descripción:** Las auditorías no se generan automáticamente al completar tareas
- **Impacto:** Medio - Eficiencia
- **Prioridad:** P2

**GAP-AUD-05: Métricas de Calidad por Tribu**
- **Descripción:** No hay dashboard con % de aprobados, hallazgos por tipo, tendencias
- **Impacto:** Medio - Análisis de desempeño
- **Prioridad:** P2

---

### 7. VISTAS DE GESTIÓN (Secciones 5.1 - 5.4 de la Propuesta)

#### 7.1 Vista por Colaborador

| Requerimiento | Estado | Gap |
|---------------|--------|-----|
| Puntos de producción cerrados | 🟡 Parcial | Falta filtro por periodo |
| Número de entregables cerrados | ✅ Implementado | - |
| % de entregables a tiempo | ✅ Implementado | - |
| Distribución por cliente/RFC/proceso | ❌ Falta | GAP-VIS-01 |
| Pasos asignados hoy | 🟡 Parcial | Lista general, no filtrada por fecha |
| Pasos bloqueados/bloqueando | ❌ Falta | GAP-VIS-02 |

#### 7.2 Vista por Tribu

| Requerimiento | Estado | Gap |
|---------------|--------|-----|
| Puntos totales y metas | 🟡 Parcial | Falta definición de metas |
| Entregables cerrados y % a tiempo | ✅ Implementado | - |
| Backlog y tareas en riesgo | ✅ Implementado | - |
| Equilibrio de carga entre miembros | ❌ Falta | GAP-VIS-03 |

#### 7.3 Vista por Cliente

| Requerimiento | Estado | Gap |
|---------------|--------|-----|
| Puntos consumidos por servicios | ❌ Falta | GAP-VIS-04 |
| Participación en esfuerzo total | ❌ Falta | GAP-VIS-05 |
| Semáforo de cumplimiento | 🟡 Parcial | Indicadores básicos |
| Entregables en riesgo | 🟡 Parcial | Sin destacar "sin pago" |
| Obligaciones vs servicios CBC | ❌ Falta | GAP-VIS-06 |
| Vista simplificada para cliente | ❌ Falta | GAP-VIS-07 |

#### 7.4 Vista por Flujo de Trabajo (Proceso)

| Requerimiento | Estado | Gap |
|---------------|--------|-----|
| Número de entregables ejecutados | ❌ Falta | GAP-VIS-08 |
| Puntos totales por proceso | ❌ Falta | GAP-VIS-08 |
| % a tiempo por proceso | ❌ Falta | GAP-VIS-08 |
| Distribución de estados | ❌ Falta | GAP-VIS-08 |
| Tiempos promedio por paso | ❌ Falta | GAP-VIS-09 |
| Pasos con retrasos/retrabajo | ❌ Falta | GAP-VIS-09 |
| Identificación de rezagos históricos | ❌ Falta | GAP-VIS-10 |

#### GAPS IDENTIFICADOS:

**GAP-VIS-01: Distribución de Trabajo por Dimensiones**
- **Descripción:** Falta gráfico/tabla de distribución por cliente, RFC y proceso en vista colaborador
- **Prioridad:** P2

**GAP-VIS-02: Indicador de Bloqueos**
- **Descripción:** No se visualiza qué pasos están bloqueados o bloqueando a otros
- **Prioridad:** P2

**GAP-VIS-03: Balance de Carga en Tribu**
- **Descripción:** No hay visualización comparativa de carga entre miembros del equipo
- **Prioridad:** P2

**GAP-VIS-04: Puntos Consumidos por Cliente**
- **Descripción:** No se muestra el esfuerzo (puntos) dedicado a cada cliente
- **Prioridad:** P2

**GAP-VIS-05: Participación en Esfuerzo Total**
- **Descripción:** Falta indicador de qué % del esfuerzo total representa cada cliente
- **Prioridad:** P3

**GAP-VIS-06: Matriz Obligaciones vs Servicios CBC**
- **Descripción:** No existe vista que muestre qué obligaciones del RFC están cubiertas por servicios contratados
- **Prioridad:** P1

**GAP-VIS-07: Portal de Cliente (Solo Lectura)**
- **Descripción:** No existe vista simplificada para que el cliente vea sus RFCs, obligaciones y qué gestiona CBC
- **Prioridad:** P3 (Fase 2)

**GAP-VIS-08: Vista por Proceso/Flujo de Trabajo**
- **Descripción:** No existe página `/dashboard/proceso` con métricas por tipo de proceso
- **Prioridad:** P1

**GAP-VIS-09: Análisis de Tiempos por Paso**
- **Descripción:** No se calculan ni muestran tiempos promedio de ejecución por paso
- **Prioridad:** P2

**GAP-VIS-10: Identificación de Rezagos/Backlog Histórico**
- **Descripción:** No hay forma de diferenciar trabajo recurrente vs limpieza de atrasos
- **Prioridad:** P2

---

### 8. INTEGRACIÓN MICROSOFT 365 (Sección 7 de la Propuesta)

#### Requerimientos del Cliente:
- SharePoint / Lists para datos
- Planner / Teams / To Do para tareas
- Power Automate para automatizaciones

#### Estado Actual:
| Elemento | Estado | Detalles |
|----------|--------|----------|
| Integración SharePoint | ❌ No implementado | Usa Supabase |
| Integración Planner | ❌ No implementado | - |
| Integración Teams | ❌ No implementado | - |
| Integración To Do | ❌ No implementado | - |
| Power Automate | ❌ No implementado | - |

#### GAPS IDENTIFICADOS:

**GAP-M365-01: Decisión Arquitectónica**
- **Descripción:** El sistema actual usa Supabase como backend en lugar de Microsoft 365. Esta es una **decisión de arquitectura** que debe discutirse con el cliente.
- **Impacto:** Crítico - Define la plataforma base
- **Prioridad:** DECISIÓN REQUERIDA

**Opciones:**
1. **Mantener Supabase** - Sistema actual funcional, menor dependencia de licencias M365
2. **Migrar a M365** - Cumple literalmente con propuesta, mayor integración con herramientas existentes del despacho
3. **Híbrido** - Supabase para backend, sincronización con Planner/Teams para tareas diarias

---

### 9. EXPERIENCIA DEL DÍA A DÍA (Sección 6 de la Propuesta)

#### Para el Colaborador:

| Requerimiento | Estado | Gap |
|---------------|--------|-----|
| Agenda de pasos del día | 🟡 Parcial | No filtrada por fecha |
| Información completa por paso | ✅ Implementado | Cliente, RFC, proceso, fecha |
| Organización por prioridad | 🟡 Parcial | Sin ordenamiento inteligente |

#### Para el Líder de Tribu:

| Requerimiento | Estado | Gap |
|---------------|--------|-----|
| Tablero de avance del equipo | ✅ Implementado | `/dashboard/tribu` |
| Identificar desbalances | ❌ Falta | GAP-VIS-03 |
| Detectar tareas críticas | ✅ Implementado | "En riesgo" |
| Reasignar pasos | ❌ Falta | GAP-ROL-02 |

#### Para Socios y Dirección:

| Requerimiento | Estado | Gap |
|---------------|--------|-----|
| Vistas ejecutivas | ❌ Falta | GAP-EXE-01 |
| Identificar procesos con riesgo | 🟡 Parcial | Vista general |
| Tendencias de carga y cumplimiento | ❌ Falta | GAP-EXE-02 |

#### GAPS IDENTIFICADOS:

**GAP-EXE-01: Dashboard Ejecutivo para Socios**
- **Descripción:** No existe vista de alto nivel con KPIs consolidados para la dirección
- **Prioridad:** P2

**GAP-EXE-02: Reportes de Tendencias**
- **Descripción:** No hay gráficos de evolución temporal (cumplimiento mes a mes, etc.)
- **Prioridad:** P2

---

## PARTE 2: RESUMEN DE GAPS POR PRIORIDAD

### Prioridad 1 (Críticos para MVP)

| ID | Gap | Módulo | Esfuerzo Est. |
|----|-----|--------|---------------|
| GAP-ENT-01 | UI de Gestión de Catálogo de Entregables | Entregables | 3-4 días |
| GAP-FLU-03 | Indicador "En Riesgo" por Falta de Pago | Flujos | 1 día |
| GAP-ROL-01 | Reasignación Automática de Tareas | Roles | 3-4 días |
| GAP-ROL-02 | Panel de Reasignación Manual para Líder | Roles | 2-3 días |
| GAP-CAL-01 | Vista de Calendario Visual | Calendario | 4-5 días |
| GAP-AUD-02 | UI de Registro de Hallazgos | Auditoría | 2-3 días |
| GAP-AUD-03 | Visualización de Retrabajo en Agenda | Auditoría | 2-3 días |
| GAP-VIS-06 | Matriz Obligaciones vs Servicios CBC | Vistas | 2-3 días |
| GAP-VIS-08 | Vista por Proceso/Flujo de Trabajo | Vistas | 3-4 días |

**Subtotal P1:** ~25-32 días de desarrollo

### Prioridad 2 (Importantes para MVP Completo)

| ID | Gap | Módulo | Esfuerzo Est. |
|----|-----|--------|---------------|
| GAP-ENT-02 | Visualización de Instancias de Entregables | Entregables | 1-2 días |
| GAP-PTS-01 | Configuración Granular Talla RFC-Proceso | Puntos | 2-3 días |
| GAP-PTS-02 | Dashboard de Puntos Acumulados | Puntos | 2-3 días |
| GAP-FLU-02 | Visualización de Flujo con Estados | Flujos | 3-4 días |
| GAP-ROL-03 | Gestión de Ausencias/Vacaciones | Roles | 2-3 días |
| GAP-CAL-02 | Catálogo de Días Inhábiles | Calendario | 1-2 días |
| GAP-CAL-03 | Registro de Ajustes de Fecha | Calendario | 1-2 días |
| GAP-AUD-01 | Estado "Aprobado con Observaciones" | Auditoría | 0.5 días |
| GAP-AUD-04 | Generación Automática de Auditorías | Auditoría | 2-3 días |
| GAP-AUD-05 | Métricas de Calidad por Tribu | Auditoría | 2-3 días |
| GAP-VIS-01 | Distribución de Trabajo por Dimensiones | Vistas | 2-3 días |
| GAP-VIS-02 | Indicador de Bloqueos | Vistas | 1-2 días |
| GAP-VIS-03 | Balance de Carga en Tribu | Vistas | 2-3 días |
| GAP-VIS-04 | Puntos Consumidos por Cliente | Vistas | 1-2 días |
| GAP-VIS-09 | Análisis de Tiempos por Paso | Vistas | 2-3 días |
| GAP-VIS-10 | Identificación de Rezagos/Backlog | Vistas | 2-3 días |
| GAP-EXE-01 | Dashboard Ejecutivo para Socios | Ejecutivo | 3-4 días |
| GAP-EXE-02 | Reportes de Tendencias | Ejecutivo | 3-4 días |

**Subtotal P2:** ~33-45 días de desarrollo

### Prioridad 3 (Fase 2 / Nice to Have)

| ID | Gap | Módulo | Esfuerzo Est. |
|----|-----|--------|---------------|
| GAP-FLU-01 | Dependencias Explícitas entre Pasos | Flujos | 2-3 días |
| GAP-CAL-04 | Rol de Dueño del Calendario | Calendario | 0.5 días |
| GAP-VIS-05 | Participación en Esfuerzo Total | Vistas | 1-2 días |
| GAP-VIS-07 | Portal de Cliente (Solo Lectura) | Vistas | 5-7 días |

**Subtotal P3:** ~9-13 días de desarrollo

### Decisión Pendiente

| ID | Gap | Descripción |
|----|-----|-------------|
| GAP-M365-01 | Integración Microsoft 365 | Requiere decisión del cliente sobre arquitectura |

---

## PARTE 3: PLAN DE IMPLEMENTACIÓN

### Fase MVP-Beta (P1 - 5 semanas estimadas)

#### Semana 1: Fundamentos de Configuración
- [ ] GAP-ENT-01: UI de Gestión de Catálogo de Entregables
- [ ] GAP-AUD-01: Agregar estado "Aprobado con Observaciones"

#### Semana 2: Calendario y Visualización
- [ ] GAP-CAL-01: Vista de Calendario Visual (inicio)
- [ ] GAP-FLU-03: Indicador "En Riesgo" por Falta de Pago

#### Semana 3: Calendario y Vistas
- [ ] GAP-CAL-01: Vista de Calendario Visual (finalización)
- [ ] GAP-VIS-08: Vista por Proceso/Flujo de Trabajo

#### Semana 4: Gestión de Equipo
- [ ] GAP-ROL-02: Panel de Reasignación Manual para Líder
- [ ] GAP-VIS-06: Matriz Obligaciones vs Servicios CBC

#### Semana 5: Auditoría y Calidad
- [ ] GAP-AUD-02: UI de Registro de Hallazgos
- [ ] GAP-AUD-03: Visualización de Retrabajo en Agenda
- [ ] GAP-ROL-01: Reasignación Automática de Tareas (reglas básicas)

**Entregable:** Sistema listo para piloto con 1-2 tribus

---

### Fase MVP-Completo (P2 - 6 semanas adicionales)

#### Semana 6: Scoring y Puntos
- [ ] GAP-PTS-01: Configuración Granular Talla RFC-Proceso
- [ ] GAP-PTS-02: Dashboard de Puntos Acumulados

#### Semana 7: Flujos Avanzados
- [ ] GAP-FLU-02: Visualización de Flujo con Estados
- [ ] GAP-VIS-02: Indicador de Bloqueos

#### Semana 8: Gestión de Personal
- [ ] GAP-ROL-03: Gestión de Ausencias/Vacaciones
- [ ] GAP-VIS-03: Balance de Carga en Tribu

#### Semana 9: Calendario Avanzado
- [ ] GAP-CAL-02: Catálogo de Días Inhábiles
- [ ] GAP-CAL-03: Registro de Ajustes de Fecha
- [ ] GAP-AUD-04: Generación Automática de Auditorías

#### Semana 10: Análisis y Métricas
- [ ] GAP-AUD-05: Métricas de Calidad por Tribu
- [ ] GAP-VIS-01: Distribución de Trabajo por Dimensiones
- [ ] GAP-VIS-04: Puntos Consumidos por Cliente

#### Semana 11: Dashboard Ejecutivo
- [ ] GAP-EXE-01: Dashboard Ejecutivo para Socios
- [ ] GAP-EXE-02: Reportes de Tendencias
- [ ] GAP-VIS-09: Análisis de Tiempos por Paso
- [ ] GAP-VIS-10: Identificación de Rezagos/Backlog

**Entregable:** MVP completo para despliegue general

---

### Fase 2 (Post-MVP)

- [ ] GAP-VIS-07: Portal de Cliente (Solo Lectura)
- [ ] GAP-FLU-01: Dependencias Explícitas entre Pasos
- [ ] GAP-M365-01: Integración con Microsoft 365 (si se decide)
- [ ] Sistema de bonificación basado en puntos
- [ ] Encuesta de satisfacción del cliente

---

## PARTE 4: RECOMENDACIONES

### 1. Prioridad Inmediata
Completar los gaps P1 antes de iniciar piloto. El calendario visual (GAP-CAL-01) y la reasignación de tareas (GAP-ROL-01/02) son los más críticos para la operación diaria.

### 2. Decisión sobre Microsoft 365
Recomiendo discutir con el cliente si la integración con M365 es un requisito mandatorio o si la arquitectura actual (Supabase + Next.js) cumple con los objetivos. La migración completa requeriría reescribir gran parte del sistema.

### 3. Piloto Controlado
Antes de implementar todos los P2, realizar un piloto de 2-4 semanas con una tribu para validar que los P1 funcionan correctamente en producción.

### 4. Documentación de Procesos
Aprovechar la implementación para documentar los procesos actuales del despacho, ya que el sistema los formaliza.

---

## ANEXO: Matriz de Trazabilidad

| Sección Propuesta | Gaps Relacionados |
|-------------------|-------------------|
| 4.1 Entregables estándar | GAP-ENT-01, GAP-ENT-02 |
| 4.2 Puntos y tallas | GAP-PTS-01, GAP-PTS-02 |
| 4.3 Flujos de trabajo | GAP-FLU-01, GAP-FLU-02, GAP-FLU-03 |
| 4.4 Roles y tribus | GAP-ROL-01, GAP-ROL-02, GAP-ROL-03 |
| 4.5 Calendario | GAP-CAL-01, GAP-CAL-02, GAP-CAL-03, GAP-CAL-04 |
| 4.6 Calidad y auditoría | GAP-AUD-01 al GAP-AUD-05 |
| 5.1 Vista colaborador | GAP-VIS-01, GAP-VIS-02 |
| 5.2 Vista tribu | GAP-VIS-03 |
| 5.3 Vista cliente | GAP-VIS-04 al GAP-VIS-07 |
| 5.4 Vista proceso | GAP-VIS-08 al GAP-VIS-10 |
| 6 Experiencia día a día | GAP-EXE-01, GAP-EXE-02 |
| 7 Microsoft 365 | GAP-M365-01 |

---

**Documento preparado para revisión con el cliente.**
