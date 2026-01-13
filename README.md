# SGR CBC - Sistema de Gestión de Resultados

Sistema integral de gestión de obligaciones fiscales mexicanas y procesos operativos para despachos contables.

## Descripción

**SGR CBC** (Sistema de Gestión de Resultados - Cumplimiento y Compliance) es una plataforma web que permite:

- Gestionar obligaciones fiscales (Nómina, IMSS, ISR, IVA, DIOT, etc.)
- Asignar y rastrear tareas por equipo/colaborador
- Validar cumplimiento con auditoría y VoBo de líderes
- Calcular puntuación/méritos basada en entregables completados
- Generar tareas automáticamente por período fiscal

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | Next.js 16 + React 19 + TypeScript 5 |
| Backend | Next.js API Routes |
| Autenticación | Supabase Auth |
| Base de Datos | PostgreSQL (Supabase) |
| Estilos | Tailwind CSS 4 |
| Iconos | Lucide React |
| Importación Excel | XLSX |

## Requisitos Previos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase con proyecto configurado

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/gonzalodev-ops/sgr-cbc.git
cd sgr-cbc
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### 4. Configurar base de datos

Ejecutar en orden en Supabase SQL Editor:

```bash
# 1. Esquema principal
supabase/schema.sql

# 2. Datos iniciales
supabase/seed_data_fixed.sql

# 3. Políticas RLS
supabase/rls_policies.sql

# 4. Trigger de autenticación
supabase/auth_trigger.sql
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Estructura del Proyecto

```
sgr-cbc/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Página inicio
│   │   ├── login/                    # Autenticación
│   │   ├── dashboard/                # Panel principal (protegido)
│   │   │   ├── page.tsx              # TMR - Tablero Maestro
│   │   │   ├── configuracion/        # 7 tabs de configuración
│   │   │   ├── cliente/              # Gestión de clientes
│   │   │   ├── colaborador/          # Métricas por persona
│   │   │   ├── tribu/                # Métricas por equipo
│   │   │   ├── auditor/              # Panel de auditoría
│   │   │   ├── entregables/          # Catálogo
│   │   │   └── calendario/           # Vista calendario
│   │   └── api/                      # API Routes
│   │       ├── admin/create-user/    # Crear usuarios
│   │       ├── engine/generate-tasks/# Generar tareas
│   │       └── templates/            # Descargar templates
│   │
│   ├── components/
│   │   ├── layout/                   # Sidebar, Header
│   │   ├── config/                   # Tabs de configuración
│   │   └── import/                   # Importación Excel
│   │
│   └── lib/
│       ├── types/                    # Tipos TypeScript
│       ├── data/                     # Datos mock
│       ├── supabase/                 # Cliente Supabase
│       └── engine/                   # Motor de tareas
│
├── supabase/
│   ├── schema.sql                    # Esquema de BD
│   ├── seed_data_fixed.sql           # Datos iniciales
│   ├── rls_policies.sql              # Políticas RLS
│   └── migrations/                   # Migraciones
│
├── docs/
│   ├── PLAN_CONFIGURACION_MVP.md     # Plan MVP
│   ├── MANUAL_USUARIO.md             # Manual de usuario
│   └── GUIA_CONFIGURACION.md         # Guía de configuración
│
└── plantillas_equipo/                # Templates Excel
    ├── Plantilla_Clientes.xlsx
    └── Plantilla_Usuarios.xlsx
```

## Módulos del Sistema

### 1. Tablero Maestro de Resultados (TMR)

Panel principal que muestra todas las tareas con:
- Filtros por RFC, Tribu, Entregable, Responsable
- KPIs: Meta grupal, puntos acumulados, estados
- Scoring automático basado en completitud

### 2. Configuración (7 Tabs)

| Tab | Función |
|-----|---------|
| Clientes | CRUD de clientes, RFCs, servicios, tallas |
| Obligaciones | Catálogo fiscal + matriz régimen↔obligación |
| Procesos | Procesos operativos con pasos y pesos % |
| SLA | Configuración de tiempos por estado |
| Datos | Catálogos base (regímenes, calendario) |
| Colaboradores | Gestión de usuarios y equipos |
| Servicios | Servicios contratables |

### 3. Motor de Generación de Tareas

Genera automáticamente tareas basándose en:
- RFCs activos y sus regímenes
- Obligaciones aplicables por régimen
- Servicios contratados por cliente
- Reglas de calendario para deadlines

### 4. Sistema de Scoring

```
Puntos = PuntosBase × FactorTalla

Requisitos para sumar puntos:
✓ Estado = "Terminado"
✓ Evidencia subida
✓ VoBo del líder
✓ Auditoría aprobada
```

| Talla | Factor |
|-------|--------|
| XS | 0.5 (50%) |
| S | 0.75 (75%) |
| M | 1.0 (100%) |
| L | 1.5 (150%) |
| XL | 2.0 (200%) |

## Roles del Sistema

### Roles Globales
- **ADMIN**: Acceso total, configuración del sistema
- **SOCIO**: Visión ejecutiva, todos los equipos
- **LIDER**: Gestión de su equipo, VoBo
- **COLABORADOR**: Ejecución de tareas asignadas

### Roles en Equipo
- **LIDER**: Coordinador del equipo
- **AUXILIAR_A**: Expert
- **AUXILIAR_B**: Intermediate
- **AUXILIAR_C**: Junior

## API Endpoints

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/engine/generate-tasks` | POST | Generar tareas por período | ADMIN |
| `/api/admin/create-user` | POST | Crear nuevo usuario | ADMIN |
| `/api/templates/[filename]` | GET | Descargar template Excel | - |

### Ejemplo: Generar tareas

```bash
POST /api/engine/generate-tasks
Content-Type: application/json

{
  "periodo": "2026-01",
  "contribuyenteId": "uuid-opcional"
}
```

## Base de Datos

El sistema utiliza 34 tablas organizadas en:

- **Catálogos Fiscales**: regimen_fiscal, obligacion_fiscal, regimen_obligacion
- **Comercial**: cliente, contribuyente, servicio, cliente_servicio
- **Procesos**: proceso_operativo, proceso_paso
- **Tareas**: tarea, tarea_step, tarea_documento, tarea_auditoria
- **Usuarios**: users, teams, team_members
- **Calendario**: calendario_regla, calendario_deadline, sla_config

## Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar producción
npm start

# Linting
npm run lint
```

## Flujo de Trabajo

```
1. Configuración Inicial
   └─> Catálogos → Procesos → Matriz → Clientes

2. Generación de Tareas
   └─> API genera tareas por período/RFC

3. Ejecución
   └─> Colaborador trabaja → Sube evidencia → Solicita VoBo

4. Validación
   └─> Líder aprueba → Auditor revisa → Puntos asignados

5. Métricas
   └─> TMR → Dashboards por persona/equipo
```

## Documentación Adicional

- [Manual de Usuario](docs/MANUAL_USUARIO.md) - Guía completa para usuarios finales
- [Guía de Configuración](docs/GUIA_CONFIGURACION.md) - Configuración inicial del sistema
- [Plan MVP](docs/PLAN_CONFIGURACION_MVP.md) - Roadmap y estado actual

## Estado del Proyecto

**Versión**: MVP Beta (Sprint 2 completado)

### Funcionalidades Implementadas
- [x] Autenticación con Supabase
- [x] TMR con datos reales
- [x] Configuración completa (7 tabs)
- [x] Motor de generación de tareas
- [x] Métricas por colaborador/tribu
- [x] Panel de auditoría
- [x] Importación desde Excel

### Pendiente
- [ ] Upload de documentos/evidencia
- [ ] Integración con SAT/IMSS
- [ ] Reportes avanzados
- [ ] Notificaciones

## Contribución

1. Crear rama desde `main`
2. Realizar cambios
3. Ejecutar tests y linting
4. Crear Pull Request

## Licencia

Proyecto privado - Todos los derechos reservados.

---

*Documentación actualizada: Enero 2026*
