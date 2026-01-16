# 📋 Plan de Pruebas Integrales - SGR CBC

> **Versión:** 1.0
> **Fecha:** 2026-01-16
> **Branch:** `claude/consolidated-fixes-6Ksdb`

---

## Pre-requisitos

```bash
# En Claude Code Web o local
npm install
npm run build  # Verificar que compila sin errores
npm run dev    # Iniciar servidor en localhost:3000
```

---

## 🔐 1. AUTENTICACIÓN

| # | Prueba | Pasos | Resultado Esperado |
|---|--------|-------|-------------------|
| 1.1 | Login válido | Ir a `/login`, ingresar credenciales válidas | Redirige a dashboard según rol |
| 1.2 | Login inválido | Ingresar credenciales incorrectas | Muestra mensaje de error |
| 1.3 | Logout | Click en "Cerrar sesión" en sidebar | Redirige a `/login`, limpia sesión |
| 1.4 | Sesión expirada | Esperar timeout o borrar cookies | Redirige a login al navegar |

---

## 🧭 2. NAVEGACIÓN Y ROLES

### 2.1 Sidebar (Verificar fix de accesibilidad)

| # | Prueba | Pasos | Resultado Esperado |
|---|--------|-------|-------------------|
| 2.1.1 | Colapsar sidebar | Click en botón chevron | Sidebar se contrae, muestra solo íconos |
| 2.1.2 | **Accesibilidad** | Inspeccionar botón con DevTools | Debe tener `aria-label` y `aria-expanded` |
| 2.1.3 | Navegación teclado | Tab hasta el botón, presionar Enter | Sidebar se colapsa/expande |

### 2.2 Menú por Rol

| Rol | Menú visible | Página inicial |
|-----|--------------|----------------|
| COLABORADOR | Mi Día, Calendario, Clientes | `/dashboard/mi-dia` |
| LIDER | Mi Equipo, Validaciones, Seguimientos + anteriores | `/dashboard/equipo` |
| AUDITOR | Auditorías, TMR, Clientes, Calendario | `/dashboard/auditor` |
| SOCIO | TMR, Ejecutivo, Análisis, Configuración + todos | `/dashboard` |
| ADMIN | Todo el menú | `/dashboard` |

---

## 📊 3. TMR (Dashboard Principal)

| # | Prueba | Pasos | Resultado Esperado |
|---|--------|-------|-------------------|
| 3.1 | Carga inicial | Navegar a `/dashboard` | Muestra tabla de entregables sin errores |
| 3.2 | Filtros | Usar filtros de estado, cliente, tribu | Tabla se actualiza correctamente |
| 3.3 | Datos relacionales | Verificar columnas cliente, responsable, tribu | Muestra nombres, no IDs ni "null" |
| 3.4 | Estados | Verificar badges de estado | Colores correctos por estado |

---

## 📈 4. ANÁLISIS (Verificar fix de hydration)

| # | Prueba | Pasos | Resultado Esperado |
|---|--------|-------|-------------------|
| 4.1 | Carga sin errores | Navegar a `/dashboard/analisis` | No errores en consola de hydration |
| 4.2 | Selector de proceso | Cambiar proceso en dropdown | Gráficas se actualizan |
| 4.3 | Rango de fechas | Cambiar a 60, 90, 180 días | Fechas mostradas cambian correctamente |
| 4.4 | Tab Backlog | Click en pestaña "Backlog" | Muestra análisis de backlog |

---

## 📅 5. CALENDARIO

| # | Prueba | Pasos | Resultado Esperado |
|---|--------|-------|-------------------|
| 5.1 | Vista mensual | Navegar a `/dashboard/calendario` | Muestra calendario del mes actual |
| 5.2 | Vista semanal | Cambiar a vista semanal | Muestra semana actual |
| 5.3 | Navegación | Click en flechas anterior/siguiente | Cambia mes/semana |
| 5.4 | Tareas en fecha | Ver día con tareas | Muestra indicadores de tareas |

---

## 📥 6. IMPORT EXCEL (Verificar fix de seguridad)

| # | Prueba | Pasos | Resultado Esperado |
|---|--------|-------|-------------------|
| 6.1 | Acceso | Ir a `/dashboard/configuracion` → Clientes o Colaboradores | Muestra opción de importar |
| 6.2 | Archivo XLSX | Subir archivo .xlsx válido | Parsea y muestra preview |
| 6.3 | Archivo CSV | Subir archivo .csv válido | Parsea y muestra preview |
| 6.4 | Archivo inválido | Subir archivo sin columnas requeridas | Muestra error descriptivo |
| 6.5 | Drag & Drop | Arrastrar archivo al área | Acepta el archivo |

### Archivo de prueba para clientes (CSV):

```csv
Nombre del Cliente,RFC,Tipo Persona (PF/PM),Régimen Fiscal (Código),Talla Fiscal (XS-XL),Talla Nómina (XS-XL),Talla IMSS (XS-XL),Tribu / Equipo
Empresa Test,ABC123456789,PM,601,M,S,S,Tribu Alpha
```

### Archivo de prueba para colaboradores (CSV):

```csv
Nombre de la Tribu,Nombre Completo,Correo Electrónico,Rol (LIDER/AUXILIAR_A/B/C)
Tribu Alpha,Juan Pérez,juan@example.com,AUXILIAR_A
```

---

## ⚙️ 7. CONFIGURACIÓN

| # | Prueba | Pasos | Resultado Esperado |
|---|--------|-------|-------------------|
| 7.1 | Acceso por rol | Login como COLABORADOR, ir a config | No debe aparecer en menú |
| 7.2 | Tabs | Click en cada tab (Clientes, Colaboradores, etc.) | Carga contenido sin errores |
| 7.3 | Ausencias | Ir a Configuración → Ausencias | Lista ausencias, permite crear |

---

## 🔍 8. CONSOLA DEL NAVEGADOR

**Abrir DevTools (F12) → Console y verificar:**

| Tipo | Qué buscar | Acción si aparece |
|------|------------|-------------------|
| 🔴 Error | `Hydration failed` | Bug de SSR - reportar |
| 🔴 Error | `Cannot read property of null` | Null check faltante |
| 🟡 Warning | `Each child should have unique key` | Key prop faltante |
| 🟡 Warning | `useEffect has missing dependency` | Hook mal configurado |
| 🟢 Info | Network requests failing | Verificar Supabase/API |

---

## 📱 9. RESPONSIVE (Opcional)

| Dispositivo | Resolución | Verificar |
|-------------|------------|-----------|
| Desktop | 1920x1080 | Layout completo |
| Tablet | 768x1024 | Sidebar colapsable |
| Mobile | 375x667 | Menú hamburguesa |

---

## ✅ Checklist Final

- [ ] Login/Logout funciona
- [ ] Navegación por rol correcta
- [ ] Sidebar accesible (aria-label)
- [ ] TMR carga datos correctamente
- [ ] Análisis sin errores de hydration
- [ ] Import Excel funciona (XLSX y CSV)
- [ ] Sin errores críticos en consola
- [ ] Datos relacionales muestran nombres, no nulls

---

## 📝 Registro de Resultados

| Fecha | Tester | Sección | Resultado | Notas |
|-------|--------|---------|-----------|-------|
| | | | | |
| | | | | |
| | | | | |

---

## 🐛 Bugs Encontrados

| # | Sección | Descripción | Severidad | Estado |
|---|---------|-------------|-----------|--------|
| | | | | |
| | | | | |
