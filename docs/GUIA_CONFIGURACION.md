# Guía de Configuración Inicial - SGR CBC

Esta guía detalla los pasos necesarios para configurar SGR CBC desde cero y dejarlo listo para uso en producción.

---

## Índice

1. [Requisitos Previos](#1-requisitos-previos)
2. [Configuración del Entorno](#2-configuración-del-entorno)
3. [Configuración de Base de Datos](#3-configuración-de-base-de-datos)
4. [Orden de Configuración del Sistema](#4-orden-de-configuración-del-sistema)
5. [Paso 1: Catálogos Base](#5-paso-1-catálogos-base)
6. [Paso 2: Procesos Operativos](#6-paso-2-procesos-operativos)
7. [Paso 3: Matriz Régimen-Obligación](#7-paso-3-matriz-régimen-obligación)
8. [Paso 4: Configuración de SLA](#8-paso-4-configuración-de-sla)
9. [Paso 5: Alta de Usuarios](#9-paso-5-alta-de-usuarios)
10. [Paso 6: Alta de Clientes](#10-paso-6-alta-de-clientes)
11. [Paso 7: Generación de Tareas](#11-paso-7-generación-de-tareas)
12. [Verificación Final](#12-verificación-final)

---

## 1. Requisitos Previos

### Software Necesario

- Node.js 18 o superior
- npm o yarn
- Git
- Navegador web moderno (Chrome, Firefox, Edge)

### Cuentas Requeridas

- Cuenta de Supabase (gratuita o de pago)
- Acceso al repositorio de código

### Información a Recopilar

Antes de iniciar, reúna la siguiente información:

- [ ] Lista de regímenes fiscales que manejan
- [ ] Lista de obligaciones fiscales por régimen
- [ ] Procesos operativos y sus pasos
- [ ] Lista de equipos/tribus
- [ ] Lista de colaboradores con sus datos
- [ ] Lista de clientes con RFCs

---

## 2. Configuración del Entorno

### 2.1 Clonar el Repositorio

```bash
git clone https://github.com/gonzalodev-ops/sgr-cbc.git
cd sgr-cbc
```

### 2.2 Instalar Dependencias

```bash
npm install
```

### 2.3 Crear Archivo de Variables de Entorno

Crear archivo `.env.local` en la raíz:

```env
# URL de tu proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave anónima (pública)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Clave de servicio (privada - solo backend)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Obtener estas claves:**
1. Ir a Supabase Dashboard → tu proyecto
2. Settings → API
3. Copiar URL del proyecto
4. Copiar `anon` key (Project API keys)
5. Copiar `service_role` key (Project API keys)

### 2.4 Verificar Instalación

```bash
npm run dev
```

Debería ver:
```
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

---

## 3. Configuración de Base de Datos

### 3.1 Crear Proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Seleccionar región cercana
4. Definir contraseña de base de datos (guardarla)
5. Esperar a que se provisione

### 3.2 Ejecutar Scripts SQL

En el orden indicado, ejecutar en Supabase SQL Editor:

**Paso 1: Esquema principal**
```sql
-- Contenido de: supabase/schema.sql
```

**Paso 2: Datos iniciales**
```sql
-- Contenido de: supabase/seed_data_fixed.sql
```

**Paso 3: Políticas RLS**
```sql
-- Contenido de: supabase/rls_policies.sql
```

**Paso 4: Trigger de autenticación**
```sql
-- Contenido de: supabase/auth_trigger.sql
```

**Paso 5: Migraciones adicionales**
```sql
-- Ejecutar archivos en: supabase/migrations/
-- En orden cronológico
```

### 3.3 Verificar Tablas Creadas

En Supabase → Table Editor, verificar que existan:

- [ ] `users`
- [ ] `teams`
- [ ] `team_members`
- [ ] `regimen_fiscal`
- [ ] `obligacion_fiscal`
- [ ] `regimen_obligacion`
- [ ] `proceso_operativo`
- [ ] `proceso_paso`
- [ ] `cliente`
- [ ] `contribuyente`
- [ ] `servicio`
- [ ] `tarea`
- [ ] `sla_config`

---

## 4. Orden de Configuración del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: CATÁLOGOS BASE                                      │
│  • Regímenes fiscales                                        │
│  • Obligaciones fiscales                                     │
│  • Reglas de calendario                                      │
│  • Tallas                                                    │
│  • Servicios                                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: PROCESOS OPERATIVOS                                 │
│  • Definir procesos (NOMINA, IMSS, etc.)                    │
│  • Crear pasos con pesos %                                  │
│  • Asignar tipo de colaborador                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: MATRIZ RÉGIMEN-OBLIGACIÓN                           │
│  • Vincular regímenes con obligaciones                      │
│  • Definir condiciones y riesgos                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 4: CONFIGURACIÓN SLA                                   │
│  • Tiempos por estado                                       │
│  • Pausas y conteos                                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 5: USUARIOS Y EQUIPOS                                  │
│  • Crear equipos/tribus                                     │
│  • Crear usuarios                                           │
│  • Asignar roles                                            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 6: CLIENTES                                            │
│  • Alta de clientes                                         │
│  • RFCs y regímenes                                         │
│  • Servicios y tallas                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 7: GENERACIÓN DE TAREAS                                │
│  • Ejecutar motor de tareas                                 │
│  • Verificar asignaciones                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Paso 1: Catálogos Base

### 5.1 Regímenes Fiscales

**Ubicación:** Configuración → Tab "Datos" → Regímenes

Crear los regímenes que maneje el despacho:

| Clave | Nombre | Tipo Persona |
|-------|--------|--------------|
| 601 | General de Ley Personas Morales | PM |
| 612 | Personas Físicas con Actividades Empresariales y Profesionales | PF |
| 625 | Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas | PF |
| 626 | Régimen Simplificado de Confianza | AMBOS |
| 605 | Sueldos y Salarios e Ingresos Asimilados a Salarios | PF |

**Campos por régimen:**
- Clave SAT (requerido)
- Nombre completo
- Tipo persona (PF, PM, AMBOS)
- Activo (checkbox)

### 5.2 Obligaciones Fiscales

**Ubicación:** Configuración → Tab "Obligaciones"

Crear las obligaciones que manejen:

| Obligación | Nivel | Periodicidad |
|------------|-------|--------------|
| Nómina Quincenal | Federal | Quincenal |
| Nómina Mensual | Federal | Mensual |
| IMSS Mensual | Seguridad Social | Mensual |
| ISR Provisional | Federal | Mensual |
| IVA Mensual | Federal | Mensual |
| DIOT | Federal | Mensual |
| Declaración Anual PF | Federal | Anual |
| Declaración Anual PM | Federal | Anual |

**Campos por obligación:**
- Nombre corto (requerido)
- Descripción
- Nivel: Federal / Estatal / Seguridad Social
- Impuesto relacionado
- Periodicidad: Mensual / Anual / Eventual
- Es informativa: Sí/No
- Fundamento legal

### 5.3 Reglas de Calendario

**Ubicación:** Configuración → Tab "Datos" → Calendario

Crear reglas para calcular fechas límite:

| Regla | Día Base | Mes Base | Descripción |
|-------|----------|----------|-------------|
| Día 17 siguiente | 17 | +1 | Para impuestos mensuales |
| Día 28 siguiente | 28 | +1 | Para IMSS |
| 30 Abril | 30 | 4 | Declaración anual PF |
| 31 Marzo | 31 | 3 | Declaración anual PM |

### 5.4 Tallas

Las tallas vienen precargadas en el seed:

| Talla | Factor | Puntos Ejemplo |
|-------|--------|----------------|
| EXTRA_CHICA | 0.50 | 50 pts |
| CHICA | 0.75 | 75 pts |
| MEDIANA | 1.00 | 100 pts |
| GRANDE | 1.50 | 150 pts |
| EXTRA_GRANDE | 2.00 | 200 pts |

### 5.5 Servicios

**Ubicación:** Configuración → Tab "Servicios"

Crear servicios contratables:

| Servicio | Obligaciones Incluidas |
|----------|------------------------|
| Nómina Quincenal | Nómina, IMSS |
| Nómina Mensual | Nómina, IMSS |
| Contabilidad Fiscal | ISR, IVA, DIOT |
| Declaración Anual | Dec. Anual PF/PM |

---

## 6. Paso 2: Procesos Operativos

**Ubicación:** Configuración → Tab "Procesos"

### 6.1 Crear Proceso NOMINA

1. Clic en "+ Nuevo Proceso"
2. Nombre: `NOMINA`
3. Guardar

4. Expandir y agregar pasos:

| # | Paso | Peso % | Colaborador | Evidencia |
|---|------|--------|-------------|-----------|
| 1 | Consulta incidencias | 30% | C | No |
| 2 | Captura incidencias | 30% | C | Sí |
| 3 | Procesar nómina | 30% | C | Sí |
| 4 | Timbrar | 5% | C | Sí |
| 5 | Enviar | 5% | C | Sí |
| | **TOTAL** | **100%** | | |

### 6.2 Crear Proceso IMSS

| # | Paso | Peso % | Colaborador | Evidencia |
|---|------|--------|-------------|-----------|
| 1 | Captura mov. IDSE | 20% | B | Sí |
| 2 | Captura mov. Nominax | 15% | B | No |
| 3 | Captura mov. SUA | 15% | B | No |
| 4 | Descarga IDSE | 15% | C | Sí |
| 5 | Descarga SIPARE | 5% | C | Sí |
| 6 | Descarga reportes | 5% | C | No |
| 7 | Cotejo/Validación | 25% | A | Sí |
| | **TOTAL** | **100%** | | |

### 6.3 Verificación

Asegurarse que cada proceso:
- Suma exactamente 100% (barra verde)
- Tiene todos los pasos necesarios
- Cada paso tiene tipo de colaborador asignado

---

## 7. Paso 3: Matriz Régimen-Obligación

**Ubicación:** Configuración → Tab "Obligaciones" → Sub-tab "Matriz"

### 7.1 Configurar la Matriz

Vista de tabla cruzada:
- **Filas:** Regímenes fiscales
- **Columnas:** Obligaciones fiscales
- **Intersección:** Checkbox de aplicabilidad

### 7.2 Ejemplo de Configuración

```
              │ Nómina Q │ IMSS M │ ISR M │ IVA M │ DIOT │ Dec Anual │
──────────────┼──────────┼────────┼───────┼───────┼──────┼───────────│
601 (PM)      │    ✓     │   ✓    │   ✓   │   ✓   │  ✓   │    ✓      │
612 (PF)      │    ✓     │   ✓    │   ✓   │   ✓   │  ✓   │    ✓      │
625 (PF)      │    -     │   -    │   ✓   │   -   │  -   │    ✓      │
626 (RESICO)  │    ✓*    │   ✓*   │   ✓   │   -   │  -   │    ✓      │
605 (Sueldos) │    -     │   -    │   -   │   -   │  -   │    ✓      │

* Condicional: Si tiene empleados
```

### 7.3 Editar Condiciones

Al hacer clic en una celda marcada:
- **Condición:** Texto explicativo (ej: "Si tiene empleados")
- **Riesgo:** Alto / Medio / Bajo
- **Prioridad:** Número (1 = más alta)

### 7.4 Vincular a Proceso y Calendario

Por cada obligación:
1. Seleccionar la obligación
2. En "Proceso Operativo": Elegir proceso asociado
3. En "Regla de Calendario": Elegir regla de deadline

---

## 8. Paso 4: Configuración de SLA

**Ubicación:** Configuración → Tab "SLA"

### 8.1 Configurar Tiempos por Estado

| Estado | Cuenta Tiempo | Pausa Conteo | Días Límite | Orden | Final |
|--------|--------------|--------------|-------------|-------|-------|
| pendiente | Sí | No | - | 1 | No |
| en_curso | Sí | No | - | 2 | No |
| pendiente_evidencia | Sí | No | 2 | 3 | No |
| en_validacion | Sí | No | 1 | 4 | No |
| bloqueado_cliente | No | Sí | - | 5 | No |
| presentado | Sí | No | - | 6 | No |
| pagado | No | No | - | 7 | Sí |
| cerrado | No | No | - | 8 | Sí |
| rechazado | No | No | - | 9 | Sí |

### 8.2 Significado de Campos

- **Cuenta Tiempo:** Si el reloj de SLA avanza en este estado
- **Pausa Conteo:** Si este estado pausa el conteo (ej: esperando cliente)
- **Días Límite:** Días máximos permitidos en este estado
- **Orden:** Secuencia en el flujo de trabajo
- **Final:** Si es un estado terminal (no hay transición posterior)

---

## 9. Paso 5: Alta de Usuarios

### 9.1 Crear Equipos/Tribus

**Ubicación:** Base de datos → Tabla `teams`

O desde el sistema, crear equipos:

| Equipo | Descripción |
|--------|-------------|
| Tribu Isidora | Equipo de nóminas |
| Tribu María | Equipo de contabilidad |
| Tribu Carlos | Equipo de IMSS |

### 9.2 Crear Usuarios

**Ubicación:** Configuración → Tab "Colaboradores"

**Opción A: Uno por uno**
1. Clic en "+ Nuevo Usuario"
2. Llenar datos:
   - Nombre completo
   - Email
   - Rol global (ADMIN, SOCIO, LIDER, COLABORADOR)
   - Equipo asignado
3. Guardar

**Opción B: Importación masiva**
1. Clic en "Importar"
2. Descargar plantilla Excel
3. Llenar datos siguiendo formato:

| nombre | email | rol | equipo |
|--------|-------|-----|--------|
| Juan Pérez | juan@empresa.com | COLABORADOR | Tribu Isidora |
| Ana García | ana@empresa.com | LIDER | Tribu Isidora |

4. Subir archivo
5. Verificar preview
6. Confirmar

### 9.3 Usuario Administrador Inicial

El primer usuario ADMIN debe crearse desde Supabase:

1. Ir a Supabase → Authentication → Users
2. Clic en "Add user" → "Create new user"
3. Llenar email y contraseña
4. En tabla `users` agregar registro con rol ADMIN

---

## 10. Paso 6: Alta de Clientes

**Ubicación:** Configuración → Tab "Clientes"

### 10.1 Crear Cliente

1. Clic en "+ Nuevo Cliente"
2. Datos básicos:
   - Nombre comercial (requerido)
   - Razón social principal
   - Segmento: MICRO / PEQUEÑA / MEDIANA / GRANDE / CORPORATIVO
   - Contacto: nombre, email, teléfono
   - Notas
3. Guardar

### 10.2 Agregar RFCs

1. Expandir el cliente
2. En "RFCs Asociados" → "+ Agregar RFC"
3. Llenar:
   - RFC (se valida formato SAT)
   - Razón social
   - Tipo persona: PF / PM
4. Guardar RFC

### 10.3 Asignar Regímenes al RFC

1. En el RFC, sección "Regímenes"
2. Marcar checkboxes de regímenes aplicables
3. Los cambios se guardan automáticamente

### 10.4 Asignar Equipo al RFC

1. En el RFC, selector "Equipo/Tribu"
2. Elegir el equipo responsable
3. Guardar

### 10.5 Configurar Servicios Contratados

1. En el cliente, sección "Servicios Contratados"
2. Marcar servicios que aplican
3. Por cada servicio:
   - Fecha de inicio
   - Talla asignada (XS a XL)
4. Guardar

### 10.6 Verificar Configuración

Al terminar, el resumen debe mostrar:
```
Cliente: Abarrotes Lupita
RFCs: 1
Regímenes: 601, 612
Servicios: Nómina Quincenal (M), IMSS Mensual (S)
Equipo: Tribu Isidora
Obligaciones aplicables: 4
```

---

## 11. Paso 7: Generación de Tareas

### 11.1 Generar Tareas por Período

**Vía API:**

```bash
curl -X POST "https://tu-app.com/api/engine/generate-tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu-token" \
  -d '{
    "periodo": "2026-01"
  }'
```

**Parámetros:**
- `periodo`: Formato "YYYY-MM" (requerido)
- `contribuyenteId`: UUID opcional para generar solo un RFC

### 11.2 Proceso de Generación

El motor automáticamente:

1. Obtiene todos los RFCs activos
2. Por cada RFC:
   - Lee regímenes vigentes
   - Consulta obligaciones aplicables (matriz)
   - Filtra por servicios contratados
   - Crea tarea por cada obligación
3. Asigna:
   - Fecha límite según regla de calendario
   - Responsable según equipo del RFC
   - Puntos según talla

### 11.3 Verificar Tareas Generadas

1. Ir al TMR (Dashboard)
2. Verificar que aparecen las tareas
3. Revisar asignaciones correctas:
   - RFC correcto
   - Obligación correcta
   - Responsable correcto
   - Fecha límite correcta

---

## 12. Verificación Final

### 12.1 Checklist de Configuración

**Catálogos:**
- [ ] Regímenes fiscales creados
- [ ] Obligaciones fiscales creadas
- [ ] Reglas de calendario configuradas
- [ ] Servicios definidos

**Procesos:**
- [ ] Procesos creados (NOMINA, IMSS, etc.)
- [ ] Pasos con pesos que suman 100%
- [ ] Tipos de colaborador asignados

**Matriz:**
- [ ] Regímenes vinculados a obligaciones
- [ ] Obligaciones vinculadas a procesos
- [ ] Obligaciones vinculadas a calendario

**Usuarios:**
- [ ] Equipos/tribus creados
- [ ] Usuarios con roles correctos
- [ ] Al menos un ADMIN activo

**Clientes:**
- [ ] Clientes con RFCs
- [ ] RFCs con regímenes
- [ ] Servicios contratados
- [ ] Tallas asignadas
- [ ] Equipos asignados

**Tareas:**
- [ ] Motor ejecutado para período actual
- [ ] Tareas visibles en TMR
- [ ] Asignaciones correctas

### 12.2 Prueba de Flujo Completo

1. **Login:** Ingresar como colaborador
2. **Ver tarea:** Localizar una tarea asignada
3. **Cambiar estado:** Pendiente → En Curso
4. **Simular trabajo:** Cambiar a Pend. Evidencia
5. **Subir evidencia:** (cuando esté implementado)
6. **Solicitar VoBo:** Cambiar a En Validación
7. **Login como líder:** Dar VoBo
8. **Verificar puntos:** Confirmar que se calculan

### 12.3 Troubleshooting

**No aparecen tareas:**
- Verificar que el período sea correcto
- Verificar que el RFC tenga régimen y servicios
- Verificar que la obligación esté en la matriz

**Puntos en 0:**
- Verificar estado = Terminado/Cerrado
- Verificar evidencia subida
- Verificar VoBo dado
- Verificar auditoría aprobada

**Usuario no puede ingresar:**
- Verificar email correcto
- Verificar que existe en tabla `users`
- Revisar logs de Supabase Auth

---

## Soporte

Para problemas durante la configuración:

1. Revisar logs en consola del navegador (F12)
2. Revisar logs en Supabase Dashboard
3. Consultar documentación en `/docs`
4. Contactar al equipo de desarrollo

---

*Guía de Configuración v1.0 - Enero 2026*
*SGR CBC - Sistema de Gestión de Resultados*
