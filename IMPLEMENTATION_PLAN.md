# SGR CBC - Analisis Critico y Plan de Implementacion

**Fecha**: 2026-01-13
**Autor**: Claude (Opus 4.5)
**Branch**: `claude/review-implementation-plan-gOIyu`

---

## 1. RESUMEN EJECUTIVO

SGR CBC es un **Sistema de Gestion de Resultados** para un despacho contable mexicano, especializado en el proceso de "Cambio de Beneficiario de Control". El proyecto esta construido con Next.js 16, React 19, Supabase y TailwindCSS.

### Estado Actual: ~75% completado

| Categoria | Progreso | Notas |
|-----------|----------|-------|
| Backend/DB Schema | 95% | Esquema robusto, 19+ tablas |
| APIs | 70% | Endpoints core funcionando |
| TMR (Dashboard Principal) | 85% | Funcional con datos reales |
| Configuracion | 90% | Todos los tabs implementados |
| Autenticacion | 80% | Login funciona, logout pendiente |
| Paginas Secundarias | 40% | Calendario, Entregables pendientes |

---

## 2. ANALISIS CRITICO

### 2.1 Fortalezas

1. **Arquitectura Solida**
   - Esquema de BD bien normalizado con relaciones claras
   - Separacion correcta entre catalogos fiscales, comerciales y operativos
   - Sistema de scoring bien disenado (tallas, pesos, puntos)

2. **Motor de Tareas Robusto**
   - `taskGenerator.ts` implementa logica de negocio compleja
   - Genera tareas automaticamente basado en regimen + servicios + calendario
   - Previene duplicados con constraint en BD

3. **UI Consistente**
   - Tailwind bien aplicado con tema coherente
   - Componentes de configuracion completos y funcionales
   - UX intuitiva en el TMR

### 2.2 Problemas Criticos (Alta Prioridad)

#### P1: TypeScript Build Errors Ignorados
```typescript
// next.config.ts
typescript: {
  ignoreBuildErrors: true,  // RED FLAG
}
```
**Impacto**: Errores de tipo no detectados pueden causar bugs en produccion.
**Solucion**: Habilitar verificacion y corregir errores.

#### P2: Tabla `tarea_auditoria` No Existe
El TMR hace upsert a `tarea_auditoria` (linea 256-261 de `dashboard/page.tsx`), pero esta tabla no existe en el schema. Solo existe `audits` que tiene estructura diferente.

**Impacto**: Funcionalidad de auditoria rota en produccion.
**Solucion**: Crear la tabla o adaptar codigo a usar `audits`.

#### P3: Columna `vobo_lider` No Existe en `tarea`
```typescript
// dashboard/page.tsx:236
await supabase.from('tarea').update({ vobo_lider: nextVobo })
```
El schema de `tarea` no tiene esta columna.

**Impacto**: VoBo Lider no persiste en BD.
**Solucion**: Agregar columna al schema.

#### P4: Sin Sistema de Logout
El boton de logout existe en el sidebar pero no tiene funcionalidad conectada.

**Impacto**: UX incompleta, sesiones quedan activas.
**Solucion**: Implementar `supabase.auth.signOut()`.

### 2.3 Problemas Medios (Media Prioridad)

#### M1: Mock Data en Componente Auditor
`/dashboard/auditor/page.tsx` usa `MOCK_AUDITORIAS` hardcodeado en vez de datos reales.

#### M2: Paginas Placeholder
- `/dashboard/calendario` - Solo skeleton
- `/dashboard/entregables` - "Vista en Construccion"
- `/dashboard/tribu` - Pagina no existe (404)

#### M3: Sin Upload de Evidencias
La columna "Evidencia" en TMR hace toggle local pero no hay sistema de upload a Supabase Storage.

#### M4: Sin Tests
No hay configuracion de Jest/Vitest, no hay archivos de test.

### 2.4 Deuda Tecnica

1. **Imports Duplicados**: `createBrowserClient` se crea en cada componente
2. **Error Handling Inconsistente**: Algunos usan `console.error`, otros `alert()`
3. **Tipos `any`**: Queries de Supabase usan `any` en varios lugares
4. **TODOs en Codigo**:
   - `// TODO: Traer de scoring engine` (TMR linea 128)
   - `// TODO: Traer de tarea_documento` (TMR linea 133)

---

## 3. PLAN DE IMPLEMENTACION

### Fase 1: Estabilizacion (Semana 1)

**Objetivo**: Arreglar bugs criticos y estabilizar funcionalidad existente.

#### 1.1 Corregir Schema de BD
```sql
-- Agregar columna vobo_lider a tarea
ALTER TABLE tarea ADD COLUMN vobo_lider BOOLEAN DEFAULT false;

-- Crear tabla tarea_auditoria (o unificar con audits)
CREATE TABLE tarea_auditoria (
  tarea_id UUID PRIMARY KEY REFERENCES tarea(tarea_id),
  resultado TEXT CHECK (resultado IN ('NO_AUDITADO', 'PENDIENTE', 'APROBADO', 'RECHAZADO')),
  auditor_id UUID REFERENCES users(user_id),
  fecha_auditoria TIMESTAMPTZ,
  comentarios TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2 Habilitar TypeScript Strict
```typescript
// next.config.ts
typescript: {
  ignoreBuildErrors: false,  // Habilitar
}
```
Luego corregir todos los errores de tipo.

#### 1.3 Implementar Logout
```typescript
// En Sidebar.tsx o Header
async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/login')
}
```

#### 1.4 Conectar Auditor a Datos Reales
Reemplazar `MOCK_AUDITORIAS` con query a `tarea` + `tarea_auditoria`.

### Fase 2: Funcionalidad Core (Semana 2-3)

#### 2.1 Sistema de Evidencias
- Configurar Supabase Storage bucket `evidencias`
- Crear componente `EvidenciaUpload.tsx`
- Guardar referencia en `tarea_documento`
- Mostrar link de descarga en TMR

#### 2.2 Pagina Calendario
- Vista mensual de deadlines fiscales
- Semaforo de vencimientos (verde/amarillo/rojo)
- Filtros por obligacion/cliente

#### 2.3 Pagina Entregables
- Catalogo de entregables con pesos
- CRUD para `entregable` y `regimen_entregable_peso`
- Matriz entregable x regimen

#### 2.4 Scoring Engine Real
- Calcular puntos desde BD (no mock)
- Formula: `base_points * (talla.ponderacion/100) * (regimen_entregable_peso.peso_pct/100)`
- Solo sumar si: estado=terminado + evidencia=true + vobo_lider=true + auditoria=aprobado

### Fase 3: Mejoras UX (Semana 4)

#### 3.1 Vista Tribu
- Dashboard por equipo
- Metricas de equipo
- Ranking de colaboradores

#### 3.2 Notificaciones
- Toast notifications para acciones
- Badge de tareas pendientes en sidebar

#### 3.3 Responsive Design
- Optimizar para tablet/mobile
- Menu hamburguesa en mobile

### Fase 4: Calidad y Produccion (Semana 5+)

#### 4.1 Testing
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```
- Tests unitarios para engines
- Tests de integracion para APIs
- Tests de componentes criticos

#### 4.2 Error Boundaries
- Componente ErrorBoundary global
- Fallback UI para errores

#### 4.3 Logging
- Reemplazar `console.error` con sistema estructurado
- Considerar Sentry o similar

---

## 4. PRIORIDADES INMEDIATAS

Para comenzar a trabajar juntos, recomiendo este orden:

### HOY (Prioridad Maxima)
1. [ ] Corregir schema BD (vobo_lider, tarea_auditoria)
2. [ ] Habilitar TypeScript y corregir errores
3. [ ] Implementar logout

### ESTA SEMANA
4. [ ] Conectar auditor a datos reales
5. [ ] Centralizar cliente Supabase en un hook
6. [ ] Implementar upload de evidencias

### PROXIMA SEMANA
7. [ ] Pagina Calendario funcional
8. [ ] Pagina Entregables funcional
9. [ ] Scoring engine real

---

## 5. ARQUITECTURA RECOMENDADA

### 5.1 Estructura de Hooks Centralizada
```
src/
  hooks/
    useSupabase.ts      # Cliente singleton
    useAuth.ts          # Estado de autenticacion
    useTareas.ts        # CRUD tareas
    useClientes.ts      # CRUD clientes
```

### 5.2 Constantes y Enums
```
src/
  lib/
    constants/
      estados.ts        # Estados de tarea
      roles.ts          # Roles de usuario
      fiscales.ts       # Constantes fiscales
```

### 5.3 Tipos Centralizados
```typescript
// Ya existe database.ts, pero extender con:
export type TareaConRelaciones = Database['public']['Tables']['tarea']['Row'] & {
  contribuyente: Contribuyente
  cliente: Cliente
  obligacion: ObligacionFiscal
  responsable: Usuario | null
}
```

---

## 6. METRICAS DE EXITO

| Metrica | Actual | Objetivo |
|---------|--------|----------|
| Build sin errores | No | Si |
| Cobertura de tests | 0% | >60% |
| Paginas funcionales | 5/9 | 9/9 |
| Errores de consola | Varios | 0 |
| Tiempo de carga TMR | ~2s | <1s |

---

## 7. PREGUNTAS PARA EL EQUIPO

Antes de comenzar, necesito clarificar:

1. **Flujo de Auditoria**: ¿La tabla `audits` existente debe usarse o crear `tarea_auditoria` separada?

2. **Scoring**: ¿La formula de puntos esta correcta? (base * talla * peso_regimen)

3. **Evidencias**: ¿Que tipos de archivo se suben? (PDF, imagenes, XML del SAT?)

4. **Permisos**: ¿Los roles de equipo (AUXILIAR_A/B/C) determinan que pueden ver/editar?

5. **Calendario**: ¿Las reglas de deadline son fijas o configurables por cliente?

---

**Siguiente paso**: Confirmar prioridades y comenzar con Fase 1.
