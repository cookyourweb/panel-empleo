import { test, expect } from '@playwright/test';
import { inyectarGoogleFalso } from './helpers/mock-google';

test.describe('Borrar cuenta', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarGoogleFalso(page);

    await page.route('**/health', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    await page.route('**/yo', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sub: '123', email: 'test@ejemplo.com', nombre: 'Usuario Test', tiene_perfil: true, origen_master: 'neon', consentimientos: { almacenar_cv: true, enviar_cv_a_ia: true } }) });
    });
    await page.route('**/clave-api*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configurada: false, trial_restante: 3 }) });
    });
    await page.route('**/localhost:5000/cuenta', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204, statusText: 'No Content' });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      }
    });
    await page.route('**/cv', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });

  test('borrar cuenta: confirmar y mostrar pantalla de borrada', async ({ page }) => {
    // Login automatico
    await page.goto('/');
    await page.waitForTimeout(6000);
    console.log('URL tras login:', page.url());

    // Navegar a cuenta
    await page.goto('/cuenta');
    await page.waitForTimeout(6000);
    console.log('URL en cuenta:', page.url());

    const hs = await page.locator('h1, h2').allTextContents();
    console.log('HEADINGS:', JSON.stringify(hs));

    // Hacer clic en "Borrar mi cuenta" (data-borrar)
    await page.locator('[data-borrar]').click();

    // Pantalla de confirmacion con data-confirmar
    await expect(page.locator('[data-confirmar]')).toBeVisible();

    // Confirmar el borrado
    await page.locator('[data-confirmar]').click();

    // Esperar procesamiento
    await page.waitForTimeout(3000);

    // Tras borrar, aparece la pantalla de "cuenta borrada" con data-salir
    await expect(page.locator('[data-salir]')).toBeVisible();
  });
});
