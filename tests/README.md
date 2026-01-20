# Tests E2E - SGR-CBC

## Prerrequisitos

1. Node.js 18+
2. npm o yarn

## Instalación

```bash
# Instalar dependencias de Playwright
npm install -D @playwright/test

# Instalar navegadores
npx playwright install chromium
```

## Ejecutar Tests

### Opción 1: Script automatizado
```bash
chmod +x scripts/run-tests.sh
./scripts/run-tests.sh
```

### Opción 2: Comando directo
```bash
npx playwright test
```

### Opción 3: Modo UI (visual)
```bash
npx playwright test --ui
```

## Tests Disponibles

### `colaborador.spec.ts`
Tests para el rol COLABORADOR:

| Test | Descripción |
|------|-------------|
| 1.1 | Login exitoso con credenciales válidas |
| 1.2 | Menú lateral solo muestra opciones permitidas |
| 2.1 | Mi Día muestra tareas asignadas |
| 4.1 | Calendario muestra eventos |
| 5.1 | Clientes muestra solo clientes del equipo |
| 7.1 | Acceso denegado a rutas restringidas |

## Credenciales de Prueba

```
Email: colaborador.prueba@sgrcbc.test
Password: Test1234!
```

## Configuración

La URL base se puede cambiar en `tests/colaborador.spec.ts`:

```typescript
const BASE_URL = 'https://tu-url-de-vercel.app';
```

## Ver Resultados

```bash
# Ver reporte HTML
npx playwright show-report

# Ver screenshots de fallos
# Los screenshots se guardan en test-results/
```
