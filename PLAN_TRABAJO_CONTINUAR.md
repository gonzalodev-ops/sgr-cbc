# Plan: Completar Mejoras UX + Implementar Testing

> **IMPORTANTE:** La rama `claude/consolidated-fixes-6Ksdb` contiene cambios significativos que AÚN NO están en main. Este plan refleja el estado de esa rama.

## Estado Real del Proyecto (Rama: claude/consolidated-fixes-6Ksdb)

### Sidebar Dinámico - ✅ IMPLEMENTADO

**Archivo:** `src/components/layout/Sidebar.tsx`
**Hook:** `src/lib/hooks/useUserRole.ts`

#### Navegación por Rol (IMPLEMENTADO):

| Rol | Items de Navegación | Home |
|-----|---------------------|------|
| **COLABORADOR** | Mi Día, Calendario, Clientes | `/dashboard/mi-dia` |
| **LIDER** | Mi Equipo, Mi Día, Validaciones, Seguimientos, Calendario, Clientes, Alertas | `/dashboard/equipo` |
| **AUDITOR** | Auditorías, TMR, Clientes, Calendario | `/dashboard/auditor` |
| **SOCIO** | TMR, TMR 2.0, Mi Día, Mi Equipo, Ejecutivo, Validaciones, Seguimientos, Auditorías, Calendario, Clientes, Colaboradores, Equipos, Alertas, Análisis, Configuración | `/dashboard` |
| **ADMIN** | TMR, Ejecutivo, Alertas, Equipos, Colaboradores, Clientes, Configuración, Entregables, Procesos | `/dashboard` |

#### Propuesta ADMIN (UX Mejorado):

**Problema actual:** ADMIN ve TODO (incluyendo items operativos como Mi Día, Validaciones, Seguimientos)

**Propuesta:** ADMIN enfocado en supervisión y configuración:

| Sección | Items | Propósito |
|---------|-------|-----------|
| **Supervisión** | TMR, Ejecutivo, Alertas | Ver estado general |
| **Gestión** | Equipos, Colaboradores, Clientes | Administrar recursos |
| **Configuración** | Configuración, Entregables, Procesos | Setup del sistema |

**Excluir de ADMIN:** Mi Día, Mi Equipo, Validaciones, Seguimientos, Auditorías (son operativos)

### COLABORADOR - Implementación (~85%)

| Funcionalidad | Estado | Archivo |
|---------------|--------|---------|
| Mi Día con priorización | ✅ | `mi-dia/page.tsx` |
| Acciones rápidas inline | ✅ | `mi-dia/page.tsx` |
| Agrupación por urgencia | ✅ | `mi-dia/page.tsx` |
| KPIs de urgencia | ✅ | `mi-dia/page.tsx` |
| Cards simplificadas | ✅ | `mi-dia/page.tsx` |
| Calendario | ✅ | `calendario/page.tsx` |
| Clientes | ✅ | `cliente/ClientePage.tsx` |

**Faltante (15%):**
| Funcionalidad | Estado | Prioridad |
|---------------|--------|-----------|
| Toggle agrupación urgencia/cliente | ❌ Pendiente | MEDIA |
| Búsqueda rápida por RFC/Cliente | ❌ Pendiente | MEDIA |

### LÍDER - Implementación (~95%)

| Funcionalidad | Estado | Archivo | Líneas |
|---------------|--------|---------|--------|
| **Mi Equipo (NUEVO)** | ✅ | `equipo/page.tsx` | 699 |
| **Validaciones (NUEVO)** | ✅ | `validaciones/page.tsx` | 781 |
| **Seguimientos (NUEVO)** | ✅ | `seguimientos/page.tsx` | 853 |
| Carga por colaborador | ✅ | `CargaEquipo.tsx` | - |
| Reasignación de tareas | ✅ | `ReasignarModal.tsx` | - |
| Alertas | ✅ | Sidebar incluye `/alertas` | - |

### SOCIO - Implementación (~90%)

| Funcionalidad | Estado | Archivo | Líneas |
|---------------|--------|---------|--------|
| TMR (Dashboard original) | ✅ | `page.tsx` | 110 cambios |
| **TMR 2.0 Centro Control (NUEVO)** | ✅ | `tmr/page.tsx` | 1179 |
| **Seguimientos Global (NUEVO)** | ✅ | `seguimientos-global/page.tsx` | 1071 |
| Ejecutivo | ✅ | `ejecutivo/page.tsx` | - |
| Análisis | ✅ | `analisis/page.tsx` | 34 cambios |
| Configuración | ✅ | Solo SOCIO/ADMIN | - |

### AUDITOR - Implementación (~90%)

| Funcionalidad | Estado | Archivo | Líneas |
|---------------|--------|---------|--------|
| Panel Auditorías | ✅ | `auditor/page.tsx` | 865 cambios |
| **Selección Auditorías (NUEVO)** | ✅ | `auditor/seleccion/page.tsx` | 794 |
| **Detalle Auditoría (NUEVO)** | ✅ | `auditor/[auditoriaId]/page.tsx` | 929 |

### TESTING - Estado

| Aspecto | Estado |
|---------|--------|
| **Playwright configurado** | ✅ |
| `playwright.config.ts` | ✅ Existe |
| `.github/workflows/playwright.yml` | ✅ CI/CD configurado |
| Plan de pruebas | ✅ `PLAN_PRUEBAS_INTEGRALES.md` |
| Tests unitarios (Vitest) | ❌ No configurado |
| Cobertura | ❌ No medida |

### Componentes Comunes Creados

| Componente | Archivo | Líneas |
|------------|---------|--------|
| KPICard | `common/KPICard.tsx` | 210 |
| StatusBadge | `common/StatusBadge.tsx` | 192 |
| TrendIndicator | `common/TrendIndicator.tsx` | 131 |

---

## Plan de Implementación (Actualizado)

### Prerrequisito: Merge de rama consolidada

**Acción requerida:** Hacer merge de `claude/consolidated-fixes-6Ksdb` a main después de validaciones.

**Cambios incluidos en esa rama:**
- ✅ Sidebar dinámico por rol
- ✅ Hook useUserRole
- ✅ Vista Mi Equipo (`/dashboard/equipo`)
- ✅ Vista Validaciones (`/dashboard/validaciones`)
- ✅ Vista Seguimientos (`/dashboard/seguimientos`)
- ✅ Vista Seguimientos Global (`/dashboard/seguimientos-global`)
- ✅ TMR 2.0 Centro de Control (`/dashboard/tmr`)
- ✅ Mejoras Auditor (selección, detalle)
- ✅ Componentes comunes (KPICard, StatusBadge, TrendIndicator)
- ✅ Playwright configurado

---

### Fase 1: Corrección de Bugs Críticos (PRIORITARIO)

**Objetivo:** Corregir bugs identificados antes del merge

#### 1.1 BUG-001: Tareas vencidas en CORRIENTE
**Archivo:** `src/app/dashboard/mi-dia/page.tsx`
**Cambio:** Modificar lógica de agrupación
```typescript
// Actual: tareas vencidas van a CORRIENTE si son del mes actual
// Fix: tareas vencidas SIEMPRE van a URGENTE
const esVencida = calcularDiasRestantes(tarea.fecha_limite) < 0
if (esVencida) {
  // Mover a sección URGENTE, no CORRIENTE
}
```

#### 1.2 BUG-002: Error al cargar detalle de tarea
**Archivo:** `src/app/dashboard/mi-dia/page.tsx`
**Investigar:**
- Query de detalle de tarea
- Permisos RLS en tabla tarea
- Manejo de errores en modal

#### 1.3 BUG-003: Panel de Control - Desglose por colaborador
**Archivo:** `src/app/dashboard/tmr/page.tsx`
**Cambio:** Sección "Rendimiento por Equipo" → "Rendimiento por Colaborador"
- Agrupar tareas por `responsable_usuario_id`
- Mostrar métricas individuales: en proceso, completado, vencido
- Eliminar duplicación de totales

#### 1.4 BUG-004: Evidencias solo URLs
**Archivos:** Componentes de evidencia
**Cambio:**
- Reemplazar file upload por input de URL
- Validar que sea URL válida
- Al ver evidencia: `window.open(url, '_blank')`

---

### Fase 1.5: Mejoras Pendientes

#### MEJORA-001: Vista Seguimientos ADMIN/SOCIO (Solo lectura)
**Archivo:** `src/components/layout/Sidebar.tsx`
**Cambio:**
- Agregar "Seguimientos" a navegación de ADMIN y SOCIO
- Usar `seguimientos-global/page.tsx` pero sin botones de crear/editar
- O crear vista específica `/dashboard/seguimientos-resumen`

---

### Fase 2: Validación Pre-Merge

**Objetivo:** Verificar que todo funciona antes del merge

#### 2.1 Tests E2E con Playwright
```bash
npx playwright test
```

#### 2.2 Tests Manuales de Regresión
| Flujo | Usuario | Pasos | Validación |
|-------|---------|-------|------------|
| Mi Día - Vencidas | LIDER | Ver Mi Día | Vencidas en URGENTE, no CORRIENTE |
| Mi Día - Detalle | LIDER | Clic en ojito | Modal carga sin error |
| Panel Control | LIDER | Ver TMR | Desglose POR COLABORADOR |
| Evidencia | COLABORADOR | Subir evidencia | Solo pide URL |
| Seguimientos | SOCIO | Ver seguimientos | Vista informativa |

---

### Fase 2: Tests Unitarios (Post-Merge)

**Objetivo:** Agregar cobertura de tests unitarios con Vitest

#### 2.1 Configurar Vitest
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

**Archivos a crear:**
- `vitest.config.ts`
- `src/test/setup.ts`

#### 2.2 Tests Prioritarios
```
src/__tests__/
├── engine/
│   ├── taskGenerator.test.ts      # Motor de tareas
│   ├── riskDetector.test.ts       # Detección de riesgo
│   └── autoReassign.test.ts       # Reasignación automática
├── hooks/
│   └── useUserRole.test.ts        # Permisos por rol
└── components/
    └── Sidebar.test.tsx           # Navegación dinámica
```

---

### Fase 3: Ajustes Menores (Opcional)

Si durante validación se identifican issues:

#### 3.1 Ajustes ADMIN ⭐ RECOMENDADO
**Cambio propuesto:** Modificar navegación de ADMIN para enfocarse en supervisión/configuración

**Archivo:** `src/components/layout/Sidebar.tsx`

**Cambios en `allNavigation`:**
```typescript
// Quitar ADMIN de estos items (son operativos):
- Mi Día: roles: ['COLABORADOR', 'LIDER', 'SOCIO'] // quitar 'ADMIN'
- Mi Equipo: roles: ['LIDER', 'SOCIO'] // quitar 'ADMIN'
- Validaciones: roles: ['LIDER', 'SOCIO'] // quitar 'ADMIN'
- Seguimientos: roles: ['LIDER', 'SOCIO'] // quitar 'ADMIN'
- Auditorías: roles: ['AUDITOR', 'SOCIO'] // quitar 'ADMIN'

// ADMIN mantiene:
- TMR (supervisión)
- Ejecutivo (supervisión)
- Alertas (supervisión)
- Equipos (gestión)
- Colaboradores (gestión)
- Clientes (gestión)
- Configuración (setup)
- Entregables (setup)
- Procesos (setup)
```

#### 3.2 Mejoras adicionales Mi Día
- Toggle agrupación (urgencia/cliente) - si no está
- Búsqueda rápida por RFC/Cliente - si no está

#### 3.3 Mejoras UX Menores
- Revisar consistencia de componentes entre vistas
- Verificar que los componentes comunes se usen en todas las vistas

---

## Verificación y Tests

### Tests E2E (Playwright - Ya configurado)

**Ejecutar:**
```bash
npx playwright test
```

**Escenarios clave a validar:**

| # | Rol | Escenario | Resultado Esperado |
|---|-----|-----------|-------------------|
| 1 | COLABORADOR | Login → Ver sidebar | Solo: Mi Día, Calendario, Clientes |
| 2 | COLABORADOR | Ir a `/dashboard` | Redirige a `/dashboard/mi-dia` |
| 3 | LIDER | Login → Ver sidebar | Mi Equipo, Mi Día, Validaciones, Seguimientos, Calendario, Clientes, Alertas |
| 4 | LIDER | Ir a `/dashboard` | Redirige a `/dashboard/equipo` |
| 5 | LIDER | Mi Equipo → Ver carga | Muestra barras de carga por colaborador |
| 6 | LIDER | Validaciones → Aprobar | Tarea cambia estado, evento registrado |
| 7 | LIDER | Seguimientos → Crear | Seguimiento aparece en lista |
| 8 | SOCIO | Login → Ver sidebar | Todos los items de gestión + Configuración |
| 9 | SOCIO | TMR 2.0 → Ver métricas | KPIs consolidados de todos los equipos |
| 10 | SOCIO | Seguimientos Global | Ve seguimientos de todos los equipos |
| 11 | AUDITOR | Login → Ver sidebar | Auditorías, TMR, Clientes, Calendario |
| 12 | AUDITOR | Selección → Auditar | Puede aprobar/rechazar con hallazgos |
| 13 | ADMIN | Login → Ver sidebar | Todo + Entregables, Procesos |

### Tests Unitarios (A implementar post-merge)

```
src/__tests__/
├── engine/
│   ├── taskGenerator.test.ts      # Motor de tareas
│   ├── riskDetector.test.ts       # Detección de riesgo
│   └── autoReassign.test.ts       # Reasignación automática
├── hooks/
│   └── useUserRole.test.ts        # Permisos por rol
└── components/
    └── Sidebar.test.tsx           # Navegación dinámica
```

### Tests Específicos para Bugs Corregidos

| Bug | Test | Validación |
|-----|------|------------|
| BUG-001 | `mi-dia.test.ts` | Tareas vencidas NO aparecen en sección CORRIENTE |
| BUG-002 | `tarea-detalle.test.ts` | Modal detalle carga correctamente |
| BUG-003 | `panel-control.test.ts` | Desglose muestra datos POR COLABORADOR |
| BUG-004 | `evidencias.test.ts` | Solo se guarda URL, no archivo |

### Tests Manuales de Regresión (Actualizados)

| # | Flujo | Pasos | Resultado Esperado |
|---|-------|-------|-------------------|
| 1 | Mi Día - Agrupación | Ver tareas vencidas | Aparecen en "URGENTE", NO en "CORRIENTE" |
| 2 | Mi Día - Detalle | Clic en ojito (👁) | Modal muestra datos de la tarea |
| 3 | Panel Control | Ver "Rendimiento" | Muestra desglose POR COLABORADOR |
| 4 | Evidencia | Subir evidencia | Solo pide URL, no archivo |
| 5 | SOCIO - Seguimientos | Ver seguimientos | Vista informativa (solo lectura) |

---

## Archivos Críticos (Rama consolidated-fixes)

### Ya Implementados ✅

| Archivo | Descripción | Líneas |
|---------|-------------|--------|
| `src/components/layout/Sidebar.tsx` | Navegación dinámica por rol | ~250 |
| `src/lib/hooks/useUserRole.ts` | Hook de permisos | ~50 |
| `src/app/dashboard/equipo/page.tsx` | Vista Mi Equipo | 699 |
| `src/app/dashboard/validaciones/page.tsx` | Cola de Validaciones | 781 |
| `src/app/dashboard/seguimientos/page.tsx` | Seguimientos LIDER | 853 |
| `src/app/dashboard/seguimientos-global/page.tsx` | Seguimientos SOCIO | 1071 |
| `src/app/dashboard/tmr/page.tsx` | TMR 2.0 Centro Control | 1179 |
| `src/app/dashboard/auditor/seleccion/page.tsx` | Selección Auditorías | 794 |
| `src/app/dashboard/auditor/[auditoriaId]/page.tsx` | Detalle Auditoría | 929 |
| `src/components/common/KPICard.tsx` | Componente reutilizable | 210 |
| `src/components/common/StatusBadge.tsx` | Badge de estados | 192 |
| `playwright.config.ts` | Config E2E tests | 24 |

### A Crear (Post-merge)

| Archivo | Descripción |
|---------|-------------|
| `vitest.config.ts` | Configuración tests unitarios |
| `src/__tests__/**` | Tests unitarios |

---

## Resumen de Prioridades (Actualizado)

1. **ACTUAL:** Validar rama `consolidated-fixes` con tests manuales y Playwright
2. **POST-MERGE:** Configurar Vitest y agregar tests unitarios
3. **OPCIONAL:** Ajustes menores según feedback de validación

---

## Próximos Pasos Inmediatos

1. ✅ Revisar estado real del código (HECHO)
2. ✅ Revisión profunda de la rama (HECHO)
3. ⏳ **CORREGIR BUGS CRÍTICOS:**
   - BUG-001: Tareas vencidas en sección CORRIENTE
   - BUG-002: Error al cargar detalle de tarea
   - BUG-003: Panel de Control - desglose por colaborador
   - BUG-004: Evidencias solo URLs (no archivos)
4. ⏳ **MEJORAS:**
   - MEJORA-001: Vista seguimientos informativa ADMIN/SOCIO
   - Ajustar navegación ADMIN
5. ⏳ Ejecutar tests Playwright
6. ⏳ Hacer merge a main cuando todo pase
7. ⏳ Configurar tests unitarios con Vitest

---

## Revisión Profunda (Fase 1.0) - RESULTADOS

### ✅ Archivos Revisados

| Archivo | Estado | Observaciones |
|---------|--------|---------------|
| `equipo/page.tsx` | ✅ OK | KPIs correctos, carga por miembro, reasignación funcional |
| `validaciones/page.tsx` | ✅ OK | Modal detalle, aprobar/rechazar, evidencias, motivo rechazo |
| `seguimientos/page.tsx` | ✅ OK | CRUD completo, categorías (PAGO, TRAMITE, etc.), prioridades |
| `seguimientos-global/page.tsx` | ✅ OK | Vista SOCIO, estadísticas por equipo, alertas, modal detalle |
| `tmr/page.tsx` | ✅ OK | VIEW v_tarea_completa, fallback, 3 modos vista, filtros múltiples |
| `useUserRole.ts` | ✅ OK | Permisos derivados, listener auth, bien tipado |
| `enums.ts` | ✅ OK | Enums centralizados, documentados, sincronizados con BD |

### Hallazgos Positivos

1. **Arquitectura consistente:** Todos los archivos siguen el mismo patrón
   - `useUserRole` para permisos
   - `KPICard` y `StatusBadge` componentes reutilizables
   - Modales para acciones detalladas

2. **Enums centralizados:** `src/lib/constants/enums.ts`
   - EstadoTarea, Prioridad, NivelRiesgo
   - RolGlobal, RolEnEquipo
   - TipoEvento

3. **Utilidades de fecha:** `src/lib/utils/dateCalculations.ts`
   - `calcularDiasRestantes`, `formatearFecha`, `diferenciaEnDias`

4. **TMR 2.0 optimizado:**
   - Usa VIEW `v_tarea_completa` para performance
   - Fallback a queries normales si VIEW no existe
   - 3 modos: resumen, detalle, crítico

---

## 🔄 FILTROS DINÁMICOS/CASCADA (NUEVO)

### Requerimiento Confirmado
Los filtros deben ser **CASCADA/DINÁMICOS** en todas las vistas con filtros múltiples.

### Comportamiento Esperado

| Acción | Resultado |
|--------|-----------|
| Selecciono **Equipo** | Colaborador muestra SOLO miembros de ese equipo, Cliente muestra SOLO clientes de ese equipo |
| Selecciono **Colaborador** | Cliente muestra SOLO los que atiende ese colaborador |
| Selecciono **Cliente** | Colaborador muestra SOLO quien lo atiende |

### Consideración Importante
**Algunas vistas ya vienen PRE-FILTRADAS por rol:**
- LIDER: Solo ve su equipo (no puede ver otros equipos)
- COLABORADOR: Solo ve sus tareas
- El cascada aplica DENTRO de ese contexto prefiltrado

### Vistas Afectadas
- `equipo/page.tsx` - Filtros: Miembro, Estado
- `tmr/page.tsx` - Filtros: Equipo, Estado, Responsable, Periodo
- `validaciones/page.tsx` - Revisar filtros existentes
- `seguimientos-global/page.tsx` - Filtros: Equipo, Categoría, Prioridad, Estado

### Implementación Propuesta
```typescript
// Hook o utilidad para filtros cascada
function useCascadeFilters(tareas, filtros) {
  // 1. Aplicar filtro principal
  // 2. Recalcular opciones de filtros secundarios basado en datos filtrados
  // 3. Retornar opciones actualizadas para cada select
}
```

---

## 🔍 BUG-002 RESUELTO: Error Detalle de Tarea

### ✅ CAUSA IDENTIFICADA
**Falta FK en tabla `tarea` para `responsable_usuario_id`**

El query del modal usa:
```typescript
responsable:users!responsable_usuario_id(nombre, email)
```

Supabase necesita la FK para resolver el JOIN automáticamente.

### ✅ SOLUCIÓN: Aplicar migración existente
**Archivo:** `supabase/migrations/20260120_fix_tarea_fk_responsable.sql`

Esta migración:
1. Agrega FK `tarea_responsable_usuario_id_fkey` → `users(user_id)`
2. Agrega FK `tarea_revisor_usuario_id_fkey` → `users(user_id)`
3. Crea índice `idx_tarea_revisor` para performance

### Acción Requerida
```bash
# Aplicar migración a producción (Supabase)
supabase db push
# O ejecutar SQL directamente en Supabase Dashboard
```

---

### BUG-001: Tareas vencidas aparecen en sección "CORRIENTE"
**Ubicación:** `/dashboard/mi-dia`
**Problema:** Tareas con "VENCIDA (4d)", "VENCIDA (2d)" aparecen en sección "CORRIENTE (Tareas del mes actual)" cuando deberían estar en "URGENTE: EN CONCLUSIÓN"
**Archivo:** `src/app/dashboard/mi-dia/page.tsx`
**Fix:** Revisar lógica de agrupación - tareas vencidas deben ir a sección URGENTE, no CORRIENTE

### BUG-002: Error al cargar detalle de tarea
**Ubicación:** `/dashboard/mi-dia` → clic en ojito (👁)
**Problema:** Modal muestra "Error al cargar los datos de la tarea"
**Archivo:** `src/app/dashboard/mi-dia/page.tsx` (función de detalle)
**Fix:** Revisar query de detalle de tarea, verificar permisos RLS

### BUG-003: Panel de Control - KPIs duplicados
**Ubicación:** `/dashboard/tmr` (Panel de Control)
**Problema:** Los mismos números aparecen arriba (cards) y abajo (Rendimiento por Equipo)
**Solución propuesta:** Abajo mostrar desglose **POR COLABORADOR**:
- Cada colaborador con sus métricas individuales
- En proceso, Terminado, Vencido por persona
- NO repetir totales del equipo

### BUG-004: Evidencias - Subir archivos vs URLs
**Problema actual:** El sistema intenta subir archivos
**Requerimiento:** Solo guardar URL/link a SharePoint/OneDrive
**Comportamiento esperado:**
1. Usuario hace clic en "Subir Evidencia"
2. Se abre input para pegar URL
3. Al guardar, solo se almacena la URL
4. Al ver evidencia, se abre el link en nueva pestaña

---

## 📋 MEJORAS PENDIENTES

### MEJORA-001: Vista Seguimientos para ADMIN/SOCIO (Informativa)
**Problema:** ADMIN y SOCIO no ven seguimientos
**Requerimiento:** Agregar vista de seguimientos pero **SOLO LECTURA**:
- Ver pendientes abiertos
- Ver cerrados
- NO pueden crear/editar (eso es operativo del LIDER)
- Solo informativo para saber qué está en proceso

### MEJORA-002: Toggle agrupación Mi Día
**Archivo:** `src/app/dashboard/mi-dia/page.tsx`
**Funcionalidad:** Permitir alternar entre:
- Agrupación por URGENCIA (actual)
- Agrupación por CLIENTE

### MEJORA-003: Búsqueda rápida Mi Día
**Archivo:** `src/app/dashboard/mi-dia/page.tsx`
**Funcionalidad:** Campo de búsqueda para filtrar por RFC o nombre de cliente

---

## ✅ CONFIRMACIONES

- **Reasignación LIDER:** ✅ Ya funciona correctamente en Mi Equipo (botón "Reasignar" en cada tarea)

---

## 📋 PLAN ACTUAL: Integrar useCascadeFilters en equipo/page.tsx

### Análisis del Archivo

La página `equipo/page.tsx` tiene 2 filtros simples:
- `filtroMiembro` (línea 69): Filtra por colaborador del equipo
- `filtroEstado` (línea 70): Filtra por estado de tarea

**Diferencia con TMR:** Esta página NO necesita filtro de equipo porque ya está limitada al equipo del usuario actual.

### Cambios a Realizar

#### 1. Importar el hook (línea 3)
```typescript
import { useCascadeFilters, CascadeFilterConfig } from '@/lib/hooks/useCascadeFilters'
```

#### 2. Crear config para TeamTask (después de línea 80)
```typescript
const cascadeConfig: CascadeFilterConfig<TeamTask> = useMemo(() => ({
  getEquipo: () => teamId,
  getEquipoLabel: () => teamName,
  getColaborador: (t) => t.responsable?.user_id || null,
  getColaboradorLabel: (t) => t.responsable?.nombre || null,
  getCliente: () => null, // No filtrar por cliente aquí
  getClienteLabel: () => null,
  getEstado: (t) => t.estado,
  getEstadoLabel: (t) => ESTADO_TAREA_CONFIG[t.estado as EstadoTarea]?.label || t.estado
}), [teamId, teamName])
```

#### 3. Usar el hook (reemplazar estados líneas 69-70)
```typescript
const {
  filters: cascadeFilters,
  setFilter: setCascadeFilter,
  resetFilters: resetCascadeFilters,
  options: cascadeOptions,
  filteredData: tareasPorCascada
} = useCascadeFilters(tareas, cascadeConfig)
```

#### 4. Actualizar tareasFiltradas (línea 221)
```typescript
const tareasFiltradas = useMemo(() => {
  return tareasPorCascada.filter(t => {
    // Solo mostrar tareas activas
    const isActive = !['cerrado', 'pagado'].includes(t.estado)
    return isActive
  })
}, [tareasPorCascada])
```

#### 5. Actualizar dropdowns (líneas 520-542)
```typescript
<select
  value={cascadeFilters.colaborador}
  onChange={(e) => setCascadeFilter('colaborador', e.target.value)}
  ...
>
  <option value="all">Todos los miembros</option>
  {cascadeOptions.colaboradores.map(m => (
    <option key={m.value} value={m.value}>{m.label}</option>
  ))}
</select>

<select
  value={cascadeFilters.estado}
  onChange={(e) => setCascadeFilter('estado', e.target.value)}
  ...
>
  <option value="all">Todos los estados</option>
  {cascadeOptions.estados.map(e => (
    <option key={e.value} value={e.value}>{e.label}</option>
  ))}
</select>
```

#### 6. Actualizar click en miembro (línea 399-401)
```typescript
onClick={() => setCascadeFilter('colaborador',
  cascadeFilters.colaborador === miembro.user_id ? 'all' : miembro.user_id
)}
```

#### 7. Actualizar botón "Ver bloqueadas" (línea 643)
```typescript
onClick={() => setCascadeFilter('estado', 'bloqueado_cliente')}
```

### Archivos a Modificar
- `src/app/dashboard/equipo/page.tsx`

### Verificación
1. `npx tsc --noEmit` - Sin errores TypeScript
2. Probar en navegador:
   - Seleccionar miembro → Estados muestran solo los de ese miembro
   - Click en barra de miembro → Filtra correctamente
   - Botón "Ver bloqueadas" → Filtra por estado bloqueado

---

## 🔴 FIX CRÍTICO: RLS - Edición de Usuarios No Funciona

### Problema Identificado
Los usuarios ADMIN no pueden editar el `rol_global` ni desactivar otros usuarios. La operación parece exitosa pero no persiste.

### Investigación Completa (Enero 2026)

#### Diagnóstico con Network DevTools
- Request: `PATCH /rest/v1/users?user_id=eq.xxx`
- Status: `204 No Content`
- **Content-Range: `*/*`** ← Indica **0 filas afectadas**

Esto confirma que **RLS está bloqueando silenciosamente** (no lanza error, simplemente no actualiza).

#### Componentes Involucrados

1. **Función `is_admin_or_socio()`** - Verifica si usuario es ADMIN/SOCIO
2. **Trigger `protect_user_fields`** - Protege campos sensibles (rol_global, activo)
3. **Políticas RLS en `users`**:
   - `admin_socio_all_users`: FOR ALL USING (is_admin_or_socio())
   - `users_view_authenticated`: FOR SELECT USING (auth.uid() IS NOT NULL)
   - `users_update_own`: FOR UPDATE USING (user_id = auth.uid())

#### Estado Actual de la Función (CORREGIDO)
```sql
-- Ya se aplicó SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin_or_socio()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE user_id = auth.uid()
    AND rol_global IN ('ADMIN', 'SOCIO')
  );
$function$
```

#### Estado Actual del Trigger
```sql
CREATE TRIGGER protect_user_fields
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION protect_user_sensitive_fields()

-- Función del trigger:
CREATE OR REPLACE FUNCTION public.protect_user_sensitive_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF OLD.rol_global IS DISTINCT FROM NEW.rol_global THEN
    IF NOT is_admin_or_socio() THEN
      RAISE EXCEPTION 'No autorizado para cambiar rol_global';
    END IF;
  END IF;

  IF OLD.activo IS DISTINCT FROM NEW.activo THEN
    IF NOT is_admin_or_socio() THEN
      RAISE EXCEPTION 'No autorizado para cambiar estado activo';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
```

### Problema Confirmado

El UPDATE desde la aplicación retorna `204` con `Content-Range: */*` (0 filas), lo que significa:
1. **RLS bloquea ANTES de que el trigger se ejecute**
2. La política `admin_socio_all_users` depende de `is_admin_or_socio()`
3. Aunque la función tiene SECURITY DEFINER, hay un problema de contexto con RLS

### Solución Recomendada: API con Service Role + Ajuste Trigger

#### Paso 1: Modificar Trigger para Permitir Service Role

```sql
CREATE OR REPLACE FUNCTION protect_user_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no hay sesión auth (service_role desde API), permitir
  -- La verificación de permisos ya se hizo en la capa de aplicación
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD.rol_global IS DISTINCT FROM NEW.rol_global THEN
    IF NOT is_admin_or_socio() THEN
      RAISE EXCEPTION 'No autorizado para cambiar rol_global';
    END IF;
  END IF;

  IF OLD.activo IS DISTINCT FROM NEW.activo THEN
    IF NOT is_admin_or_socio() THEN
      RAISE EXCEPTION 'No autorizado para cambiar estado activo';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Paso 2: Crear API `/api/admin/update-user/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    try {
        const { user_id, nombre, rol_global, activo, equipo_id, rol_en_equipo } = await req.json()

        if (!user_id) {
            return NextResponse.json({ success: false, error: 'user_id requerido' }, { status: 400 })
        }

        // Usar service role para bypass RLS
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // VERIFICACIÓN DE SEGURIDAD: Solo ADMIN/SOCIO puede modificar usuarios
        const supabaseAuth = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => req.cookies.getAll() } }
        )

        const { data: { user: currentUser }, error: authCheckError } = await supabaseAuth.auth.getUser()

        if (authCheckError || !currentUser) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
        }

        // Consultar rol del usuario actual
        const { data: dbUser, error: dbError } = await supabaseAdmin
            .from('users')
            .select('rol_global')
            .eq('user_id', currentUser.id)
            .single()

        if (dbError || !dbUser || !['ADMIN', 'SOCIO'].includes(dbUser.rol_global)) {
            return NextResponse.json({ success: false, error: 'Permisos insuficientes. Se requiere rol ADMIN o SOCIO.' }, { status: 403 })
        }

        // Construir objeto de actualización
        const updateData: Record<string, unknown> = {}
        if (nombre !== undefined) updateData.nombre = nombre
        if (rol_global !== undefined) updateData.rol_global = rol_global
        if (activo !== undefined) updateData.activo = activo

        // Actualizar usuario
        const { data: updatedUser, error: updateError } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('user_id', user_id)
            .select()
            .single()

        if (updateError) {
            return NextResponse.json({ success: false, error: updateError.message }, { status: 400 })
        }

        // Actualizar equipo si se especificó
        if (equipo_id !== undefined) {
            await supabaseAdmin.from('team_members').delete().eq('user_id', user_id)
            if (equipo_id) {
                await supabaseAdmin.from('team_members').insert({
                    team_id: equipo_id,
                    user_id: user_id,
                    rol_en_equipo: rol_en_equipo || 'AUXILIAR_C',
                    activo: true
                })
            }
        }

        return NextResponse.json({
            success: true,
            user: updatedUser,
            mensaje: activo === false ? 'Usuario desactivado correctamente' : 'Usuario actualizado correctamente'
        })

    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
    }
}
```

#### Paso 3: Actualizar TabColaboradores.tsx

Cambiar las funciones `saveUser` y `confirmDeleteUser` para usar la API:

```typescript
// En saveUser (cuando editing):
const res = await fetch('/api/admin/update-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        user_id: editingUser.user_id,
        nombre: userForm.nombre,
        rol_global: userForm.rol_global,
        equipo_id: userForm.equipo_id || undefined,
        rol_en_equipo: userForm.rol_en_equipo || undefined
    })
})

// En confirmDeleteUser:
const res = await fetch('/api/admin/update-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: id, activo: false })
})
```

### Verificación Post-Fix

1. Aplicar SQL del trigger modificado
2. Crear archivo `/api/admin/update-user/route.ts`
3. Actualizar `TabColaboradores.tsx`
4. Probar:
   - Cambiar rol_global de un usuario → Debe persistir
   - Desactivar un usuario → Debe desaparecer de la lista

---

## 🔴 FIX URGENTE: Seguridad TMR - Redirigir LIDER

### Problema (PR Review Comment)
El código actual en `src/app/dashboard/page.tsx` solo redirige a COLABORADOR:
```typescript
if (!isRoleLoading && rol === 'COLABORADOR') {
    router.replace('/dashboard/mi-dia')
}
```

Pero TMR solo debe ser accesible para SOCIO, ADMIN, AUDITOR.
Un LIDER puede acceder directamente vía URL y ver datos que no debería.

### Fix Requerido

**Archivo:** `src/app/dashboard/page.tsx` (líneas 50-55)

**Código actual:**
```typescript
useEffect(() => {
    // Redirect COLABORADOR to Mi Dia - TMR is only for SOCIO, ADMIN, AUDITOR
    if (!isRoleLoading && rol === 'COLABORADOR') {
        router.replace('/dashboard/mi-dia')
    }
}, [rol, isRoleLoading, router])
```

**Código corregido:**
```typescript
useEffect(() => {
    // Redirect non-allowed roles - TMR is only for SOCIO, ADMIN, AUDITOR
    if (!isRoleLoading && rol) {
        const tmrAllowedRoles = ['SOCIO', 'ADMIN', 'AUDITOR']
        if (!tmrAllowedRoles.includes(rol)) {
            const homePages: Record<string, string> = {
                'COLABORADOR': '/dashboard/mi-dia',
                'LIDER': '/dashboard/equipo',
            }
            router.replace(homePages[rol] || '/dashboard/mi-dia')
        }
    }
}, [rol, isRoleLoading, router])
```

**También actualizar el loading check (línea 403):**
```typescript
// Actual:
if (isRoleLoading || rol === 'COLABORADOR') {

// Corregido:
if (isRoleLoading || (rol && !['SOCIO', 'ADMIN', 'AUDITOR'].includes(rol))) {
```

### Impacto
- Resuelve el comentario de seguridad del PR
- Los tests E2E de LIDER deberían pasar porque LIDER será redirigido correctamente

---

## 📌 RESUMEN PARA CONTINUAR (Próxima Sesión)

### Estado Actual (24 Enero 2026)

**Rama activa:** `claude/review-project-planning-vxPKt`

**Commits recientes:**
- `1882291` feat: add alertas page + fix INP issue in TabColaboradores
- `e157a7d` Merge PR #44

### ✅ Completado Esta Sesión

1. **Página Alertas** - Copiada de rama de tests, ahora en main
2. **Fix INP** - Reemplazado `confirm()` bloqueante con modal async en TabColaboradores
3. **Investigación RLS** - Diagnosticado problema completo de edición de usuarios

### 🔴 Pendiente Crítico: Edición de Usuarios

**Problema:** ADMIN no puede cambiar `rol_global` ni desactivar usuarios

**Diagnóstico completado:**
- Network muestra `204` con `Content-Range: */*` = 0 filas afectadas
- RLS bloquea silenciosamente antes del trigger
- `is_admin_or_socio()` ya tiene SECURITY DEFINER pero no es suficiente

**Solución validada (3 pasos):**

#### Paso 1: SQL - Modificar trigger
```sql
CREATE OR REPLACE FUNCTION protect_user_sensitive_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Permitir service_role (verificación ya hecha en API)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF OLD.rol_global IS DISTINCT FROM NEW.rol_global THEN
    IF NOT is_admin_or_socio() THEN
      RAISE EXCEPTION 'No autorizado para cambiar rol_global';
    END IF;
  END IF;

  IF OLD.activo IS DISTINCT FROM NEW.activo THEN
    IF NOT is_admin_or_socio() THEN
      RAISE EXCEPTION 'No autorizado para cambiar estado activo';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Paso 2: Crear archivo `/src/app/api/admin/update-user/route.ts`
(Ver código completo arriba en sección "FIX CRÍTICO")

#### Paso 3: Actualizar `TabColaboradores.tsx`
- `saveUser()` → usar fetch a `/api/admin/update-user`
- `confirmDeleteUser()` → usar fetch a `/api/admin/update-user`

### Archivos a Modificar

| Archivo | Acción |
|---------|--------|
| SQL en Supabase | Aplicar trigger modificado |
| `src/app/api/admin/update-user/route.ts` | CREAR |
| `src/components/config/TabColaboradores.tsx` | MODIFICAR funciones saveUser y confirmDeleteUser |

### Orden de Ejecución

1. Aplicar SQL del trigger en Supabase Dashboard
2. Crear `/api/admin/update-user/route.ts`
3. Modificar `TabColaboradores.tsx`
4. Probar en UI
5. Commit y push si funciona

### Notas Importantes

- **NO revertir** el SECURITY DEFINER de `is_admin_or_socio()` - ya está aplicado y es necesario
- El trigger protege accesos directos a BD pero permite API con service_role
- La API verifica permisos en TypeScript antes de usar service_role
