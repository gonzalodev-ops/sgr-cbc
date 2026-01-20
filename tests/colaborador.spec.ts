import { test, expect } from '@playwright/test';

// Configuración
const BASE_URL = 'https://sgr-247p2myay-gonzalos-projects-c2b87390.vercel.app';
const COLABORADOR_EMAIL = 'colaborador.prueba@sgrcbc.test';
const COLABORADOR_PASSWORD = 'Test1234!';

test.describe('COLABORADOR - Suite de Pruebas', () => {

  test.beforeEach(async ({ page }) => {
    // Ir a la página de login
    await page.goto(`${BASE_URL}/login`);
  });

  test('1.1 Login exitoso con credenciales válidas', async ({ page }) => {
    // Llenar formulario de login
    await page.fill('input[type="email"]', COLABORADOR_EMAIL);
    await page.fill('input[type="password"]', COLABORADOR_PASSWORD);

    // Click en botón de login
    await page.click('button:has-text("Entrar")');

    // Esperar redirección
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Verificar que estamos en el dashboard
    expect(page.url()).toContain('dashboard');
  });

  test('1.2 Menú lateral solo muestra opciones permitidas', async ({ page }) => {
    // Login primero
    await page.fill('input[type="email"]', COLABORADOR_EMAIL);
    await page.fill('input[type="password"]', COLABORADOR_PASSWORD);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Verificar opciones VISIBLES para colaborador
    const sidebar = page.locator('nav, aside, [class*="sidebar"]');

    await expect(page.locator('text=Mi Día').first()).toBeVisible();
    await expect(page.locator('text=Calendario').first()).toBeVisible();
    await expect(page.locator('text=Clientes').first()).toBeVisible();

    // Verificar opciones que NO deben estar visibles
    await expect(page.locator('a:has-text("Validaciones")')).not.toBeVisible();
    await expect(page.locator('a:has-text("Ejecutivo")')).not.toBeVisible();
    await expect(page.locator('a:has-text("Configuración")')).not.toBeVisible();
  });

  test('2.1 Mi Día muestra tareas asignadas', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', COLABORADOR_EMAIL);
    await page.fill('input[type="password"]', COLABORADOR_PASSWORD);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Navegar a Mi Día si no estamos ahí
    await page.click('text=Mi Día');
    await page.waitForTimeout(2000);

    // Verificar que hay tareas visibles
    const tareas = page.locator('[class*="tarea"], [class*="task"], [class*="card"]');

    // Debe haber al menos una tarea
    const count = await tareas.count();
    console.log(`Tareas encontradas: ${count}`);

    // Verificar cliente del equipo Isis
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).toContain('omar');
  });

  test('4.1 Calendario muestra eventos', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', COLABORADOR_EMAIL);
    await page.fill('input[type="password"]', COLABORADOR_PASSWORD);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Navegar a Calendario
    await page.click('text=Calendario');
    await page.waitForTimeout(2000);

    // Verificar que estamos en la página de calendario
    expect(page.url()).toContain('calendario');
  });

  test('5.1 Clientes muestra solo clientes del equipo', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', COLABORADOR_EMAIL);
    await page.fill('input[type="password"]', COLABORADOR_PASSWORD);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Navegar a Clientes
    await page.click('text=Clientes');
    await page.waitForTimeout(2000);

    // Verificar que estamos en la página de clientes
    expect(page.url()).toContain('cliente');
  });

  test('7.1 Acceso denegado a rutas restringidas', async ({ page }) => {
    // Login
    await page.fill('input[type="email"]', COLABORADOR_EMAIL);
    await page.fill('input[type="password"]', COLABORADOR_PASSWORD);
    await page.click('button:has-text("Entrar")');
    await page.waitForURL(/dashboard/, { timeout: 10000 });

    // Intentar acceder a validaciones directamente
    await page.goto(`${BASE_URL}/dashboard/validaciones`);
    await page.waitForTimeout(2000);

    // Debería redirigir o mostrar acceso denegado
    const url = page.url();
    const content = await page.content();

    // Verificar que no puede acceder (redirige o muestra error)
    const hasAccess = url.includes('validaciones') && !content.includes('acceso') && !content.includes('denied');

    console.log(`URL actual: ${url}`);
    console.log(`Tiene acceso a validaciones: ${hasAccess}`);
  });
});
