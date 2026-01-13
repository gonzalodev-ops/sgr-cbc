# Manual de Usuario - SGR CBC

## Sistema de Gestión de Resultados

Bienvenido al manual de usuario de SGR CBC. Esta guía le ayudará a utilizar todas las funcionalidades del sistema de manera efectiva.

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Acceso al Sistema](#2-acceso-al-sistema)
3. [Navegación Principal](#3-navegación-principal)
4. [Tablero Maestro de Resultados (TMR)](#4-tablero-maestro-de-resultados-tmr)
5. [Gestión de Tareas](#5-gestión-de-tareas)
6. [Panel de Configuración](#6-panel-de-configuración)
7. [Métricas y Reportes](#7-métricas-y-reportes)
8. [Roles y Permisos](#8-roles-y-permisos)
9. [Preguntas Frecuentes](#9-preguntas-frecuentes)

---

## 1. Introducción

### ¿Qué es SGR CBC?

SGR CBC es un sistema de gestión integral diseñado para despachos contables que permite:

- **Gestionar obligaciones fiscales**: Nómina, IMSS, ISR, IVA, DIOT y más
- **Asignar tareas**: Distribución automática de trabajo por equipo
- **Medir desempeño**: Sistema de puntuación por entregables completados
- **Controlar cumplimiento**: Auditoría y validación de entregas

### Beneficios del Sistema

| Beneficio | Descripción |
|-----------|-------------|
| Automatización | Generación automática de tareas por período |
| Trazabilidad | Seguimiento completo de cada obligación |
| Métricas | KPIs en tiempo real por persona y equipo |
| Control | Validación multinivel (VoBo + Auditoría) |

---

## 2. Acceso al Sistema

### 2.1 Iniciar Sesión

1. Abrir el navegador web (Chrome, Firefox, Edge)
2. Ingresar la URL del sistema
3. En la pantalla de login:
   - Ingresar **correo electrónico**
   - Ingresar **contraseña**
   - Hacer clic en **"Iniciar Sesión"**

### 2.2 Primer Ingreso

Si es su primera vez:
1. Solicite credenciales al administrador del sistema
2. Al ingresar por primera vez, se recomienda cambiar su contraseña
3. Verifique que su perfil tenga el rol y equipo correctos

### 2.3 Recuperar Contraseña

1. En la pantalla de login, hacer clic en **"¿Olvidaste tu contraseña?"**
2. Ingresar correo electrónico registrado
3. Revisar bandeja de entrada (y spam)
4. Seguir el enlace para crear nueva contraseña

### 2.4 Cerrar Sesión

1. Hacer clic en su nombre/avatar en la parte superior
2. Seleccionar **"Cerrar Sesión"**
3. Será redirigido a la pantalla de login

---

## 3. Navegación Principal

### 3.1 Barra Lateral (Sidebar)

La barra lateral izquierda contiene los accesos principales:

| Icono | Sección | Descripción |
|-------|---------|-------------|
| Home | Dashboard | Tablero Maestro de Resultados |
| Users | Clientes | Gestión de clientes |
| User | Colaborador | Métricas individuales |
| Users | Tribu | Métricas por equipo |
| Shield | Auditor | Panel de auditoría |
| FileText | Entregables | Catálogo de entregables |
| Calendar | Calendario | Vista de fechas límite |
| Settings | Configuración | Panel de administración |

### 3.2 Colapsar/Expandir Sidebar

- Hacer clic en el botón de menú (☰) para colapsar
- En modo colapsado, solo se muestran iconos
- Útil para ganar espacio en pantalla

### 3.3 Barra Superior (Header)

Muestra:
- Nombre del usuario activo
- Rol actual
- Botón de cerrar sesión

---

## 4. Tablero Maestro de Resultados (TMR)

El TMR es la pantalla principal del sistema donde se visualizan y gestionan todas las tareas.

### 4.1 Estructura del TMR

```
┌─────────────────────────────────────────────────────────────┐
│  KPIs: Meta Grupal | Puntos Acumulados | Por Estado         │
├─────────────────────────────────────────────────────────────┤
│  Filtros: RFC | Tribu | Entregable | Responsable  [Reset]   │
├─────────────────────────────────────────────────────────────┤
│  Tabla de Tareas                                            │
│  RFC | Entregable | Talla | Responsable | Estado | ...      │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 KPIs Principales

| KPI | Descripción |
|-----|-------------|
| Meta Grupal | Objetivo de puntos del equipo (ej: 1000 pts) |
| Puntos Filtrados | Puntos según filtros activos |
| Por Estado | Contador de tareas por cada estado |

### 4.3 Filtros Disponibles

- **RFC**: Filtrar por contribuyente específico
- **Tribu**: Ver solo tareas de un equipo
- **Entregable**: Filtrar por tipo de obligación
- **Responsable**: Ver tareas de un colaborador
- **Reset**: Limpiar todos los filtros

### 4.4 Columnas de la Tabla

| Columna | Descripción |
|---------|-------------|
| RFC / Cliente | Identificador fiscal y nombre comercial |
| Entregable | Obligación fiscal (Nómina, IMSS, etc.) |
| Talla | Tamaño del cliente (XS, S, M, L, XL) |
| Responsable | Colaborador asignado + rol |
| Estado | Estado actual de la tarea |
| Evidencia | Indica si hay documentos adjuntos |
| VoBo | Visto bueno del líder |
| Auditoría | Estado de revisión de auditoría |
| Puntos | Puntuación calculada |

### 4.5 Estados de Tarea

| Estado | Color | Descripción |
|--------|-------|-------------|
| Pendiente | Gris | No iniciado |
| En Curso | Azul | Trabajo activo |
| Pend. Evidencia | Amarillo | Falta subir documentos |
| En Validación | Naranja | Esperando VoBo del líder |
| Bloq. Cliente | Rojo | Falta información del cliente |
| Presentado | Verde claro | Enviado a autoridad |
| Pagado | Verde | Pago confirmado |
| Cerrado | Verde oscuro | Completado exitosamente |
| Rechazado | Rojo | Rechazado, requiere corrección |

---

## 5. Gestión de Tareas

### 5.1 Ver Detalle de Tarea

1. En el TMR, hacer clic en la fila de la tarea
2. Se expande mostrando:
   - Pasos del proceso
   - Documentos adjuntos
   - Historial de cambios
   - Comentarios

### 5.2 Cambiar Estado

1. Hacer clic en el estado actual
2. Seleccionar el nuevo estado del menú
3. El sistema registra automáticamente:
   - Fecha y hora del cambio
   - Usuario que realizó el cambio

**Flujo típico de estados:**
```
Pendiente → En Curso → Pend. Evidencia → En Validación → Cerrado
```

### 5.3 Subir Evidencia

1. Localizar la tarea en el TMR
2. Hacer clic en el icono de clip (📎)
3. Seleccionar archivo (PDF, XML, imagen)
4. Agregar descripción opcional
5. Hacer clic en "Subir"

**Tipos de documento:**
- PDF: Declaraciones, acuses
- XML: Comprobantes fiscales
- Imágenes: Capturas de pantalla

### 5.4 Solicitar VoBo (Visto Bueno)

Cuando una tarea está lista para validación:

1. Cambiar estado a **"En Validación"**
2. El líder del equipo recibe notificación
3. El líder revisa y aprueba/rechaza

### 5.5 Sistema de Puntos

Los puntos se calculan automáticamente cuando se cumplen TODOS los requisitos:

```
✓ Estado = "Terminado" o "Cerrado"
✓ Evidencia = Subida
✓ VoBo = Aprobado por líder
✓ Auditoría = Aprobada

Puntos = Puntos Base × Factor de Talla
```

**Factores de Talla:**

| Talla | Factor | Ejemplo (100 pts base) |
|-------|--------|------------------------|
| XS | 0.5 | 50 puntos |
| S | 0.75 | 75 puntos |
| M | 1.0 | 100 puntos |
| L | 1.5 | 150 puntos |
| XL | 2.0 | 200 puntos |

---

## 6. Panel de Configuración

*Disponible solo para usuarios con rol ADMIN*

### 6.1 Acceder a Configuración

1. En la barra lateral, hacer clic en **"Configuración"** (icono de engrane)
2. Se muestran 7 pestañas de configuración

### 6.2 Tab: Clientes

Gestión completa de clientes del despacho.

**Crear Cliente:**
1. Hacer clic en **"+ Nuevo Cliente"**
2. Llenar datos básicos:
   - Nombre comercial (requerido)
   - Razón social
   - Segmento (Micro, Pequeña, Mediana, Grande, Corporativo)
   - Datos de contacto
3. Hacer clic en **"Guardar"**

**Agregar RFC a Cliente:**
1. Expandir el cliente en la lista
2. En sección "RFCs Asociados", hacer clic en **"+ Agregar RFC"**
3. Ingresar:
   - RFC (validado automáticamente)
   - Razón social
   - Tipo persona (PF/PM)
4. Asignar regímenes fiscales (checkboxes)
5. Asignar equipo/tribu responsable

**Configurar Servicios:**
1. En sección "Servicios Contratados"
2. Marcar los servicios que aplican
3. Seleccionar talla por servicio
4. Indicar fecha de inicio

**Asignar Tallas:**
1. En sección "Tallas"
2. Por cada dominio (Fiscal, Nómina, IMSS):
   - Seleccionar talla apropiada
   - Ver ponderación resultante

### 6.3 Tab: Obligaciones

Catálogo de obligaciones fiscales y matriz de aplicabilidad.

**Crear Obligación:**
1. Hacer clic en **"+ Nueva Obligación"**
2. Llenar campos:
   - Nombre corto
   - Descripción
   - Nivel (Federal, Estatal, Seguridad Social)
   - Periodicidad (Mensual, Anual, Eventual)
   - Es informativa (Sí/No)
3. Guardar

**Matriz Régimen-Obligación:**
1. Ir a sub-tab "Matriz"
2. Vista de tabla cruzada:
   - Filas: Regímenes fiscales
   - Columnas: Obligaciones
3. Marcar checkbox donde aplique
4. Al hacer clic en celda marcada, editar:
   - Condición (ej: "Si tiene nómina")
   - Riesgo (Alto/Medio/Bajo)
   - Prioridad

**Vincular a Proceso:**
1. Seleccionar obligación
2. En "Proceso Operativo", elegir proceso asociado
3. En "Regla de Calendario", elegir regla de deadline

### 6.4 Tab: Procesos

Definición de procesos operativos y sus pasos.

**Crear Proceso:**
1. Hacer clic en **"+ Nuevo Proceso"**
2. Ingresar nombre (ej: NOMINA, IMSS)
3. Guardar

**Agregar Pasos:**
1. Expandir el proceso
2. Hacer clic en **"+ Agregar Paso"**
3. Por cada paso definir:
   - Nombre del paso
   - Peso % (contribución al total)
   - Tipo de colaborador (A, B, C)
   - Requiere evidencia (Sí/No)
   - Orden de ejecución

**Validación de Pesos:**
- Barra de progreso muestra suma actual
- Verde: Suma = 100%
- Amarillo: Suma < 100%
- Rojo: Suma > 100%
- La suma DEBE ser exactamente 100%

**Ejemplo NOMINA:**

| # | Paso | Peso | Colaborador |
|---|------|------|-------------|
| 1 | Consulta incidencias | 30% | C |
| 2 | Captura incidencias | 30% | C |
| 3 | Procesar nómina | 30% | C |
| 4 | Timbrar | 5% | C |
| 5 | Enviar | 5% | C |
| | **TOTAL** | **100%** | |

### 6.5 Tab: SLA

Configuración de tiempos límite por estado.

**Configurar SLA por Estado:**

| Estado | Cuenta Tiempo | Pausa | Días Límite |
|--------|--------------|-------|-------------|
| Pendiente | Sí | No | - |
| En Curso | Sí | No | - |
| Pend. Evidencia | Sí | No | 2 |
| En Validación | Sí | No | 1 |
| Bloq. Cliente | No | Sí | - |
| Presentado | Sí | No | - |
| Cerrado | No | No | - |

**Campos editables:**
- **Cuenta Tiempo**: Si el tiempo corre en este estado
- **Pausa**: Si este estado pausa el conteo de SLA
- **Días Límite**: Días máximos permitidos en este estado

### 6.6 Tab: Datos

Catálogos base del sistema.

**Regímenes Fiscales:**
- Crear/editar regímenes (601, 612, 625, etc.)
- Definir tipo persona (PF, PM, Ambos)
- Marcar vigencia

**Reglas de Calendario:**
- Definir fechas límite (día 17, día 28, etc.)
- Asociar a obligaciones

**Entregables:**
- Catálogo de tipos de entregable
- Base para asignación de puntos

### 6.7 Tab: Colaboradores

Gestión de usuarios del sistema.

**Crear Usuario:**
1. Hacer clic en **"+ Nuevo Usuario"**
2. Llenar datos:
   - Nombre completo
   - Correo electrónico
   - Rol global (Admin, Socio, Líder, Colaborador)
   - Equipo asignado
3. Guardar (se envía invitación por email)

**Importar desde Excel:**
1. Hacer clic en **"Importar"**
2. Descargar plantilla
3. Llenar datos en Excel
4. Arrastrar archivo al área de carga
5. Verificar preview
6. Confirmar importación

### 6.8 Tab: Servicios

Catálogo de servicios contratables.

**Crear Servicio:**
1. Hacer clic en **"+ Nuevo Servicio"**
2. Ingresar nombre y descripción
3. Asociar obligaciones incluidas
4. Guardar

---

## 7. Métricas y Reportes

### 7.1 Métricas por Colaborador

Acceso: Sidebar → **Colaborador**

**Información mostrada:**
- Lista de todos los colaboradores
- Por cada uno:
  - Tareas pendientes
  - Tareas en curso
  - Tareas completadas
  - Puntos acumulados
  - % entregas a tiempo
  - Equipo asignado

**Filtros:**
- Por equipo/tribu
- Por período

### 7.2 Métricas por Tribu

Acceso: Sidebar → **Tribu**

**Información mostrada:**
- Lista de equipos/tribus
- Por cada uno:
  - Cantidad de miembros
  - Tareas (pendientes, en curso, completadas)
  - Puntos totales del equipo
  - % cumplimiento
  - Tareas en riesgo

**Expandir equipo:**
- Ver detalle de cada miembro
- Ver distribución de tareas

### 7.3 Panel de Auditoría

Acceso: Sidebar → **Auditor** (requiere rol Auditor)

**Funcionalidades:**
- Lista de tareas pendientes de auditoría
- Por cada tarea:
  - Ver documentos adjuntos
  - Ver historial de estados
  - Aprobar o Rechazar
  - Agregar comentarios

**Flujo de auditoría:**
1. Tarea llega con estado "En Validación"
2. Líder da VoBo
3. Auditor revisa documentos
4. Auditor aprueba o rechaza
5. Si aprueba: puntos se suman
6. Si rechaza: tarea vuelve a colaborador

---

## 8. Roles y Permisos

### 8.1 Roles Globales

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| ADMIN | Administrador | Acceso total, configuración |
| SOCIO | Socio del despacho | Ver todo, no editar config |
| LIDER | Líder de equipo | Gestionar su equipo, dar VoBo |
| COLABORADOR | Ejecutor | Ver y ejecutar tareas asignadas |

### 8.2 Roles en Equipo

| Rol | Nivel | Tareas Típicas |
|-----|-------|----------------|
| LIDER | Coordinador | Asignar, validar, reportar |
| AUXILIAR_A | Expert | Tareas complejas, validación |
| AUXILIAR_B | Intermediate | Tareas estándar |
| AUXILIAR_C | Junior | Tareas operativas, captura |

### 8.3 Matriz de Permisos

| Acción | ADMIN | SOCIO | LIDER | COLABORADOR |
|--------|-------|-------|-------|-------------|
| Ver TMR | ✓ | ✓ | ✓ | ✓ |
| Editar tareas | ✓ | - | Equipo | Propias |
| Dar VoBo | ✓ | - | ✓ | - |
| Auditar | ✓ | - | - | - |
| Configuración | ✓ | - | - | - |
| Ver métricas | ✓ | ✓ | Equipo | Propias |
| Crear usuarios | ✓ | - | - | - |
| Generar tareas | ✓ | - | - | - |

---

## 9. Preguntas Frecuentes

### P: ¿Por qué no veo puntos en mi tarea completada?

**R:** Los puntos se asignan solo cuando se cumplen TODOS los requisitos:
1. Estado = Terminado/Cerrado
2. Evidencia subida
3. VoBo del líder
4. Auditoría aprobada

Verifique cada uno de estos puntos.

### P: ¿Cómo cambio mi contraseña?

**R:** Actualmente debe solicitarlo al administrador. En próximas versiones se habilitará el cambio desde el perfil.

### P: ¿Puedo ver tareas de otros equipos?

**R:** Depende de su rol:
- ADMIN/SOCIO: Ven todas las tareas
- LIDER: Ve tareas de su equipo
- COLABORADOR: Ve solo sus tareas

### P: ¿Qué significa cada talla?

**R:** La talla indica el tamaño/complejidad del cliente:
- XS: Extra chico (50% de puntos base)
- S: Chico (75%)
- M: Mediano (100%)
- L: Grande (150%)
- XL: Extra grande (200%)

### P: ¿Cómo se calculan las fechas límite?

**R:** Las fechas se calculan según reglas de calendario configuradas por el administrador, generalmente basadas en la periodicidad de cada obligación (mensual día 17, anual en abril, etc.).

### P: ¿Puedo trabajar desde el celular?

**R:** El sistema es responsive y puede accederse desde dispositivos móviles, aunque la experiencia óptima es en computadora de escritorio.

### P: ¿Qué hago si una tarea está "Bloqueada por Cliente"?

**R:** Este estado indica que falta información del cliente. Acciones:
1. Contactar al cliente solicitando la información
2. Documentar el seguimiento
3. Una vez recibida la info, cambiar a "En Curso"

### P: ¿Cómo importo clientes masivamente?

**R:**
1. Ir a Configuración → Clientes
2. Hacer clic en "Importar"
3. Descargar la plantilla Excel
4. Llenar datos siguiendo el formato
5. Arrastrar el archivo completo
6. Revisar preview y confirmar

---

## Soporte

Para asistencia técnica o dudas sobre el sistema:

- **Email**: soporte@sgr-cbc.com
- **Teléfono**: Contactar al administrador interno

---

*Manual de Usuario v1.0 - Enero 2026*
*SGR CBC - Sistema de Gestión de Resultados*
