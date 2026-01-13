# Plan de Configuración para MVP Beta

## Resumen Ejecutivo

Para lanzar con usuarios beta, la plataforma necesita que la configuración esté completa. Actualmente **la estructura de base de datos existe**, pero **falta la UX** para configurar las relaciones críticas entre entidades.

---

## 1. Estado Actual vs. Requerido

### Datos del Cliente

| Campo | BD | UX Actual | Estado |
|-------|:--:|:---------:|--------|
| Nombre comercial | ✅ | ✅ | Listo |
| Razón social | ✅ | ✅ | Listo |
| Segmento | ✅ | ✅ | Listo |
| Contacto (nombre, email, tel) | ✅ | ✅ | Listo |
| RFCs asociados | ✅ | ✅ | Listo |
| **Régimen fiscal por RFC** | ✅ | ❌ | **FALTA UX** |
| **Servicios contratados** | ✅ | ❌ | **FALTA UX** |
| **Talla por dominio** | ✅ | ❌ | **FALTA UX** |
| Tribu/Equipo asignado | ✅ | ❌ | **FALTA UX** |

### Configuración Fiscal

| Funcionalidad | BD | UX Actual | Estado |
|---------------|:--:|:---------:|--------|
| Crear obligaciones fiscales | ✅ | ✅ | Listo |
| Crear regímenes fiscales | ✅ | ✅ | Listo |
| Crear reglas de calendario | ✅ | ✅ | Listo |
| **Vincular régimen → obligaciones** | ✅ | ❌ | **FALTA UX** |
| **Vincular obligación → calendario** | ✅ | ❌ | **FALTA UX** |
| **Vincular obligación → proceso operativo** | ❌ | ❌ | **FALTA TODO** |

### Procesos Operativos

| Funcionalidad | BD | UX Actual | Estado |
|---------------|:--:|:---------:|--------|
| Crear procesos (Nómina, IMSS) | ✅ | ✅ | Listo |
| Crear pasos con peso % | ✅ | ✅ | Listo |
| Asignar tipo colaborador (A/B/C) | ✅ | ✅ | Listo |
| **Validar suma pesos = 100%** | ❌ | ❌ | **FALTA** |
| **Indicador visual del total** | ❌ | ❌ | **FALTA** |

---

## 2. Definición del Proceso de Configuración Ideal

### Flujo de Configuración (Orden Recomendado)

```
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 1: CATÁLOGOS BASE                                             │
│  ─────────────────────                                              │
│  • Regímenes fiscales (601, 612, 625, 626...)                       │
│  • Obligaciones fiscales (ISR, IVA, IMSS, Nómina...)                │
│  • Reglas de calendario (deadlines)                                 │
│  • Tallas (XS, S, M, L, XL con ponderación)                         │
│  • Servicios disponibles (Nómina Quincenal, IMSS Mensual...)        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 2: PROCESOS OPERATIVOS                                        │
│  ───────────────────────────                                        │
│  Para cada proceso (NOMINA, IMSS, CONTABILIDAD...):                 │
│  • Definir pasos secuenciales                                       │
│  • Asignar peso % (debe sumar 100%)                                 │
│  • Asignar tipo de colaborador (A, B, C)                            │
│  • Indicar si requiere evidencia                                    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 3: MATRIZ RÉGIMEN → OBLIGACIONES                              │
│  ─────────────────────────────────────                              │
│  Para cada régimen definir:                                         │
│  • Qué obligaciones aplican                                         │
│  • Si son obligatorias o condicionales                              │
│  • Condición (ej: "Si tiene nómina")                                │
│  • Riesgo default (ALTO/MEDIO/BAJO)                                 │
│  • Prioridad default                                                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 4: VINCULAR OBLIGACIÓN → PROCESO + CALENDARIO                 │
│  ──────────────────────────────────────────────────                 │
│  Para cada obligación:                                              │
│  • Qué proceso operativo la ejecuta                                 │
│  • Qué regla de calendario aplica para deadline                     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 5: ALTA DE CLIENTES                                           │
│  ────────────────────────                                           │
│  Para cada cliente:                                                 │
│  1. Datos básicos (nombre, contacto, segmento)                      │
│  2. RFCs asociados                                                  │
│  3. Régimen fiscal de cada RFC                                      │
│  4. Servicios contratados                                           │
│  5. Talla por dominio (Fiscal, Nómina, IMSS)                        │
│  6. Equipo/Tribu asignado                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Datos Requeridos para MVP

### Procesos MVP (según tu especificación)

#### NOMINA (5 pasos, 100%)
| # | Paso | Peso % | Colaborador |
|---|------|--------|-------------|
| 1 | Consulta incidencias | 30 | C |
| 2 | Captura incidencias | 30 | C |
| 3 | Procesar nómina | 30 | C |
| 4 | Timbrar nómina | 5 | C |
| 5 | Enviar nómina | 5 | C |
| | **TOTAL** | **100%** | |

#### IMSS (6 pasos, 75% definido + falta cotejo)
| # | Paso | Peso % | Colaborador |
|---|------|--------|-------------|
| 1 | Captura mov. IDSE | 20 | B |
| 2 | Captura mov. Nominax | 15 | B |
| 3 | Captura mov. SUA | 15 | B |
| 4 | Descarga IDSE | 15 | C |
| 5 | Descarga SIPARE | 5 | C |
| 6 | Descarga reportes Nominax | 5 | C |
| 7 | Cotejo/Validación | 25 | A |
| | **TOTAL** | **100%** | |

> **Nota**: En el schema actual IMSS tiene 7 pasos incluyendo COTEJO (25%, Aux A). Confirmar si esto es correcto.

### Campos del Cliente Completo

```typescript
interface ClienteCompleto {
  // Datos básicos
  cliente_id: string
  nombre_comercial: string           // Requerido
  razon_social_principal?: string
  segmento: 'MICRO' | 'PEQUEÑA' | 'MEDIANA' | 'GRANDE' | 'CORPORATIVO'

  // Contacto
  contacto_nombre?: string
  contacto_email?: string
  contacto_telefono?: string
  notas?: string

  // RFCs (pueden ser varios)
  rfcs: {
    rfc: string                      // Requerido, validar formato SAT
    tipo_persona: 'PF' | 'PM'        // Requerido
    razon_social: string             // Requerido
    regimenes: string[]              // ['601', '612'] - Requerido al menos uno
  }[]

  // Servicios contratados
  servicios: {
    servicio_id: string              // Requerido
    vigencia_desde: Date
    vigencia_hasta?: Date
    notas_comerciales?: string
  }[]

  // Tallas por dominio
  tallas: {
    dominio: 'FISCAL' | 'NOMINA' | 'IMSS'
    talla: 'EXTRA_CHICA' | 'CHICA' | 'MEDIANA' | 'GRANDE' | 'EXTRA_GRANDE'
  }[]

  // Asignación operativa
  equipo_id?: string                 // Tribu asignada
}
```

---

## 4. Plan de Implementación

### Fase 1: Mejorar UX de Configuración Base (Prioridad Alta)

#### 1.1 TabClientes - Agregar secciones faltantes
**Archivo**: `src/components/config/TabClientes.tsx`

**Cambios requeridos**:
- [ ] Al expandir RFC, mostrar selector de regímenes fiscales
- [ ] Agregar sección "Servicios Contratados" al expandir cliente
- [ ] Agregar sección "Tallas" con selector por dominio
- [ ] Agregar selector de "Equipo/Tribu Asignado"
- [ ] Mostrar resumen: "X obligaciones aplicables"

**Mockup de la UI expandida**:
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 Abarrotes Lupita                              [Editar] [🗑]  │
│    Sin razón social • MEDIANA • 1 RFC                          │
├─────────────────────────────────────────────────────────────────┤
│ ▼ Expandido                                                     │
│                                                                 │
│ ┌─ RFCs Asociados ─────────────────────────────────────────┐   │
│ │ ALU150101AB1  Abarrotes Lupita SA de CV  (PM)     [🗑]   │   │
│ │ └─ Regímenes: [601 ✓] [612 ☐] [625 ☐] [626 ☐]           │   │
│ │                                                           │   │
│ │ [+ Agregar RFC]                                           │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Servicios Contratados ──────────────────────────────────┐   │
│ │ ☑ Nómina Quincenal    Desde: 01/01/2024                  │   │
│ │ ☑ IMSS Mensual        Desde: 01/01/2024                  │   │
│ │ ☐ Contabilidad Mensual                                   │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Tallas ─────────────────────────────────────────────────┐   │
│ │ Fiscal:  [MEDIANA ▼]  (100 pts base)                     │   │
│ │ Nómina:  [CHICA ▼]    (75 pts base)                      │   │
│ │ IMSS:    [CHICA ▼]    (75 pts base)                      │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Equipo Asignado ────────────────────────────────────────┐   │
│ │ Tribu: [Isidora ▼]                                       │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ 📋 Obligaciones aplicables: 2 (Nómina Quincenal, IMSS Mensual) │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.2 TabObligaciones - Agregar matriz régimen↔obligación
**Archivo**: `src/components/config/TabObligaciones.tsx`

**Cambios requeridos**:
- [ ] Nueva sub-tab: "Matriz Régimen-Obligación"
- [ ] Vista de tabla cruzada: Regímenes en filas, Obligaciones en columnas
- [ ] Checkbox para marcar qué obligaciones aplican a cada régimen
- [ ] Campos adicionales al hacer click: condición, riesgo, prioridad

**Mockup**:
```
┌─ Matriz Régimen → Obligaciones ────────────────────────────────┐
│                                                                 │
│        │ Nómina Q │ IMSS M │ ISR M │ IVA M │ DIOT M │         │
│ ───────┼──────────┼────────┼───────┼───────┼────────┤         │
│ 601 PM │    ✓     │   ✓    │   ✓   │   ✓   │   ✓    │         │
│ 612 PF │    ✓     │   ☐    │   ✓   │   ✓   │   ✓    │         │
│ 625 PF │    ☐     │   ☐    │   ✓   │   ☐   │   ☐    │         │
│ 626 AM │    ✓     │   ✓    │   ✓   │   ☐   │   ☐    │         │
│                                                                 │
│ Click en ✓ para editar: Condición, Riesgo, Prioridad           │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.3 TabProcesos - Mejorar validación y UX
**Archivo**: `src/components/config/TabProcesos.tsx`

**Cambios requeridos**:
- [ ] Indicador visual de suma de pesos (barra de progreso)
- [ ] Alerta si suma ≠ 100%
- [ ] Color verde si suma = 100%, rojo si excede, amarillo si falta
- [ ] Botón "Auto-balancear" para distribuir peso restante

**Mockup**:
```
┌─ Pasos del Proceso NOMINA ─────────────────────────────────────┐
│                                                                 │
│ Total: ████████████████████░░░░░ 80% (Faltan 20%)    [⚠️]      │
│                                                                 │
│ 1️⃣ Consulta incidencias    30%  Aux C  📎         [✏️][🗑]    │
│ 2️⃣ Captura incidencias     30%  Aux C  📎         [✏️][🗑]    │
│ 3️⃣ Procesar nómina         20%  Aux C             [✏️][🗑]    │
│                                                                 │
│ [+ Agregar Paso]                [Auto-balancear]               │
└─────────────────────────────────────────────────────────────────┘
```

### Fase 2: Relación RFC-Equipo, Talla por Servicio y SLA

#### 2.1 Agregar team_id a contribuyente (RFC) - IMPLEMENTADO
```sql
-- El equipo se asigna al RFC, no al cliente
ALTER TABLE contribuyente
ADD COLUMN team_id UUID REFERENCES teams(team_id);

CREATE INDEX idx_contribuyente_team ON contribuyente(team_id);
```

#### 2.2 Agregar talla_id a cliente_servicio - IMPLEMENTADO
```sql
-- La talla es por servicio contratado (XS en IMSS, G en Nomina)
ALTER TABLE cliente_servicio
ADD COLUMN talla_id TEXT REFERENCES talla(talla_id);
```

#### 2.3 Crear tabla de configuración SLA - IMPLEMENTADO
```sql
-- Configuración de SLA por estado
CREATE TABLE sla_config (
  sla_config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estado TEXT NOT NULL UNIQUE,
  descripcion TEXT NOT NULL,
  sla_activo BOOLEAN NOT NULL DEFAULT true,  -- ✅ cuenta tiempo, ❌ no cuenta
  sla_pausado BOOLEAN NOT NULL DEFAULT false, -- ⏸️ pausa el conteo
  dias_sla_default INTEGER,                   -- días límite para este estado
  orden_flujo INTEGER NOT NULL,               -- orden en el flujo de trabajo
  es_estado_final BOOLEAN NOT NULL DEFAULT false,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Datos iniciales de SLA
INSERT INTO sla_config (estado, descripcion, sla_activo, sla_pausado, dias_sla_default, orden_flujo, es_estado_final) VALUES
('pendiente', 'No iniciado', true, false, NULL, 1, false),
('en_curso', 'Trabajo activo', true, false, NULL, 2, false),
('pendiente_evidencia', 'Falta subir comprobantes', true, false, 2, 3, false),
('en_validacion', 'Revisión líder', true, false, 1, 4, false),
('bloqueado_cliente', 'Falta info/pago cliente', false, true, NULL, 5, false),
('presentado', 'Enviado a autoridad', true, false, NULL, 6, false),
('pagado', 'Pago confirmado', false, false, NULL, 7, true),
('cerrado', 'Completado', false, false, NULL, 8, true),
('rechazado', 'Rechazado/Error', false, false, NULL, 9, true);
```

#### 2.4 UI en TabClientes - IMPLEMENTADO
- [x] Selector de equipo/tribu por RFC
- [x] Selector de regimenes fiscales por RFC
- [x] Selector de servicios contratados con talla por servicio
- [x] Resumen de configuracion del cliente

#### 2.5 Nueva seccion en Configuracion: SLA
- [ ] Tab o sub-tab para configurar SLA por estado (pendiente)
- [ ] Poder modificar dias limite, si cuenta tiempo, si pausa

---

### Fase 3: Vincular Obligación → Proceso + Calendario

#### 3.1 Nueva tabla en BD (si no existe)
```sql
-- Vincular obligación fiscal con proceso operativo
CREATE TABLE IF NOT EXISTS obligacion_proceso (
    id_obligacion TEXT REFERENCES obligacion_fiscal(id_obligacion),
    proceso_id TEXT REFERENCES proceso_operativo(proceso_id),
    activo BOOLEAN DEFAULT true,
    PRIMARY KEY (id_obligacion, proceso_id)
);

-- Vincular obligación fiscal con regla de calendario
CREATE TABLE IF NOT EXISTS obligacion_calendario (
    id_obligacion TEXT REFERENCES obligacion_fiscal(id_obligacion),
    calendario_regla_id UUID REFERENCES calendario_regla(calendario_regla_id),
    activo BOOLEAN DEFAULT true,
    PRIMARY KEY (id_obligacion, calendario_regla_id)
);
```

#### 3.2 UI en TabObligaciones
- [ ] Al editar una obligación, agregar selectores:
  - "Proceso operativo asociado": dropdown con procesos
  - "Regla de calendario": dropdown con reglas

### Fase 3: Datos Iniciales para Beta

#### 3.1 Seed data completo
Crear archivo `supabase/seed_mvp_beta.sql` con:

- [ ] Regímenes fiscales comunes (601, 612, 625, 626, etc.)
- [ ] Obligaciones para MVP (Nómina, IMSS, al menos)
- [ ] Procesos NOMINA e IMSS con todos los pasos
- [ ] Matriz régimen→obligación completa
- [ ] Reglas de calendario (día 17 del mes siguiente, etc.)
- [ ] Tallas con ponderaciones
- [ ] Servicios disponibles

---

## 5. Orden de Prioridad para Implementación

### Sprint 1 (Crítico para Beta)
1. **Migración BD**: Agregar `team_id` a cliente, crear tabla `sla_config`
2. **TabClientes expandido**: Regímenes por RFC, Servicios, Tallas, **Equipo**
3. **TabProcesos mejorado**: Validación de pesos, indicador visual
4. **Seed data completo**: Procesos NOMINA e IMSS con pasos correctos, SLA config

### Sprint 2 (Importante)
5. **Matriz régimen→obligación**: Vista y edición
6. **Vinculación obligación→proceso→calendario**
7. **Tab SLA**: Configuración de SLA por estado

### Sprint 3 (Nice to have)
8. Wizard de alta de cliente paso a paso
9. Importación masiva desde Excel con validaciones
10. Dashboard de "completitud" de configuración

---

## 6. Métricas de Éxito

Un cliente está **correctamente configurado** cuando tiene:

- [ ] Al menos 1 RFC asociado
- [ ] Cada RFC tiene al menos 1 régimen fiscal
- [ ] Al menos 1 servicio contratado
- [ ] Talla definida para cada dominio relevante
- [ ] Equipo asignado (opcional pero recomendado)

Una obligación está **correctamente configurada** cuando tiene:

- [ ] Al menos 1 régimen que la incluye
- [ ] Un proceso operativo asociado
- [ ] Una regla de calendario asociada

---

## 7. Preguntas para Confirmar

1. **IMSS tiene 7 pasos en el schema actual** (incluyendo COTEJO 25% Aux A). ¿Es correcto o deben ser solo 6?

2. **¿Qué otros procesos necesitan estar listos para beta?** (Contabilidad, ISR, IVA, DIOT?)

3. **¿El equipo/tribu se asigna a nivel cliente o a nivel RFC?**

4. **¿La talla es por cliente o por RFC?** (Actualmente el schema lo tiene por cliente)

5. **¿Necesitamos "condiciones" para las obligaciones?** (ej: "Solo si factura > $X")

---

## 8. Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/migrations/xxx_add_team_and_sla.sql` | **NUEVO**: Migración para team_id y sla_config |
| `src/components/config/TabClientes.tsx` | Agregar regímenes, servicios, tallas, **equipo** |
| `src/components/config/TabProcesos.tsx` | Validación de pesos, indicador visual |
| `src/components/config/TabObligaciones.tsx` | Nueva sub-tab matriz, vínculos proceso/calendario |
| `src/components/config/TabSLA.tsx` | **NUEVO**: Configuración de SLA por estado |
| `supabase/schema.sql` | Agregar tablas: sla_config, obligacion_proceso, obligacion_calendario |
| `supabase/seed_data_fixed.sql` | Datos completos para MVP + SLA config |
| `src/lib/types/database.ts` | Tipos actualizados |

---

*Documento creado: 2026-01-13*
*Autor: Claude Code*
*Estado: Borrador para revisión*
