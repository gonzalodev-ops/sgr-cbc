# CLAUDE.md - SGR CBC Project Guide

## Project Overview

**SGR CBC** (Sistema de Gestión de Resultados - Cumplimiento y Compliance) is a web platform for managing Mexican tax obligations and operational processes for accounting firms. The system handles fiscal obligations (Nómina, IMSS, ISR, IVA, DIOT), task assignment and tracking, compliance validation with audit workflows, merit/scoring calculation, and automatic task generation by fiscal period.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5
- **Frontend**: React 19
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Icons**: Lucide React
- **Excel Import/Export**: xlsx

## Quick Start Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── login/             # Authentication pages
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── page.tsx       # TMR - Main task board
│   │   ├── configuracion/ # 7-tab configuration system
│   │   ├── cliente/       # Client management
│   │   ├── colaborador/   # Employee metrics
│   │   ├── tribu/         # Team metrics
│   │   ├── auditor/       # Audit panel
│   │   ├── entregables/   # Deliverables catalog
│   │   ├── calendario/    # Calendar view
│   │   └── ejecutivo/     # Executive dashboard
│   └── api/               # API Routes
│       ├── admin/         # User creation
│       ├── engine/        # Task generation engine
│       └── cron/          # Scheduled jobs
│
├── components/            # React components
│   ├── layout/           # Sidebar, Header
│   ├── config/           # Configuration tab components
│   ├── import/           # Excel import components
│   ├── tarea/            # Task-related components
│   ├── tribu/            # Team components
│   └── [module]/         # Module-specific components
│
├── lib/
│   ├── types/            # TypeScript type definitions
│   │   └── database.ts   # Database schema types
│   ├── supabase/         # Supabase client configuration
│   ├── engine/           # Task generation engine
│   │   ├── taskGenerator.ts  # Core task generation logic
│   │   ├── stepAssigner.ts   # Step assignment logic
│   │   ├── autoReassign.ts   # Auto-reassignment logic
│   │   └── riskDetector.ts   # Risk detection system
│   ├── data/             # Mock/seed data
│   └── utils/            # Utility functions
│
└── middleware.ts         # Auth middleware

supabase/
├── schema.sql            # Main database schema
├── seed_data_fixed.sql   # Initial seed data
├── rls_policies.sql      # Row Level Security policies
├── auth_trigger.sql      # Auth trigger for user creation
└── migrations/           # Database migrations

docs/                     # Project documentation
plantillas_equipo/        # Excel templates for import
```

## Key Architecture Patterns

### Authentication Flow
- Supabase Auth handles authentication
- `middleware.ts` protects dashboard routes
- Auth callback at `/auth/callback` handles OAuth redirects
- User roles: ADMIN, SOCIO, LIDER, COLABORADOR

### Task Generation Engine
Located in `src/lib/engine/`:
- `taskGenerator.ts` - Creates tasks based on RFC regime and contracted services
- `stepAssigner.ts` - Assigns process steps to team members
- `autoReassign.ts` - Handles automatic task reassignment
- `riskDetector.ts` - Detects risks and delays

### Scoring System
```
Points = BasePoints × SizeFactor
Sizes: XS(0.5), S(0.75), M(1.0), L(1.5), XL(2.0)
Requirements: Status=Terminado + Evidence + VoBo + Audit approved
```

### Database Structure
34 tables organized in categories:
- **Fiscal Catalogs**: regimen_fiscal, obligacion_fiscal, regimen_obligacion
- **Commercial**: cliente, contribuyente, servicio, cliente_servicio
- **Processes**: proceso_operativo, proceso_paso
- **Tasks**: tarea, tarea_step, tarea_documento, tarea_auditoria
- **Users**: users, teams, team_members
- **Calendar**: calendario_regla, calendario_deadline, sla_config

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/engine/generate-tasks` | POST | Generate tasks for a period |
| `/api/engine/auto-reassign` | POST | Auto-reassign tasks |
| `/api/engine/delete-tasks` | DELETE | Delete generated tasks |
| `/api/admin/create-user` | POST | Create new user (ADMIN only) |
| `/api/templates/[filename]` | GET | Download Excel templates |
| `/api/cron/generate-tasks` | GET | Cron job for task generation |

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Components in PascalCase, files in kebab-case or PascalCase
- Server components by default, 'use client' only when needed
- Supabase queries in server components when possible

### Database Queries
- Use Supabase client from `src/lib/supabase/`
- Server-side: `createClient()` from server utils
- Client-side: `createBrowserClient()`
- Always apply RLS policies for security

### Component Organization
- Layout components in `components/layout/`
- Feature components in `components/[feature]/`
- Configuration tabs in `components/config/`

## Key Files to Understand

1. `src/app/dashboard/page.tsx` - Main TMR dashboard (34k+ lines)
2. `src/lib/engine/taskGenerator.ts` - Core task generation
3. `src/lib/types/database.ts` - All TypeScript types
4. `supabase/schema.sql` - Complete database schema
5. `src/middleware.ts` - Route protection logic
6. `src/components/config/` - Configuration tab components

## Testing & Deployment

- **Deployment**: Vercel (see `vercel.json`)
- **Linting**: ESLint with Next.js config
- **No test framework currently configured**

## Common Tasks

### Generate Tasks
POST to `/api/engine/generate-tasks` with:
```json
{ "periodo": "2026-01", "contribuyenteId": "optional-uuid" }
```

### Add New Configuration Tab
1. Create component in `src/components/config/TabName.tsx`
2. Import in `src/app/dashboard/configuracion/page.tsx`
3. Add to tab array

### Modify Database Schema
1. Update `supabase/schema.sql`
2. Create migration in `supabase/migrations/`
3. Update types in `src/lib/types/database.ts`
