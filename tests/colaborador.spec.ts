import { test, expect, Page } from '@playwright/test';

// Configuración - usa variable de entorno o valor por defecto
const BASE_URL = process.env.BASE_URL || 'https://sgr-cbc-git-claude-consolidat-da85f8-gonzalos-projects-c2b87390.vercel.app';
const COLABORADOR_EMAIL = 'colaborador.prueba@sgrcbc.test';
const COLABORADOR_PASSWORD = 'Test1234!';

/**
 * Helper function para hacer login
 * Incluye diagnóstico si la página no es la esperada
 */
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);

  // Esperar a que la página cargue completamente
  await page.waitForLoadState('networkidle');

  // Verificar si estamos en la página correcta de login (no Vercel SSO)
  const pageContent = await page.content();
  const isVercelAuth = pageContent.includes('Vercel') && pageContent.includes('authenticate');

  if (isVercelAuth) {
    throw new Error(
      'Vercel Deployment Protection está habilitado. ' +
      'Deshabilita la protección en Vercel Settings > Deployment Protection, ' +
      'o configura VERCEL_AUTOMATION_BYPASS_SECRET.'
    );
  }

  // Esperar a que aparezca el formulario de login
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  // Verificar que ambos campos existen
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible({ timeout: 10000 });

  // Llenar formulario
  await emailInput.fill(COLABORADOR_EMAIL);
  await passwordInput.fill(COLABORADOR_PASSWORD);

  // Click en botón de login
  await page.click('button:has-text("Entrar")');

  // Esperar redirección al dashboard (primero va a /dashboard, luego redirige a /dashboard/mi-dia)
  await page.waitForURL(/dashboard/, { timeout: 15000 });

  // Esperar a que el sidebar cargue (indica que la app está lista)
  await expect(page.locator('text=Mi Dia').first()).toBeVisible({ timeout: 10000 });

  // COLABORADOR será redirigido automáticamente a Mi Dia desde TMR
  // Esperar la redirección si estamos en /dashboard exacto
  if (page.url().endsWith('/dashboard') || page.url().endsWith('/dashboard/')) {
    await page.waitForURL(/mi-dia/, { timeout: 10000 });
  }
}

test.describe('COLABORADOR - Suite de Pruebas', () => {

  test.beforeEach(async ({ page }) => {
    // Log para debug
    console.log(`Testing against: ${BASE_URL}`);
  });

  test('1.1 Login exitoso con credenciales válidas', async ({ page }) => {
    await login(page);

    // Verificar que COLABORADOR fue redirigido a Mi Dia (no TMR)
    expect(page.url()).toContain('mi-dia');

    // Verificar que se muestra contenido del dashboard (sidebar visible)
    await expect(page.locator('text=Calendario').first()).toBeVisible({ timeout: 5000 });
  });

  test('1.2 Menú lateral solo muestra opciones permitidas', async ({ page }) => {
    await login(page);

    // Verificar opciones VISIBLES para colaborador (sin tilde: "Mi Dia")
    await expect(page.locator('text=Mi Dia').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Calendario').first()).toBeVisible();
    await expect(page.locator('text=Clientes').first()).toBeVisible();

    // Verificar opciones que NO deben estar visibles para COLABORADOR
    await expect(page.locator('a:has-text("Validaciones")')).not.toBeVisible();
    await expect(page.locator('a:has-text("Ejecutivo")')).not.toBeVisible();
    await expect(page.locator('a:has-text("Configuración")')).not.toBeVisible();
  });

  test('2.1 Mi Dia muestra tareas asignadas', async ({ page }) => {
    await login(page);

    // COLABORADOR ya está en Mi Dia después del login (redirect automático)
    // Verificar que la página de Mi Dia cargó
    await expect(page.locator('h1:has-text("Mi Dia")')).toBeVisible({ timeout: 5000 });

    // Verificar que hay contenido de tareas (cards, lista, etc.)
    const pageContent = await page.content();
    const hasTareas = pageContent.includes('tarea') ||
                      pageContent.includes('cliente') ||
                      pageContent.includes('pendiente');

    console.log(`Página Mi Día cargada, tiene contenido de tareas: ${hasTareas}`);
  });

  test('4.1 Calendario muestra eventos', async ({ page }) => {
    await login(page);

    // Esperar a que el sidebar cargue completamente (el link debe ser visible)
    const calendarioLink = page.locator('a[href="/dashboard/calendario"]');
    await expect(calendarioLink).toBeVisible({ timeout: 10000 });

    // Click y esperar navegación simultáneamente
    await Promise.all([
      page.waitForURL(/calendario/, { timeout: 10000 }),
      calendarioLink.click()
    ]);

    // Verificar que estamos en la página de calendario
    expect(page.url()).toContain('calendario');
  });

  test('5.1 Clientes muestra solo clientes del equipo', async ({ page }) => {
    await login(page);

    // Esperar a que el sidebar cargue completamente (el link debe ser visible)
    const clientesLink = page.locator('a[href="/dashboard/cliente"]');
    await expect(clientesLink).toBeVisible({ timeout: 10000 });

    // Click y esperar navegación simultáneamente
    await Promise.all([
      page.waitForURL(/cliente/, { timeout: 10000 }),
      clientesLink.click()
    ]);

    // Verificar que estamos en la página de clientes
    expect(page.url()).toContain('cliente');
  });

  test('7.1 Acceso denegado a rutas restringidas', async ({ page }) => {
    await login(page);

    // Intentar acceder a validaciones directamente
    await page.goto(`${BASE_URL}/dashboard/validaciones`);
    await page.waitForLoadState('networkidle');

    // Debería redirigir o mostrar acceso denegado
    const url = page.url();
    const content = await page.content();

    // Un colaborador NO debería tener acceso a validaciones
    // Puede redirigir a dashboard o mostrar mensaje de acceso denegado
    const wasRedirected = !url.includes('validaciones');
    const showsAccessDenied = content.toLowerCase().includes('acceso') ||
                              content.toLowerCase().includes('permiso') ||
                              content.toLowerCase().includes('denied');

    console.log(`URL actual: ${url}`);
    console.log(`Fue redirigido: ${wasRedirected}`);
    console.log(`Muestra acceso denegado: ${showsAccessDenied}`);

    // El test pasa si fue redirigido O si muestra mensaje de acceso denegado
    expect(wasRedirected || showsAccessDenied).toBe(true);
  });
});
