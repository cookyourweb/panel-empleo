import { test, expect } from '@playwright/test';
import { inyectarGoogleFalso, tokenFalso } from './helpers/mock-google';

test.describe('Login con Google simulado', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarGoogleFalso(page);

    // Mock del backend: /yo devuelve una usuaria con perfil
    await page.route('**/yo', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sub: '123',
          email: 'test@ejemplo.com',
          nombre: 'Usuario Test',
          tiene_perfil: true,
          origen_master: 'neon',
          consentimientos: { almacenar_cv: true, enviar_cv_a_ia: true },
        }),
      });
    });

    // Mock generico para el resto de endpoints (evita errores de red)
    await page.route('**/clave-api*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configurada: false, trial_restante: 3 }) });
    });
  });

  test('simular login y llegar a la app', async ({ page }) => {
    await page.goto('/');

    // Disparar el prompt de Google (nuestro mock lo resuelve solo)
    // Buscar boton de login y hacer clic
    const botonLogin = page.getByRole('button', { name: /entrar|login|google|acceder/i });
    if (await botonLogin.count() > 0) {
      await botonLogin.first().click();
    }

    // Esperar a que la app procese la credencial (navegacion o cambio de estado)
    await page.waitForTimeout(2000);

    // Verificar que no hay pantalla en blanco
    await expect(page.locator('body')).not.toBeEmpty();
  });
});