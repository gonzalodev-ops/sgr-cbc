# SGR-CBC: Mejoras UX/UI por Rol

## Resumen Ejecutivo

Este documento analiza la experiencia de usuario actual del sistema SGR-CBC desde la perspectiva de cada rol, identificando problemas y proponiendo mejoras concretas para hacer la interfaz mas intuitiva, ordenada y simple.

**Fecha:** Enero 2026
**Enfoque:** Desktop-first
**Prioridad:** Colaborador > Lider > Socio/Admin

---

## Analisis del Estado Actual

### Navegacion Actual (Sidebar)
Ubicacion: `src/components/layout/Sidebar.tsx`

```
TMR
Mi Dia
Ejecutivo
Colaboradores
Tribus
Clientes
Entregables
Calendario
Auditor
Procesos
Analisis
---
Configuracion
```

**Problema Principal:** Los 11 items de navegacion se muestran a TODOS los usuarios, independientemente de su rol. Esto causa:
- Confusion: Un colaborador no necesita ver "Ejecutivo" o "Auditor"
- Sobrecarga cognitiva: Demasiadas opciones
- Riesgo de seguridad: Configuracion accesible a todos

### Sistema de Permisos Actual
Ubicacion: `src/middleware.ts`

**Estado:** Solo valida sesion activa, NO valida roles.

```typescript
// Actual - Solo verifica sesion
export async function middleware(request: NextRequest) {
    return await updateSession(request)
}
```

**Riesgo:** Cualquier usuario puede acceder a `/dashboard/configuracion`

---

## Perspectiva del COLABORADOR

### Perfil
- Ejecuta tareas fiscales diarias
- Necesita saber QUE hacer y CUANDO
- Trabaja con clientes asignados
- Reporta a un lider de tribu

### Problemas Identificados

| Problema | Ubicacion | Impacto |
|----------|-----------|---------|
| Demasiadas opciones en sidebar | Sidebar.tsx:23-35 | Confusion, perdida de tiempo |
| TMR muy complejo para sus necesidades | dashboard/page.tsx | Abrumador, no usa la mayoria |
| Dos vistas similares (Colaborador vs Mi Dia) | Duplicacion | Cual usar? |
| No puede ver solo sus clientes | cliente/page.tsx | Ve todo sin filtro |

### Propuesta de Mejora

**Nueva Navegacion para Colaborador:**
```
Mi Dia ← INICIO (agenda priorizada)
Mi Agenda ← vista completa de tareas
Mis Clientes ← clientes filtrados automaticamente
Calendario
```

**Mejoras a "Mi Dia"** (`src/app/dashboard/mi-dia/page.tsx`):

1. **Acciones Rapidas en Linea**
   - Boton "Iniciar" visible sin scroll
   - Boton "Subir Evidencia" directo
   - Marcar completado con un click

2. **Agrupacion Opcional por Cliente**
   ```
   [Toggle: Por Urgencia | Por Cliente]

   CLIENTE ABC:
   ├── ISR Mensual (Hoy)
   ├── DIOT (3 dias)
   └── IVA (5 dias)
   ```

3. **Indicadores de Tiempo**
   - Agregar tiempo estimado por tarea
   - Barra de progreso del dia

4. **Simplificar Cards de Tarea**
   ```
   ANTES: 7 columnas en linea
   DESPUES: Card compacto con info esencial

   ┌────────────────────────────────────┐
   │ [1] ISR Mensual - Cliente ABC      │
   │     RFC: ABC123456789              │
   │     ⚠️ VENCE HOY                   │
   │     [Iniciar] [Ver Detalle]        │
   └────────────────────────────────────┘
   ```

**Mejoras a "Mi Agenda"** (`src/app/dashboard/colaborador/page.tsx`):

1. **Reducir Columnas**
   - Quitar: Periodicidad (poco util en ejecucion)
   - Agregar: Botones de accion inline

2. **Modo Foco**
   ```
   [Todas] [Solo Hoy] [Esta Semana]
   ```

3. **Busqueda Rapida**
   - Buscar por RFC o cliente
   - Filtro persistente

---

## Perspectiva del LIDER

### Perfil
- Supervisa equipo de 3-8 colaboradores
- Valida trabajo antes de presentacion
- Asigna tareas a su equipo
- Responde por la tribu

### Problemas Identificados

| Problema | Ubicacion | Impacto |
|----------|-----------|---------|
| No hay vista de "Mi Equipo" | No existe | No ve carga de trabajo |
| Validaciones dispersas | TMR tiene todo mezclado | Dificil encontrar pendientes |
| Sin alertas de equipo | ejecutivo/page.tsx general | No especifico para su tribu |

### Propuesta de Mejora

**Nueva Navegacion para Lider:**
```
Mi Equipo ← INICIO (dashboard de tribu)
Mi Dia ← sus tareas personales
Validaciones ← cola de aprobacion
Calendario ← vista de equipo
Clientes ← clientes de la tribu
Alertas ← riesgos del equipo
```

**Nueva Vista: "Mi Equipo"** (`src/app/dashboard/equipo/page.tsx`):

```
┌─────────────────────────────────────────────────┐
│ MI EQUIPO: Tribu Fiscal Norte                   │
├─────────────────────────────────────────────────┤
│ KPIs del Equipo                                 │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ 45      │ │ 12      │ │ 3       │ │ 89%     ││
│ │ Activas │ │ Por     │ │ En      │ │ A       ││
│ │         │ │ Validar │ │ Riesgo  │ │ Tiempo  ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
├─────────────────────────────────────────────────┤
│ Carga por Colaborador                           │
│ ├── Maria Garcia     ████████░░ 8 tareas       │
│ ├── Juan Lopez       ██████████ 10 tareas ⚠️   │
│ ├── Ana Martinez     ████░░░░░░ 4 tareas       │
│ └── Pedro Sanchez    ██████░░░░ 6 tareas       │
├─────────────────────────────────────────────────┤
│ Tareas Pendientes de Validacion                 │
│ └── [Ver Cola de Validaciones →]                │
└─────────────────────────────────────────────────┘
```

**Nueva Vista: "Validaciones"** (`src/app/dashboard/validaciones/page.tsx`):

```
┌─────────────────────────────────────────────────┐
│ COLA DE VALIDACIONES (5 pendientes)             │
├─────────────────────────────────────────────────┤
│ [✓ Seleccionar Todas] [Aprobar Seleccionadas]   │
├─────────────────────────────────────────────────┤
│ ☐ ISR Mensual - Cliente ABC                     │
│   Colaborador: Maria Garcia                     │
│   Enviado: Hace 2 horas                         │
│   [Ver Evidencia] [✓ Aprobar] [✗ Rechazar]      │
├─────────────────────────────────────────────────┤
│ ☐ DIOT - Cliente XYZ                            │
│   Colaborador: Juan Lopez                       │
│   Enviado: Hace 30 min                          │
│   [Ver Evidencia] [✓ Aprobar] [✗ Rechazar]      │
└─────────────────────────────────────────────────┘
```

---

## Perspectiva del SOCIO

### Perfil
- Vision ejecutiva del negocio
- Revisa rentabilidad por cliente
- Toma decisiones estrategicas
- Accede a configuracion

### Problemas Identificados

| Problema | Ubicacion | Impacto |
|----------|-----------|---------|
| TMR tiene demasiada informacion | dashboard/page.tsx | Dificil obtener resumen |
| Ejecutivo no muestra tendencias | ejecutivo/page.tsx | Solo estado actual |
| No hay analisis de rentabilidad | No existe | Decision sin datos |

### Propuesta de Mejora

**Navegacion para Socio:**
```
TMR ← INICIO (tablero maestro)
Ejecutivo ← alertas y KPIs
Analisis ← graficas y tendencias
---
Clientes ← todos los clientes
Colaboradores ← todo el personal
Tribus ← estructura organizacional
---
Configuracion ← ajustes del sistema
```

**Mejoras a TMR** (`src/app/dashboard/page.tsx`):

1. **Personalizar Columnas**
   ```
   [Columnas ▼]
   ☑ RFC/Cliente
   ☑ Entregable
   ☐ Talla (ocultar)
   ☑ Tribu
   ☑ Estado
   ☐ Puntos (ocultar)
   ```

2. **Header Fijo al Scroll**
   - Siempre visible para referencia

3. **Atajos de Teclado**
   - `j/k` - Navegar arriba/abajo
   - `e` - Editar seleccionado
   - `/` - Buscar
   - `f` - Abrir filtros

4. **Exportar a Excel**
   ```
   [↓ Exportar] → SGR_TMR_2026-01-15.xlsx
   ```

**Mejoras a Ejecutivo** (`src/app/dashboard/ejecutivo/page.tsx`):

1. **Graficas de Tendencia**
   ```
   Tareas Completadas (ultimos 30 dias)
   ▁▂▃▅▇█▇▅▆▇███▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆
   ```

2. **Indicadores Predictivos**
   ```
   ⚠️ Riesgo de Atraso: 15 tareas podrian vencer esta semana
      basado en velocidad actual del equipo
   ```

3. **Click-Through a Detalle**
   - Click en alerta → Ver tareas afectadas

---

## Perspectiva del ADMIN

### Perfil
- Administrador del sistema
- Configura obligaciones, procesos, SLAs
- Gestiona usuarios y permisos
- Soporte tecnico interno

### Problemas Identificados

| Problema | Ubicacion | Impacto |
|----------|-----------|---------|
| Configuracion sin restriccion | configuracion/page.tsx | Cualquiera puede modificar |
| Cambios sin auditoria | No existe | No se sabe quien cambio que |
| Sin validacion de datos | TabDatos.tsx | Puede corromper BD |

### Propuesta de Mejora

**Acceso Restringido:**
- Solo ADMIN y SOCIO pueden ver `/configuracion`
- Middleware valida rol antes de cargar pagina

**Log de Cambios:**
```
Ultimos Cambios en Configuracion:
├── Admin modifico SLA "presentado" → 5 dias (hace 2h)
├── Socio agrego cliente "Empresa XYZ" (ayer)
└── Admin desactivo proceso "IVA Trimestral" (hace 3d)
```

---

## Sistema de Permisos Propuesto

### Matriz de Acceso

| Pagina | COLABORADOR | LIDER | SOCIO | ADMIN |
|--------|-------------|-------|-------|-------|
| Mi Dia | ✓ Home | ✓ | ✓ | ✓ |
| Mi Agenda | ✓ | ✓ | ✓ | ✓ |
| Calendario | ✓ | ✓ | ✓ | ✓ |
| Clientes (filtrado) | ✓ | ✓ | ✓ | ✓ |
| Mi Equipo | - | ✓ Home | ✓ | ✓ |
| Validaciones | - | ✓ | ✓ | ✓ |
| Tribu | - | ✓ | ✓ | ✓ |
| TMR | - | ✓ | ✓ Home | ✓ |
| Ejecutivo | - | ✓ | ✓ | ✓ |
| Analisis | - | - | ✓ | ✓ |
| Auditor | - | - | ✓ | ✓ |
| Configuracion | - | - | ✓ | ✓ |

### Implementacion Tecnica

**1. Hook de Usuario** (`src/lib/hooks/useUserRole.ts`):
```typescript
export function useUserRole() {
  // Obtiene rol del usuario autenticado
  // Cachea en sessionStorage
  return {
    role: 'COLABORADOR' | 'LIDER' | 'SOCIO' | 'ADMIN',
    isAdmin: boolean,
    isSocio: boolean,
    isLider: boolean,
    loading: boolean
  }
}
```

**2. Middleware Mejorado** (`src/middleware.ts`):
```typescript
const PROTECTED_ROUTES = {
  '/dashboard/configuracion': ['ADMIN', 'SOCIO'],
  '/dashboard/ejecutivo': ['ADMIN', 'SOCIO', 'LIDER'],
  '/dashboard/auditor': ['ADMIN', 'SOCIO'],
  '/dashboard/analisis': ['ADMIN', 'SOCIO'],
  '/dashboard/tribu': ['ADMIN', 'SOCIO', 'LIDER'],
}

// Validar acceso segun rol
```

**3. Sidebar Dinamico** (`src/components/layout/Sidebar.tsx`):
```typescript
const navigationByRole = {
  COLABORADOR: ['mi-dia', 'colaborador', 'calendario', 'cliente'],
  LIDER: ['equipo', 'mi-dia', 'validaciones', 'calendario', 'cliente', 'tribu'],
  SOCIO: ['page', 'ejecutivo', 'analisis', 'cliente', 'colaborador', 'tribu', 'configuracion'],
  ADMIN: [...] // Todas las paginas
}
```

---

## Plan de Implementacion

### Sprint 3: Sistema de Permisos
- Crear useUserRole hook
- Modificar middleware
- Actualizar Sidebar
- Proteger Configuracion

### Sprint 4: UX Colaborador
- Mejorar Mi Dia
- Simplificar Mi Agenda
- Agregar acciones rapidas

### Sprint 5: UX Lider
- Crear Mi Equipo
- Crear Validaciones
- Mejorar Tribu

### Sprint 6: UX Socio/Admin
- Mejorar TMR
- Agregar tendencias a Ejecutivo
- Log de cambios en Config

---

## Metricas de Exito

| Metrica | Actual | Objetivo |
|---------|--------|----------|
| Clicks para completar tarea | 5+ | 2-3 |
| Tiempo para encontrar tarea urgente | ~30s | <10s |
| Opciones visibles en sidebar | 11 | 4-6 segun rol |
| Paginas accesibles incorrectamente | 4+ | 0 |

---

## Conclusion

Las mejoras propuestas simplifican significativamente la experiencia de cada rol:

1. **Colaborador**: Interface enfocada en ejecucion diaria con acciones rapidas
2. **Lider**: Vision clara de su equipo con herramientas de supervision
3. **Socio**: Dashboards ejecutivos con tendencias y analisis
4. **Admin**: Acceso completo con controles de seguridad

La implementacion del sistema de permisos es CRITICA y debe ser el primer paso antes de cualquier mejora de UX.
