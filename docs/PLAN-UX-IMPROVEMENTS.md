# Plan: UX/UI Review and Improvements by Role

## Overview
Comprehensive UX/UI review for SGR-CBC focusing on role-based experiences, navigation simplification, and permission system implementation.

**User Preferences:**
- Priority Role: Colaborador
- Scope: All changes (sidebar reorganization, view redesign, permission system)
- Config Access: ADMIN and SOCIO only
- Device Focus: Desktop first

**Decisiones Técnicas Confirmadas:**
| Decisión | Opción Elegida | Justificación |
|----------|----------------|---------------|
| Vistas Colaborador | Mantener Mi Día + Mi Agenda separadas | Propósitos distintos: ejecución vs planificación |
| Creación automática Seguimientos | Trigger en BD | Más confiable, no depende del frontend |
| UI Polish | Sprint 8 dedicado | Evita deuda técnica, mejor cohesión visual |
| RLS Policies | Completo desde inicio | Seguridad desde el día 1, evita retrofitting |
| Modelo Auditor | Híbrido (Auditor dedicado + Líderes cruzados) | Flexibilidad operativa |
| Selección Auditoría | Híbrido (sistema sugiere, socio confirma) | Balance entre automatización y control |
| Estados Auditoría | 4 estados (RECHAZADO, CORREGIR, APROBADO, DESTACADO) | Distinción entre rehacer y ajustar |
| Timing Auditoría | Cierre de periodo + manual en cualquier momento | Flexibilidad para el socio |
| Score Bonos | Tracking ahora, fórmula después | Recopilar datos sin comprometer diseño |
| Navegación Periodos | Selector global en header | Permite cambiar entre periodos activos |
| Mi Día Periodos | Mostrar ambos agrupados | "Urgente (mes anterior)" + "Corriente" |
| RLS Tablas Existentes | Sprint 2.5 dedicado previo | Resolver 33 tablas sin RLS antes de features |
| RLS Catálogos | Lectura pública, escritura ADMIN | Todos leen, solo ADMIN/SOCIO modifican |

---

## Optimizaciones de Código Identificadas ⭐ REVISIÓN FINAL

### Hallazgos del Análisis de Codebase (Consolidado)

| # | Categoría | Problema | Impacto | Archivos |
|---|-----------|----------|---------|----------|
| 1 | **Supabase Client** | 74 inicializaciones duplicadas | 🔴 Alto | Todos los componentes |
| 2 | **Data Transform** | 37 `Array.isArray` patterns repetidos | 🔴 Alto | pages, components |
| 3 | **Date Calculations** | 5+ funciones de fechas duplicadas | 🟡 Medio | mi-dia, colaborador |
| 4 | **Form Boilerplate** | 4 formularios con 50%+ duplicado | 🟡 Medio | EntregableForm, AusenciaForm |
| 5 | **Modal States** | 3 modales con loading/error idéntico | 🟡 Medio | AjusteFecha, Reasignar, Ausencia |
| 6 | **Error Handling** | 4 patrones diferentes de try/catch | 🟡 Medio | Todos los componentes |
| 7 | **TypeScript Types** | Interfaces locales no centralizadas | 🟡 Medio | DistribucionTrabajo, Backlog |
| 8 | **Constants** | Estados, roles, tipos hardcodeados | 🟡 Medio | ReasignarModal, HallazgoForm |
| 9 | **Thresholds** | Umbrales de alertas hardcodeados | 🟢 Bajo | BacklogAnalysis, BalanceCarga |
| 10 | **KPI Cards** | Mismo patrón en 4+ componentes | 🟢 Bajo | KPICards, PuntosEquipo |
| 11 | **Status Badges** | 3+ funciones idénticas | 🟢 Bajo | mi-dia, colaborador, equipo |

### Hallazgos de API/Integración

| # | Problema | Ubicación | Solución |
|---|----------|-----------|----------|
| 1 | Cliente Supabase duplicado en API routes | 6 archivos en `/api/` | Helper `getSupabaseClients()` |
| 2 | Verificación de auth repetida | Todas las API routes | Helper `requireAuth()` |
| 3 | Server Actions no implementadas | Todo el proyecto | Migrar donde tenga sentido |
| 4 | Env variables mal documentadas | `env.example.txt` | Documentar todas las vars |
| 5 | RBAC hardcodeado en routes | `/api/admin/`, `/api/engine/` | Centralizar en `rbac.ts` |

### Hallazgos de Testing ⚠️ CRÍTICO

| Estado | Detalle |
|--------|---------|
| Tests existentes | **NINGUNO** - 0 archivos de test |
| Funciones críticas sin tests | `taskGenerator.ts`, `riskDetector.ts`, `autoReassign.ts` |
| Config de testing | **NO EXISTE** - Sin Jest/Vitest |
| Estimación de setup | ~19 días para cobertura básica |

### Optimizaciones de Base de Datos

| Tipo | Descripción | Beneficio |
|------|-------------|-----------|
| **VIEW v_tarea_completa** | JOIN tarea + cliente + contribuyente + obligacion + responsable | 4-5 queries → 1 |
| **VIEW v_cliente_coverage** | Cliente + servicios + regímenes + tareas activas | 8 queries → 1 |
| **VIEW v_user_workload** | Usuario + equipo + carga de tareas | Elimina N+1 |
| **RPC rpc_generate_tasks** | Generación de tareas en BD | 10 queries → 1 |
| **RPC rpc_detect_risk** | Detección de riesgo transaccional | Evita inconsistencias |
| **RPC rpc_reassign_tasks** | Reasignación por ausencia | Elimina N+1 |

### Archivos a Crear (Estructura Final)

```
src/lib/
├── api/
│   ├── auth.ts               ← requireAuth(), getAuthenticatedUser()
│   └── supabase.ts           ← getSupabaseClients() para API routes
├── hooks/
│   ├── useSupabaseClient.ts  ← Centraliza 74 inicializaciones
│   ├── useUserRole.ts        ← Permisos por rol
│   ├── useAsyncState.ts      ← Estados loading/error/saving
│   └── useFormModal.ts       ← Lógica común de modales
├── utils/
│   ├── dateCalculations.ts   ← Consolida funciones de fechas
│   ├── dataTransformers.ts   ← Normaliza relaciones Supabase
│   ├── formatters.ts         ← Formateo consistente
│   └── errorHandling.ts      ← Manejo de errores centralizado
├── constants/
│   ├── enums.ts              ← Estados, roles, tipos
│   └── thresholds.ts         ← Umbrales configurables
├── types/
│   └── shared.ts             ← Tipos TypeScript compartidos
└── context/
    └── PeriodoContext.tsx    ← Manejo de periodos

src/components/common/
├── KPICard.tsx               ← Componente reutilizable
├── StatusBadge.tsx           ← Badge parametrizable
├── FormModal.tsx             ← Base para modales
├── DataTable.tsx             ← Tabla con sorting/filtering
└── ErrorBoundary.tsx         ← Manejo de errores en UI
```

### N+1 Queries a Resolver

| Archivo | Problema | Solución |
|---------|----------|----------|
| `dashboard/page.tsx:46-139` | Múltiples queries + mapeo O(n) | VIEW v_tarea_completa |
| `cliente/ClientePage.tsx:56-163` | 8 queries + loops O(n²) | VIEW v_cliente_coverage |
| `config/TabClientes.tsx:96-144` | 8 queries + mapeos complejos | VIEW + RPC |
| `engine/autoReassign.ts:56-233` | Loop con queries por tarea | RPC rpc_reassign_tasks |
| `engine/taskGenerator.ts` | 10 queries secuenciales | RPC rpc_generate_tasks |

---

## Manejo de Periodos Múltiples ⭐ NUEVO

### Contexto del Problema
En despachos contables es común trabajar con **dos periodos simultáneamente**:
- **Periodo en conclusión** (ej: Diciembre 2025): Declaraciones que vencen a inicios del mes siguiente
- **Periodo corriente** (ej: Enero 2026): Obligaciones del mes actual

**GAP Actual:** El sistema NO distingue periodos - todas las tareas aparecen mezcladas.

### Solución: Selector Global de Periodo

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SGR-CBC    [Mi Día] [TMR] [...]                                         │
│                                                                          │
│            Periodo: [Diciembre 2025 ▼]  ← SELECTOR EN HEADER            │
│                     ┌────────────────────┐                              │
│                     │ ● Diciembre 2025   │ ← En conclusión              │
│                     │ ○ Enero 2026       │ ← Corriente                  │
│                     │ ○ Ambos periodos   │ ← Ver todo                   │
│                     └────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Comportamiento por Vista

| Vista | Comportamiento del Selector |
|-------|----------------------------|
| **TMR** | Filtra todas las tareas por periodo seleccionado |
| **Ejecutivo** | Muestra alertas/KPIs del periodo seleccionado |
| **Mi Día** | **Excepción:** Siempre muestra ambos periodos agrupados |
| **Mi Agenda** | Filtra por periodo seleccionado |
| **Seguimientos** | Filtra por periodo (los seguimientos persisten) |
| **Calendario** | Muestra ambos periodos (es visual por fechas) |

### Mi Día: Vista Especial con Ambos Periodos

**Concepto:** El colaborador necesita ver TODO lo que tiene pendiente, pero organizado por urgencia.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MI DÍA                                           Hoy: 5 Enero 2026      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─── 🔴 URGENTE: EN CONCLUSIÓN (Diciembre 2025) ────────────────────┐   │
│ │ Estas tareas del mes anterior deben cerrarse ESTA SEMANA          │   │
│ │                                                                    │   │
│ │ ⚡ ISR Diciembre - Cliente ABC           Vence: 17 Ene │ 12 días  │   │
│ │ ⚡ DIOT Diciembre - Cliente XYZ          Vence: 17 Ene │ 12 días  │   │
│ │ ⚡ IVA Diciembre - Cliente DEF           Vence: 17 Ene │ 12 días  │   │
│ │                                                                    │   │
│ │ Total: 8 tareas de diciembre pendientes                           │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── 📋 CORRIENTE (Enero 2026) ─────────────────────────────────────┐   │
│ │ Tareas del mes actual                                              │   │
│ │                                                                    │   │
│ │ 📌 Nómina Quincenal - Cliente GHI        Vence: 15 Ene │ 10 días  │   │
│ │ 📌 Provisionales - Cliente JKL           Vence: 17 Ene │ 12 días  │   │
│ │ 📌 IMSS - Cliente MNO                    Vence: 17 Ene │ 12 días  │   │
│ │                                                                    │   │
│ │ Total: 12 tareas de enero asignadas                                │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Implementación Técnica

**1. Context Provider para Periodo**
```typescript
// src/lib/context/PeriodoContext.tsx
interface PeriodoContextType {
  periodoSeleccionado: string | 'AMBOS'  // "2025-12" | "2026-01" | "AMBOS"
  periodosDisponibles: string[]          // ["2025-12", "2026-01"]
  setPeriodo: (periodo: string) => void
  periodoEnConclusion: string            // "2025-12"
  periodoCorriente: string               // "2026-01"
}

// Lógica para determinar periodos disponibles:
// - Periodo corriente = mes actual
// - Periodo en conclusión = mes anterior (si tiene tareas abiertas)
```

**2. Selector en Header**
```typescript
// src/components/layout/Header.tsx
// Agregar selector desplegable con los periodos disponibles
// Guardar selección en localStorage para persistencia
```

**3. Filtrar Queries por Periodo**
```typescript
// Ejemplo en TMR
const { data } = await supabase
  .from('tarea')
  .select('...')
  .eq('periodo_fiscal', periodoSeleccionado)  // ← NUEVO FILTRO
```

**4. Mi Día: Query Especial**
```typescript
// Mi Día siempre carga ambos periodos y agrupa en frontend
const { data } = await supabase
  .from('tarea')
  .select('...')
  .in('periodo_fiscal', [periodoEnConclusion, periodoCorriente])
  .eq('responsable_usuario_id', userId)

// Luego agrupa:
const tareasConclusion = data.filter(t => t.periodo_fiscal === periodoEnConclusion)
const tareasCorriente = data.filter(t => t.periodo_fiscal === periodoCorriente)
```

### Motor de Riesgos: Considerar Periodo

**Ajuste necesario:** Solo calcular riesgo para tareas de periodos activos.

```sql
-- Antes: Marcaba en riesgo tareas de cualquier periodo
-- Después: Solo considera periodos relevantes

SELECT * FROM tarea
WHERE estado = 'presentado'
  AND periodo_fiscal IN ('2025-12', '2026-01')  -- Solo periodos activos
  AND fecha_estado_presentado < NOW() - INTERVAL '3 days'
```

### Archivos a Crear/Modificar

**Nuevos:**
- `src/lib/context/PeriodoContext.tsx` - Context provider
- `src/components/layout/SelectorPeriodo.tsx` - Componente selector

**Modificar:**
- `src/components/layout/Header.tsx` - Agregar selector
- `src/app/dashboard/page.tsx` (TMR) - Filtrar por periodo
- `src/app/dashboard/mi-dia/page.tsx` - Agrupar por periodo
- `src/app/dashboard/ejecutivo/page.tsx` - Filtrar métricas
- `src/lib/engine/riskDetector.ts` - Considerar solo periodos activos

---

## Phase 1: Role-Based Navigation Reorganization

### Current State
The sidebar (`src/components/layout/Sidebar.tsx:23-35`) shows 11 items to ALL users:
- TMR, Mi Día, Ejecutivo, Colaboradores, Equipos, Clientes, Entregables, Calendario, Auditor, Procesos, Análisis

### Proposed Navigation by Role

**COLABORADOR** (daily task executor):
```
Primary:
├── Mi Día (home) - Prioritized daily agenda (ejecución: ¿qué hago AHORA?)
├── Mi Agenda - Full task list (planificación: ¿qué tengo en total?)
└── Calendario - Personal calendar

Secondary (collapsible):
└── Mis Clientes - Filtered client view
```

**Decisión confirmada:** Mantener ambas vistas separadas (Mi Día + Mi Agenda) porque sirven propósitos distintos: ejecución vs planificación.

**LIDER** (team supervisor):
```
Primary:
├── Mi Equipo (home) - Team dashboard
├── Mi Día - Personal tasks
├── Validaciones - Tasks pending approval
├── Seguimientos - Pendientes que persisten entre periodos ⭐ NUEVO
└── Calendario - Team calendar

Secondary:
├── Clientes - Team's clients
└── Alertas - Risk alerts
```

### Nueva Funcionalidad: Pendientes de Seguimiento ⭐

**Concepto:** Items que no se resuelven en el periodo actual y necesitan seguimiento continuo.

**Categorías (6):**
| Categoría | Descripción | Ejemplo |
|-----------|-------------|---------|
| PAGO | Comprobantes de pago pendientes | "ISR Enero - cliente no ha pagado" |
| TRAMITE | Gestiones ante autoridad | "Alta en padrón de importadores" |
| CAMBIO | Modificaciones RFC/régimen | "Cambio de régimen a RESICO" |
| DOCUMENTACION | Docs que cliente debe entregar | "Faltan estados de cuenta Q4" |
| REQUERIMIENTO | Respuestas pendientes al SAT | "Requerimiento de información" |
| OTRO | Casos no clasificados | Catch-all |

**Ejemplos de uso:**
- Trámite con cliente pendiente ante autoridad → TRAMITE
- Cambio de régimen fiscal no aplicado → CAMBIO
- Comprobante de pago del mes anterior sin recibir → PAGO
- Cliente no entrega facturas para contabilidad → DOCUMENTACION
- SAT solicitó información adicional → REQUERIMIENTO

**Modelo de datos:**
```typescript
interface PendienteSeguimiento {
  id: string
  descripcion: string
  cliente_id: string
  tarea_origen_id?: string  // Opcional - si nació de una tarea
  categoria: 'PAGO' | 'TRAMITE' | 'CAMBIO' | 'DOCUMENTACION' | 'REQUERIMIENTO' | 'OTRO'
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA'
  fecha_creacion: Date
  fecha_compromiso?: Date
  responsable_id: string  // Colaborador asignado
  lider_id: string        // Líder que supervisa
  estado: 'ABIERTO' | 'CERRADO'
  evidencia_cierre_url?: string  // Requerido para cerrar
  notas?: string
}
```

**Creación:**
- **Automática:** Trigger en BD detecta tareas vencidas, presentadas sin pago >X días (Decisión confirmada)
- **Manual:** Líder o colaborador crea desde interfaz

**Mecanismo de Creación Automática (Trigger en BD):**
```sql
-- Trigger que detecta tareas en riesgo y crea seguimientos automáticamente
CREATE OR REPLACE FUNCTION fn_crear_seguimiento_automatico()
RETURNS TRIGGER AS $$
BEGIN
  -- Caso 1: Tarea vencida sin completar
  IF NEW.estado = 'VENCIDA' AND OLD.estado != 'VENCIDA' THEN
    INSERT INTO pendiente_seguimiento (
      descripcion,
      cliente_id,
      tarea_origen_id,
      categoria,
      prioridad,
      responsable_id,
      lider_id,
      team_id
    )
    SELECT
      'Tarea vencida: ' || e.nombre,
      NEW.cliente_id,
      NEW.tarea_id,
      'OTRO',
      'ALTA',
      NEW.colaborador_id,
      t.lider_id,
      t.team_id
    FROM entregable e
    JOIN team t ON NEW.team_id = t.team_id
    WHERE e.entregable_id = NEW.entregable_id;
  END IF;

  -- Caso 2: Presentada sin pago >3 días
  IF NEW.estado = 'PRESENTADA'
     AND NEW.fecha_presentacion IS NOT NULL
     AND NEW.fecha_pago IS NULL
     AND (CURRENT_DATE - NEW.fecha_presentacion::date) > 3 THEN
    INSERT INTO pendiente_seguimiento (...)
    -- Similar al caso anterior con categoria = 'PAGO'
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crear_seguimiento_automatico
AFTER UPDATE ON tarea
FOR EACH ROW
EXECUTE FUNCTION fn_crear_seguimiento_automatico();
```

**Cierre:** Requiere subir evidencia/documento que demuestre resolución

**Vistas:**
- **Líder:** Ver/crear/cerrar pendientes de su equipo
- **Socio:** Dashboard de pendientes abiertos por líder/equipo

---

## Perspectiva del SOCIO (Detalle) ⭐

### Perfil del Socio
- Visión ejecutiva del despacho completo
- Toma decisiones estratégicas
- Supervisa rendimiento de equipos/líderes
- Responsable ante clientes clave
- Necesita información consolidada, no operativa

### Necesidades Clave
1. **¿Cómo va el despacho HOY?** → Vista rápida de salud general
2. **¿Qué equipos necesitan atención?** → Identificar cuellos de botella
3. **¿Qué clientes tienen problemas?** → Riesgos de relación
4. **¿Qué se está quedando sin cerrar?** → Seguimientos acumulados
5. **¿Cómo vamos vs mes anterior?** → Tendencias

### Navegación Propuesta
```
Primary:
├── TMR (home) - Tablero maestro de resultados
├── Ejecutivo - Dashboard de alertas y KPIs
├── Seguimientos Global - Pendientes de todos los equipos ⭐
├── Análisis - Gráficas y tendencias

Management:
├── Clientes - Todos los clientes (con indicadores de salud)
├── Colaboradores - Gestión de personal
├── Equipos - Estructura organizacional

Admin:
└── Configuración - Ajustes del sistema
```

---

### Vista 1: TMR 2.0 - Centro de Control (Home del Socio) ⭐ REDISEÑO

**Propósito:** Vista unificada que responde "¿Cómo vamos?" en segundos y permite accionar

**Concepto:** Combina barra de alertas sticky + 3 modos de vista + acciones directas

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CENTRO DE CONTROL                                        Enero 2026    │
├─────────────────────────────────────────────────────────────────────────┤
│ ⚠️ ALERTAS: [🔴 12 Vencidas] [⚠️ 8 En Riesgo] [📋 5 Seguim] [📅 23 Sem]│  ← STICKY
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ MODOS:  [📊 Resumen]  [📋 Detalle]  [🔥 Crítico]                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### Modo 📊 RESUMEN (Vista ejecutiva rápida)

**Uso:** "¿Cómo vamos?" en 5 segundos - vista diaria del socio

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⚠️ ALERTAS: [🔴 12 Vencidas] [⚠️ 8 En Riesgo] [📋 5 Seguim] [📅 23 Sem]│
├─────────────────────────────────────────────────────────────────────────┤
│ MODOS:  [📊 RESUMEN ←]  [📋 Detalle]  [🔥 Crítico]                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─── META DEL MES ─────────────────────────────────────────────────┐  │
│  │  ENERO 2026: ████████████░░░░░░░░ 62%                            │  │
│  │  234 tareas │ 145 cerradas │ 89 pendientes                       │  │
│  │  Proyección al cierre: 85% (meta: 95%) ⚠️                        │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌─── KPIs ─────────────────┐  ┌─── RENDIMIENTO EQUIPOS ────────────┐  │
│  │ ┌─────┐ ┌─────┐          │  │                                    │  │
│  │ │ 234 │ │ 89% │          │  │ Fiscal Norte  ████████████░░░ 85%  │  │
│  │ │Total│ │A tmp│          │  │ Fiscal Sur    ██████████████░ 92%  │  │
│  │ └─────┘ └─────┘          │  │ Contable      ██████████░░░░░ 67% ⚠│  │
│  │ ┌─────┐ ┌─────┐          │  │                                    │  │
│  │ │ 45  │ │ 12  │          │  │ [Click equipo → ver detalle]       │  │
│  │ │Venc │ │Riesg│          │  │                                    │  │
│  │ └─────┘ └─────┘          │  └────────────────────────────────────┘  │
│  └──────────────────────────┘                                          │
│                                                                         │
│  ┌─── TENDENCIA (30 días) ──────────────────────────────────────────┐  │
│  │ Completadas: ▁▂▃▅▇█▇▅▆▇███▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆  ↑ +12% vs anterior  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### Modo 📋 DETALLE (Tabla completa)

**Uso:** Cuando necesitas ver todo el detalle operativo

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⚠️ ALERTAS: [🔴 12 Vencidas] [⚠️ 8 En Riesgo] [📋 5 Seguim] [📅 23 Sem]│
├─────────────────────────────────────────────────────────────────────────┤
│ MODOS:  [📊 Resumen]  [📋 DETALLE ←]  [🔥 Crítico]                     │
├─────────────────────────────────────────────────────────────────────────┤
│ Filtros: [Equipo ▼] [Estado ▼] [Periodo ▼]    [Columnas ▼] [↓ Excel]   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ RFC          │ Cliente      │ Entregable │ Equipo   │ Estado  │ Fecha   │
│ ─────────────┼──────────────┼────────────┼─────────┼─────────┼─────────│
│ ABC123456789 │ Empresa ABC  │ ISR Mens.  │ Fiscal N│ ✓ Pres. │ 15 Ene  │
│ XYZ987654321 │ Comercial XY │ DIOT       │ Fiscal S│ ⏳ Curso│ 17 Ene  │
│ DEF456789123 │ Industrias D │ IVA Mens.  │ Contable│ 🔴 Venc.│ 10 Ene  │
│ ...          │ ...          │ ...        │ ...     │ ...     │ ...     │
│                                                                         │
│ [Mostrando 234 de 234 tareas]                      Página 1 de 12      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Columnas configurables (mostrar/ocultar)
- Header sticky al hacer scroll
- Exportar a Excel con filtros aplicados
- Atajos: j/k navegar, / buscar, f filtros
- Click en fila → Modal de detalle

---

#### Modo 🔥 CRÍTICO (Solo lo que requiere acción)

**Uso:** "¿Qué necesita mi atención AHORA?" + acciones directas

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ⚠️ ALERTAS: [🔴 12 Vencidas ←] [⚠️ 8 En Riesgo] [📋 5 Seguim] [📅 23 Sem]│
├─────────────────────────────────────────────────────────────────────────┤
│ MODOS:  [📊 Resumen]  [📋 Detalle]  [🔥 CRÍTICO ←]                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MOSTRANDO: 🔴 Vencidas (12)     [Cambiar a: ⚠️ Riesgo | 📋 Seguim]    │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 🔴 ISR Mensual - Empresa ABC                                     │  │
│  │    Venció hace 5 días │ Resp: María García │ Equipo: Fiscal Norte │  │
│  │    [Ver Detalle] [Contactar Responsable] [Escalar a Líder]       │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ 🔴 DIOT - Comercial XYZ                                          │  │
│  │    Venció hace 3 días │ Resp: Juan López │ Equipo: Fiscal Sur     │  │
│  │    [Ver Detalle] [Contactar Responsable] [Escalar a Líder]       │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ 🔴 IVA Mensual - Industrias DEF                                  │  │
│  │    Venció hace 2 días │ Resp: Ana Martínez │ Equipo: Contable     │  │
│  │    [Ver Detalle] [Contactar Responsable] [Escalar a Líder]       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ☑ Seleccionar todas (12)    [Asignar a...] [Notificar Líderes]        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Cards accionables (no tabla)
- Acciones directas: contactar, escalar, asignar
- Acciones masivas sobre selección múltiple
- Filtro dinámico según alerta clickeada

---

#### Interacción Barra Sticky ↔ Modos

```
BARRA STICKY (siempre visible en todos los modos)
      │
      ▼
[🔴 12 Vencidas]  ──click──►  Modo Crítico + filtra "Vencidas"
[⚠️ 8 En Riesgo]  ──click──►  Modo Crítico + filtra "En Riesgo"
[📋 5 Seguim]     ──click──►  Navega a página Seguimientos Global
[📅 23 Sem]       ──click──►  Modo Crítico + filtra "Esta Semana"
```

---

#### Resumen TMR 2.0

| Modo | Propósito | Frecuencia |
|------|-----------|------------|
| **Resumen** | ¿Cómo vamos? Vista ejecutiva | Diario (mañana) |
| **Detalle** | Acceso a todo cuando se necesita | Según necesidad |
| **Crítico** | ¿Qué acciono AHORA? | Diario (seguimiento) |

**Beneficios del rediseño:**
- TMR vuelve a ser el **home diario** del Socio
- Barra sticky: nunca pierdes de vista lo crítico
- 3 modos cubren diferentes necesidades sin cambiar de página
- Acciones directas desde modo Crítico

---

### Vista 2: Ejecutivo (Dashboard de Alertas)

**Propósito:** Identificar rápidamente qué necesita atención

**Mejoras propuestas:**
```
┌─────────────────────────────────────────────────────────────┐
│ PANEL EJECUTIVO                              Enero 2026     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─── ALERTAS CRÍTICAS ──────────────────────────────────┐   │
│ │ 🔴 12 tareas vencidas sin atender                      │   │
│ │ 🔴 8 tareas en riesgo (presentadas sin pago >3 días)   │   │
│ │ 🟡 23 tareas vencen esta semana                        │   │
│ │ 🟡 5 clientes con seguimientos acumulados              │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌─── TENDENCIAS (30 días) ───────────────────────────────┐  │
│ │ Completadas: ▁▂▃▅▇█▇▅▆▇███▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆            │  │
│ │ En riesgo:   ▁▁▂▂▃▃▄▅▅▄▃▂▂▁▁▁▂▂▃▄▄▃▂▁▁▁▂▂▃            │  │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌─── RENDIMIENTO POR EQUIPO ─────────────────────────────┐  │
│ │ Equipo Fiscal Norte    ████████████░░░ 85% a tiempo     │  │
│ │ Equipo Fiscal Sur      ██████████████░ 92% a tiempo ✓   │  │
│ │ Equipo Contable        ██████████░░░░░ 67% a tiempo ⚠️  │  │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌─── PREDICCIÓN ─────────────────────────────────────────┐  │
│ │ ⚠️ Basado en velocidad actual:                         │  │
│ │    15 tareas podrían vencer sin completarse esta sem.  │  │
│ │    Equipos en riesgo: Equipo Contable                   │  │
│ └────────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades nuevas:**
- Gráficas de tendencia (últimos 30 días)
- Indicadores predictivos basados en velocidad
- Click en alerta → Ver tareas afectadas
- Comparativo mes actual vs anterior
- Rendimiento por equipo con drill-down

---

### Vista 3: Seguimientos Global

**Propósito:** Supervisar pendientes acumulados de todos los equipos

```
┌─────────────────────────────────────────────────────────────┐
│ SEGUIMIENTOS GLOBAL                    Total: 23 abiertos   │
├─────────────────────────────────────────────────────────────┤
│ Filtros: [Equipo ▼] [Categoría ▼] [Prioridad ▼] [Días ▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─── POR EQUIPO ─────────────────────────────────────────┐  │
│ │                                                         │  │
│ │ Equipo Fiscal Norte (María López)                        │  │
│ │   🔴 3 alta │ 🟡 5 media │ Total: 8                     │  │
│ │   Más antiguo: 45 días                                  │  │
│ │   [Ver detalle →]                                       │  │
│ │                                                         │  │
│ │ Equipo Fiscal Sur (Juan Pérez)         ✓ BAJO CONTROL   │  │
│ │   🔴 1 alta │ 🟡 2 media │ Total: 3                     │  │
│ │   Más antiguo: 12 días                                  │  │
│ │   [Ver detalle →]                                       │  │
│ │                                                         │  │
│ │ Equipo Contable (Ana García)           ⚠️ REQUIERE ATN  │  │
│ │   🔴 7 alta │ 🟡 5 media │ Total: 12                    │  │
│ │   Más antiguo: 78 días ⚠️                               │  │
│ │   [Ver detalle →]                                       │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─── POR CATEGORÍA ──────────────────────────────────────┐  │
│ │ PAGO: 8 │ DOCUMENTACION: 7 │ TRAMITE: 4 │ CAMBIO: 2    │  │
│ │ REQUERIMIENTO: 2 │ OTRO: 0                              │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─── ENVEJECIMIENTO ─────────────────────────────────────┐  │
│ │ < 7 días:  ████████████ 12                             │  │
│ │ 7-30 días: ██████ 6                                    │  │
│ │ 30-60:     ███ 3                                       │  │
│ │ > 60 días: ██ 2 ⚠️ CRÍTICO                             │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Vista consolidada por equipo/líder
- Indicadores de "salud" por equipo
- Envejecimiento de pendientes (cuánto tiempo llevan abiertos)
- Drill-down a detalle de cada equipo
- Alertas automáticas para equipos con pendientes acumulados

---

### Vista 4: Análisis

**Propósito:** Datos históricos y tendencias para decisiones estratégicas

```
┌─────────────────────────────────────────────────────────────┐
│ ANÁLISIS                           Periodo: [Ene 2026 ▼]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─── CUMPLIMIENTO MENSUAL ───────────────────────────────┐  │
│ │          Oct    Nov    Dic    Ene                       │  │
│ │ A tiempo  89%    87%    91%    85%                      │  │
│ │ Vencidas  8%     10%    6%     12%                      │  │
│ │ En riesgo 3%     3%     3%     3%                       │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─── TOP 5 CLIENTES CON MÁS INCIDENCIAS ─────────────────┐  │
│ │ 1. Cliente XYZ     - 8 tareas vencidas, 3 seguimientos │  │
│ │ 2. Cliente ABC     - 5 tareas vencidas, 2 seguimientos │  │
│ │ 3. Cliente DEF     - 4 tareas vencidas, 4 seguimientos │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─── CARGA POR COLABORADOR ──────────────────────────────┐  │
│ │ María García     ████████░░ 32 tareas │ 94% a tiempo   │  │
│ │ Juan López       ██████████ 45 tareas │ 87% a tiempo   │  │
│ │ Ana Martínez     ████░░░░░░ 18 tareas │ 78% a tiempo ⚠️│  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─── COMPARATIVO MENSUAL ────────────────────────────────┐  │
│ │ vs Mes Anterior:                                        │  │
│ │ ✓ Tareas completadas: +12%                              │  │
│ │ ⚠️ Tareas vencidas: +18%                                │  │
│ │ → Seguimientos cerrados: -5%                            │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Gráficas de cumplimiento histórico
- Identificación de clientes problemáticos
- Carga de trabajo por colaborador
- Comparativos mes a mes
- Exportar reportes

---

### Vista 5: Clientes (Mejorada para Socio)

**Propósito:** Ver salud de la relación con cada cliente

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENTES                                     Total: 87      │
├─────────────────────────────────────────────────────────────┤
│ [Buscar cliente...] [Estado ▼] [Equipo ▼] [Talla ▼]         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Cliente              │ Equipo    │ Tareas │ Seguim │ Estado  │
│ ─────────────────────┼──────────┼────────┼────────┼─────────│
│ Empresa ABC          │ Fiscal N │ 12     │ 2      │ ✓ OK    │
│ Comercial XYZ        │ Fiscal S │ 8      │ 0      │ ✓ OK    │
│ Industrias DEF       │ Contable │ 15     │ 5      │ ⚠️ Aten │
│ Servicios GHI        │ Fiscal N │ 6      │ 3      │ 🔴 Riesgo│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Indicadores de salud del cliente:**
- ✓ OK: Sin tareas vencidas, <2 seguimientos
- ⚠️ Atención: 1-3 tareas vencidas o 2-4 seguimientos
- 🔴 Riesgo: >3 tareas vencidas o >4 seguimientos

---

### Resumen de Vistas del Socio

| Vista | Propósito | Frecuencia de Uso |
|-------|-----------|-------------------|
| **TMR 2.0** | Centro de Control - ¿Cómo vamos? + Acciones | **Diario** ⭐ |
| Ejecutivo | Alertas detalladas y predicciones | Diario |
| Seguimientos | ¿Qué se está acumulando? | Semanal |
| Análisis | Tendencias y decisiones | Mensual |
| Clientes | Salud de relaciones | Según necesidad |

**Nota:** Con el rediseño TMR 2.0, el Tablero Maestro vuelve a ser la vista principal diaria del Socio, combinando resumen ejecutivo + detalle operativo + acciones críticas en una sola página.

### Files to Modify
- `src/components/layout/Sidebar.tsx` - Add role-based filtering
- `src/lib/hooks/useUserRole.ts` (NEW) - Hook to get current user role
- `src/middleware.ts` - Add role validation for protected routes

---

## Phase 2: Permission System Implementation

### Current State
- `src/middleware.ts:4-6` - Only validates session, no role checks
- `src/app/dashboard/configuracion/page.tsx` - Accessible to ALL users (security issue!)

### Proposed Implementation

**2.1 Role Hook** (`src/lib/hooks/useUserRole.ts`):
```typescript
// Returns { role, isAdmin, isSocio, isLider, isColaborador, loading }
// Caches role in session storage for performance
```

**2.2 Middleware Enhancement** (`src/middleware.ts`):
```typescript
// Route protection rules:
const ADMIN_ONLY_ROUTES = ['/dashboard/configuracion']
const LEADER_ROUTES = ['/dashboard/equipo', '/dashboard/ejecutivo']
const ALLOWED_ROLES = { ADMIN: [...], SOCIO: [...], LIDER: [...], COLABORADOR: [...] }
```

**2.3 Protected Route HOC** (`src/lib/auth/withRoleAccess.tsx`):
```typescript
// Wraps pages with role validation
// Shows "Access Denied" or redirects unauthorized users
```

### Access Matrix (Actualizada con AUDITOR)

| Route | COLABORADOR | LIDER | AUDITOR | SOCIO | ADMIN |
|-------|-------------|-------|---------|-------|-------|
| Mi Día | ✓ Home | ✓ | ✓ | ✓ | ✓ |
| Mi Agenda | ✓ | ✓ | ✓ | ✓ | ✓ |
| Calendario | ✓ | ✓ | ✓ | ✓ | ✓ |
| Cliente (filtered) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Seguimientos (equipo) | - | ✓ | - | - | - |
| Seguimientos (global) | - | - | - | ✓ | ✓ |
| Mi Equipo | - | ✓ Home | - | ✓ | ✓ |
| Validaciones | - | ✓ | - | ✓ | ✓ |
| Equipo | - | ✓ | - | ✓ | ✓ |
| Ejecutivo | - | ✓ | - | ✓ | ✓ |
| TMR 2.0 | - | ✓ | - | ✓ Home | ✓ |
| Auditor | - | ✓ (cruzado) | ✓ Home | ✓ | ✓ |
| Procesos Analytics | - | - | - | ✓ | ✓ |
| Análisis | - | - | - | ✓ | ✓ |
| Configuración | - | - | - | ✓ | ✓ |

**Nota:** El AUDITOR tiene acceso limitado - principalmente al módulo de auditoría y vistas básicas. No ve dashboards ejecutivos ni configuración.

---

## Phase 3: View Redesigns by Role

### 3.1 COLABORADOR Experience (Priority)

**Mi Día Page Improvements** (`src/app/dashboard/mi-dia/page.tsx`):
Current: Good prioritization algorithm, clean layout
Improvements:
- Add quick-action buttons (upload evidence, mark complete)
- Add time estimates per task
- Add task grouping by client (optional toggle)
- Mobile-responsive cards

**Mi Agenda Page** (`src/app/dashboard/colaborador/page.tsx`):
Current: Full task table
Improvements:
- Simplify columns (remove periodicidad, add quick status buttons)
- Add inline editing for common actions
- Add "Focus Mode" - shows only today's tasks

### 3.2 LIDER Experience

**New: Team Dashboard** (`src/app/dashboard/equipo/page.tsx`):
- Team KPIs (completed vs pending)
- Members workload disequipotion
- Tasks pending validation
- Team alerts

**Validaciones Page** (NEW):
- Queue of tasks from team members pending VoBo
- Batch approval capability
- Quick reject with comment

**Seguimientos Page** (NEW) (`src/app/dashboard/seguimientos/page.tsx`):
- Lista de pendientes del equipo (filtrable por categoría, prioridad, responsable)
- Crear nuevo pendiente (manual)
- Ver pendientes generados automáticamente
- Cerrar pendiente (requiere subir evidencia)
- Historial de notas por pendiente

### 3.3 SOCIO/ADMIN Experience

**TMR Page** (`src/app/dashboard/page.tsx`):
Current: Dense table with 11 columns
Improvements:
- Sticky header on scroll
- Column visibility toggles
- Quick filters bar (RFC, Equipo, Estado)
- Export functionality
- Keyboard shortcuts (j/k navigation)

**Ejecutivo Page** (`src/app/dashboard/ejecutivo/page.tsx`):
Current: Good alert system
Improvements:
- Add trend graphs
- Add predictive risk indicators
- Add click-through to task details

**Seguimientos Global Page** (NEW) (`src/app/dashboard/seguimientos-global/page.tsx`):
- Dashboard de pendientes por equipo/líder
- Indicadores: equipos con más pendientes abiertos
- Drill-down a detalle por equipo
- Alertas: equipos con pendientes de alta prioridad acumulados

---

## Phase 4: UI Polish

### 4.1 Consistent Component Library
- Standardize button styles (primary, secondary, danger)
- Standardize badge colors by state
- Create reusable `<TaskCard>` component
- Create reusable `<KPICard>` component

### 4.2 Loading States
- Skeleton loaders instead of spinners
- Optimistic updates for quick actions

### 4.3 Empty States
- Helpful messages with action suggestions
- Consistent iconography

---

## Implementation Order

### Sprint 2.5: Seguridad RLS (URGENTE - Previo a features)

**Contexto:** El linter de Supabase detectó 33 tablas sin RLS habilitado. Esto es un problema de seguridad crítico que debe resolverse antes de agregar nuevas funcionalidades.

**Tablas a habilitar RLS:**

**1. Catálogos (Lectura pública, escritura ADMIN):**
```sql
-- Patrón para catálogos
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalogo_lectura" ON nombre_tabla FOR SELECT USING (true);
CREATE POLICY "catalogo_escritura_admin" ON nombre_tabla FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND rol_global IN ('ADMIN', 'SOCIO')));
CREATE POLICY "catalogo_update_admin" ON nombre_tabla FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND rol_global IN ('ADMIN', 'SOCIO')));
CREATE POLICY "catalogo_delete_admin" ON nombre_tabla FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND rol_global IN ('ADMIN', 'SOCIO')));
```

Aplicar a (16 tablas):
- `regimen_fiscal`, `obligacion_fiscal`, `servicio`, `entregable`, `talla`
- `proceso_operativo`, `proceso_paso`, `regimen_obligacion`, `servicio_obligacion`
- `entregable_obligacion`, `regimen_entregable_peso`, `obligacion_proceso`
- `obligacion_calendario`, `calendario_regla`, `calendario_regla_obligacion`, `sla_config`

**2. Tablas de Datos Operativos (RLS por equipo/usuario):**

Aplicar a (9 tablas):
- `contribuyente_regimen` - Ya tiene política, solo habilitar RLS
- `cliente_servicio`, `cliente_talla` - Por equipo del cliente
- `calendario_deadline` - Lectura autenticados
- `evento_calendario`, `ausencia`, `dia_inhabil` - Por usuario/equipo
- `fecha_ajuste_log`, `contribuyente_proceso_talla` - Lectura autenticados

**3. Tablas Sensibles (Solo ADMIN/propietario):**

Aplicar a (6 tablas):
- `users` - Solo el propio usuario o ADMIN/LIDER pueden ver
- `audits`, `findings`, `retrabajo` - Por rol auditor
- `system_log`, `config_sistema` - Solo ADMIN

**4. Vista SECURITY DEFINER:**
```sql
-- Cambiar vw_pasos_bloqueados a SECURITY INVOKER
ALTER VIEW vw_pasos_bloqueados SET (security_invoker = true);
```

**5. Tablas con RLS habilitado pero sin políticas (INFO - 2 tablas bloqueadas):**
```sql
-- tarea_documento: Documentos/evidencias de tareas
CREATE POLICY "doc_select" ON tarea_documento FOR SELECT
  USING (EXISTS (SELECT 1 FROM tarea t WHERE t.tarea_id = tarea_documento.tarea_id
    AND (t.responsable_usuario_id = auth.uid() OR EXISTS (
      SELECT 1 FROM team tm WHERE tm.team_id = t.team_id AND tm.lider_id = auth.uid()
    ) OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.rol_global IN ('SOCIO','ADMIN')))));
CREATE POLICY "doc_insert" ON tarea_documento FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tarea t WHERE t.tarea_id = tarea_documento.tarea_id
    AND t.responsable_usuario_id = auth.uid()));

-- tarea_evento: Historial de cambios de estado (solo lectura)
CREATE POLICY "evento_select" ON tarea_evento FOR SELECT
  USING (EXISTS (SELECT 1 FROM tarea t WHERE t.tarea_id = tarea_evento.tarea_id
    AND (t.responsable_usuario_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.rol_global IN ('LIDER','SOCIO','ADMIN')))));
```

**6. Funciones con search_path mutable (8 funciones):**
```sql
-- Fijar search_path para prevenir ataques de inyección de esquema
ALTER FUNCTION handle_new_user SET search_path = public;
ALTER FUNCTION update_updated_at_column SET search_path = public;
ALTER FUNCTION get_user_role SET search_path = public;
ALTER FUNCTION is_admin_or_socio SET search_path = public;
ALTER FUNCTION get_user_teams SET search_path = public;
ALTER FUNCTION get_user_clients SET search_path = public;
ALTER FUNCTION fn_audit_tarea_changes SET search_path = public;
ALTER FUNCTION check_tarea_exists SET search_path = public;
```

**7. Habilitar Leaked Password Protection:**
- Supabase Dashboard → Authentication → Settings
- Habilitar "Leaked Password Protection"
- Previene uso de contraseñas comprometidas (HaveIBeenPwned.org)

---

### Optimizaciones de Rendimiento (WARN - Performance)

**8. Optimizar auth.uid() en políticas RLS (8 políticas):**

Las siguientes políticas evalúan `auth.uid()` por cada fila, lo cual es ineficiente. Cambiar a `(select auth.uid())` para que se evalúe una sola vez:

```sql
-- Patrón: Cambiar auth.uid() por (select auth.uid())
-- ANTES (ineficiente):
CREATE POLICY "ejemplo" ON tabla USING (user_id = auth.uid());

-- DESPUÉS (optimizado):
CREATE POLICY "ejemplo" ON tabla USING (user_id = (select auth.uid()));
```

Políticas a optimizar:
- `cliente`: admin_full_access, leader_team_access, member_team_access
- `contribuyente`: admin_full_access, leader_team_access, member_team_access
- `tarea_auditoria`: admin_full_access, auditor_access
- (y otras políticas existentes que usen auth.uid() directamente)

**9. Consolidar múltiples políticas permisivas (~50 issues):**

Cuando hay múltiples políticas PERMISSIVE en la misma tabla/operación, PostgreSQL las evalúa TODAS con OR. Es más eficiente consolidarlas en una sola política.

**Tablas afectadas:**
- `cliente` (3 políticas SELECT → consolidar en 1)
- `tarea` (múltiples políticas → consolidar)
- `contribuyente` (3 políticas SELECT → consolidar en 1)
- `documento` (múltiples políticas)
- `tarea_auditoria` (múltiples políticas)
- `tarea_step` (múltiples políticas)
- `team_members` (múltiples políticas)
- `teams` (múltiples políticas)

```sql
-- Ejemplo de consolidación para cliente:
-- ANTES (3 políticas separadas):
CREATE POLICY "admin_full_access" ON cliente FOR SELECT USING (...);
CREATE POLICY "leader_team_access" ON cliente FOR SELECT USING (...);
CREATE POLICY "member_team_access" ON cliente FOR SELECT USING (...);

-- DESPUÉS (1 política consolidada):
DROP POLICY IF EXISTS "admin_full_access" ON cliente;
DROP POLICY IF EXISTS "leader_team_access" ON cliente;
DROP POLICY IF EXISTS "member_team_access" ON cliente;

CREATE POLICY "cliente_select" ON cliente FOR SELECT USING (
  -- Admin/Socio: acceso total
  EXISTS (SELECT 1 FROM users WHERE id = (select auth.uid()) AND rol_global IN ('ADMIN', 'SOCIO'))
  OR
  -- Líder: clientes de su equipo
  EXISTS (SELECT 1 FROM teams t WHERE t.team_id = cliente.team_id AND t.lider_id = (select auth.uid()))
  OR
  -- Miembro: clientes de equipos donde participa
  EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = cliente.team_id AND tm.user_id = (select auth.uid()))
);
```

**10. Crear índices para foreign keys sin cobertura (26 FKs):**

```sql
-- Índices para mejorar rendimiento de JOINs y deletes en cascada
CREATE INDEX idx_audits_tarea_id ON audits(tarea_id);
CREATE INDEX idx_ausencia_created_by ON ausencia(created_by);
CREATE INDEX idx_calendario_deadline_regla ON calendario_deadline(calendario_regla_id);
CREATE INDEX idx_calendario_regla_obligacion_obl ON calendario_regla_obligacion(id_obligacion);
CREATE INDEX idx_cliente_contribuyente_contrib ON cliente_contribuyente(contribuyente_id);
CREATE INDEX idx_cliente_servicio_servicio ON cliente_servicio(servicio_id);
CREATE INDEX idx_cliente_servicio_talla ON cliente_servicio(talla_id);
CREATE INDEX idx_cliente_talla_talla ON cliente_talla(talla_id);
CREATE INDEX idx_cpt_created_by ON contribuyente_proceso_talla(created_by);
CREATE INDEX idx_cpt_talla ON contribuyente_proceso_talla(talla_id);
CREATE INDEX idx_contribuyente_regimen_reg ON contribuyente_regimen(c_regimen);
CREATE INDEX idx_entregable_obligacion_obl ON entregable_obligacion(id_obligacion);
CREATE INDEX idx_findings_audit ON findings(audit_id);
CREATE INDEX idx_obligacion_calendario_regla ON obligacion_calendario(calendario_regla_id);
CREATE INDEX idx_obligacion_proceso_proc ON obligacion_proceso(proceso_id);
CREATE INDEX idx_regimen_entregable_peso_ent ON regimen_entregable_peso(entregable_id);
CREATE INDEX idx_regimen_obligacion_obl ON regimen_obligacion(id_obligacion);
CREATE INDEX idx_retrabajo_finding ON retrabajo(finding_id);
CREATE INDEX idx_retrabajo_tarea ON retrabajo(tarea_id);
CREATE INDEX idx_servicio_obligacion_obl ON servicio_obligacion(id_obligacion);
CREATE INDEX idx_tarea_revisor ON tarea(revisor_usuario_id);
CREATE INDEX idx_tarea_obligacion ON tarea(id_obligacion);
CREATE INDEX idx_tarea_vobo_por ON tarea(vobo_lider_por);
CREATE INDEX idx_tarea_documento_doc ON tarea_documento(documento_id);
CREATE INDEX idx_team_members_suplente ON team_members(suplente_de);
CREATE INDEX idx_team_members_user ON team_members(user_id);
```

**11. Revisar índices no utilizados (18 índices - INFO):**

Los siguientes índices nunca han sido usados. Evaluar si eliminarlos para reducir overhead de escritura:

```sql
-- NOTA: Revisar antes de eliminar - pueden ser necesarios para funcionalidades futuras
-- Solo eliminar si se confirma que no se necesitarán

-- Candidatos a eliminación (nunca usados):
-- DROP INDEX IF EXISTS idx_calendario_deadline_fecha;
-- DROP INDEX IF EXISTS idx_calendario_deadline_periodo;
-- DROP INDEX IF EXISTS idx_tarea_cliente;
-- DROP INDEX IF EXISTS idx_tarea_auditoria_auditor;
-- DROP INDEX IF EXISTS idx_tarea_vobo_lider;
-- DROP INDEX IF EXISTS idx_contribuyente_team;
-- DROP INDEX IF EXISTS idx_evento_usuario;
-- DROP INDEX IF EXISTS idx_evento_equipo;
-- DROP INDEX IF EXISTS idx_evento_activo;
-- DROP INDEX IF EXISTS idx_ausencia_colaborador;
-- DROP INDEX IF EXISTS idx_ausencia_fechas;
-- DROP INDEX IF EXISTS idx_ausencia_suplente;
-- DROP INDEX IF EXISTS idx_ausencia_activo;
-- DROP INDEX IF EXISTS idx_dia_inhabil_fecha;
-- DROP INDEX IF EXISTS idx_dia_inhabil_activo;
-- DROP INDEX IF EXISTS idx_tarea_en_riesgo;
-- DROP INDEX IF EXISTS idx_fecha_ajuste_tarea;
-- DROP INDEX IF EXISTS idx_fecha_ajuste_usuario;
-- DROP INDEX IF EXISTS idx_fecha_ajuste_created;
-- DROP INDEX IF EXISTS idx_cpt_contribuyente;
-- DROP INDEX IF EXISTS idx_cpt_proceso;

-- RECOMENDACIÓN: No eliminar aún - el sistema es nuevo y estos índices
-- pueden volverse útiles cuando crezca el volumen de datos.
-- Reevaluar después de 3-6 meses de uso en producción.
```

---

**Entregables Sprint 2.5:**
1. Script SQL: políticas RLS (`scripts/rls_security_fix.sql`)
2. Script SQL: fijar search_path en funciones
3. Script SQL: optimización `(select auth.uid())` en políticas
4. Script SQL: consolidación de políticas permisivas
5. Script SQL: índices para foreign keys (`scripts/rls_indexes.sql`)
6. Habilitar Leaked Password Protection en dashboard
7. Ejecutar scripts en Supabase
8. Verificar linter sin errores ni warnings de seguridad
9. Probar que la aplicación sigue funcionando
10. Documentar cambios de seguridad aplicados

**Prioridad de ejecución:**
1. **CRÍTICO** (Seguridad): Items 1-2 - RLS y search_path
2. **ALTO** (Rendimiento): Items 3-5 - Optimizaciones
3. **MEDIO** (Configuración): Item 6 - Password protection
4. **INFO** (Monitoreo): Índices no usados - evaluar en 3-6 meses

---

---

## 🚀 Plan de Ejecución Reorganizado (Con Paralelización)

### Diagrama de Fases y Dependencias

```
FASE 0: SEGURIDAD (Bloqueante)
═══════════════════════════════════════════════════════════════
Sprint 2.5a │████████│ RLS Crítico (Seguridad)
            ↓
═══════════════════════════════════════════════════════════════

FASE 1: FUNDACIÓN (Secuencial)
═══════════════════════════════════════════════════════════════
Sprint 3    │████████████│ Permisos + Periodo + Utilidades
            ↓↓↓
═══════════════════════════════════════════════════════════════

FASE 2: FEATURES (Paralelo ⚡)
═══════════════════════════════════════════════════════════════
            │ EQUIPO FRONTEND          │ EQUIPO BACKEND
────────────┼──────────────────────────┼───────────────────────
Sprint 4    │████████│ Colaborador UX  │
Sprint 5A   │                          │████████│ BD + Triggers
Sprint 7A   │████████│ Analytics       │
            │         ↓                │    ↓
Sprint 5B   │    ████████│ Líder UX    │
Sprint 7B   │                          │████████│ Auditor BD
═══════════════════════════════════════════════════════════════

FASE 3: INTEGRACIÓN (Después de Fase 2)
═══════════════════════════════════════════════════════════════
Sprint 6    │████████████│ TMR 2.0 + Management
            ↓
═══════════════════════════════════════════════════════════════

FASE 4: PULIDO (Final)
═══════════════════════════════════════════════════════════════
Sprint 8    │████████│ UI Polish
Sprint 2.5b │████│ Optimizaciones BD (puede ser paralelo)
═══════════════════════════════════════════════════════════════
```

---

### FASE 0: SEGURIDAD (Bloqueante Absoluto)

#### Sprint 2.5a: RLS Crítico - Seguridad
**Duración estimada:** 1-2 semanas | **Bloqueante:** TODO lo demás

| # | Tarea | Prioridad |
|---|-------|-----------|
| 1 | Habilitar RLS en 33 tablas (catálogos + operativas + sensibles) | CRÍTICO |
| 2 | Crear políticas básicas por rol | CRÍTICO |
| 3 | Fijar search_path en 8 funciones | CRÍTICO |
| 4 | Políticas para tarea_documento y tarea_evento | CRÍTICO |
| 5 | Cambiar vista a SECURITY INVOKER | CRÍTICO |
| 6 | Habilitar Leaked Password Protection | ALTO |
| 7 | Verificar linter sin errores de seguridad | ALTO |

**Entregables:**
- `scripts/rls_security_critical.sql`
- Linter Supabase sin errores (ERROR level)

---

### FASE 1: FUNDACIÓN (Prerequisito de Features)

#### Sprint 3: Permission System + Periodo + Utilidades Base
**Duración estimada:** 2 semanas | **Desbloquea:** Fase 2 completa

**3.1 Sistema de Permisos:**
| # | Tarea | Archivo |
|---|-------|---------|
| 1 | Crear hook `useUserRole` | `src/lib/hooks/useUserRole.ts` |
| 2 | Crear HOC `withRoleAccess` | `src/lib/auth/withRoleAccess.tsx` |
| 3 | Definir constantes de permisos | `src/lib/constants/rolePermissions.ts` |
| 4 | Actualizar middleware con validación | `src/middleware.ts` |
| 5 | Implementar sidebar filtrado por rol | `src/components/layout/Sidebar.tsx` |
| 6 | Restringir /configuracion a ADMIN+SOCIO | Middleware + página |

**3.2 Selector de Periodo:**
| # | Tarea | Archivo |
|---|-------|---------|
| 7 | Crear PeriodoContext | `src/lib/context/PeriodoContext.tsx` |
| 8 | Crear SelectorPeriodo componente | `src/components/layout/SelectorPeriodo.tsx` |
| 9 | Integrar en Header | `src/components/layout/Header.tsx` |
| 10 | Ajustar motor de riesgos para periodos | `src/lib/engine/riskDetector.ts` |

**3.3 Utilidades Base (Consolidación de Código):**
| # | Tarea | Archivo | Elimina Duplicación |
|---|-------|---------|---------------------|
| 11 | Crear hook `useSupabaseClient` | `src/lib/hooks/useSupabaseClient.ts` | 74 inicializaciones |
| 12 | Crear `dateCalculations.ts` | `src/lib/utils/dateCalculations.ts` | 5+ funciones |
| 13 | Crear `dataTransformers.ts` | `src/lib/utils/dataTransformers.ts` | 37 patterns |
| 14 | Crear componente StatusBadge | `src/components/common/StatusBadge.tsx` | 3+ funciones |

**Entregables:**
- Sistema de roles funcionando
- Selector de periodo en header
- Utilidades base creadas
- 150+ líneas de código duplicado eliminadas

---

### FASE 2: FEATURES (Ejecución en Paralelo ⚡)

#### 🔵 STREAM FRONTEND

##### Sprint 4: Colaborador UX
**Duración:** 1-2 semanas | **Inicia:** Después de Sprint 3 | **Paralelo con:** 5A, 7A

| # | Tarea | Descripción |
|---|-------|-------------|
| 1 | Mi Día con agrupación por periodo | Sección "🔴 Urgente" + "📋 Corriente" |
| 2 | Quick actions en tareas | Botones: completar, subir evidencia |
| 3 | Modal de detalle de tarea | Vista completa sin cambiar página |
| 4 | Simplificar página Agenda | Menos columnas, más acciones inline |
| 5 | Crear componente KPICard | Reutilizable para dashboards |
| 6 | Refactorizar con utilidades base | Usar dateCalculations, dataTransformers |

##### Sprint 7A: Vista Analytics
**Duración:** 1-2 semanas | **Inicia:** Después de Sprint 3 | **Paralelo con:** 4, 5A

| # | Tarea | Descripción |
|---|-------|-------------|
| 1 | Crear página `/procesos-analytics` | Vista por tipo de proceso |
| 2 | KPIs por proceso | Entregables, puntos, % a tiempo |
| 3 | Gráficas de distribución | Estados por proceso |
| 4 | Identificar cuellos de botella | Pasos con más retrasos |

##### Sprint 5B: Líder UX
**Duración:** 1-2 semanas | **Inicia:** Después de Sprint 5A | **Paralelo con:** 7B

| # | Tarea | Descripción |
|---|-------|-------------|
| 1 | Crear Team Dashboard | KPIs del equipo, carga por colaborador |
| 2 | Crear página Validaciones | Cola de tareas pendientes VoBo |
| 3 | Página Seguimientos (Líder) | Lista de pendientes del equipo |
| 4 | Notificaciones in-app | Bell icon en header |
| 5 | Integrar con tablas de Sprint 5A | pendiente_seguimiento, notificacion |

---

#### 🟢 STREAM BACKEND

##### Sprint 5A: Base de Datos + Triggers
**Duración:** 1-2 semanas | **Inicia:** Después de Sprint 3 | **Paralelo con:** 4, 7A

| # | Tarea | Descripción |
|---|-------|-------------|
| 1 | Crear tabla `pendiente_seguimiento` | Con RLS policies |
| 2 | Crear tabla `notificacion` | Con RLS policies |
| 3 | Crear trigger automático seguimientos | Para tareas vencidas, sin pago |
| 4 | Crear VIEW `v_tarea_completa` | Optimiza queries de dashboard |
| 5 | Crear VIEW `v_user_workload` | Optimiza reasignaciones |

```sql
-- VIEW v_tarea_completa
CREATE VIEW v_tarea_completa AS
SELECT
    t.tarea_id, t.cliente_id, t.estado, t.periodo_fiscal,
    t.fecha_limite_oficial, t.en_riesgo, t.prioridad,
    c.nombre_comercial as cliente_nombre,
    cont.rfc, cont.razon_social,
    o.nombre_corto as obligacion_nombre, o.periodicidad,
    u.nombre as responsable_nombre,
    tm.nombre as equipo_nombre
FROM tarea t
LEFT JOIN cliente c ON t.cliente_id = c.cliente_id
LEFT JOIN contribuyente cont ON t.contribuyente_id = cont.contribuyente_id
LEFT JOIN obligacion_fiscal o ON t.id_obligacion = o.id_obligacion
LEFT JOIN users u ON t.responsable_usuario_id = u.id
LEFT JOIN teams tm ON t.responsable_equipo_id = tm.team_id;
```

##### Sprint 7B: Auditor Base de Datos
**Duración:** 1-2 semanas | **Inicia:** Después de Sprint 5A | **Paralelo con:** 5B

| # | Tarea | Descripción |
|---|-------|-------------|
| 1 | Crear/verificar tabla `auditoria` | Con estados correctos |
| 2 | Crear tabla `hallazgo` | Tipos y gravedad |
| 3 | Crear tabla `metrica_calidad` | Tracking para bonos |
| 4 | RLS policies para auditoría | Por rol (Auditor, Líder, Colaborador) |
| 5 | Crear RPC `rpc_generate_tasks` | Optimiza generación |
| 6 | Crear RPC `rpc_detect_risk` | Con transacción |

---

### FASE 3: INTEGRACIÓN

#### Sprint 6: Management UX + TMR 2.0
**Duración:** 2 semanas | **Inicia:** Después de Sprint 5A+5B | **Requiere:** Datos de seguimientos

| # | Tarea | Descripción |
|---|-------|-------------|
| 1 | TMR 2.0 - Barra sticky alertas | Siempre visible con contadores |
| 2 | TMR 2.0 - Modo Resumen | KPIs, progreso mensual, equipos |
| 3 | TMR 2.0 - Modo Detalle | Tabla completa con filtros |
| 4 | TMR 2.0 - Modo Crítico | Cards accionables, bulk actions |
| 5 | Integrar VIEW v_tarea_completa | Optimiza carga de TMR |
| 6 | Dashboard Ejecutivo mejorado | Trend graphs, predicciones |
| 7 | Página Seguimientos Global (Socio) | Consolidado de todos los equipos |
| 8 | Módulo Auditor UI | Selección, evaluación, métricas |
| 9 | Export to Excel | En TMR modo Detalle |
| 10 | Mover Entregables a Configuración | Limpia sidebar principal |

---

### FASE 4: PULIDO

#### Sprint 8: UI Polish
**Duración:** 1-2 semanas | **Inicia:** Después de Sprint 6

| # | Área | Tareas |
|---|------|--------|
| 1 | Sistema de Diseño | Estandarizar botones, badges, colores |
| 2 | Estados de Carga | Skeleton loaders, optimistic updates |
| 3 | Estados Vacíos | Mensajes útiles, iconografía Lucide |
| 4 | Microinteracciones | Transiciones, feedback visual, tooltips |
| 5 | Accesibilidad | WCAG AA, navegación teclado, labels |

#### Sprint 2.5b: Optimizaciones BD (Puede ser paralelo con Sprint 8)
**Duración:** 1 semana

| # | Tarea | Impacto |
|---|-------|---------|
| 1 | Optimizar `(select auth.uid())` en 8 políticas | Rendimiento RLS |
| 2 | Consolidar ~50 políticas permisivas | Menos evaluaciones |
| 3 | Crear 26 índices para FKs | JOINs más rápidos |
| 4 | Evaluar índices no usados | Documentar para futuro |

---

## 🤖 Coordinación de Agentes Paralelos

### Arquitectura de Ejecución

```
┌─────────────────────────────────────────────────────────────────────┐
│                    🎯 COORDINADOR (Claude Principal)                 │
│    - Lee el plan, asigna tareas, verifica completitud               │
│    - Resuelve conflictos entre agentes                              │
│    - Integra resultados y hace commits                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌───────────────┐          ┌───────────────┐          ┌───────────────┐
│ 🔵 AGENTE BD  │          │ 🟢 AGENTE FE  │          │ 🟡 AGENTE UTL │
│ (Supabase)    │          │ (React/Next)  │          │ (Utilidades)  │
├───────────────┤          ├───────────────┤          ├───────────────┤
│ - SQL/RLS     │          │ - Componentes │          │ - Hooks       │
│ - VIEWs       │          │ - Páginas     │          │ - Utils       │
│ - RPCs        │          │ - UI/UX       │          │ - Constants   │
│ - Triggers    │          │ - Integración │          │ - Types       │
└───────────────┘          └───────────────┘          └───────────────┘
```

### Tareas por Agente (Granular)

#### FASE 0: Sprint 2.5a - SECUENCIAL (Bloqueante)

| Tarea | Agente | Dependencia | Archivos |
|-------|--------|-------------|----------|
| T0.1 Habilitar RLS 33 tablas | 🔵 BD | Ninguna | `scripts/rls_enable.sql` |
| T0.2 Crear políticas catálogos | 🔵 BD | T0.1 | `scripts/rls_policies_catalog.sql` |
| T0.3 Crear políticas operativas | 🔵 BD | T0.1 | `scripts/rls_policies_data.sql` |
| T0.4 Fijar search_path funciones | 🔵 BD | Ninguna | `scripts/fix_search_path.sql` |
| T0.5 Verificar y probar | 🔵 BD | T0.2, T0.3 | Manual |

---

#### FASE 1: Sprint 3 - PARALELO (3 agentes)

```
┌─────────────────────────────────────────────────────────────┐
│                      FASE 1 - PARALELO                       │
├─────────────────┬─────────────────┬─────────────────────────┤
│   🟡 AGENTE UTL │   🟢 AGENTE FE  │      🔵 AGENTE BD       │
├─────────────────┼─────────────────┼─────────────────────────┤
│ T1.1 constants/ │ T1.5 useUserRole│ T1.9 VIEW v_tarea      │
│   enums.ts      │ T1.6 withRole   │ T1.10 VIEW v_cliente   │
│ T1.2 constants/ │   Access.tsx    │ T1.11 VIEW v_workload  │
│   thresholds.ts │ T1.7 Sidebar    │                         │
│ T1.3 utils/     │   filtrado      │                         │
│   dateCalcs.ts  │ T1.8 Periodo    │                         │
│ T1.4 utils/     │   Context       │                         │
│   dataTransf.ts │                 │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

| ID | Tarea | Agente | Archivo Output |
|----|-------|--------|----------------|
| T1.1 | Crear enums (estados, roles, tipos) | 🟡 UTL | `src/lib/constants/enums.ts` |
| T1.2 | Crear thresholds configurables | 🟡 UTL | `src/lib/constants/thresholds.ts` |
| T1.3 | Crear dateCalculations.ts | 🟡 UTL | `src/lib/utils/dateCalculations.ts` |
| T1.4 | Crear dataTransformers.ts | 🟡 UTL | `src/lib/utils/dataTransformers.ts` |
| T1.5 | Crear useUserRole hook | 🟢 FE | `src/lib/hooks/useUserRole.ts` |
| T1.6 | Crear withRoleAccess HOC | 🟢 FE | `src/lib/auth/withRoleAccess.tsx` |
| T1.7 | Actualizar Sidebar con filtro rol | 🟢 FE | `src/components/layout/Sidebar.tsx` |
| T1.8 | Crear PeriodoContext | 🟢 FE | `src/lib/context/PeriodoContext.tsx` |
| T1.9 | Crear VIEW v_tarea_completa | 🔵 BD | `scripts/views/v_tarea_completa.sql` |
| T1.10 | Crear VIEW v_cliente_coverage | 🔵 BD | `scripts/views/v_cliente_coverage.sql` |
| T1.11 | Crear VIEW v_user_workload | 🔵 BD | `scripts/views/v_user_workload.sql` |

---

#### FASE 2: Sprints 4, 5A, 5B, 7A, 7B - PARALELO MÁXIMO

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FASE 2 - PARALELO MÁXIMO                          │
├───────────────────────────────┬─────────────────────────────────────┤
│        RONDA A (Paralelo)     │         RONDA B (Paralelo)          │
├───────────────────────────────┼─────────────────────────────────────┤
│ 🟢 Sprint 4: Colaborador UX   │ 🟢 Sprint 5B: Líder UX              │
│ 🔵 Sprint 5A: BD + Triggers   │ 🔵 Sprint 7B: Auditor BD            │
│ 🟢 Sprint 7A: Analytics       │                                      │
├───────────────────────────────┼─────────────────────────────────────┤
│ Depende de: FASE 1            │ Depende de: Sprint 5A               │
└───────────────────────────────┴─────────────────────────────────────┘
```

**RONDA A (3 agentes paralelos):**

| ID | Tarea | Agente | Sprint | Archivos |
|----|-------|--------|--------|----------|
| T2A.1 | Mi Día con agrupación periodo | 🟢 FE | 4 | `src/app/dashboard/mi-dia/page.tsx` |
| T2A.2 | Quick actions en tareas | 🟢 FE | 4 | `src/components/tarea/QuickActions.tsx` |
| T2A.3 | Modal detalle tarea | 🟢 FE | 4 | `src/components/tarea/TaskDetailModal.tsx` |
| T2A.4 | Tabla pendiente_seguimiento | 🔵 BD | 5A | `scripts/tables/pendiente_seguimiento.sql` |
| T2A.5 | Tabla notificacion | 🔵 BD | 5A | `scripts/tables/notificacion.sql` |
| T2A.6 | Trigger auto seguimientos | 🔵 BD | 5A | `scripts/triggers/auto_seguimiento.sql` |
| T2A.7 | RPC rpc_generate_tasks | 🔵 BD | 5A | `scripts/rpcs/rpc_generate_tasks.sql` |
| T2A.8 | Página procesos-analytics | 🟢 FE | 7A | `src/app/dashboard/procesos-analytics/page.tsx` |
| T2A.9 | Componente KPICard | 🟢 FE | 7A | `src/components/common/KPICard.tsx` |

**RONDA B (2 agentes paralelos, después de 5A):**

| ID | Tarea | Agente | Sprint | Archivos |
|----|-------|--------|--------|----------|
| T2B.1 | Team Dashboard | 🟢 FE | 5B | `src/app/dashboard/equipo/page.tsx` |
| T2B.2 | Página Validaciones | 🟢 FE | 5B | `src/app/dashboard/validaciones/page.tsx` |
| T2B.3 | Página Seguimientos Líder | 🟢 FE | 5B | `src/app/dashboard/seguimientos/page.tsx` |
| T2B.4 | Tabla auditoria mejorada | 🔵 BD | 7B | `scripts/tables/auditoria.sql` |
| T2B.5 | Tabla hallazgo | 🔵 BD | 7B | `scripts/tables/hallazgo.sql` |
| T2B.6 | Tabla metrica_calidad | 🔵 BD | 7B | `scripts/tables/metrica_calidad.sql` |
| T2B.7 | RPC rpc_detect_risk | 🔵 BD | 7B | `scripts/rpcs/rpc_detect_risk.sql` |

---

#### FASE 3: Sprint 6 - SECUENCIAL (Integración)

| ID | Tarea | Agente | Dependencia |
|----|-------|--------|-------------|
| T3.1 | TMR 2.0 - Barra alertas | 🟢 FE | Fase 2 completa |
| T3.2 | TMR 2.0 - 3 modos vista | 🟢 FE | T3.1 |
| T3.3 | Integrar VIEWs en TMR | 🟢 FE | T3.2, VIEWs |
| T3.4 | Seguimientos Global Socio | 🟢 FE | T3.3 |
| T3.5 | Módulo Auditor UI | 🟢 FE | 7B completo |
| T3.6 | Export Excel | 🟢 FE | T3.2 |

---

#### FASE 4: Sprint 8 + 2.5b - PARALELO FINAL

```
┌─────────────────────────────┬─────────────────────────────┐
│      🟢 AGENTE FE           │       🔵 AGENTE BD          │
│      Sprint 8               │       Sprint 2.5b           │
├─────────────────────────────┼─────────────────────────────┤
│ T4.1 Sistema de diseño      │ T4.5 Optimizar auth.uid()   │
│ T4.2 Skeleton loaders       │ T4.6 Consolidar políticas   │
│ T4.3 Estados vacíos         │ T4.7 Crear índices FKs      │
│ T4.4 Accesibilidad          │                             │
└─────────────────────────────┴─────────────────────────────┘
```

---

### Comandos de Coordinación

**Lanzar FASE 1 (3 agentes paralelos):**
```
Coordinador envía mensaje con 3 tool calls Task simultáneos:
- Task(agente=UTL, tareas=[T1.1, T1.2, T1.3, T1.4])
- Task(agente=FE, tareas=[T1.5, T1.6, T1.7, T1.8])
- Task(agente=BD, tareas=[T1.9, T1.10, T1.11])
```

**Verificación entre fases:**
```
Antes de FASE 2:
- Verificar que T1.1-T1.11 estén completas
- Verificar que código compila (npm run build)
- Hacer commit: "feat: complete Sprint 3 foundation"
```

**Resolución de conflictos:**
```
Si dos agentes modifican el mismo archivo:
1. Coordinador lee ambas versiones
2. Merge manual de cambios
3. Commit unificado
```

---

## Resumen de Reducción de Código (Actualizado)

| Optimización | Líneas Eliminadas | Sprint | Agente |
|--------------|-------------------|--------|--------|
| `constants/enums.ts` | ~80 líneas | 3 | 🟡 UTL |
| `useSupabaseClient` hook | ~150 líneas | 3 | 🟡 UTL |
| `dataTransformers.ts` | ~100 líneas | 3 | 🟡 UTL |
| `dateCalculations.ts` | ~80 líneas | 3 | 🟡 UTL |
| `StatusBadge` componente | ~60 líneas | 3 | 🟢 FE |
| `KPICard` componente | ~50 líneas | 4 | 🟢 FE |
| VIEW `v_tarea_completa` | ~200 líneas queries | 5A | 🔵 BD |
| `api/auth.ts` helper | ~60 líneas | 3 | 🟡 UTL |
| **TOTAL** | **~780 líneas** | - | - |

---

## ✅ Decisiones Confirmadas (Antes Inconsistencias)

### 1. Estados de Auditoría ✅ CONFIRMADO
5 estados totales:
| Estado | Uso |
|--------|-----|
| PENDIENTE | Estado inicial al asignar |
| RECHAZADO | Rehacer completo |
| CORREGIR | Ajuste parcial |
| APROBADO | OK, sin observaciones |
| DESTACADO | Excelente, ejemplo a seguir |

### 2. Permisos de Seguimientos ✅ CONFIRMADO
| Acción | COLABORADOR | LÍDER | SOCIO |
|--------|-------------|-------|-------|
| Ver sus seguimientos | ✅ | ✅ | ✅ |
| Crear seguimiento manual | ✅ | ✅ | ✅ |
| **Cerrar seguimiento** | ❌ | ✅ | ✅ |
| Ver seguimientos del equipo | ❌ | ✅ | ✅ |
| Ver seguimientos globales | ❌ | ❌ | ✅ |

### 3. Matriz Periodo × Vista ✅ CONFIRMADO
| Vista | "Periodo Anterior" | "Periodo Actual" | "Ambos" |
|-------|-------------------|------------------|---------|
| **TMR** | Filtra | Filtra | Muestra todos |
| **Mi Día** | N/A (siempre ambos) | N/A | ✅ Default |
| **Mi Agenda** | Filtra | Filtra | Muestra todos |
| **Ejecutivo** | Métricas del periodo | Métricas del periodo | Combina métricas |
| **Seguimientos** | Filtra por fecha_creacion | Filtra | Muestra todos |
| **Calendario** | N/A (visual por fechas) | N/A | ✅ Default |
| **Clientes** | N/A (no aplica) | N/A | N/A |
| **Analytics** | Datos del periodo | Datos del periodo | Comparativo |
| **Auditoría** | Filtra por periodo_auditado | Filtra | Muestra todos |

### 4. Selección de Auditoría ✅ CONFIRMADO
**Algoritmo como PROPUESTA - Socio decide:**
```
Al cierre de periodo (día configurable, default día 5):
1. Obtener tareas COMPLETADAS del periodo (estado = 'cerrado' o 'pagado')
2. Excluir tareas ya auditadas del mismo cliente
3. Porcentaje objetivo configurable (default 10%)
4. Distribución sugerida:
   - 50% aleatorio puro
   - 30% proporcional por equipo
   - 20% sesgado a colaboradores nuevos (<3 meses)
5. Socio puede: aceptar, modificar, o reemplazar manualmente
```

### 5. Motor de Riesgos ✅ CONFIRMADO
| Trigger | Frecuencia | Acción |
|---------|------------|--------|
| Cron job | Cada 4 horas | Ejecuta `rpc_detect_risk()` |
| Al cargar dashboard | On-demand | Solo muestra flag, no recalcula |
| Al cambiar estado de tarea | Trigger BD | Recalcula solo esa tarea |

---

## Files to Create/Modify

### New Files
- `src/lib/hooks/useUserRole.ts`
- `src/lib/auth/withRoleAccess.tsx`
- `src/lib/constants/rolePermissions.ts`
- `src/app/dashboard/equipo/page.tsx`
- `src/app/dashboard/validaciones/page.tsx`
- `src/app/dashboard/seguimientos/page.tsx` ⭐ Líder - pendientes de equipo
- `src/app/dashboard/seguimientos-global/page.tsx` ⭐ Socio - pendientes de todos
- `src/app/dashboard/procesos-analytics/page.tsx` ⭐ Vista rendimiento por proceso
- `src/components/seguimientos/SeguimientoCard.tsx` ⭐ Card de pendiente
- `src/components/seguimientos/NuevoSeguimientoModal.tsx` ⭐ Modal crear pendiente
- `src/components/seguimientos/CerrarSeguimientoModal.tsx` ⭐ Modal cerrar con evidencia
- `src/components/auditor/HallazgoCard.tsx` ⭐ Card de hallazgo
- `src/components/auditor/RetrabajoModal.tsx` ⭐ Modal crear tarea retrabajo
- `src/components/auditor/SeleccionAuditoriaPanel.tsx` ⭐ Panel selección para socio
- `src/components/auditor/EvaluacionAuditoriaForm.tsx` ⭐ Form de evaluación del auditor
- `src/components/auditor/MetricasCalidadDashboard.tsx` ⭐ Dashboard de métricas
- `src/app/dashboard/seleccion-auditoria/page.tsx` ⭐ Página selección (Socio)
- `src/app/dashboard/auditoria-equipo/page.tsx` ⭐ Retroalimentación equipo (Líder)
- `src/app/dashboard/mis-auditorias/page.tsx` ⭐ Mis auditorías (Colaborador)
- `src/lib/engine/seguimientosDetector.ts` ⭐ Detección automática
- `src/lib/notifications/notificationService.ts` ⭐ Servicio de notificaciones
- `src/components/common/TaskCard.tsx`
- `src/components/common/KPICard.tsx`

### New Database Tables

```sql
-- =============================================
-- TABLA: pendiente_seguimiento
-- =============================================
CREATE TABLE pendiente_seguimiento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  descripcion TEXT NOT NULL,
  cliente_id UUID REFERENCES cliente(cliente_id),
  tarea_origen_id UUID REFERENCES tarea(tarea_id),
  categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('PAGO', 'TRAMITE', 'CAMBIO', 'DOCUMENTACION', 'REQUERIMIENTO', 'OTRO')),
  prioridad VARCHAR(10) NOT NULL CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_compromiso DATE,
  responsable_id UUID REFERENCES users(id),
  lider_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(team_id),
  estado VARCHAR(10) DEFAULT 'ABIERTO' CHECK (estado IN ('ABIERTO', 'CERRADO')),
  evidencia_cierre_url TEXT,
  fecha_cierre TIMESTAMPTZ,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para rendimiento
CREATE INDEX idx_seguimiento_team ON pendiente_seguimiento(team_id);
CREATE INDEX idx_seguimiento_responsable ON pendiente_seguimiento(responsable_id);
CREATE INDEX idx_seguimiento_estado ON pendiente_seguimiento(estado);
CREATE INDEX idx_seguimiento_categoria ON pendiente_seguimiento(categoria);
```

### RLS Policies (Decisión confirmada - Completo desde inicio)

**Principio:** Todas las tablas nuevas tendrán RLS habilitado desde el primer momento.

```sql
-- =============================================
-- RLS para pendiente_seguimiento
-- =============================================
ALTER TABLE pendiente_seguimiento ENABLE ROW LEVEL SECURITY;

-- COLABORADOR: Solo ve sus propios seguimientos asignados
CREATE POLICY "colaborador_seguimiento_select" ON pendiente_seguimiento
  FOR SELECT
  USING (
    responsable_id = auth.uid()
    OR
    -- También ve los de su equipo si es líder
    EXISTS (
      SELECT 1 FROM team t
      WHERE t.team_id = pendiente_seguimiento.team_id
      AND t.lider_id = auth.uid()
    )
  );

-- LÍDER: Puede crear/editar seguimientos de su equipo
CREATE POLICY "lider_seguimiento_insert" ON pendiente_seguimiento
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team t
      WHERE t.team_id = pendiente_seguimiento.team_id
      AND t.lider_id = auth.uid()
    )
  );

CREATE POLICY "lider_seguimiento_update" ON pendiente_seguimiento
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team t
      WHERE t.team_id = pendiente_seguimiento.team_id
      AND t.lider_id = auth.uid()
    )
  );

-- SOCIO/ADMIN: Acceso completo
CREATE POLICY "socio_admin_seguimiento_all" ON pendiente_seguimiento
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.rol_global IN ('SOCIO', 'ADMIN')
    )
  );

-- =============================================
-- RLS para hallazgo
-- =============================================
ALTER TABLE hallazgo ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer hallazgos de sus tareas
CREATE POLICY "hallazgo_select" ON hallazgo
  FOR SELECT
  USING (
    -- El responsable de la tarea
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = hallazgo.tarea_id
      AND t.colaborador_id = auth.uid()
    )
    OR
    -- El líder del equipo
    EXISTS (
      SELECT 1 FROM tarea t
      JOIN team tm ON t.team_id = tm.team_id
      WHERE t.tarea_id = hallazgo.tarea_id
      AND tm.lider_id = auth.uid()
    )
    OR
    -- Auditor, Socio, Admin
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.rol_global IN ('AUDITOR', 'SOCIO', 'ADMIN')
    )
  );

-- Solo AUDITOR, SOCIO, ADMIN pueden crear hallazgos
CREATE POLICY "hallazgo_insert" ON hallazgo
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.rol_global IN ('AUDITOR', 'SOCIO', 'ADMIN')
    )
    OR
    -- Líder cruzado (no su propia equipo)
    EXISTS (
      SELECT 1 FROM users u
      JOIN team t ON u.id = t.lider_id
      WHERE u.id = auth.uid()
      AND u.rol_global = 'LIDER'
      AND NOT EXISTS (
        SELECT 1 FROM tarea ta
        WHERE ta.tarea_id = hallazgo.tarea_id
        AND ta.team_id = t.team_id
      )
    )
  );

-- =============================================
-- RLS para notificacion
-- =============================================
ALTER TABLE notificacion ENABLE ROW LEVEL SECURITY;

-- Solo el destinatario puede ver/modificar sus notificaciones
CREATE POLICY "notificacion_owner" ON notificacion
  FOR ALL
  USING (usuario_id = auth.uid());

-- =============================================
-- RLS para auditoria
-- =============================================
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Colaborador ve auditorías de sus tareas
CREATE POLICY "colaborador_auditoria_select" ON auditoria
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tarea t
      WHERE t.tarea_id = auditoria.tarea_id
      AND t.colaborador_id = auth.uid()
    )
  );

-- Auditor puede ver/editar todas las auditorías
CREATE POLICY "auditor_auditoria_all" ON auditoria
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.rol_global IN ('AUDITOR', 'SOCIO', 'ADMIN')
    )
  );

-- Líder puede ver auditorías de su equipo
CREATE POLICY "lider_auditoria_select" ON auditoria
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tarea t
      JOIN team tm ON t.team_id = tm.team_id
      WHERE t.tarea_id = auditoria.tarea_id
      AND tm.lider_id = auth.uid()
    )
  );

-- =============================================
-- RLS para metrica_calidad
-- =============================================
ALTER TABLE metrica_calidad ENABLE ROW LEVEL SECURITY;

-- Colaborador ve solo sus propias métricas
CREATE POLICY "colaborador_metrica_select" ON metrica_calidad
  FOR SELECT
  USING (colaborador_id = auth.uid());

-- Líder ve métricas de su equipo
CREATE POLICY "lider_metrica_select" ON metrica_calidad
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM colaborador_team ct
      JOIN team t ON ct.team_id = t.team_id
      WHERE ct.colaborador_id = metrica_calidad.colaborador_id
      AND t.lider_id = auth.uid()
    )
  );

-- Socio/Admin ven todas las métricas
CREATE POLICY "socio_admin_metrica_all" ON metrica_calidad
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.rol_global IN ('SOCIO', 'ADMIN')
    )
  );
```

**Nota sobre Service Role:** Las funciones del servidor (triggers, jobs) usan el service role de Supabase que bypasea RLS, permitiendo operaciones automáticas como crear seguimientos y actualizar métricas.

### Modify Files
- `src/middleware.ts` - Role validation
- `src/components/layout/Sidebar.tsx` - Role-based nav
- `src/app/dashboard/mi-dia/page.tsx` - Quick actions
- `src/app/dashboard/colaborador/page.tsx` - Simplification
- `src/app/dashboard/page.tsx` - TMR 2.0 improvements
- `src/app/dashboard/ejecutivo/page.tsx` - Trend graphs
- `src/app/dashboard/auditor/page.tsx` - Conectar a datos reales
- `src/app/dashboard/configuracion/page.tsx` - Agregar tabs Entregables

---

## Sistema de Notificaciones ⭐ NUEVO

### Eventos que Disparan Notificaciones

| Evento | Notificar a | Canal |
|--------|-------------|-------|
| Tarea se vence | Responsable + Líder | In-app + Email |
| Tarea entra en riesgo (presentada sin pago >3 días) | Líder + Socio | In-app |
| Seguimiento creado automáticamente | Líder | In-app |
| Seguimiento >30 días sin cerrar | Líder + Socio | In-app + Email |
| Socio escala desde modo Crítico | Líder + Responsable | In-app + Email |
| Tarea rechazada en auditoría | Responsable | In-app |
| Hallazgo de calidad registrado | Responsable + Líder | In-app |

### Implementación

**Fase 1 (Sprint 5-6): Notificaciones In-App**
- Icono de campana en header con contador
- Panel desplegable con lista de notificaciones
- Marcar como leída/no leída
- Tabla `notificacion` en BD

**Fase 2 (Posterior): Email**
- Integrar con servicio de email (Resend, SendGrid, etc.)
- Preferencias de usuario (qué notificaciones recibir por email)

### Modelo de Datos Notificaciones
```sql
CREATE TABLE notificacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES users(id) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT,
  url_destino VARCHAR(500),
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Módulo Auditor (Detalle) ⭐

### Propósito (Sección 4.6 de Propuesta Original)
Sistema de calidad, auditoría y retrabajo para:
- Medir calidad más allá de "a tiempo"
- Registrar errores y generar aprendizaje
- Vincular calidad a compensación (fase futura - tracking desde ahora)

---

### Flujo Completo de Auditoría

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FLUJO DE AUDITORÍA                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. TAREA COMPLETADA              2. VALIDACIÓN LÍDER                   │
│     ┌─────────────┐                  ┌─────────────┐                    │
│     │ Colaborador │──────────────────│   Líder     │                    │
│     │ sube        │                  │   valida    │                    │
│     │ evidencias  │                  │   (VoBo)    │                    │
│     └─────────────┘                  └──────┬──────┘                    │
│                                             │                            │
│                                             ▼                            │
│                                   3. POOL DE AUDITABLES                 │
│                                      ┌─────────────────┐                │
│                                      │ Tareas listas   │                │
│                                      │ para auditoría  │                │
│                                      └────────┬────────┘                │
│                                               │                          │
│                        ┌──────────────────────┴──────────────────────┐  │
│                        │                                              │  │
│                        ▼                                              ▼  │
│          4a. SELECCIÓN AUTOMÁTICA                    4b. SELECCIÓN MANUAL│
│          ┌───────────────────────┐                  ┌─────────────────┐ │
│          │ Sistema sugiere X%    │                  │ Socio elige     │ │
│          │ al cierre de periodo  │                  │ en cualquier    │ │
│          │ Socio confirma/ajusta │                  │ momento         │ │
│          └───────────┬───────────┘                  └────────┬────────┘ │
│                      │                                       │          │
│                      └───────────────────┬───────────────────┘          │
│                                          ▼                              │
│                               5. COLA DE AUDITORÍA                      │
│                               ┌────────────────────┐                    │
│                               │ Auditor revisa     │                    │
│                               │ evidencias y       │                    │
│                               │ evalúa trabajo     │                    │
│                               └─────────┬──────────┘                    │
│                                         │                               │
│                    ┌────────────────────┼────────────────────┐          │
│                    ▼                    ▼                    ▼          │
│              ┌──────────┐        ┌──────────┐        ┌──────────┐       │
│              │ RECHAZADO│        │ CORREGIR │        │ APROBADO │       │
│              │ (Rehacer)│        │ (Ajustar)│        │   (OK)   │       │
│              └────┬─────┘        └────┬─────┘        └──────────┘       │
│                   │                   │                    │            │
│                   │                   │              ┌─────┴─────┐      │
│                   │                   │              ▼           ▼      │
│                   │                   │        ┌─────────┐ ┌─────────┐  │
│                   ▼                   ▼        │APROBADO │ │DESTACADO│  │
│           ┌─────────────┐     ┌─────────────┐  │ normal  │ │ ⭐⭐     │  │
│           │ Tarea de    │     │ Tarea de    │  └─────────┘ └─────────┘  │
│           │ RETRABAJO   │     │ CORRECCIÓN  │                           │
│           │ (completo)  │     │ (parcial)   │                           │
│           └──────┬──────┘     └──────┬──────┘                           │
│                  │                   │                                  │
│                  └───────────────────┴───────────────────┐              │
│                                                          ▼              │
│                                               6. MÉTRICAS DE CALIDAD    │
│                                               ┌─────────────────────┐   │
│                                               │ Tracking histórico  │   │
│                                               │ por colaborador     │   │
│                                               │ (base para bonos)   │   │
│                                               └─────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Vista 1: Selección para Auditoría (SOCIO)

**Propósito:** El socio selecciona qué tareas enviar a auditoría

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SELECCIÓN PARA AUDITORÍA                              Periodo: Ene 2026 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─── SUGERENCIA DEL SISTEMA ────────────────────────────────────────┐   │
│ │ 📊 Tareas completadas y validadas este periodo: 234                │   │
│ │ 🎲 Sugerencia aleatoria (10%): 24 tareas                          │   │
│ │                                                                    │   │
│ │ [Aceptar Sugerencia] [Modificar Selección] [Seleccionar Manualmente]│  │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── TAREAS SELECCIONADAS (24) ─────────────────────────────────────┐   │
│ │ ☑ Seleccionar todas                              [Enviar a Auditoría]│ │
│ ├────────────────────────────────────────────────────────────────────┤   │
│ │ ☑ ISR Mensual - Empresa ABC                                        │   │
│ │   Responsable: María García │ Equipo: Fiscal Norte                  │   │
│ │   Completado: 15 Ene │ Evidencias: 3 archivos                      │   │
│ ├────────────────────────────────────────────────────────────────────┤   │
│ │ ☑ DIOT - Comercial XYZ                                             │   │
│ │   Responsable: Juan López │ Equipo: Fiscal Sur                      │   │
│ │   Completado: 16 Ene │ Evidencias: 2 archivos                      │   │
│ ├────────────────────────────────────────────────────────────────────┤   │
│ │ ☐ Nómina Quincenal - Industrias DEF                                │   │
│ │   Responsable: Ana Martínez │ Equipo: Contable                      │   │
│ │   Completado: 17 Ene │ Evidencias: 5 archivos                      │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── POOL DISPONIBLE (210 restantes) ───────────────────────────────┐   │
│ │ [Buscar...] [Filtrar por equipo ▼] [Filtrar por proceso ▼]         │   │
│ │                                                                    │   │
│ │ + Agregar tareas manualmente a la selección                        │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Sistema sugiere X% aleatorio al cierre de periodo
- Socio puede aceptar, modificar o hacer selección manual
- Posibilidad de enviar tareas específicas en cualquier momento
- Distribución equilibrada por equipo/proceso (configurable)

---

### Vista 2: Cola de Auditoría (AUDITOR)

**Propósito:** El auditor revisa evidencias y evalúa el trabajo

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AUDITORÍA                                            Pendientes: 12     │
├─────────────────────────────────────────────────────────────────────────┤
│ Filtros: [Equipo ▼] [Proceso ▼] [Periodo ▼]                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌── TAREA EN REVISIÓN ──────────────────────────────────────────────┐   │
│ │                                                                    │   │
│ │ 📋 ISR Mensual - Empresa ABC                                       │   │
│ │    RFC: XAXX010101ABC │ Periodo: Enero 2026                        │   │
│ │    Responsable: María García │ Equipo: Fiscal Norte                 │   │
│ │    Completado: 15 Ene │ Validado por líder: 16 Ene                 │   │
│ │                                                                    │   │
│ │    ┌─── EVIDENCIAS ───────────────────────────────────────────┐   │   │
│ │    │ 📎 Declaracion_ISR_Enero.pdf          [Ver] [Descargar]  │   │   │
│ │    │ 📎 Acuse_presentacion.pdf             [Ver] [Descargar]  │   │   │
│ │    │ 📎 Comprobante_pago.pdf               [Ver] [Descargar]  │   │   │
│ │    └──────────────────────────────────────────────────────────┘   │   │
│ │                                                                    │   │
│ │    ┌─── RETROALIMENTACIÓN ────────────────────────────────────┐   │   │
│ │    │ Comentarios del auditor:                                  │   │   │
│ │    │ ┌──────────────────────────────────────────────────────┐ │   │   │
│ │    │ │ El cálculo está correcto. La presentación fue       │ │   │   │
│ │    │ │ oportuna y la evidencia está completa.              │ │   │   │
│ │    │ └──────────────────────────────────────────────────────┘ │   │   │
│ │    │                                                          │   │   │
│ │    │ Hallazgos (opcional):                                    │   │   │
│ │    │ [+ Agregar Hallazgo]                                     │   │   │
│ │    └──────────────────────────────────────────────────────────┘   │   │
│ │                                                                    │   │
│ │    ┌─── EVALUACIÓN FINAL ─────────────────────────────────────┐   │   │
│ │    │                                                           │   │   │
│ │    │  [✗ RECHAZAR]  [⚠️ CORREGIR]  [✓ APROBAR]  [⭐ DESTACAR] │   │   │
│ │    │   Rehacer        Ajustar        OK           Excelente   │   │   │
│ │    │   completo       parcial                     ⭐⭐         │   │   │
│ │    │                                                           │   │   │
│ │    └───────────────────────────────────────────────────────────┘   │   │
│ │                                                                    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌── COLA PENDIENTE (11 más) ────────────────────────────────────────┐   │
│ │ • DIOT - Comercial XYZ                    Esperando desde: 2 días │   │
│ │ • Nómina - Industrias DEF                 Esperando desde: 1 día  │   │
│ │ • IVA Mensual - Servicios GHI             Esperando desde: 3 horas│   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Vista 3: Detalle de Hallazgo (al agregar)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AGREGAR HALLAZGO                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Tipo de hallazgo:                                                        │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ○ Error técnico (cálculos, datos)                                   │ │
│ │ ○ Documentación (evidencia incompleta/incorrecta)                   │ │
│ │ ● Proceso (no siguió procedimiento)                                 │ │
│ │ ○ Comunicación (falta de comunicación)                              │ │
│ │ ○ Otro                                                              │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ Gravedad:                                                                │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ○ Baja (menor, no afecta resultado)                                 │ │
│ │ ● Media (afecta parcialmente, corregible rápido)                    │ │
│ │ ○ Alta (requiere retrabajo significativo)                           │ │
│ │ ○ Crítica (impacto en cliente/autoridad)                            │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ Descripción detallada:                                                   │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ No se incluyó el desglose de deducciones autorizadas según         │ │
│ │ el procedimiento establecido en el manual de operaciones.          │ │
│ │ Se recomienda revisar sección 4.2 del manual.                      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ☑ Este hallazgo genera tarea de retrabajo                               │
│                                                                          │
│ Tipo de retrabajo:                                                       │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ○ Rehacer completo (toda la tarea desde cero)                       │ │
│ │ ● Corrección parcial (solo ajustar lo indicado)                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                                        [Cancelar]  [Guardar Hallazgo]    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Vista 4: Métricas de Calidad (Dashboard)

**Propósito:** Tracking histórico para decisiones de bonos (fase futura)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MÉTRICAS DE CALIDAD                                  Periodo: 2026      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─── RESUMEN DEL PERIODO ───────────────────────────────────────────┐   │
│ │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│ │  │ 124     │ │ 95      │ │ 18      │ │ 8       │ │ 3       │     │   │
│ │  │Auditadas│ │Aprobadas│ │Corregir │ │Rechazad │ │Destacad │     │   │
│ │  │         │ │ 77%     │ │ 14%     │ │ 6%      │ │ 3%      │     │   │
│ │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── RENDIMIENTO POR COLABORADOR ───────────────────────────────────┐   │
│ │                                                                    │   │
│ │ Colaborador      │ Auditadas │ ✓ Aprob │ ⭐ Dest │ ⚠️ Corr │ ✗ Rech│  │
│ │ ─────────────────┼───────────┼─────────┼─────────┼─────────┼───────│  │
│ │ María García     │ 28        │ 24 (86%)│ 2       │ 2       │ 0     │  │
│ │ Juan López       │ 32        │ 25 (78%)│ 1       │ 4       │ 2     │  │
│ │ Ana Martínez     │ 22        │ 15 (68%)│ 0       │ 5       │ 2  ⚠️ │  │
│ │ Pedro Sánchez    │ 18        │ 15 (83%)│ 0       │ 2       │ 1     │  │
│ │ Laura Méndez     │ 24        │ 16 (67%)│ 0       │ 5       │ 3  ⚠️ │  │
│ │                                                                    │   │
│ │ ⚠️ = Requiere atención (>20% con problemas)                        │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── TOP DESTACADOS ⭐ ──────────────────────────────────────────────┐   │
│ │ 1. María García (2 destacados) - Fiscal Norte                     │   │
│ │ 2. Carlos Ruiz (1 destacado) - Contable                           │   │
│ │ 3. Juan López (1 destacado) - Fiscal Sur                          │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── HALLAZGOS FRECUENTES ──────────────────────────────────────────┐   │
│ │ Tipo                 │ Cantidad │ % del total │ Tendencia         │   │
│ │ ─────────────────────┼──────────┼─────────────┼───────────────────│   │
│ │ Documentación        │ 15       │ 42%         │ ↗️ Subiendo       │   │
│ │ Error técnico        │ 12       │ 33%         │ ↘️ Bajando        │   │
│ │ Proceso              │ 6        │ 17%         │ → Estable         │   │
│ │ Comunicación         │ 3        │ 8%          │ → Estable         │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── EVOLUCIÓN MENSUAL ─────────────────────────────────────────────┐   │
│ │                                                                    │   │
│ │ % Aprobación:  Oct    Nov    Dic    Ene                           │   │
│ │                82%    79%    85%    77%                           │   │
│ │                ▁▁▁    ▁▁▁    ▁▁▁    ▁▁▁                           │   │
│ │                                                                    │   │
│ │ Destacados:    2      1      3      3                             │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│                                              [Exportar Reporte]          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Estados de Auditoría (Confirmado: 4 estados)

| Estado | Descripción | Color | Acción Resultante |
|--------|-------------|-------|-------------------|
| `PENDIENTE` | En cola, esperando revisión | Gris | - |
| `RECHAZADO` | Trabajo inaceptable, rehacer completo | Rojo | Crea tarea RETRABAJO (completo) |
| `CORREGIR` | Necesita ajustes parciales | Naranja | Crea tarea CORRECCIÓN (parcial) |
| `APROBADO` | Trabajo correcto | Verde | Cierra flujo |
| `DESTACADO` | Trabajo excelente, ejemplo a seguir | Oro ⭐ | Cierra flujo + registro especial |

---

### Hallazgos

**Tipos de Hallazgo:**
- `ERROR_TECNICO` - Error en cálculos, datos incorrectos
- `DOCUMENTACION` - Evidencia incompleta o incorrecta
- `PROCESO` - No siguió el procedimiento establecido
- `COMUNICACION` - Falta de comunicación con cliente/equipo
- `OTRO` - Casos no clasificados

**Gravedad:**
- `BAJA` - Menor, no afecta resultado
- `MEDIA` - Afecta parcialmente, corregible rápido
- `ALTA` - Afecta significativamente, requiere retrabajo
- `CRITICA` - Error grave, impacto en cliente/autoridad

---

### Retrabajo (Flujo detallado)

Cuando el auditor marca RECHAZADO o CORREGIR:

1. **Se crea tarea de retrabajo** automáticamente
   - Tipo: `RETRABAJO_COMPLETO` o `CORRECCION_PARCIAL`
   - Vinculada a la tarea original
   - Contiene: hallazgos, comentarios del auditor

2. **Aparece en agenda del responsable**
   - Marcada visualmente como "RETRABAJO" o "CORRECCIÓN"
   - Prioridad alta automáticamente
   - Incluye enlace a retroalimentación del auditor

3. **Flujo después de corregir**
   - Colaborador completa corrección
   - Líder valida nuevamente
   - Vuelve a cola de auditoría para verificación

4. **Trazabilidad completa**
   - Historial de intentos por tarea
   - Tiempo total de ciclo (incluye retrabajos)

---

### Modelo de Datos Auditor (Actualizado)

```sql
-- Tabla para registro de auditorías
CREATE TABLE auditoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID REFERENCES tarea(tarea_id) NOT NULL,
  auditor_id UUID REFERENCES users(id) NOT NULL,
  estado VARCHAR(20) NOT NULL CHECK (estado IN ('PENDIENTE', 'RECHAZADO', 'CORREGIR', 'APROBADO', 'DESTACADO')),
  comentarios TEXT,
  fecha_asignacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_revision TIMESTAMPTZ,
  periodo VARCHAR(7), -- "2026-01" formato año-mes
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para hallazgos
CREATE TABLE hallazgo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auditoria_id UUID REFERENCES auditoria(id) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ERROR_TECNICO', 'DOCUMENTACION', 'PROCESO', 'COMUNICACION', 'OTRO')),
  gravedad VARCHAR(10) NOT NULL CHECK (gravedad IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
  descripcion TEXT NOT NULL,
  genera_retrabajo BOOLEAN DEFAULT FALSE,
  tipo_retrabajo VARCHAR(20) CHECK (tipo_retrabajo IN ('COMPLETO', 'PARCIAL')),
  tarea_retrabajo_id UUID REFERENCES tarea(tarea_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para tracking de métricas (para bonos futuros)
CREATE TABLE metrica_calidad (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES users(id) NOT NULL,
  periodo VARCHAR(7) NOT NULL, -- "2026-01"
  total_auditadas INTEGER DEFAULT 0,
  total_aprobadas INTEGER DEFAULT 0,
  total_destacadas INTEGER DEFAULT 0,
  total_corregir INTEGER DEFAULT 0,
  total_rechazadas INTEGER DEFAULT 0,
  score_calculado DECIMAL(5,2), -- Para uso futuro en bonos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(colaborador_id, periodo)
);

-- Índices para rendimiento
CREATE INDEX idx_auditoria_tarea ON auditoria(tarea_id);
CREATE INDEX idx_auditoria_estado ON auditoria(estado);
CREATE INDEX idx_auditoria_periodo ON auditoria(periodo);
CREATE INDEX idx_hallazgo_auditoria ON hallazgo(auditoria_id);
CREATE INDEX idx_metrica_colaborador ON metrica_calidad(colaborador_id);
CREATE INDEX idx_metrica_periodo ON metrica_calidad(periodo);
```

---

### Selección Híbrida (Configuración)

```typescript
interface ConfiguracionAuditoria {
  // Porcentaje sugerido automáticamente
  porcentaje_aleatorio: number  // Default: 10%

  // Distribución equilibrada
  equilibrar_por_equipo: boolean  // Default: true
  equilibrar_por_proceso: boolean  // Default: true

  // Forzar inclusión
  incluir_todos_nuevos_colaboradores: boolean  // Default: true (primer mes)
  incluir_tareas_alto_valor: boolean  // Default: true (clientes premium)

  // Timing
  dia_cierre_periodo: number  // Default: 5 (día 5 del mes siguiente)
}
```

---

### Vista 5: Retroalimentación de Auditoría (LÍDER)

**Propósito:** El líder ve resultados de auditoría de su equipo para coaching y seguimiento

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AUDITORÍA DE MI EQUIPO                           Equipo: Fiscal Norte    │
├─────────────────────────────────────────────────────────────────────────┤
│ Periodo: [Enero 2026 ▼]                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─── RESUMEN DEL EQUIPO ────────────────────────────────────────────┐   │
│ │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐     │   │
│ │  │ 28      │ │ 22      │ │ 3       │ │ 2       │ │ 1       │     │   │
│ │  │Auditadas│ │Aprobadas│ │Corregir │ │Rechazad │ │Destacad │     │   │
│ │  │         │ │ 79%     │ │ 11%     │ │ 7%      │ │ 3%      │     │   │
│ │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘     │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── REQUIEREN ATENCIÓN ⚠️ ─────────────────────────────────────────┐   │
│ │                                                                    │   │
│ │ 🔴 RECHAZADO: ISR Mensual - Cliente ABC                           │   │
│ │    Colaborador: María García                                       │   │
│ │    Auditor: Carlos Ruiz │ Fecha: 18 Ene                           │   │
│ │    ┌─────────────────────────────────────────────────────────┐    │   │
│ │    │ Hallazgo: Error en cálculo de deducciones (ALTA)        │    │   │
│ │    │ "El monto de deducciones no coincide con los CFDI..."   │    │   │
│ │    │ Retrabajo: COMPLETO - Pendiente                         │    │   │
│ │    └─────────────────────────────────────────────────────────┘    │   │
│ │    [Ver Detalle] [Hablar con Colaborador]                         │   │
│ │                                                                    │   │
│ │ ⚠️ CORREGIR: DIOT - Cliente XYZ                                   │   │
│ │    Colaborador: Juan López                                         │   │
│ │    Auditor: Carlos Ruiz │ Fecha: 17 Ene                           │   │
│ │    ┌─────────────────────────────────────────────────────────┐    │   │
│ │    │ Hallazgo: Documentación incompleta (MEDIA)              │    │   │
│ │    │ "Falta incluir el comprobante de pago en evidencias..." │    │   │
│ │    │ Corrección: PARCIAL - En proceso                        │    │   │
│ │    └─────────────────────────────────────────────────────────┘    │   │
│ │    [Ver Detalle] [Hablar con Colaborador]                         │   │
│ │                                                                    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── DESTACADOS ⭐ ──────────────────────────────────────────────────┐   │
│ │                                                                    │   │
│ │ ⭐ DESTACADO: Nómina Quincenal - Cliente DEF                       │   │
│ │    Colaborador: Ana Martínez                                       │   │
│ │    Auditor: Carlos Ruiz │ Fecha: 16 Ene                           │   │
│ │    ┌─────────────────────────────────────────────────────────┐    │   │
│ │    │ "Excelente trabajo. Documentación impecable, cálculos   │    │   │
│ │    │ correctos y presentación anticipada. Ejemplo a seguir." │    │   │
│ │    └─────────────────────────────────────────────────────────┘    │   │
│ │    [Ver Detalle] [Felicitar al Colaborador]                       │   │
│ │                                                                    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── RENDIMIENTO POR COLABORADOR ───────────────────────────────────┐   │
│ │                                                                    │   │
│ │ Colaborador      │ Audit │ ✓ │ ⭐ │ ⚠️ │ ✗ │ Tendencia            │   │
│ │ ─────────────────┼───────┼───┼────┼────┼───┼──────────────────────│   │
│ │ María García     │ 8     │ 6 │ 0  │ 1  │ 1 │ ↘️ Bajando (atención)│   │
│ │ Juan López       │ 10    │ 8 │ 0  │ 2  │ 0 │ → Estable            │   │
│ │ Ana Martínez     │ 6     │ 5 │ 1  │ 0  │ 0 │ ↗️ Mejorando         │   │
│ │ Pedro Sánchez    │ 4     │ 3 │ 0  │ 0  │ 1 │ → Primera auditoría  │   │
│ │                                                                    │   │
│ │ [Click en colaborador → historial detallado]                       │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── HALLAZGOS FRECUENTES EN MI EQUIPO ─────────────────────────────┐   │
│ │ Documentación: 4 │ Error técnico: 2 │ Proceso: 1                  │   │
│ │                                                                    │   │
│ │ 💡 Sugerencia: Reforzar capacitación en documentación de          │   │
│ │    evidencias (hallazgo más frecuente este periodo)               │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Funcionalidades del Líder:**
- Ver resumen de auditorías de su equipo por periodo
- Acceso a retroalimentación completa del auditor
- Ver hallazgos y comentarios detallados
- Monitorear retrabajos pendientes de su equipo
- Ver tendencias por colaborador (mejorando/empeorando)
- Identificar patrones de error para coaching
- Celebrar destacados con su equipo
- Acceso directo a "Hablar con colaborador" (notificación/chat)

**Notificaciones al Líder:**
- Cuando una tarea de su equipo es rechazada → Notificación inmediata
- Cuando una tarea es destacada → Notificación para felicitar
- Resumen semanal de auditorías del equipo

---

### Vista 6: Mi Retroalimentación (COLABORADOR)

**Propósito:** El colaborador ve sus propias auditorías y aprende de la retroalimentación

```
┌─────────────────────────────────────────────────────────────────────────┐
│ MIS AUDITORÍAS                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│ Periodo: [Enero 2026 ▼]                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ┌─── MI RESUMEN ────────────────────────────────────────────────────┐   │
│ │  Auditadas: 5 │ ✓ Aprobadas: 3 │ ⚠️ Corregir: 1 │ ⭐ Destacado: 1 │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── PENDIENTE DE CORREGIR ⚠️ ──────────────────────────────────────┐   │
│ │                                                                    │   │
│ │ ⚠️ DIOT - Cliente XYZ                                              │   │
│ │    Auditor: Carlos Ruiz │ Fecha: 17 Ene                           │   │
│ │                                                                    │   │
│ │    Retroalimentación del auditor:                                  │   │
│ │    ┌─────────────────────────────────────────────────────────┐    │   │
│ │    │ "El cálculo está correcto, pero falta incluir el        │    │   │
│ │    │ comprobante de pago en las evidencias. Por favor        │    │   │
│ │    │ agrégalo y vuelve a enviar para verificación."          │    │   │
│ │    └─────────────────────────────────────────────────────────┘    │   │
│ │                                                                    │   │
│ │    Hallazgo: Documentación incompleta (MEDIA)                     │   │
│ │                                                                    │   │
│ │    [Ir a Corrección] [Ver Tarea Original]                         │   │
│ │                                                                    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── MIS DESTACADOS ⭐ ──────────────────────────────────────────────┐   │
│ │                                                                    │   │
│ │ ⭐ Nómina Quincenal - Cliente DEF                                  │   │
│ │    "Excelente trabajo. Documentación impecable..."                │   │
│ │                                                                    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── HISTORIAL COMPLETO ────────────────────────────────────────────┐   │
│ │                                                                    │   │
│ │ Tarea                  │ Resultado  │ Fecha   │ Hallazgos         │   │
│ │ ───────────────────────┼────────────┼─────────┼───────────────────│   │
│ │ ISR Mensual - ABC      │ ✓ Aprobado │ 18 Ene  │ 0                 │   │
│ │ DIOT - XYZ             │ ⚠️ Corregir│ 17 Ene  │ 1 (Documentación) │   │
│ │ Nómina - DEF           │ ⭐ Destacad│ 16 Ene  │ 0                 │   │
│ │ IVA Mensual - GHI      │ ✓ Aprobado │ 15 Ene  │ 0                 │   │
│ │ Contabilidad - JKL     │ ✓ Aprobado │ 14 Ene  │ 0                 │   │
│ │                                                                    │   │
│ │ [Ver más...]                                                       │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌─── MIS ÁREAS DE MEJORA ───────────────────────────────────────────┐   │
│ │ 📊 Últimos 3 meses:                                                │   │
│ │    Documentación: 2 hallazgos → Área a reforzar                   │   │
│ │    Error técnico: 0 hallazgos → ✓ Bien                            │   │
│ │    Proceso: 1 hallazgo → Revisar                                  │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Funcionalidades del Colaborador:**
- Ver todas sus auditorías y resultados
- Leer retroalimentación completa del auditor
- Acceso directo a tareas de corrección pendientes
- Ver su historial y tendencias
- Identificar sus áreas de mejora
- Celebrar sus destacados

---

### Acceso al Módulo Auditor (Actualizado)

| Rol | Permisos |
|-----|----------|
| COLABORADOR | Ver sus auditorías, leer retroalimentación, ver áreas de mejora (solo lectura) |
| LIDER | Ver auditorías del equipo, retroalimentación, métricas, tendencias, coaching (solo lectura) |
| AUDITOR | Revisar tareas asignadas, emitir evaluaciones, registrar hallazgos |
| SOCIO | Seleccionar tareas para auditoría, ver métricas globales, configurar reglas |
| ADMIN | Todo + configurar reglas de selección automática |

---

### ¿Quién Audita? (Decisión Confirmada)

**Modelo Híbrido: Auditor Dedicado + Líderes Cruzados**

1. **Auditor Dedicado (principal)**
   - Rol específico: `AUDITOR` en rol_global
   - Responsable de auditar la mayoría de entregables
   - Acceso completo al módulo Auditor
   - Puede auditar cualquier equipo/equipo

2. **Líderes Cruzados (respaldo/complemento)**
   - Líder de Equipo A puede auditar trabajo de Equipo B
   - Útil cuando auditor no disponible o para segundo opinión
   - Restricción: NO puede auditar su propia equipo

---

### Tracking para Bonos (Fase Futura)

**Datos que se registran desde ahora:**
- Total de tareas auditadas por colaborador/periodo
- Distribución por estado (aprobado, rechazado, etc.)
- Cantidad de destacados
- Tipos de hallazgos más frecuentes
- Tiempo de resolución de retrabajos

**Uso futuro:**
- Definir fórmula de score de calidad
- Vincular score a sistema de compensación
- Generar reportes para revisiones de desempeño
- Identificar necesidades de capacitación

**Nota:** La fórmula exacta de cálculo de bonos se definirá en fase posterior. El sistema almacena todos los datos necesarios para cualquier fórmula que se decida implementar.

---

## Verification Plan

1. **Permission Testing:**
   - Login as each role type
   - Verify sidebar shows correct items
   - Verify protected routes redirect
   - Verify API calls respect permissions

2. **UX Testing:**
   - Complete task lifecycle as Colaborador
   - Validate tasks as Líder
   - Review dashboards as Socio/Admin

3. **Regression Testing:**
   - Run existing functionality
   - Verify data integrity
   - Check performance (no slowdown)

---

## Documentation Output

Create `/docs/UX_MEJORAS_POR_ROL.md` with:
- Role-specific user journeys
- Screenshots/wireframes of proposed changes
- Before/after comparisons
- Implementation status tracking
