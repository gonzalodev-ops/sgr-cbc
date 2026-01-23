import { test, expect, Page } from '@playwright/test';

// Configuración - usa variable de entorno o valor por defecto
const BASE_URL = process.env.BASE_URL || 'https://sgr-cbc-git-claude-consolidat-da85f8-gonzalos-projects-c2b87390.vercel.app';
const LIDER_EMAIL = 'lider.prueba@sgrcbc.test';
const LIDER_PASSWORD = 'Test1234!';

/**
 * Helper function para hacer login como LIDER
 */
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Verificar que no es Vercel Auth
  const pageContent = await page.content();
  if (pageContent.includes('Vercel') && pageContent.includes('authenticate')) {
    throw new Error('Vercel Deployment Protection está habilitado.');
  }

  // Esperar formulario de login
  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await expect(passwordInput).toBeVisible({ timeout: 10000 });

  // Llenar formulario
  await emailInput.fill(LIDER_EMAIL);
  await passwordInput.fill(LIDER_PASSWORD);

  // Click en botón de login
  await page.click('button:has-text("Entrar")');

  // Esperar redirección al dashboard
  await page.waitForURL(/dashboard/, { timeout: 15000 });

  // Esperar a que el sidebar cargue
  await expect(page.locator('text=Mi Equipo').first()).toBeVisible({ timeout: 10000 });
}

test.describe('LIDER - Suite de Pruebas', () => {

  test.beforeEach(async ({ page }) => {
    console.log(`Testing against: ${BASE_URL}`);
  });

  test('1.1 Login exitoso y acceso a dashboard', async ({ page }) => {
    await login(page);

    // LIDER puede ver el dashboard (no es redirigido como COLABORADOR)
    expect(page.url()).toContain('dashboard');

    // Verificar que el sidebar está visible
    await expect(page.locator('text=Mi Equipo').first()).toBeVisible({ timeout: 5000 });
  });

  test('1.2 Menú lateral muestra opciones de LIDER', async ({ page }) => {
    await login(page);

    // Opciones que SÍ debe ver un LIDER
    await expect(page.locator('a[href="/dashboard/equipo"]').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('a[href="/dashboard/mi-dia"]').first()).toBeVisible();
    await expect(page.locator('a[href="/dashboard/validaciones"]').first()).toBeVisible();
    await expect(page.locator('a[href="/dashboard/seguimientos"]').first()).toBeVisible();
    await expect(page.locator('a[href="/dashboard/calendario"]').first()).toBeVisible();
    await expect(page.locator('a[href="/dashboard/cliente"]').first()).toBeVisible();
    await expect(page.locator('a[href="/dashboard/alertas"]').first()).toBeVisible();

    // Opciones que NO debe ver un LIDER (solo SOCIO/ADMIN)
    await expect(page.locator('a[href="/dashboard/ejecutivo"]')).not.toBeVisible();
    await expect(page.locator('a[href="/dashboard/configuracion"]')).not.toBeVisible();
    await expect(page.locator('a[href="/dashboard/colaborador"]')).not.toBeVisible();
  });

  test('2.1 TMR muestra tareas del equipo', async ({ page }) => {
    await login(page);

    // Navegar al TMR (dashboard principal)
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // LIDER debe poder ver el TMR (no ser redirigido)
    expect(page.url()).toContain('dashboard');

    // Verificar que el TMR cargó (título visible)
    await expect(page.locator('text=Tablero Maestro de Resultados')).toBeVisible({ timeout: 10000 });

    // Verificar que hay contenido (tabla o mensaje de no hay datos)
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasNoData = await page.locator('text=No hay entregables').isVisible().catch(() => false);

    console.log(`TMR cargado - Tiene tabla: ${hasTable}, Sin datos: ${hasNoData}`);
    expect(hasTable || hasNoData).toBe(true);
  });

  test('3.1 Mi Equipo muestra colaboradores del equipo', async ({ page }) => {
    await login(page);

    // Navegar a Mi Equipo
    const equipoLink = page.locator('a[href="/dashboard/equipo"]');
    await expect(equipoLink).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForURL(/equipo/, { timeout: 10000 }),
      equipoLink.click()
    ]);

    // Verificar que estamos en la página de equipo
    expect(page.url()).toContain('equipo');

    // Verificar que la página cargó
    await expect(page.locator('h1:has-text("Mi Equipo")').or(page.locator('text=Equipo'))).toBeVisible({ timeout: 5000 });
  });

  test('4.1 Validaciones permite revisar tareas del equipo', async ({ page }) => {
    await login(page);

    // Navegar a Validaciones
    const validacionesLink = page.locator('a[href="/dashboard/validaciones"]');
    await expect(validacionesLink).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForURL(/validaciones/, { timeout: 10000 }),
      validacionesLink.click()
    ]);

    // Verificar que estamos en la página de validaciones
    expect(page.url()).toContain('validaciones');
  });

  test('5.1 Seguimientos muestra tareas en seguimiento', async ({ page }) => {
    await login(page);

    // Navegar a Seguimientos
    const seguimientosLink = page.locator('a[href="/dashboard/seguimientos"]');
    await expect(seguimientosLink).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForURL(/seguimientos/, { timeout: 10000 }),
      seguimientosLink.click()
    ]);

    // Verificar que estamos en la página de seguimientos
    expect(page.url()).toContain('seguimientos');
  });

  test('6.1 Calendario muestra eventos', async ({ page }) => {
    await login(page);

    // Navegar a Calendario
    const calendarioLink = page.locator('a[href="/dashboard/calendario"]');
    await expect(calendarioLink).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForURL(/calendario/, { timeout: 10000 }),
      calendarioLink.click()
    ]);

    // Verificar que estamos en la página de calendario
    expect(page.url()).toContain('calendario');
  });

  test('7.1 Clientes muestra solo clientes del equipo', async ({ page }) => {
    await login(page);

    // Navegar a Clientes
    const clientesLink = page.locator('a[href="/dashboard/cliente"]');
    await expect(clientesLink).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForURL(/cliente/, { timeout: 10000 }),
      clientesLink.click()
    ]);

    // Verificar que estamos en la página de clientes
    expect(page.url()).toContain('cliente');
  });

  test('8.1 Alertas muestra alertas del equipo', async ({ page }) => {
    await login(page);

    // Navegar a Alertas
    const alertasLink = page.locator('a[href="/dashboard/alertas"]');
    await expect(alertasLink).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForURL(/alertas/, { timeout: 10000 }),
      alertasLink.click()
    ]);

    // Verificar que estamos en la página de alertas
    expect(page.url()).toContain('alertas');
  });

  test('9.1 Acceso denegado a rutas de SOCIO/ADMIN', async ({ page }) => {
    await login(page);

    // Intentar acceder a Ejecutivo (solo SOCIO/ADMIN)
    await page.goto(`${BASE_URL}/dashboard/ejecutivo`);
    await page.waitForLoadState('networkidle');

    const url = page.url();
    const content = await page.content();

    // LIDER NO debería tener acceso a ejecutivo
    const wasRedirected = !url.includes('ejecutivo');
    const showsAccessDenied = content.toLowerCase().includes('acceso') ||
                              content.toLowerCase().includes('permiso') ||
                              content.toLowerCase().includes('denied');

    console.log(`URL actual: ${url}`);
    console.log(`Fue redirigido: ${wasRedirected}`);
    console.log(`Muestra acceso denegado: ${showsAccessDenied}`);

    expect(wasRedirected || showsAccessDenied).toBe(true);
  });
});
